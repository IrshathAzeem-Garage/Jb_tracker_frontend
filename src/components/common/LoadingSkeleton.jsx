import React from 'react';

export const LoadingSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-6 shadow-sm animate-pulse space-y-4">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div className="h-6 w-1/4 bg-slate-200 rounded-md"></div>
        <div className="h-8 w-24 bg-slate-200 rounded-md"></div>
      </div>
      <div className="space-y-3 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            {Array.from({ length: cols }).map((_, j) => (
              <div
                key={j}
                className="h-4 bg-slate-100 rounded flex-1"
                style={{ opacity: 1 - j * 0.15 }}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
