import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'Low' | 'Medium' | 'High' | 'Critical' | 'Passed' | 'Failed' | 'Pending' | 'Blocked' | 'Skipped';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'Medium', className = '' }) => {
  const styles = {
    Low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    Passed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Failed: 'bg-red-500/10 text-red-400 border-red-500/20',
    Pending: 'bg-white/5 text-white/40 border-white/10',
    Blocked: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Skipped: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;