import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  subtitle?: string;
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'indigo';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendPositive = true,
  subtitle,
  color = 'blue',
  onClick,
}) => {
  const iconBgMap = {
    blue: 'bg-blue-50 text-blue-600 border border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border border-purple-100',
    rose: 'bg-rose-50 text-rose-600 border border-rose-100',
    indigo: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
  };

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs transition-all duration-200 hover:border-slate-300 hover:shadow-md ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl font-black tracking-tight text-slate-900">{value}</h4>
        </div>
        <div className={`p-3 rounded-2xl ${iconBgMap[color]} transition-transform duration-200 group-hover:scale-105 shadow-2xs`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(trend || subtitle) && (
        <div className="mt-3.5 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
          {subtitle && <span className="text-slate-500 font-medium text-[11px]">{subtitle}</span>}
          {trend && (
            <span
              className={`font-bold text-[11px] flex items-center gap-1 ${
                trendPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trendPositive ? '↑' : '↓'} {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
