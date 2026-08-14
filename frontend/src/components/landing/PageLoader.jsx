import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

/**
 * PageLoader — A ~900ms cinematic entry animation.
 * A single sperm-like particle travels across a dark screen,
 * leaving a faint trail, then resolving into MANTRA.AI
 * before transitioning to the actual page.
 */
export default function PageLoader({ onComplete }) {
  const [phase, setPhase] = useState('traveling'); // 'traveling' | 'resolving' | 'done'
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      onComplete?.();
      return;
    }

    const t1 = setTimeout(() => setPhase('resolving'), 700);
    const t2 = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, 1300);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [prefersReducedMotion, onComplete]);

  if (prefersReducedMotion) return null;

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-night-blue flex items-center justify-center overflow-hidden"
          aria-hidden="true"
        >
          {/* Traveling particle + trail */}
          {phase === 'traveling' && (
            <motion.div
              className="absolute top-1/2 -translate-y-1/2"
              initial={{ left: '-5%' }}
              animate={{ left: '105%' }}
              transition={{ duration: 0.65, ease: [0.25, 0.1, 0.4, 1] }}
            >
              {/* Trail */}
              <div
                className="absolute right-full top-1/2 -translate-y-1/2 h-[1px]"
                style={{
                  width: '80px',
                  background: 'linear-gradient(to left, rgba(217,119,6,0.5), transparent)',
                  marginRight: '2px',
                }}
              />
              {/* Sperm form */}
              <svg width="40" height="18" viewBox="0 0 48 18" fill="none">
                <ellipse cx="6" cy="9" rx="5" ry="3.5" fill="#d97706" opacity="0.85" />
                <ellipse cx="5" cy="9" rx="2" ry="1.5" fill="#fbfaf7" opacity="0.4" />
                <path
                  d="M 11 9 C 18 6, 24 12, 32 9 C 36 7.5, 40 10, 46 8"
                  stroke="#d97706"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  opacity="0.75"
                />
              </svg>
            </motion.div>
          )}

          {/* Resolving: MANTRA.AI text fades up */}
          {phase === 'resolving' && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-2">
                <span className="font-sans text-[10px] text-marigold bg-marigold/10 border border-marigold/20 px-1.5 py-0.5 font-medium tracking-widest rounded-sm">
                  मंत्र
                </span>
                <span className="font-grotesk font-bold text-2xl tracking-wider text-cream">
                  MANTRA<span className="text-marigold">.AI</span>
                </span>
              </div>
              <span className="font-grotesk text-[9px] tracking-[0.3em] uppercase text-cream/30">
                Private Health Intelligence
              </span>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
