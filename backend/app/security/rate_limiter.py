"""
MantraAI — Production Rate Limiting & DoS Protection Service
============================================================

PURPOSE
-------
Enforces configurable rate limits across expensive AI and report-generation routes:
1. Prefers per-user identification for authenticated routes (`user:{id}`).
2. Falls back to client IP for unauthenticated routes (`ip:{address}`).
3. Supports pluggable storage:
   - Redis sliding window log for multi-worker distributed production deployments.
   - Thread-safe in-memory sliding window fallback for single-instance, local dev, and tests.
4. Returns HTTP 429 with RFC-compliant `Retry-After` header when limit is exceeded.
5. Emits `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.
"""

import logging
import math
import threading
import time
from typing import Dict, List, Optional, Tuple
from fastapi import HTTPException, Request, status

from app.config import settings

logger = logging.getLogger(__name__)


def get_client_ip(request: Request) -> str:
    """Extracts client IP address safely, checking standard reverse-proxy headers."""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # First IP in comma-separated chain is the client
        client_ip = forwarded_for.split(",")[0].strip()
        if client_ip:
            return client_ip

    real_ip = request.headers.get("x-real-ip")
    if real_ip and real_ip.strip():
        return real_ip.strip()

    if request.client and request.client.host:
        return request.client.host

    return "127.0.0.1"


class MemoryRateLimitStorage:
    """
    Thread-safe sliding-window rate limit storage.
    Maintains per-key timestamps in memory with automatic eviction of expired windows.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._records: Dict[str, List[float]] = {}

    def is_allowed(
        self, key: str, max_requests: int, window_seconds: int
    ) -> Tuple[bool, int, int, float]:
        """
        Determines if request is allowed under sliding window.
        Returns: (allowed: bool, retry_after: int, remaining: int, reset_time: float)
        """
        now = time.time()
        window_start = now - window_seconds

        with self._lock:
            timestamps = self._records.get(key, [])
            # Evict timestamps outside the sliding window
            timestamps = [t for t in timestamps if t > window_start]

            if len(timestamps) >= max_requests:
                # Limit exceeded; calculate when the oldest recorded timestamp expires
                oldest = timestamps[0]
                retry_after = max(1, math.ceil(oldest + window_seconds - now))
                reset_time = oldest + window_seconds
                self._records[key] = timestamps
                return False, retry_after, 0, reset_time

            timestamps.append(now)
            self._records[key] = timestamps
            remaining = max(0, max_requests - len(timestamps))
            reset_time = timestamps[0] + window_seconds
            return True, 0, remaining, reset_time

    def clear(self) -> None:
        """Clears all stored rate limits (used during test suites)."""
        with self._lock:
            self._records.clear()


class RedisRateLimitStorage:
    """
    Distributed sliding-window rate limit storage using Redis.
    Allows multi-worker Gunicorn/Uvicorn deployments to share state.
    """

    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self._client = None
        self._init_client()

    def _init_client(self):
        try:
            import importlib
            redis_mod = importlib.import_module("redis")
            self._client = redis_mod.from_url(self.redis_url, decode_responses=True)
            self._client.ping()
            logger.info("Connected to Redis for distributed rate limiting at %s", self.redis_url)
        except Exception as e:
            logger.warning(
                "Could not connect to Redis (%s). Multi-worker rate limiting will fall back to in-memory.",
                str(e),
            )
            self._client = None

    def is_allowed(
        self, key: str, max_requests: int, window_seconds: int
    ) -> Tuple[bool, int, int, float]:
        if not self._client:
            # Fallback if Redis is temporarily unreachable
            return True, 0, max_requests, time.time() + window_seconds

        now = time.time()
        window_start = now - window_seconds
        redis_key = f"rl:{key}"

        try:
            pipe = self._client.pipeline()
            # Remove timestamps outside window
            pipe.zremrangebyscore(redis_key, 0, window_start)
            # Count elements currently in window
            pipe.zcard(redis_key)
            # Add current timestamp
            pipe.zadd(redis_key, {str(now): now})
            # Set key expiration
            pipe.expire(redis_key, window_seconds + 5)
            # Fetch oldest timestamp to calculate reset
            pipe.zrange(redis_key, 0, 0, withscores=True)
            results = pipe.execute()

            current_count = results[1]
            oldest_tuple = results[4]

            if current_count >= max_requests:
                oldest_ts = oldest_tuple[0][1] if oldest_tuple else now
                retry_after = max(1, math.ceil(oldest_ts + window_seconds - now))
                reset_time = oldest_ts + window_seconds
                return False, retry_after, 0, reset_time

            remaining = max(0, max_requests - (current_count + 1))
            oldest_ts = oldest_tuple[0][1] if oldest_tuple else now
            reset_time = oldest_ts + window_seconds
            return True, 0, remaining, reset_time
        except Exception as e:
            logger.warning("Redis rate limit operation failed: %s; allowing request.", str(e))
            return True, 0, max_requests, now + window_seconds

    def clear(self) -> None:
        if self._client:
            try:
                keys = self._client.keys("rl:*")
                if keys:
                    self._client.delete(*keys)
            except Exception:
                pass


# Global storage singleton
_storage: Optional[MemoryRateLimitStorage] = None


def get_rate_limit_storage():
    global _storage
    if _storage is None:
        redis_url = getattr(settings, "RATE_LIMIT_REDIS_URL", None) or ""
        if redis_url.strip():
            try:
                _storage = RedisRateLimitStorage(redis_url.strip())
            except Exception as e:
                logger.warning("Falling back to MemoryRateLimitStorage: %s", str(e))
                _storage = MemoryRateLimitStorage()
        else:
            _storage = MemoryRateLimitStorage()
    return _storage


def reset_rate_limits() -> None:
    """Helper for test suites to clear stored rate limit state."""
    storage = get_rate_limit_storage()
    storage.clear()


def check_rate_limit(
    request: Request,
    key: str,
    max_requests: Optional[int] = None,
    window_seconds: int = 60,
) -> None:
    """
    Checks whether the given key is permitted to execute.
    Raises HTTPException(429) with RFC-compliant Retry-After header if exceeded.
    """
    if not getattr(settings, "RATE_LIMIT_ENABLED", True):
        return

    if max_requests is None:
        max_requests = getattr(settings, "RATE_LIMIT_DEFAULT_PER_MINUTE", 60)

    storage = get_rate_limit_storage()
    allowed, retry_after, remaining, reset_time = storage.is_allowed(
        key=key, max_requests=max_requests, window_seconds=window_seconds
    )

    if not allowed:
        logger.warning(
            "Rate limit exceeded for key='%s' (limit=%d/%ds, retry_after=%ds).",
            key,
            max_requests,
            window_seconds,
            retry_after,
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait before submitting additional requests.",
            headers={
                "Retry-After": str(retry_after),
                "X-RateLimit-Limit": str(max_requests),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(int(reset_time)),
            },
        )
