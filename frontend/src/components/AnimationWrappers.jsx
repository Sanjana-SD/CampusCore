import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useAnimation, useReducedMotion } from 'framer-motion';

/* ═══════════════════════════════════════════════════
   FadeInOnScroll — Fades + slides up on scroll into view
   ═══════════════════════════════════════════════════ */
export function FadeInOnScroll({ children, className = '', delay = 0, direction = 'up', duration = 0.6 }) {
  const prefersReduced = useReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  const directionMap = {
    up: { y: 30, x: 0 },
    down: { y: -30, x: 0 },
    left: { x: 30, y: 0 },
    right: { x: -30, y: 0 },
  };

  const offset = directionMap[direction] || directionMap.up;

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, ...offset }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offset }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   StaggerContainer + StaggerItem — Staggered children
   ═══════════════════════════════════════════════════ */
export function StaggerContainer({ children, className = '', staggerDelay = 0.1 }) {
  const prefersReduced = useReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  if (prefersReduced) {
    return <div ref={ref} className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   CountUp — Animated number counting from 0
   ═══════════════════════════════════════════════════ */
export function CountUp({ end, duration = 2, suffix = '', prefix = '', decimals = 0, className = '' }) {
  const prefersReduced = useReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });
  const [count, setCount] = useState(0);

  // Parse end value — handle strings like "100%", "94.2%", "150+"
  const numericEnd = parseFloat(String(end).replace(/[^0-9.]/g, ''));
  const endSuffix = suffix || String(end).replace(/[0-9.]/g, '');

  useEffect(() => {
    if (!isInView || prefersReduced) {
      if (prefersReduced) setCount(numericEnd);
      return;
    }

    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * numericEnd);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, numericEnd, duration, prefersReduced]);

  return (
    <span ref={ref} className={className}>
      {prefix}{decimals > 0 ? count.toFixed(decimals) : Math.round(count)}{endSuffix}
    </span>
  );
}

/* ═══════════════════════════════════════════════════
   FloatingCard — Breathing/floating animation
   ═══════════════════════════════════════════════════ */
export function FloatingCard({ children, className = '' }) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -8, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   AnimatedSkillBar — Fills from 0% to target width
   ═══════════════════════════════════════════════════ */
export function AnimatedSkillBar({ percentage, colorClass = 'bg-blue-500', className = '' }) {
  const prefersReduced = useReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });

  return (
    <div ref={ref} className={`h-1.5 w-full bg-slate-900 rounded-full overflow-hidden ${className}`}>
      <motion.div
        className={`h-full rounded-full ${colorClass}`}
        initial={{ width: '0%' }}
        animate={isInView ? { width: `${percentage}%` } : { width: '0%' }}
        transition={{
          duration: prefersReduced ? 0 : 1.2,
          delay: 0.2,
          ease: [0.16, 1, 0.3, 1],
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   AnimatedGradientText — Shifting gradient headline
   ═══════════════════════════════════════════════════ */
export function AnimatedGradientText({ children, className = '' }) {
  return (
    <span className={`gradient-text-animated ${className}`}>
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════
   CircuitBackground — The signature CampusCore motif
   ═══════════════════════════════════════════════════ */
export function CircuitBackground() {
  const prefersReduced = useReducedMotion();
  return (
    <div 
      className="circuit-bg" 
      aria-hidden="true"
      style={prefersReduced ? { display: 'none' } : undefined}
    />
  );
}

/* ═══════════════════════════════════════════════════
   PageTransition — Wrap page content for enter/exit
   ═══════════════════════════════════════════════════ */
export function PageTransition({ children, className = '' }) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
