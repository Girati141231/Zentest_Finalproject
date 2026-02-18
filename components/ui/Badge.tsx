import React from 'react';
import { Priority, Status } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: Priority | Status | 'default';
}

const styles: Record<string, string> = {
  default: 'bg-white/5 border-white/10 text-white/60',
  Passed: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
  Failed: 'bg-red-500/10 border-red-500/20 text-red-500',
  Pending: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
  Critical: 'text-red-500 font-bold border-red-500/30 bg-red-900/10',
  High: 'text-orange-400 border-orange-400/30 bg-orange-900/10',
  Medium: 'text-blue-400 border-blue-400/30 bg-blue-900/10',
  Low: 'text-slate-400 border-slate-400/30 bg-slate-800/20',
};

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default' }) => {
  return (
    <span className={`px-2 py-0.5 rounded-sm text-[10px] border uppercase tracking-wider ${styles[variant as string] || styles.default}`}>
      {children}
    </span>
  );
};

export default Badge;