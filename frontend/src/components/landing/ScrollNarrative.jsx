import React, { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

const MILESTONES = [
  { id: 'hero',     label: 'MICRO',    offset: 0.00 },
  { id: 'problem',  label: 'BIOLOGY',  offset: 0.16 },
  { id: 'modules',  label: 'CLINICAL', offset: 0.36 },
  { id: 'trust',    label: 'PRIVACY',  offset: 0.57 },
  { id: 'research', label: 'INDIA',    offset: 0.76 },
  { id: 'assess',   label: 'ASSESS',   offset: 0.95 },
];

/**
 * ScrollNarrative — A minimal vertical progress indicator on the right side.
 * Shows 6 labeled biological-journey milestones.
 * Only visible on md+ viewports.
 */
export default function ScrollNarrative() {
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const trackRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const p = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
      setProgress(p);

      // Find active milestone
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

  // Track height for dot positioning
  const TRACK_H = 160; // px
  const dotY = progress * TRACK_H;

  return (
    <div
      className="fixed right-5 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-end gap-0 select-none pointer-events-none"
      aria-hidden="true"
    >
      {/* Track + dot */}
      <div className="relative flex items-start" style={{ height: TRACK_H }}>
        {/* Track line */}
        <div
          ref={trackRef}
          className="w-[1.5px] bg-night-blue/10 dark:bg-cream/10 rounded-full"
          style={{ height: TRACK_H }}
        />

        {/* Filled portion */}
        <div
          className="absolute top-0 left-0 w-[1.5px] bg-marigold/60 rounded-full transition-all duration-150"
          style={{ height: `${dotY}px` }}
        />

        {/* Dot */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-marigold shadow-[0_0_6px_2px_rgba(217,119,6,0.4)] transition-all duration-200"
          style={{ top: `${dotY - 4}px` }}
        />

        {/* Milestone ticks */}
        {MILESTONES.map((m, i) => (
          <div
            key={m.id}
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
            style={{ top: `${m.offset * TRACK_H - 1}px` }}
          >
            {/* Tick */}
            <div
              className={`w-1 h-1 rounded-full transition-all duration-300 ${
                i <= activeIndex
                  ? 'bg-marigold scale-125'
                  : 'bg-night-blue/20 dark:bg-cream/20'
              }`}
            />
            {/* Label to the right */}
            <span
              className={`text-[7px] font-grotesk tracking-[0.2em] uppercase transition-all duration-300 ml-2.5 ${
                i === activeIndex
                  ? 'text-marigold font-semibold'
                  : 'text-night-blue/25 dark:text-cream/25'
              }`}
            >
              {m.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
