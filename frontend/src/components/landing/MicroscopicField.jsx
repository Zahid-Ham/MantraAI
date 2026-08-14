import React, { useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * MicroscopicField — A living Canvas-2D biological particle field.
 *
 * Props:
 *  mouseReactive  {boolean}  — particles repel from cursor (hero mode)
 *  density        {string}   — 'low' | 'medium' | 'high'
 *  mode           {string}   — 'drift' | 'network' | 'boundary'
 *  bioForms       {boolean}  — include sperm-like biological forms
 *  className      {string}
 */
export default function MicroscopicField({
  mouseReactive = false,
  density = 'medium',
  mode = 'drift',
  bioForms = false,
  className = '',
}) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef([]);
  const formsRef = useRef([]);
  const isVisibleRef = useRef(true);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Particle counts per density
  const particleCount = {
    low: 18,
    medium: 32,
    high: 50,
  }[density] ?? 32;

  const formCount = bioForms ? (density === 'high' ? 5 : density === 'medium' ? 4 : 2) : 0;

  // ──────────────────────────────────────────────────
  // Particle class — simple closure objects
  // ──────────────────────────────────────────────────
  function createParticle(W, H) {
    const phase = Math.random() * Math.PI * 2;
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      size: 0.6 + Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      baseOpacity: 0.03 + Math.random() * 0.1,
      life: Math.random(),
      lifeDir: Math.random() > 0.5 ? 1 : -1,
      lifeSpeed: 0.003 + Math.random() * 0.004,
      phase,
      oscillate: Math.random() * 0.008,
    };
  }

  // ──────────────────────────────────────────────────
  // Biological form class (sperm-like)
  // ──────────────────────────────────────────────────
  function createForm(W, H) {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      angle: Math.random() * Math.PI * 2,
      speed: 0.18 + Math.random() * 0.22,
      scale: 0.7 + Math.random() * 0.9,
      baseOpacity: 0.05 + Math.random() * 0.08,
      tailLen: 22 + Math.random() * 18,
      tailPhase: Math.random() * Math.PI * 2,
      tailFreq: 0.13 + Math.random() * 0.09,
      turnRate: (Math.random() - 0.5) * 0.007,
      life: Math.random() * 200,
      maxLife: 280 + Math.random() * 320,
    };
  }

  const setupCanvas = useCallback((canvas) => {
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    // Handle DPR for sharp rendering
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, W, H };
  }, []);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const { ctx, W, H } = setupCanvas(canvas);

    // Mobile: halve density
    const isMobile = W < 768;
    const pCount = isMobile ? Math.floor(particleCount / 2) : particleCount;
    const fCount = isMobile ? Math.min(formCount, 2) : formCount;

    particlesRef.current = Array.from({ length: pCount }, () => createParticle(W, H));
    formsRef.current = Array.from({ length: fCount }, () => createForm(W, H));

    // IntersectionObserver — pause when off-screen
    const observer = new IntersectionObserver(
      ([entry]) => { isVisibleRef.current = entry.isIntersecting; },
      { threshold: 0 }
    );
    observer.observe(canvas);

    // Mouse tracking
    let handleMouseMove;
    if (mouseReactive) {
      handleMouseMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      };
      window.addEventListener('mousemove', handleMouseMove);
    }

    // ──────────────────────────────────────────────
    // Main animation loop
    // ──────────────────────────────────────────────
    let time = 0;

    const dark = isDark;

    // Colors
    const particleColor = dark
      ? (a) => `rgba(217,119,6,${a})`   // saffron
      : (a) => `rgba(100,70,10,${a})`;  // muted gold in light
    const formHeadColor = dark
      ? (a) => `rgba(217,119,6,${a})`
      : (a) => `rgba(90,60,10,${a})`;
    const formTailColor = dark
      ? (a) => `rgba(217,119,6,${a})`
      : (a) => `rgba(90,60,10,${a})`;
    const lineColor = dark
      ? (a) => `rgba(217,119,6,${a})`
      : (a) => `rgba(120,80,20,${a})`;

    const animate = () => {
      if (!isVisibleRef.current || document.hidden) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, W, H);
      time += 0.016;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // ── Update + draw particles ────────────────
      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i];

        // Life cycle
        p.life += p.lifeDir * p.lifeSpeed;
        if (p.life >= 1) { p.life = 1; p.lifeDir = -1; }
        if (p.life <= 0) {
          // Respawn
          const np = createParticle(W, H);
          particlesRef.current[i] = np;
          continue;
        }

        // Move
        p.x += p.vx + Math.sin(time * 0.4 + p.phase) * p.oscillate;
        p.y += p.vy + Math.cos(time * 0.3 + p.phase) * p.oscillate;

        // Mouse repulsion (hero)
        if (mouseReactive && mx > 0) {
          const dx = mx - p.x;
          const dy = my - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110 && dist > 0) {
            const force = (110 - dist) / 110;
            p.x -= (dx / dist) * force * 0.6;
            p.y -= (dy / dist) * force * 0.6;
          }
        }

        // Boundary wrap
        if (p.x < -5) p.x = W + 5;
        if (p.x > W + 5) p.x = -5;
        if (p.y < -5) p.y = H + 5;
        if (p.y > H + 5) p.y = -5;

        const alpha = p.baseOpacity * p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = particleColor(alpha);
        ctx.fill();
      }

      // ── Network mode: connect nearby particles ─
      if (mode === 'network') {
        const pts = particlesRef.current;
        for (let i = 0; i < pts.length; i++) {
          for (let j = i + 1; j < pts.length; j++) {
            const dx = pts[i].x - pts[j].x;
            const dy = pts[i].y - pts[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 80) {
              const a = (1 - dist / 80) * 0.04;
              ctx.beginPath();
              ctx.moveTo(pts[i].x, pts[i].y);
              ctx.lineTo(pts[j].x, pts[j].y);
              ctx.strokeStyle = lineColor(a);
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      }

      // ── Boundary mode: particles curve near edges ─
      if (mode === 'boundary') {
        const margin = 60;
        for (const p of particlesRef.current) {
          if (p.x < margin) p.vx += 0.01;
          if (p.x > W - margin) p.vx -= 0.01;
          if (p.y < margin) p.vy += 0.01;
          if (p.y > H - margin) p.vy -= 0.01;
          // Speed limit
          const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (speed > 0.4) { p.vx *= 0.97; p.vy *= 0.97; }
        }
      }

      // ── Draw biological forms ─────────────────
      for (const f of formsRef.current) {
        f.angle += f.turnRate;
        f.x += Math.cos(f.angle) * f.speed;
        f.y += Math.sin(f.angle) * f.speed;
        f.tailPhase += 0.055;
        f.life += 1;

        // Respawn if out of bounds or end of life
        if (
          f.life > f.maxLife ||
          f.x < -60 || f.x > W + 60 ||
          f.y < -60 || f.y > H + 60
        ) {
          const nf = createForm(W, H);
          Object.assign(f, nf);
          continue;
        }

        const lifeRatio = f.life / f.maxLife;
        const fade = Math.sin(lifeRatio * Math.PI); // fade in then out
        const alpha = f.baseOpacity * fade;

        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.angle);
        ctx.scale(f.scale, f.scale);

        // Head
        ctx.beginPath();
        ctx.ellipse(0, 0, 5, 3.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = formHeadColor(alpha);
        ctx.fill();

        // Nucleus highlight
        ctx.beginPath();
        ctx.ellipse(-1, -0.5, 2, 1.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = dark ? `rgba(255,200,100,${alpha * 0.4})` : `rgba(200,140,50,${alpha * 0.3})`;
        ctx.fill();

        // Tail
        ctx.beginPath();
        ctx.moveTo(5, 0);
        const tl = f.tailLen;
        for (let t = 0; t <= tl; t += 1.5) {
          const factor = t / tl;
          const amp = 2.5 + factor * 4;
          const wave = Math.sin(t * f.tailFreq + f.tailPhase) * amp * factor;
          ctx.lineTo(5 + t, wave);
        }
        ctx.strokeStyle = formTailColor(alpha * 0.75);
        ctx.lineWidth = 0.9;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Secondary tail (fainter)
        ctx.beginPath();
        ctx.moveTo(5, 0);
        for (let t = 0; t <= tl * 0.6; t += 1.5) {
          const factor = t / tl;
          const wave = Math.cos(t * f.tailFreq * 1.2 + f.tailPhase + 0.5) * 1.5 * factor;
          ctx.lineTo(5 + t, wave);
        }
        ctx.strokeStyle = formTailColor(alpha * 0.3);
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // Handle resize
    const handleResize = () => {
      const { W: nW, H: nH } = setupCanvas(canvas);
      particlesRef.current = Array.from({ length: pCount }, () => createParticle(nW, nH));
      formsRef.current = Array.from({ length: fCount }, () => createForm(nW, nH));
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      observer.disconnect();
      resizeObserver.disconnect();
      if (mouseReactive && handleMouseMove) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark, density, mode, bioForms, mouseReactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none select-none ${className}`}
      aria-hidden="true"
    />
  );
}
