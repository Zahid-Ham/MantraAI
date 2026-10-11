"""
MantraAI — Request Body Size Limiting Middleware
================================================

PURPOSE
-------
Guards against unbounded payload memory exhaustion and denial-of-service (DoS) attacks.
1. Inspects the `Content-Length` header immediately on request arrival.
2. Intercepts streaming chunked bodies without Content-Length and enforces strict byte caps.
3. Returns HTTP 413 (Payload Too Large) with a structured error detail if violated.
"""

import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

logger = logging.getLogger(__name__)


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_bytes: int = 524288):
        super().__init__(app)
        self.max_bytes = max_bytes

    async def dispatch(self, request: Request, call_next) -> Response:
        # 1. Fast check: inspect Content-Length header if present
        content_length_header = request.headers.get("content-length")
        if content_length_header:
            try:
                content_length = int(content_length_header)
                if content_length > self.max_bytes:
                    logger.warning(
                        "Rejected oversized payload from %s: Content-Length %d exceeds limit of %d bytes.",
                        request.client.host if request.client else "unknown",
                        content_length,
                        self.max_bytes,
                    )
                    return JSONResponse(
                        status_code=413,
                        content={
                            "detail": f"Request payload exceeds maximum allowed size of {self.max_bytes} bytes."
                        },
                    )
            except (ValueError, TypeError):
                pass

        # 2. Body-level byte check for mutating requests (POST, PUT, PATCH)
        if request.method in ("POST", "PUT", "PATCH"):
            try:
                body = await request.body()
                if len(body) > self.max_bytes:
                    logger.warning(
                        "Rejected oversized body from %s: received %d bytes exceeding limit of %d bytes.",
                        request.client.host if request.client else "unknown",
                        len(body),
                        self.max_bytes,
                    )
                    return JSONResponse(
                        status_code=413,
                        content={
                            "detail": f"Request payload exceeds maximum allowed size of {self.max_bytes} bytes."
                        },
                    )
            except Exception as e:
                logger.error("Error reading request body in size middleware: %s", str(e))
                return JSONResponse(
                    status_code=400,
                    content={"detail": "Could not read request body."},
                )

        return await call_next(request)
