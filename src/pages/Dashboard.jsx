import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  CreditCard,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Clock,
  Briefcase,
  AlertCircle,
  Plus,
  FileText,
  PieChart as PieIcon,
  BarChart2,
  Activity,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
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

const PIE_COLORS = ['#0f172a', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'];

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderModalOpen, setOrderModalOpen] = useState(false);

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
      <div className="space-y-6">
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
          className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { metrics, charts, alerts, recentActivity } = data;

  // Empty business check (Scenario 57)
  const isBusinessEmpty = metrics.totalInvestment === 0 && metrics.totalOrders === 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Empty State Banner (if completely empty) */}
      {isBusinessEmpty && (
        <div className="p-6 bg-white border-2 border-dashed border-slate-300 rounded-2xl text-center space-y-3">
          <h2 className="text-xl font-extrabold text-slate-900">Welcome to JB Tracker</h2>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            Start by adding your business partners, recording your initial investment, and creating customer orders.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to="/partners"
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
            >
              Add Partners / Investment
            </Link>
            <button
              onClick={() => setOrderModalOpen(true)}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50"
            >
              Create First Order
            </button>
          </div>
        </div>
      )}

      {/* Critical Business Notice: Profit != Cash banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 text-white shadow-sm border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Core Principle
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Verified Separation
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Net Profit (<strong>{formatCurrency(metrics.netProfit)}</strong>) is revenue minus expenses. Business Cash (<strong>{formatCurrency(metrics.cashAvailable)}</strong>) is actual liquidity available in bank.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setOrderModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-white rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Order
          </button>
        </div>
      </div>

      {/* Top 8 KPI Cards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Key Financial Indicators
          </h2>
          <span className="text-xs text-slate-400 font-medium">Real-time ledger data</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Business Health Summary */}
      <section className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Business Health Summary
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Pure factual numbers computed directly from database records without arbitrary scores
            </p>
          </div>
          <Link
            to="/reports/profit-loss"
            className="text-xs font-bold text-slate-900 hover:text-slate-700 underline underline-offset-4"
          >
            Full P&L Statement →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 pt-2">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block">Cash Available</span>
            <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
              {formatCurrency(metrics.cashAvailable)}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block">Receivables</span>
            <span className="text-base font-bold text-amber-700 font-mono mt-0.5 block">
              {formatCurrency(metrics.accountsReceivable)}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block">Payables</span>
            <span className="text-base font-bold text-rose-700 font-mono mt-0.5 block">
              {formatCurrency(metrics.accountsPayable)}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block">Net Profit</span>
            <span className="text-base font-bold text-emerald-700 font-mono mt-0.5 block">
              {formatCurrency(metrics.netProfit)}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block">Profit Margin</span>
            <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
              {metrics.overallMarginPercentage}%
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block">Customer Paid</span>
            <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
              {formatCurrency(metrics.totalCustomerPayments)}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 block">Supplier Paid</span>
            <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
              {formatCurrency(metrics.totalSupplierPayments)}
            </span>
          </div>
        </div>
      </section>

      {/* Priority Alerts Section */}
      {(alerts.overdueCustomers?.length > 0 ||
        alerts.pendingSuppliers?.length > 0 ||
        alerts.upcomingDeliveries?.length > 0 ||
        alerts.marginAlerts?.length > 0) && (
        <section className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Operational Alerts
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Margin Warnings (Requirement 48) */}
            {alerts.marginAlerts?.map((a) => (
              <div
                key={a.id}
                className={`p-4 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                  a.alert_type === 'LOSS_MAKING'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 font-bold">
                    <span>{a.alert_type === 'LOSS_MAKING' ? '⚠️ Loss-making Order' : '⚡ Low Margin Order'}</span>
                    <span className="px-1.5 py-0.5 rounded bg-white font-mono text-[10px]">
                      {a.order_number}
                    </span>
                  </div>
                  <p className="mt-1">
                    {a.customer_name} — Total: {formatCurrency(a.total_amount)} | Cost: {formatCurrency(a.total_cost)} | Profit: <strong>{formatCurrency(a.gross_profit)}</strong> ({a.margin_percentage}%)
                  </p>
                </div>
                <Link
                  to={`/orders/${a.id}`}
                  className="px-2.5 py-1 rounded bg-white text-slate-800 font-bold hover:bg-slate-100 shrink-0"
                >
                  View
                </Link>
              </div>
            ))}

            {/* Overdue / High Receivables */}
            {alerts.overdueCustomers?.slice(0, 2).map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs flex items-start justify-between gap-3"
              >
                <div>
                  <span className="font-bold flex items-center gap-1.5">
                    <ArrowDownLeft className="w-4 h-4 text-amber-600" />
                    Customer Balance Pending: {c.order_number}
                  </span>
                  <p className="mt-1">
                    {c.customer_name} owes <strong>{formatCurrency(c.outstanding)}</strong> (Paid {formatCurrency(c.paid)} of {formatCurrency(c.total_amount)})
                  </p>
                </div>
                <Link
                  to={`/orders/${c.id}`}
                  className="px-2.5 py-1 rounded bg-white text-slate-800 font-bold hover:bg-slate-100 shrink-0"
                >
                  Collect
                </Link>
              </div>
            ))}

            {/* Upcoming Deliveries */}
            {alerts.upcomingDeliveries?.slice(0, 2).map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-xl border border-sky-200 bg-sky-50 text-sky-900 text-xs flex items-start justify-between gap-3"
              >
                <div>
                  <span className="font-bold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-sky-600" />
                    Delivery Due Soon: {d.order_number}
                  </span>
                  <p className="mt-1">
                    {d.customer_name} expected delivery by <strong>{formatDate(d.expected_delivery_date)}</strong>
                  </p>
                </div>
                <Link
                  to={`/orders/${d.id}`}
                  className="px-2.5 py-1 rounded bg-white text-slate-800 font-bold hover:bg-slate-100 shrink-0"
                >
                  Check
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recharts Analytics Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Monthly Sales & Gross Profit Line/Bar Chart */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Monthly Sales & Gross Profit</h3>
            <span className="text-xs text-slate-400">Delivered & confirmed</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month_label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), '']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="sales" name="Sales" fill="#0f172a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gross_profit" name="Gross Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Cash Flow (Money In vs Money Out) */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Cash Flow (Central Ledger)</h3>
            <span className="text-xs text-slate-400">Actual funds movement</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.cashFlow}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month_label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), '']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="money_in" name="Money In (Inflow)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="money_out" name="Money Out (Disbursed)" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Sales by Business Category */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Sales by Business Category</h3>
            <Link to="/reports/categories" className="text-xs text-slate-500 hover:text-slate-900 font-semibold">
              View All →
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.salesByCategory?.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tickFormatter={(v) => `₹${v / 1000}k`} tick={{ fontSize: 11 }} />
                <YAxis dataKey="category_name" type="category" width={110} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), 'Sales']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px' }}
                />
                <Bar dataKey="sales" fill="#334155" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Expenses by Category Donut */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Expenses Breakdown</h3>
            <Link to="/expenses" className="text-xs text-slate-500 hover:text-slate-900 font-semibold">
              Manage Expenses →
            </Link>
          </div>
          <div className="h-64 flex items-center justify-center">
            {charts.expensesByCategory?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.expensesByCategory}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {charts.expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Amount']}
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400">No expenses recorded yet</span>
            )}
          </div>
        </div>
      </section>

      {/* Recent Cash & Business Activity (Requirement 46) */}
      <section className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Recent Cash Activity
          </h2>
          <Link to="/money" className="text-xs font-bold text-slate-900 hover:text-slate-700 underline underline-offset-4">
            View Complete Cash Ledger →
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentActivity?.map((act) => {
            const isMoneyIn = act.transaction_type === 'MONEY_IN';
            return (
              <div key={act.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      isMoneyIn ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {isMoneyIn ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{act.description}</p>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatDate(act.transaction_date)} • via {act.payment_method}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`font-mono font-bold text-sm block ${
                      isMoneyIn ? 'text-emerald-700' : 'text-slate-900'
                    }`}
                  >
                    {isMoneyIn ? '+' : '-'}{formatCurrency(act.amount)}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {act.source_type.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Create Order Modal */}
      <OrderFormModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        onSuccess={() => {
          fetchDashboard();
        }}
      />
    </div>
  );
};
