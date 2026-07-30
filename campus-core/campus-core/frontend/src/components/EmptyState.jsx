import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Inbox } from 'lucide-react';

/**
 * EmptyState — Styled placeholder for sections with no content.
 * Prevents large empty black areas across pages.
 */
export default function EmptyState({ 
  icon: Icon = Inbox, 
  title = 'No data available', 
  description = 'Content will appear here once data is added to the system.',
  className = '' 
}) {
  const prefersReduced = useReducedMotion();

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 ${className}`}>
      <motion.div
        className="h-16 w-16 rounded-2xl bg-white/95 border border-gray-100 flex items-center justify-center mb-5"
        animate={prefersReduced ? {} : { 
          scale: [1, 1.05, 1],
          borderColor: [
            'rgba(99, 102, 241, 0.1)',
            'rgba(99, 102, 241, 0.3)',
            'rgba(99, 102, 241, 0.1)'
          ]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Icon className="h-7 w-7 text-muted" />
      </motion.div>
      <h4 className="text-sm font-bold card-title mb-1.5">{title}</h4>
      <p className="text-xs text-muted text-center max-w-xs leading-relaxed">{description}</p>
    </div>
  );
}
