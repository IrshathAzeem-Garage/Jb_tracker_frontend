import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  Wallet,
  Building,
  Users,
  Briefcase,
  Layers,
  FileText,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import api from '../services/api';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';
import { exportToPDF, exportToCSV } from '../utils/exporter';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const Reports = () => {
  const [reportType, setReportType] = useState('profit-loss');
  const [period, setPeriod] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Calculate start/end date when period preset changes
  useEffect(() => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const toYMD = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (period === 'today') {
      setStartDate(toYMD(now));
      setEndDate(toYMD(now));
    } else if (period === 'this-week') {
      const day = now.getDay();
      const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diffToMonday));
      setStartDate(toYMD(monday));
      setEndDate(toYMD(new Date()));
    } else if (period === 'this-month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(toYMD(firstDay));
      setEndDate(toYMD(now));
    } else if (period === 'this-quarter') {
      const qMonth = Math.floor(now.getMonth() / 3) * 3;
      const firstDay = new Date(now.getFullYear(), qMonth, 1);
      setStartDate(toYMD(firstDay));
      setEndDate(toYMD(now));
    } else if (period === 'this-year') {
      const currentYear = now.getFullYear();
      const fyStart = now.getMonth() >= 3 ? new Date(currentYear, 3, 1) : new Date(currentYear - 1, 3, 1);
      setStartDate(toYMD(fyStart));
      setEndDate(toYMD(now));
    } else if (period === 'all') {
      setStartDate('');
      setEndDate('');
    }
  }, [period]);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/reports/${reportType}?${params.toString()}`);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, startDate, endDate]);

  const handleExportPDF = () => {
    if (!data) return;

    if (reportType === 'profit-loss') {
      const summary = [
        { label: 'Revenue (Sales)', value: formatCurrency(data.revenue) },
        { label: 'Direct Procurement Cost', value: formatCurrency(data.directCosts) },
        { label: 'Gross Profit', value: formatCurrency(data.grossProfit) },
        { label: 'Operating Expenses', value: formatCurrency(data.operatingExpenses.total) },
        { label: 'Net Profit', value: formatCurrency(data.netProfit) },
        { label: 'Net Margin', value: formatPercentage(data.netMarginPercentage) },
      ];

      const headers = ['Category / Line Item', 'Amount (INR)'];
      const rows = [
        ['Total Revenue (Sales)', formatCurrency(data.revenue)],
        ['Less: Direct Procurement Costs', `(${formatCurrency(data.directCosts)})`],
        ['Gross Profit', formatCurrency(data.grossProfit)],
        ...data.operatingExpenses.breakdown.map((b) => [`Operating Expense: ${b.category}`, `(${formatCurrency(b.amount)})`]),
        ['Total Operating Overheads', `(${formatCurrency(data.operatingExpenses.total)})`],
        ['Net Business Profit', formatCurrency(data.netProfit)],
      ];

      exportToPDF({
        title: 'Profit & Loss Statement (Income Statement)',
        subtitle: `Period: ${data.period.startDate} to ${data.period.endDate}`,
        headers,
        rows,
        summary,
        filename: 'profit_and_loss_statement',
      });
    } else if (reportType === 'cash-flow') {
      const summary = [
        { label: 'Opening Cash Balance', value: formatCurrency(data.openingCash) },
        { label: 'Total Cash Inflow', value: formatCurrency(data.inflows.total) },
        { label: 'Total Cash Outflow', value: formatCurrency(data.outflows.total) },
        { label: 'Net Period Cash Flow', value: formatCurrency(data.netCashFlow) },
        { label: 'Closing Cash Balance', value: formatCurrency(data.closingCash) },
      ];

      const headers = ['Cash Flow Activity', 'Type', 'Amount (INR)'];
      const rows = [
        ['Customer Receipts', 'Inflow', formatCurrency(data.inflows.customerPayments)],
        ['Partner Equity Infusion', 'Inflow', formatCurrency(data.inflows.partnerInvestments)],
        ['Other Cash Inflows', 'Inflow', formatCurrency(data.inflows.otherIncome)],
        ['Supplier Disbursements', 'Outflow', `(${formatCurrency(data.outflows.supplierPayments)})`],
        ['Operating Expenses Disbursed', 'Outflow', `(${formatCurrency(data.outflows.operatingExpenses)})`],
        ['Partner Cash Withdrawals', 'Outflow', `(${formatCurrency(data.outflows.partnerWithdrawals)})`],
        ['Net Period Movement', 'Net', formatCurrency(data.netCashFlow)],
      ];

      exportToPDF({
        title: 'Statement of Cash Flows',
        subtitle: `Period: ${data.period.startDate} to ${data.period.endDate}`,
        headers,
        rows,
        summary,
        filename: 'cash_flow_statement',
      });
    } else if (reportType === 'categories') {
      const headers = ['Business Category', 'Orders', 'Sales (INR)', 'Direct Cost (INR)', 'Gross Profit (INR)', 'Margin %'];
      const rows = data.map((c) => [
        c.category_name,
        c.total_orders,
        formatCurrency(c.total_sales),
        formatCurrency(c.total_cost),
        formatCurrency(c.gross_profit),
        formatPercentage(c.margin_percentage),
      ]);
      exportToPDF({
        title: 'Category Performance Analysis',
        headers,
        rows,
        filename: 'category_performance_report',
      });
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Financial & Management Reports
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Audit-grade P&L, Cash Flow, and operational metrics
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 shadow-sm active:scale-95 transition-all touch-target-44"
        >
          <FileText className="w-3.5 h-3.5" />
          Export Statement PDF
        </button>
      </div>

      {/* Report Selection Tabs (Horizontal Scrollable on Mobile) */}
      <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="inline-flex sm:flex p-1 bg-slate-100 rounded-xl gap-1 border border-slate-200 min-w-max sm:min-w-0 sm:flex-wrap">
          {[
            { id: 'profit-loss', label: 'Profit & Loss' },
            { id: 'cash-flow', label: 'Cash Flow' },
            { id: 'sales', label: 'Sales Summary' },
            { id: 'categories', label: 'Categories' },
            { id: 'customers', label: 'Customers' },
            { id: 'suppliers', label: 'Suppliers' },
            { id: 'partners', label: 'Partner Capital' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all touch-target-44 flex items-center justify-center ${
                reportType === tab.id
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Period Filter Toolbar */}
      <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="overflow-x-auto no-scrollbar w-full sm:w-auto -mx-1 px-1">
          <div className="flex items-center gap-1 min-w-max">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'this-week', label: 'This Week' },
              { id: 'this-month', label: 'This Month' },
              { id: 'this-quarter', label: 'This Quarter' },
              { id: 'this-year', label: 'This Year' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-2.5 py-1.5 text-xs rounded-lg font-bold border transition-all touch-target-44 flex items-center ${
                  period === p.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setPeriod('custom');
              setStartDate(e.target.value);
            }}
            className="flex-1 sm:w-32 px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-medium"
            title="Start Date"
          />
          <span className="text-xs text-slate-400 font-semibold">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setPeriod('custom');
              setEndDate(e.target.value);
            }}
            className="flex-1 sm:w-32 px-2.5 py-2 text-xs border border-slate-300 rounded-lg font-medium"
            title="End Date"
          />
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <LoadingSkeleton rows={8} cols={4} />
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 text-rose-800 text-xs font-semibold">
          {error}
        </div>
      ) : !data ? (
        <div className="p-8 text-center bg-white rounded-2xl border text-xs text-slate-500 font-medium">
          No report data generated.
        </div>
      ) : (
        <>
          {/* 1. PROFIT & LOSS VIEW */}
          {reportType === 'profit-loss' && (
            <div className="space-y-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Sales (Revenue)</span>
                  <span className="text-lg sm:text-2xl font-black font-mono text-slate-900 block mt-1">
                    {formatCurrency(data.revenue)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Delivered & confirmed</span>
                </div>

                <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Gross Profit</span>
                  <span className="text-lg sm:text-2xl font-black font-mono text-emerald-700 block mt-1">
                    {formatCurrency(data.grossProfit)}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">{data.grossMarginPercentage}% margin</span>
                </div>

                <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Net Profit</span>
                  <span className={`text-lg sm:text-2xl font-black font-mono block mt-1 ${data.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatCurrency(data.netProfit)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">After operating overheads</span>
                </div>

                <div className="p-3.5 sm:p-4 bg-slate-950 text-white rounded-2xl shadow-sm">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Net Margin</span>
                  <span className="text-lg sm:text-2xl font-black font-mono text-emerald-400 block mt-1">
                    {data.netMarginPercentage}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Over total revenue</span>
                </div>
              </div>

              {/* Responsive Chart: Revenue vs Cost vs Net Profit */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm overflow-hidden">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
                  P&L Visual Breakdown
                </h4>
                <div className="w-full min-w-0 h-48 sm:h-60 overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Revenue', amount: parseFloat(data.revenue) || 0, fill: '#0f172a' },
                        { name: 'Direct Cost', amount: parseFloat(data.directCosts) || 0, fill: '#f43f5e' },
                        { name: 'Overheads', amount: parseFloat(data.operatingExpenses?.total) || 0, fill: '#fb7185' },
                        { name: 'Net Profit', amount: parseFloat(data.netProfit) || 0, fill: '#10b981' },
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: '12px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="amount" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Statement Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Income Statement Breakdown
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Period: {data.period.startDate} to {data.period.endDate}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Line Item</th>
                        <th className="py-2.5 px-3 text-right">Amount (INR)</th>
                        <th className="py-2.5 px-3 text-right">% Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr className="bg-slate-50/50 font-bold text-slate-900">
                        <td className="py-2.5 px-3">Gross Revenue (Delivered Orders)</td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(data.revenue)}</td>
                        <td className="py-2.5 px-3 text-right font-mono">100%</td>
                      </tr>
                      <tr className="text-slate-600">
                        <td className="py-2 px-3 pl-6">Less: Direct Procurement & Production Costs</td>
                        <td className="py-2 px-3 text-right font-mono text-rose-700">({formatCurrency(data.directCosts)})</td>
                        <td className="py-2 px-3 text-right font-mono">
                          {data.revenue > 0 ? ((data.directCosts / data.revenue) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                      <tr className="bg-slate-100 font-bold text-slate-900">
                        <td className="py-2.5 px-3">GROSS PROFIT</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700">{formatCurrency(data.grossProfit)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700">{data.grossMarginPercentage}%</td>
                      </tr>
                      {data.operatingExpenses?.breakdown?.map((exp, i) => (
                        <tr key={i} className="text-slate-600">
                          <td className="py-2 px-3 pl-6">Overhead: {exp.category}</td>
                          <td className="py-2 px-3 text-right font-mono text-slate-700">({formatCurrency(exp.amount)})</td>
                          <td className="py-2 px-3 text-right font-mono">
                            {data.revenue > 0 ? ((exp.amount / data.revenue) * 100).toFixed(1) : 0}%
                          </td>
                        </tr>
                      ))}
                      <tr className="font-bold text-slate-700 bg-slate-50">
                        <td className="py-2.5 px-3 pl-6">Total Operating Overheads</td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-700">({formatCurrency(data.operatingExpenses?.total || 0)})</td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {data.revenue > 0 ? ((data.operatingExpenses?.total / data.revenue) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                      <tr className="bg-slate-900 text-white font-black text-sm">
                        <td className="py-3 px-3">NET BUSINESS PROFIT</td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-400">{formatCurrency(data.netProfit)}</td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-400">{data.netMarginPercentage}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. CASH FLOW VIEW */}
          {reportType === 'cash-flow' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Opening Cash</span>
                  <span className="text-base sm:text-xl font-bold font-mono text-slate-900 block mt-1">
                    {formatCurrency(data.openingCash)}
                  </span>
                </div>
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Total Inflow</span>
                  <span className="text-base sm:text-xl font-bold font-mono text-emerald-700 block mt-1">
                    +{formatCurrency(data.inflows.total)}
                  </span>
                </div>
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Total Outflow</span>
                  <span className="text-base sm:text-xl font-bold font-mono text-rose-700 block mt-1">
                    -{formatCurrency(data.outflows.total)}
                  </span>
                </div>
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Net Movement</span>
                  <span className={`text-base sm:text-xl font-bold font-mono block mt-1 ${data.netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {data.netCashFlow >= 0 ? '+' : ''}{formatCurrency(data.netCashFlow)}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1 p-3.5 bg-slate-900 text-white rounded-2xl shadow-sm">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Closing Cash</span>
                  <span className="text-base sm:text-xl font-bold font-mono text-emerald-400 block mt-1">
                    {formatCurrency(data.closingCash)}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Cash Flow Statement
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Activity</th>
                        <th className="py-2.5 px-3 text-center">Type</th>
                        <th className="py-2.5 px-3 text-right">Amount (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr className="bg-slate-50 font-bold text-slate-900">
                        <td colSpan="3" className="py-2 px-3 uppercase text-[11px] text-emerald-800">
                          Cash Inflows (Money In)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 pl-6">Customer Order Receipts</td>
                        <td className="py-2 px-3 text-center text-emerald-700 font-bold">INFLOW</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">+{formatCurrency(data.inflows.customerPayments)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 pl-6">Partner Capital Investments</td>
                        <td className="py-2 px-3 text-center text-emerald-700 font-bold">INFLOW</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">+{formatCurrency(data.inflows.partnerInvestments)}</td>
                      </tr>
                      <tr className="bg-slate-50 font-bold text-slate-900">
                        <td colSpan="3" className="py-2 px-3 uppercase text-[11px] text-rose-800">
                          Cash Outflows (Money Out)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 pl-6">Supplier & Vendor Disbursements</td>
                        <td className="py-2 px-3 text-center text-rose-700 font-bold">OUTFLOW</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">-{formatCurrency(data.outflows.supplierPayments)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 pl-6">Operating Overhead Expenses Disbursed</td>
                        <td className="py-2 px-3 text-center text-rose-700 font-bold">OUTFLOW</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">-{formatCurrency(data.outflows.operatingExpenses)}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 pl-6">Partner Equity Withdrawals</td>
                        <td className="py-2 px-3 text-center text-rose-700 font-bold">OUTFLOW</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">-{formatCurrency(data.outflows.partnerWithdrawals)}</td>
                      </tr>
                      <tr className="bg-slate-900 text-white font-black text-sm">
                        <td className="py-3 px-3">CLOSING CASH POSITION</td>
                        <td className="py-3 px-3 text-center text-slate-300">LIQUID</td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-400">{formatCurrency(data.closingCash)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. CATEGORIES REPORT VIEW */}
          {reportType === 'categories' && (
            <div className="space-y-3">
              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {data.map((c, i) => (
                  <div key={i} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{c.category_name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {c.total_orders} Orders
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Sales</span>
                        <span className="font-mono font-bold text-slate-900">{formatCurrency(c.total_sales)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Gross Profit</span>
                        <span className="font-mono font-bold text-emerald-700">{formatCurrency(c.gross_profit)} ({c.margin_percentage}%)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
                <h3 className="text-base font-extrabold text-slate-900">
                  Business Category Performance
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="py-3 px-4">Business Category</th>
                        <th className="py-3 px-4 text-center">Orders</th>
                        <th className="py-3 px-4 text-right">Sales Volume</th>
                        <th className="py-3 px-4 text-right">Direct Cost</th>
                        <th className="py-3 px-4 text-right">Gross Profit</th>
                        <th className="py-3 px-4 text-right">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {data.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">{c.category_name}</td>
                          <td className="py-3 px-4 text-center font-mono">{c.total_orders}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(c.total_sales)}</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">{formatCurrency(c.total_cost)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">{formatCurrency(c.gross_profit)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold">{c.margin_percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. CUSTOMER PERFORMANCE VIEW */}
          {reportType === 'customers' && (
            <div className="space-y-3">
              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {data.map((c, i) => (
                  <div key={i} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{c.customer_name}</span>
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{c.customer_code}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Sales ({c.total_orders})</span>
                        <span className="font-mono font-bold text-slate-900">{formatCurrency(c.total_sales)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Outstanding</span>
                        <span className="font-mono font-bold text-amber-700">{formatCurrency(c.outstanding_balance)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-slate-500 font-medium">Profit Generated:</span>
                      <span className="font-mono font-bold text-emerald-700">{formatCurrency(c.profit_generated)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
                <h3 className="text-base font-extrabold text-slate-900">
                  Customer Sales & Profitability Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Customer Name</th>
                        <th className="py-3 px-4 text-center">Orders</th>
                        <th className="py-3 px-4 text-right">Total Sales</th>
                        <th className="py-3 px-4 text-right">Amount Paid</th>
                        <th className="py-3 px-4 text-right">Outstanding</th>
                        <th className="py-3 px-4 text-right">Profit Generated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {data.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-bold text-slate-500">{c.customer_code}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{c.customer_name}</td>
                          <td className="py-3 px-4 text-center font-mono">{c.total_orders}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(c.total_sales)}</td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-700">{formatCurrency(c.amount_paid)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">{formatCurrency(c.outstanding_balance)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">{formatCurrency(c.profit_generated)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 5. SUPPLIERS REPORT VIEW */}
          {reportType === 'suppliers' && (
            <div className="space-y-3">
              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {data.map((s, i) => (
                  <div key={i} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{s.supplier_name}</span>
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{s.supplier_code}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Purchases ({s.total_orders})</span>
                        <span className="font-mono font-bold text-slate-900">{formatCurrency(s.purchase_cost)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Payable Due</span>
                        <span className="font-mono font-bold text-rose-700">{formatCurrency(s.outstanding_balance)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
                <h3 className="text-base font-extrabold text-slate-900">
                  Supplier Procurement & Payables Analysis
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Supplier Name</th>
                        <th className="py-3 px-4 text-center">Orders</th>
                        <th className="py-3 px-4 text-right">Purchase Cost</th>
                        <th className="py-3 px-4 text-right">Amount Paid</th>
                        <th className="py-3 px-4 text-right">Payable Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {data.map((s, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-bold text-slate-500">{s.supplier_code}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{s.supplier_name}</td>
                          <td className="py-3 px-4 text-center font-mono">{s.total_orders}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(s.purchase_cost)}</td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-700">{formatCurrency(s.amount_paid)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">{formatCurrency(s.outstanding_balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 6. PARTNER REPORT VIEW */}
          {reportType === 'partners' && (
            <div className="space-y-3">
              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                <div className="p-3 bg-slate-900 text-white rounded-xl flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">Net Business Profit</span>
                  <span className="font-mono font-bold text-emerald-400">{formatCurrency(data.netProfit)}</span>
                </div>
                {data.partners?.map((p, i) => (
                  <div key={i} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {p.profitSharePercentage}% Share
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Invested</span>
                        <span className="font-mono font-bold text-slate-900">{formatCurrency(p.invested)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Capital</span>
                        <span className="font-mono font-bold text-emerald-700">{formatCurrency(p.currentCapital)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Partner Capital Accounts & Equity Allocation
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    Net Business Profit: {formatCurrency(data.netProfit)}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="py-3 px-4">Partner Name</th>
                        <th className="py-3 px-4 text-center">Profit Share %</th>
                        <th className="py-3 px-4 text-right">Total Invested</th>
                        <th className="py-3 px-4 text-right">Withdrawn</th>
                        <th className="py-3 px-4 text-right">Profit Allocation</th>
                        <th className="py-3 px-4 text-right">Current Capital</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {data.partners?.map((p, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold">{p.profitSharePercentage}%</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(p.invested)}</td>
                          <td className="py-3 px-4 text-right font-mono text-rose-700">-{formatCurrency(p.withdrawn)}</td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-700">+{formatCurrency(p.allocatedProfit)}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-base text-slate-900">{formatCurrency(p.currentCapital)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 7. SALES REPORT VIEW */}
          {reportType === 'sales' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 space-y-6">
              <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider">
                Executive Sales Summary
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Total Orders</span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 block mt-1">{data.summary?.totalOrders}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Total Sales</span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 block mt-1">{formatCurrency(data.summary?.totalSales)}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Avg Order Value</span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-emerald-700 block mt-1">{formatCurrency(data.summary?.averageOrderValue)}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Total Profit</span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-emerald-700 block mt-1">{formatCurrency(data.summary?.totalProfit)}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="py-3 px-4">Order Status</th>
                      <th className="py-3 px-4 text-center">Orders</th>
                      <th className="py-3 px-4 text-right">Pipeline Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {data.byStatus?.map((st, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-800">{st.status}</td>
                        <td className="py-3 px-4 text-center font-mono">{st.count}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(st.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
