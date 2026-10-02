import React from 'react';
import { Menu, Bell, Shield, IndianRupee } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Header = ({ onMenuClick, title, subtitle }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
            {title || 'JB Tracker'}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Currency Tag */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
          <IndianRupee className="w-3 h-3 text-slate-500" />
          <span>INR (₹)</span>
        </div>

        {/* User Role Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-medium text-slate-700 hidden md:inline">{user?.email}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white uppercase tracking-wider">
            {user?.role}
          </span>
        </div>
      </div>
    </header>
  );
};
