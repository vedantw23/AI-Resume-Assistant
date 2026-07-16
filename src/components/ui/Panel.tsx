import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className = '' }: PanelProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className={`rounded-[18px] border border-border bg-card p-5 shadow-soft ${className}`}
    >
      {children}
    </motion.section>
  );
}
