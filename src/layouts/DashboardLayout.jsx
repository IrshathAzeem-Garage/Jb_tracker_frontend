import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Header } from '../components/common/Header';

const routeTitles = {
  '/': { title: 'Executive Dashboard', subtitle: 'Overview of company performance & cash position' },
  '/orders': { title: 'Order Management', subtitle: 'Track B2B customer orders, costs & profits' },
  '/customers': { title: 'Customers', subtitle: 'Client relationships, sales performance & receivables' },
  '/suppliers': { title: 'Suppliers & Vendors', subtitle: 'Procurement costs, supplier payments & payables' },
  '/products': { title: 'Products & Categories', subtitle: 'Standard catalog, cost benchmarks & units' },
  '/money': { title: 'Money & Central Ledger', subtitle: 'Complete track of all funds in and out of the business' },
  '/expenses': { title: 'Operating Expenses', subtitle: 'Day-to-day administrative & operational overheads' },
  '/partners': { title: 'Partners & Capital', subtitle: 'Partner equity investments, profit shares & capital accounts' },
  '/reports': { title: 'Financial Reports', subtitle: 'P&L, Cash Flow, Customer/Supplier performance analysis' },
  '/settings': { title: 'Settings & Administration', subtitle: 'Company configuration, team accounts & audit log' },
};

export const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Find matching title for current path
  const currentPath = location.pathname;
  let pageInfo = routeTitles[currentPath];
  if (!pageInfo) {
    if (currentPath.startsWith('/orders/')) {
      pageInfo = { title: 'Order Details', subtitle: 'Order items, fulfillment, cost breakdown & payments' };
    } else if (currentPath.startsWith('/customers/')) {
      pageInfo = { title: 'Customer Profile', subtitle: 'Customer statement, historical orders & payments' };
    } else if (currentPath.startsWith('/suppliers/')) {
      pageInfo = { title: 'Supplier Profile', subtitle: 'Supplier statement, procurement history & disbursements' };
    } else {
      pageInfo = { title: 'JB Tracker', subtitle: 'Just Business Things' };
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          onMenuClick={() => setMobileOpen(true)}
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
