import React from 'react';
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
  ChevronRight,
  ShieldCheck,
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

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white text-slate-950 font-black text-xl tracking-tight shadow-md">
            JB
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Just Business Things
            </span>
            <span className="text-base font-bold text-white tracking-tight">
              JB Tracker
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setMobileOpen && setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>{item.name}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </NavLink>
            );
          })}
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-slate-200 font-semibold text-xs shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'JB'}
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user?.name || 'Authorized User'}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                  {user?.role || 'STAFF'}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout session"
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
