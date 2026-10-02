import React from 'react';

export const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeType = 'default',
  trend,
  className = '',
  highlight = false,
}) => {
  const badgeStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
  };

  return (
    <div
      className={`p-5 bg-white rounded-xl border transition-all ${
        highlight
          ? 'border-slate-900 shadow-md ring-1 ring-slate-900/5'
          : 'border-slate-200 hover:border-slate-300 card-hover-subtle shadow-sm'
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-50 text-slate-700 border border-slate-100">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
          {value}
        </span>
        {badge && (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
              badgeStyles[badgeType] || badgeStyles.default
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 text-xs text-slate-500 font-medium flex items-center justify-between">
          <span>{subtitle}</span>
          {trend && <span className="font-semibold">{trend}</span>}
        </div>
      )}
    </div>
  );
};
