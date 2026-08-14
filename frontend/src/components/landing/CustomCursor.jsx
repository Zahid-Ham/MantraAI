import React, { useEffect, useState, useRef } from 'react';

// Detect touch device — disable custom cursor entirely
const isTouchDevice = typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

// Detect reduced motion
const prefersReducedMotion = typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -200, y: -200 });
  const [angle, setAngle] = useState(0);
  const [isHovering, setIsHovering] = useState(false);       // over button/link
  const [isOverCta, setIsOverCta] = useState(false);          // over the main CTA
  const [isVisible, setIsVisible] = useState(false);
  const [isOverInput, setIsOverInput] = useState(false);
  const [burstSperms, setBurstSperms] = useState([]);
  const [ripples, setRipples] = useState([]);                  // click ripple rings
  const [trail, setTrail] = useState([]);                      // comet trail points

  const tailRef1 = useRef(null);
  const tailRef2 = useRef(null);
  const prevPos = useRef({ x: 0, y: 0 });
  const trailRef = useRef([]);

  // Don't render on touch devices or reduced motion
  if (isTouchDevice || prefersReducedMotion) return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isVisible) setIsVisible(true);
      setPosition({ x: e.clientX, y: e.clientY });

      const dx = e.clientX - prevPos.current.x;
      const dy = e.clientY - prevPos.current.y;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        setAngle(Math.atan2(dy, dx) * (180 / Math.PI) + 180);
      }
      prevPos.current = { x: e.clientX, y: e.clientY };

      // Update comet trail buffer
      if (isOverCta) {
        trailRef.current = [
          { x: e.clientX, y: e.clientY, life: 1.0 },
          ...trailRef.current.slice(0, 5),
        ];
        setTrail([...trailRef.current]);
      }
    };

    const handleMouseClick = (e) => {
      const target = e.target;
      const isClickable =
        target.tagName === 'A' || target.tagName === 'BUTTON' ||
        target.closest('a') || target.closest('button') ||
        target.getAttribute('role') === 'button';

      const count = isClickable ? 14 : 5;
      const newSperms = [];
      for (let i = 0; i < count; i++) {
        const theta = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const speed = 3 + Math.random() * 5;
        newSperms.push({
          id: Math.random().toString(36).slice(2),
          x: e.clientX, y: e.clientY,
          vx: Math.cos(theta) * speed,
          vy: Math.sin(theta) * speed,
          angle: theta * (180 / Math.PI) + 180,
          opacity: 1.0,
          scale: 0.5 + Math.random() * 0.6,
          spinSpeed: (Math.random() > 0.5 ? 1 : -1) * (0.01 + Math.random() * 0.02),
          life: 1.0,
        });
      }
      setBurstSperms((prev) => [...prev, ...newSperms]);

      // Add ripple ring
      const rippleId = Math.random().toString(36).slice(2);
      setRipples((prev) => [...prev, { id: rippleId, x: e.clientX, y: e.clientY }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== rippleId));
      }, 700);
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      const isInput =
        target.tagName === 'INPUT' || target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' || target.closest('input') ||
        target.closest('select') || target.closest('textarea');
      setIsOverInput(!!isInput);

      const isClickable =
        target.tagName === 'A' || target.tagName === 'BUTTON' ||
        target.closest('a') || target.closest('button') ||
        target.getAttribute('role') === 'button';
      setIsHovering(!!isClickable);

      // CTA-specific detection
      const ctaEl = target.closest('#hero-cta') || target.id === 'hero-cta';
      setIsOverCta(!!ctaEl);
      if (!ctaEl) {
        trailRef.current = [];
        setTrail([]);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleMouseClick);
    window.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleMouseClick);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible, isOverCta]);

  // Physics loop for burst sperms
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    let animId;
    const tick = () => {
      setBurstSperms((prev) => {
        if (prev.length === 0) return prev;
        return prev
          .map((s) => ({
            ...s,
            x: s.x + s.vx,
            y: s.y + s.vy,
            vx: s.vx * 0.95,
            vy: s.vy * 0.95,
            life: s.life - 0.022,
            opacity: s.life,
          }))
          .filter((s) => s.life > 0);
      });

      // Decay trail
      trailRef.current = trailRef.current
        .map((pt) => ({ ...pt, life: pt.life - 0.18 }))
        .filter((pt) => pt.life > 0);
      setTrail([...trailRef.current]);

      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Wriggling tail animation
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    let animId;
    const animateTail = () => {
      const time = performance.now() * (isOverCta ? 0.035 : 0.022);
      let path1 = 'M 8 12';
      let path2 = 'M 8 12';
      for (let x = 10; x <= 46; x += 4) {
        const factor = (x - 8) / 38;
        path1 += ` L ${x} ${12 + Math.sin(x * 0.16 - time) * 3.8 * factor}`;
        path2 += ` L ${x} ${12 + Math.cos(x * 0.16 - time) * 2.2 * factor}`;
      }
      if (tailRef1.current) tailRef1.current.setAttribute('d', path1);
      if (tailRef2.current) tailRef2.current.setAttribute('d', path2);

      // Burst tails
      document.querySelectorAll('.burst-tail-1').forEach((path, i) => {
        const t2 = time + i * 0.5;
        let p = 'M 8 12';
        for (let x = 10; x <= 46; x += 4) {
          p += ` L ${x} ${12 + Math.sin(x * 0.18 - t2) * 3.5 * ((x - 8) / 38)}`;
        }
        path.setAttribute('d', p);
      });
      document.querySelectorAll('.burst-tail-2').forEach((path, i) => {
        const t2 = time + i * 0.5;
        let p = 'M 8 12';
        for (let x = 10; x <= 46; x += 4) {
          p += ` L ${x} ${12 + Math.cos(x * 0.18 - t2) * 2.0 * ((x - 8) / 38)}`;
        }
        path.setAttribute('d', p);
      });

      animId = requestAnimationFrame(animateTail);
    };
    animId = requestAnimationFrame(animateTail);
    return () => cancelAnimationFrame(animId);
  }, [isOverCta]);

  return (
    <>
      {/* ── Click ripple rings ─────────────────── */}
      {ripples.map((r) => (
        <div
          key={r.id}
          className="pointer-events-none fixed z-[49] rounded-full border border-marigold/40 animate-ripple"
          style={{
            left: `${r.x}px`,
            top: `${r.y}px`,
            width: '28px',
            height: '28px',
          }}
          aria-hidden="true"
        />
      ))}

      {/* ── CTA comet trail ────────────────────── */}
      {trail.map((pt, i) => (
        <div
          key={i}
          className="pointer-events-none fixed z-[49] rounded-full bg-marigold"
          style={{
            left: `${pt.x}px`,
            top: `${pt.y}px`,
            width: `${2 + i * 0.5}px`,
            height: `${2 + i * 0.5}px`,
            transform: 'translate(-50%, -50%)',
            opacity: pt.life * 0.6,
          }}
          aria-hidden="true"
        />
      ))}

      {/* ── Burst sperms ──────────────────────── */}
      {burstSperms.map((s) => (
        <div
          key={s.id}
          className="pointer-events-none fixed z-50 select-none"
          style={{
            left: `${s.x}px`,
            top: `${s.y}px`,
            transform: `translate(-50%, -50%) rotate(${s.angle}deg) scale(${s.scale})`,
            opacity: s.opacity,
            transformOrigin: '6px 12px',
          }}
          aria-hidden="true"
        >
          <svg
            width="40" height="20" viewBox="0 0 48 24"
            className="text-marigold dark:text-cream fill-current drop-shadow-[0_2px_4px_rgba(217,119,6,0.2)] dark:drop-shadow-[0_2px_4px_rgba(251,250,247,0.15)]"
          >
            <ellipse cx="6" cy="12" rx="4.5" ry="3.2" />
            <path className="burst-tail-1" d="M 8 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path className="burst-tail-2 opacity-45" d="M 8 12" fill="none" stroke="currentColor" strokeWidth="0.8" />
          </svg>
        </div>
      ))}

      {/* ── Main interactive cursor ───────────── */}
      {isVisible && !isOverInput && (
        <div
          className="pointer-events-none fixed z-50 select-none transition-transform duration-75"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: `translate(-50%, -50%) rotate(${angle}deg) scale(${isHovering ? 1.45 : 1.0})`,
            transformOrigin: '6px 12px',
          }}
          aria-hidden="true"
        >
          <svg
            width="48" height="24" viewBox="0 0 48 24"
            className={`fill-current transition-all duration-200 ${
              isOverCta
                ? 'text-marigold drop-shadow-[0_2px_8px_rgba(217,119,6,0.5)]'
                : 'text-marigold dark:text-cream drop-shadow-[0_2px_6px_rgba(217,119,6,0.3)] dark:drop-shadow-[0_2px_6px_rgba(251,250,247,0.25)]'
            }`}
          >
            <ellipse cx="6" cy="12" rx="4.5" ry="3.2" />
            <ellipse cx="5.5" cy="12" rx="2" ry="1.5" className="fill-cream dark:fill-night-blue opacity-50" />
            <path ref={tailRef1} d="M 8 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="opacity-80" />
            <path ref={tailRef2} d="M 8 12" fill="none" stroke="currentColor" strokeWidth="0.8" className="opacity-45" />
          </svg>
        </div>
      )}
    </>
  );
}
