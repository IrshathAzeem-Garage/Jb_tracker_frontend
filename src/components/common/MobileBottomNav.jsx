import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Wallet,
  BarChart3,
  Menu,
} from 'lucide-react';

export const MobileBottomNav = ({ onOpenMore }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Home', href: '/', icon: LayoutDashboard },
    { name: 'Orders', href: '/orders', icon: ShoppingCart },
    { name: 'Money', href: '/money', icon: Wallet },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ];

  const isMoreActive = [
    '/customers',
    '/suppliers',
    '/products',
    '/expenses',
    '/partners',
    '/settings',
  ].some((path) => location.pathname.startsWith(path));

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-14 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.href);

          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-all touch-manipulation min-h-[44px] ${
                isActive
                  ? 'text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-700 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-slate-950 stroke-[2.25]' : 'text-slate-400 stroke-[1.75]'
                  }`}
                />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-slate-950" />
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight leading-none ${isActive ? 'font-bold text-slate-950' : 'text-slate-500'}`}>
                {item.name}
              </span>
            </NavLink>
          );
        })}

        {/* More Button to trigger Drawer / Quick Navigation */}
        <button
          type="button"
          onClick={onOpenMore}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-all touch-manipulation min-h-[44px] ${
            isMoreActive
              ? 'text-slate-950 font-bold'
              : 'text-slate-400 hover:text-slate-700 font-medium'
          }`}
          aria-label="More navigation options"
        >
          <div className="relative">
            <Menu
              className={`w-5 h-5 transition-transform ${
                isMoreActive ? 'scale-110 text-slate-950 stroke-[2.25]' : 'text-slate-400 stroke-[1.75]'
              }`}
            />
            {isMoreActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-slate-950" />
            )}
          </div>
          <span className={`text-[10px] mt-1 tracking-tight leading-none ${isMoreActive ? 'font-bold text-slate-950' : 'text-slate-500'}`}>
            More
          </span>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
