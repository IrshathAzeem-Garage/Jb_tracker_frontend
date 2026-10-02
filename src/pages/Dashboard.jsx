import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Clock,
  Briefcase,
  AlertCircle,
  Plus,
  BarChart2,
  Activity,
  Layers,
  DollarSign,
  ChevronRight,
  Receipt,
  CreditCard,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import api from '../services/api';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';
import { MetricCard } from '../components/common/MetricCard';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { OrderFormModal } from '../components/orders/OrderFormModal';
import { StatusBadge } from '../components/common/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const PIE_COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'];

export const Dashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  // Time-based greeting for mobile
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <LoadingSkeleton rows={4} cols={4} />
        <LoadingSkeleton rows={6} cols={2} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-rose-200 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-900">Failed to load dashboard</h3>
        <p className="text-sm text-slate-500 mt-1">{error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-4 min-h-[44px] px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};
  const alerts = data?.alerts || {};
  const recentOrders = Array.isArray(data?.recentOrders)
    ? data.recentOrders
    : Array.isArray(data?.recentActivity?.orders)
    ? data.recentActivity.orders
    : Array.isArray(data?.recentActivity)
    ? data.recentActivity
    : [];
  const isBusinessEmpty = (metrics.totalInvestment || 0) === 0 && (metrics.totalOrders || 0) === 0;

  return (
    <div className="space-y-5 sm:space-y-8 pb-8">
      {/* 1. Mobile Greeting & Business Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {greeting}, {user?.name ? user.name.split(' ')[0] : 'Founder'}
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Business Overview
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Real-time ledger updates</span>
        </div>
      </div>

      {/* 2. Mobile Quick Actions Section (Prompt Requirement #8) */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block sm:hidden">
          Quick Actions
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => setOrderModalOpen(true)}
            className="touch-target-44 p-3 rounded-2xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>+ Add Order</span>
          </button>

          <Link
            to="/expenses"
            className="touch-target-44 p-3 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 shadow-sm transition-all"
          >
            <Receipt className="w-4 h-4 text-slate-500" />
            <span>+ Add Expense</span>
          </Link>

          <Link
            to="/orders"
            className="touch-target-44 p-3 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 shadow-sm transition-all"
          >
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>+ Record Payment</span>
          </Link>

          <Link
            to="/partners"
            className="touch-target-44 p-3 rounded-2xl bg-white border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 shadow-sm transition-all"
          >
            <Briefcase className="w-4 h-4 text-slate-500" />
            <span>+ Add Investment</span>
          </Link>
        </div>
      </div>

      {/* 3. Core Principle Separation Alert: Profit != Cash */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 text-white shadow-sm border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 shrink-0">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Core Principle
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300">
                Profit ≠ Cash
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-snug">
              Net Profit: <strong>{formatCurrency(metrics.netProfit)}</strong> | Liquid Cash in Hand: <strong>{formatCurrency(metrics.cashAvailable)}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 4. Compact 2-Column Mobile Financial Cards Grid (<640px) */}
      <div className="sm:hidden space-y-2.5">
        <div className="grid grid-cols-2 gap-2.5 font-mono">
          {/* Money in Hand (Liquid Cash) */}
          <div className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-400 font-sans text-[11px] font-semibold">
              <span>Money in Hand</span>
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-base font-extrabold text-white truncate">
              {formatCurrency(metrics.cashAvailable)}
            </div>
            <span className="text-[10px] text-slate-400 font-sans block truncate">
              Liquid Central Ledger
            </span>
          </div>

          {/* Net Profit */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 font-sans text-[11px] font-semibold">
              <span>Net Profit</span>
              <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className={`text-base font-extrabold truncate ${metrics.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatCurrency(metrics.netProfit)}
            </div>
            <span className="text-[10px] text-slate-400 font-sans block truncate">
              Margin: {metrics.overallMarginPercentage}%
            </span>
          </div>

          {/* Receivable */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 font-sans text-[11px] font-semibold">
              <span>Receivable</span>
              <ArrowDownLeft className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-base font-extrabold text-amber-700 truncate">
              {formatCurrency(metrics.accountsReceivable)}
            </div>
            <span className="text-[10px] text-slate-400 font-sans block truncate">
              Owed by Customers
            </span>
          </div>

          {/* Payable */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 font-sans text-[11px] font-semibold">
              <span>Payable</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="text-base font-extrabold text-rose-700 truncate">
              {formatCurrency(metrics.accountsPayable)}
            </div>
            <span className="text-[10px] text-slate-400 font-sans block truncate">
              Owed to Suppliers
            </span>
          </div>
        </div>

        {/* Secondary Mobile Metrics (Sales & Investments) */}
        <div className="grid grid-cols-2 gap-2.5 font-mono">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-[10px] font-sans text-slate-500 block">Total Sales</span>
            <strong className="text-sm font-bold text-slate-900 block truncate">{formatCurrency(metrics.totalSales)}</strong>
            <span className="text-[10px] text-slate-400 font-sans block">{metrics.totalOrders} Orders</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-[10px] font-sans text-slate-500 block">Partner Capital</span>
            <strong className="text-sm font-bold text-slate-900 block truncate">{formatCurrency(metrics.totalPartnerCapital)}</strong>
            <span className="text-[10px] text-slate-400 font-sans block">Equity Infusions</span>
          </div>
        </div>
      </div>

      {/* 5. Desktop Full KPI Grid (>=640px) */}
      <section className="hidden sm:block space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Investment"
            value={formatCurrency(metrics.totalInvestment)}
            subtitle="Partner equity infusions"
            icon={Briefcase}
          />
          <MetricCard
            title="Total Sales"
            value={formatCurrency(metrics.totalSales)}
            subtitle={`${metrics.totalOrders} delivered & active orders`}
            icon={TrendingUp}
          />
          <MetricCard
            title="Gross Profit"
            value={formatCurrency(metrics.grossProfit)}
            subtitle={`Margin: ${metrics.overallMarginPercentage}%`}
            badge={metrics.grossProfit >= 0 ? 'Profitable' : 'Loss'}
            badgeType={metrics.grossProfit >= 0 ? 'success' : 'danger'}
            icon={DollarSign}
          />
          <MetricCard
            title="Net Profit"
            value={formatCurrency(metrics.netProfit)}
            subtitle={`After ₹${metrics.operatingExpenses.toLocaleString('en-IN')} overheads`}
            badge={metrics.netProfit >= 0 ? 'Net Positive' : 'Deficit'}
            badgeType={metrics.netProfit >= 0 ? 'success' : 'danger'}
            icon={BarChart2}
          />
          <MetricCard
            title="Money In Hand (Cash)"
            value={formatCurrency(metrics.cashAvailable)}
            subtitle={`In: ${formatCurrency(metrics.moneyIn)} | Out: ${formatCurrency(metrics.moneyOut)}`}
            badge="Liquid Cash"
            badgeType="info"
            highlight={true}
            icon={Wallet}
          />
          <MetricCard
            title="Accounts Receivable"
            value={formatCurrency(metrics.accountsReceivable)}
            subtitle="Outstanding from clients"
            badge={metrics.accountsReceivable > 0 ? 'Receivable' : 'Settled'}
            badgeType={metrics.accountsReceivable > 0 ? 'warning' : 'success'}
            icon={ArrowDownLeft}
          />
          <MetricCard
            title="Accounts Payable"
            value={formatCurrency(metrics.accountsPayable)}
            subtitle="Owed to suppliers"
            badge={metrics.accountsPayable > 0 ? 'Payable' : 'Settled'}
            badgeType={metrics.accountsPayable > 0 ? 'danger' : 'success'}
            icon={ArrowUpRight}
          />
          <MetricCard
            title="Partner Capital"
            value={formatCurrency(metrics.totalPartnerCapital)}
            subtitle="Total equity + allocated profit"
            icon={Layers}
          />
        </div>
      </section>

      {/* 6. Operational Alerts Section */}
      {(alerts.overdueCustomers?.length > 0 ||
        alerts.pendingSuppliers?.length > 0 ||
        alerts.upcomingDeliveries?.length > 0 ||
        alerts.marginAlerts?.length > 0) && (
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Operational Alerts
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Margin Warnings */}
            {alerts.marginAlerts?.map((a) => (
              <div
                key={a.id}
                className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                  a.alert_type === 'LOSS_MAKING'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>{a.alert_type === 'LOSS_MAKING' ? '⚠️ Loss-making Order' : '⚡ Low Margin Order'}</span>
                    <span className="px-1.5 py-0.5 rounded bg-white font-mono text-[10px]">
                      {a.order_number}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px]">
                    {a.customer_name} — Total: {formatCurrency(a.total_amount)} | Profit: <strong>{formatCurrency(a.gross_profit)}</strong> ({a.margin_percentage}%)
                  </p>
                </div>
                <Link
                  to={`/orders/${a.id}`}
                  className="touch-target-44 px-3 py-1.5 rounded-lg bg-white text-slate-800 font-bold hover:bg-slate-100 shrink-0 text-center"
                >
                  View
                </Link>
              </div>
            ))}

            {/* Overdue / High Receivables */}
            {alerts.overdueCustomers?.slice(0, 2).map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs flex items-start justify-between gap-3"
              >
                <div>
                  <span className="font-bold flex items-center gap-1.5">
                    <ArrowDownLeft className="w-4 h-4 text-amber-600" />
                    Customer Balance Pending: {c.order_number}
                  </span>
                  <p className="mt-1 text-[11px]">
                    {c.customer_name} owes <strong>{formatCurrency(c.outstanding)}</strong>
                  </p>
                </div>
                <Link
                  to={`/orders/${c.id}`}
                  className="touch-target-44 px-3 py-1.5 rounded-lg bg-white text-slate-800 font-bold hover:bg-slate-100 shrink-0 text-center"
                >
                  Collect
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Recharts Analytics Grid with mobile-responsive width & height */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Sales & Profit */}
        <div className="p-4 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Monthly Sales & Gross Profit</h3>
            <span className="text-[11px] text-slate-400">Delivered & confirmed</span>
          </div>
          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month_label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), '']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Bar dataKey="sales" name="Sales" fill="#0f172a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gross_profit" name="Gross Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cash Flow Movement */}
        <div className="p-4 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Cash Flow (Central Ledger)</h3>
            <span className="text-[11px] text-slate-400">Inflow vs Outflow</span>
          </div>
          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.cashFlow}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month_label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), '']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Bar dataKey="money_in" name="Money In" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="money_out" name="Money Out" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* 8. Recent Orders: Mobile Cards vs Desktop Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Recent Orders</h3>
          <Link to="/orders" className="text-xs font-bold text-slate-900 hover:underline flex items-center gap-1">
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Recent Orders (<640px) */}
        <div className="sm:hidden space-y-2.5">
          {recentOrders.length === 0 ? (
            <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              No recent orders found.
            </div>
          ) : (
            recentOrders.slice(0, 4).map((o) => (
              <Link
                key={o.id}
                to={`/orders/${o.id}`}
                className="block p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900">{o.order_number}</span>
                    <p className="text-xs font-bold text-slate-800">{o.customer_name}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-slate-100">
                  <span className="text-slate-500 font-sans font-medium">Value: <strong>{formatCurrency(o.total_amount)}</strong></span>
                  <span className="text-emerald-700 font-bold">Profit: {formatCurrency(o.gross_profit)}</span>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Desktop Recent Orders (>=640px) */}
        <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {recentOrders.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No recent orders found.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-right">Value</th>
                  <th className="py-3 px-4 text-right">Profit</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentOrders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <Link to={`/orders/${o.id}`} className="hover:underline">
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{o.customer_name}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">{formatCurrency(o.total_amount)}</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-bold">{formatCurrency(o.gross_profit)}</td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Order Creation Modal */}
      <OrderFormModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        onSuccess={() => {
          showToast('Order created successfully!', 'success');
          fetchDashboard();
        }}
      />
    </div>
  );
};

export default Dashboard;
