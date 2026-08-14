import React, { useState, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';

const MILESTONES = [
  { label: 'MICRO',    offset: 0.00 },
  { label: 'BIOLOGY',  offset: 0.18 },
  { label: 'CLINICAL', offset: 0.38 },
  { label: 'PRIVACY',  offset: 0.58 },
  { label: 'INDIA',    offset: 0.78 },
  { label: 'ASSESS',   offset: 0.96 },
];

/**
 * ScrollNarrative — Ultra-minimal right-side scroll progress indicator.
 * Shows a thin track + saffron dot only. Active label shown beneath dot.
 * Hidden on mobile.
 */
export default function ScrollNarrative() {
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const p = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
      setProgress(p);
      let active = 0;
      for (let i = 0; i < MILESTONES.length; i++) {
        if (p >= MILESTONES[i].offset) active = i;
      }
      setActiveIndex(active);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (prefersReducedMotion) return null;

  const TRACK_H = 120;
  const dotY = Math.min(progress * TRACK_H, TRACK_H);

  return (
    <div
      className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-0 select-none pointer-events-none"
      aria-hidden="true"
    >
      {/* Track container */}
      <div className="relative flex flex-col items-center" style={{ height: TRACK_H }}>

        {/* Background track */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 w-px rounded-full bg-night-blue/10 dark:bg-cream/10"
          style={{ height: TRACK_H }}
        />

        {/* Filled track */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 w-px rounded-full bg-marigold/50 transition-all duration-150"
          style={{ height: dotY }}
        />

        {/* Milestone tick marks only — no labels on track */}
        {MILESTONES.map((m, i) => (
          <div
            key={m.label}
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: `${m.offset * TRACK_H - 1}px` }}
          >
            <div
              className={`w-[3px] h-[3px] rounded-full transition-all duration-300 ${
                i <= activeIndex
                  ? 'bg-marigold'
                  : 'bg-night-blue/20 dark:bg-cream/15'
              }`}
            />
          </div>
        ))}

        {/* Glowing dot */}
        <div
          className="absolute left-1/2 -translate-x-1/2 transition-all duration-200"
          style={{ top: `${dotY - 3}px` }}
        >
          <div className="w-[6px] h-[6px] rounded-full bg-marigold shadow-[0_0_5px_2px_rgba(217,119,6,0.5)]" />
        </div>
      </div>

      {/* Active label — shown below the track, always the same spot */}
      <div
        className="mt-2 flex flex-col items-center gap-1"
      >
        <div
          className="text-[7px] font-grotesk font-semibold tracking-[0.25em] uppercase text-marigold transition-all duration-300"
          style={{ minWidth: '40px', textAlign: 'center' }}
        >
          {MILESTONES[activeIndex].label}
        </div>
        {/* Small saffron line */}
        <div className="w-3 h-px bg-marigold/40" />
      </div>
    </div>
  );
}
