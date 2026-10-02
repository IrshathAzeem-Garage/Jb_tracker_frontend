import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export const AlertBanner = ({
  type = 'info', // 'info' | 'warning' | 'danger' | 'success'
  title,
  message,
  onClose,
  className = '',
}) => {
  const styles = {
    info: {
      container: 'bg-sky-50 border-sky-200 text-sky-900',
      icon: <Info className="w-5 h-5 text-sky-600 shrink-0" />,
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    },
    danger: {
      container: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
    },
    success: {
      container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    },
  };

  const current = styles[type] || styles.info;

  return (
    <div
      className={`flex items-start justify-between p-4 rounded-xl border ${current.container} ${className}`}
    >
      <div className="flex items-start gap-3">
        {current.icon}
        <div>
          {title && <h4 className="text-sm font-bold leading-tight">{title}</h4>}
          {message && <p className="text-xs mt-0.5 opacity-90">{message}</p>}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 -mr-1 rounded-md opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
