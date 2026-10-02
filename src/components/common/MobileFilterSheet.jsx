import React from 'react';
import { X, Check } from 'lucide-react';
import { ResponsiveModal } from './ResponsiveModal';

export const MobileFilterSheet = ({
  isOpen,
  onClose,
  title = 'Filters',
  children,
  onApply,
  onClear,
}) => {
  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle="Refine results with specific criteria"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {children}

        <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-6">
          <button
            type="button"
            onClick={() => {
              if (onClear) onClear();
              onClose();
            }}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Clear Filters
          </button>
          <button
            type="button"
            onClick={() => {
              if (onApply) onApply();
              onClose();
            }}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Apply Filters
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default MobileFilterSheet;
