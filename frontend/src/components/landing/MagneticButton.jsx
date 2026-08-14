import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * MagneticButton — A wrapper that adds subtle magnetic hover physics to any CTA.
 * The element slightly follows the cursor and snaps back on mouse leave.
 *
 * Props:
 *  children    {ReactNode}
 *  strength    {number}   — max pixel displacement (default 8)
 *  className   {string}
 *  onClick     {function}
 *  href        {string}   — if provided, renders as <a>
 */
export default function MagneticButton({
  children,
  strength = 8,
  className = '',
  onClick,
  href,
  id,
}) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const handleMouseMove = (e) => {
    if (prefersReducedMotion) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setPosition({ x: dx * strength, y: dy * strength });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const sharedProps = {
    ref,
    id,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    onMouseEnter: handleMouseEnter,
    onClick,
    className: `relative inline-block overflow-visible ${className}`,
    style: { isolation: 'isolate' },
  };

  const innerVariants = {
    default: { x: 0, y: 0 },
    hovered: {
      x: prefersReducedMotion ? 0 : position.x,
      y: prefersReducedMotion ? 0 : position.y,
    },
  };

  // Glow ring on hover
  const glowVariants = {
    default: { opacity: 0, scale: 0.8 },
    hovered: { opacity: 1, scale: 1 },
  };

  const inner = (
    <motion.div
      animate={isHovered ? 'hovered' : 'default'}
      variants={innerVariants}
      transition={{ type: 'spring', stiffness: 200, damping: 20, mass: 0.5 }}
      className="relative"
    >
      {/* Glow aura behind button */}
      <motion.div
        variants={glowVariants}
        animate={isHovered ? 'hovered' : 'default'}
        transition={{ duration: 0.3 }}
        className="absolute inset-[-6px] bg-marigold/15 blur-lg rounded-sm pointer-events-none"
        aria-hidden="true"
      />
      {children}
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} {...sharedProps}>
        {inner}
      </a>
    );
  }

  return (
    <div {...sharedProps}>
      {inner}
    </div>
  );
}
