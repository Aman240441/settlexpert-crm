import React from 'react';

interface BadgeProps {
  status: string;
  variant?: 'solid' | 'subtle';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, variant = 'subtle', size = 'sm' }) => {
  const s = (status || '').toLowerCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  if (['active', 'verified', 'completed', 'paid', 'converted'].includes(s)) {
    colorClasses = variant === 'solid'
      ? 'bg-emerald-600 text-white border-emerald-500'
      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  } else if (['inactive', 'cancelled', 'rejected', 'failed'].includes(s)) {
    colorClasses = variant === 'solid'
      ? 'bg-rose-600 text-white border-rose-500'
      : 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  } else if (['pending', 'pending_verification', 'negotiating', 'in_progress', 'urgent'].includes(s)) {
    colorClasses = variant === 'solid'
      ? 'bg-amber-600 text-white border-amber-500'
      : 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  } else if (['new', 'contacted', 'high'].includes(s)) {
    colorClasses = variant === 'solid'
      ? 'bg-blue-600 text-white border-blue-500'
      : 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  }

  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs font-medium' : 'px-3 py-1 text-sm font-semibold';

  const label = status ? status.replace(/_/g, ' ').toUpperCase() : 'N/A';

  return (
    <span className={`inline-flex items-center rounded-full border ${sizeClasses} ${colorClasses} tracking-wide`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {label}
    </span>
  );
};
