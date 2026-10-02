import React from 'react';
import { Menu, User, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOnlineStatus } from '../../utils/useOnlineStatus';

export const MobileHeader = ({ onMenuClick, title, subtitle }) => {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 pt-safe transition-all shadow-sm">
      <div className="flex items-center justify-between h-14 px-3 sm:px-4">
        {/* Left: ☰ Menu Hamburger */}
        <button
          onClick={onMenuClick}
          className="touch-target-44 p-2.5 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors focus:outline-none"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Center: Brand / Title */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5">
            <img
              src="/logo.png"
              alt="JBT"
              className="w-5 h-5 rounded-md object-contain bg-black shadow-xs shrink-0"
            />
            <span className="font-extrabold text-sm text-slate-900 tracking-tight">
              JB Tracker
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
            {title || 'Just Business Things'}
          </span>
        </div>

        {/* Right: Profile / Online Status */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'
            }`}
            title={isOnline ? 'System Online' : 'System Offline'}
          />
          <div className="touch-target-44 flex items-center justify-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs shadow-sm">
              {user?.name ? user.name.slice(0, 1).toUpperCase() : <User className="w-4 h-4" />}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
