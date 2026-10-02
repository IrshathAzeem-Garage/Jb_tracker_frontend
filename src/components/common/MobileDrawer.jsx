import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Truck,
  Package,
  Wallet,
  Receipt,
  Briefcase,
  BarChart3,
  Settings,
  LogOut,
  X,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Suppliers', href: '/suppliers', icon: Truck },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Money', href: '/money', icon: Wallet },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Partners', href: '/partners', icon: Briefcase },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const MobileDrawer = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.classList.remove('modal-open');
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer content panel */}
      <div
        className="relative flex-1 flex flex-col max-w-[300px] w-full bg-slate-900 text-slate-200 shadow-2xl pt-safe pb-safe z-10 animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Drawer"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="JBT Logo"
              className="w-9 h-9 rounded-xl object-contain bg-black shadow-md border border-slate-800 shrink-0"
            />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                Just Business Things
              </p>
              <h2 className="text-base font-extrabold text-white tracking-tight">
                JB Tracker
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="touch-target-44 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all touch-manipulation min-h-[44px] ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>{item.name}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-30" />
              </NavLink>
            );
          })}
        </div>

        {/* Drawer User & Logout Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-slate-100 font-bold text-xs shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'JB'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">
                  {user?.name || user?.email || 'Authorized User'}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                  {user?.role || 'ADMIN'}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="touch-target-44 p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700/50 transition-colors"
              title="Logout session"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDrawer;
