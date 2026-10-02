import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Download,
  Calendar,
  Layers,
  Plus,
  Minus,
  Briefcase,
  Receipt,
  CreditCard,
  Users,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToCSV } from '../utils/exporter';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';

export const Money = () => {
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalMoneyIn: 0, totalMoneyOut: 0, cashInHand: 0 });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Tabs & Filters
  const [typeTab, setTypeTab] = useState(''); // '' (All), 'MONEY_IN', 'MONEY_OUT'
  const [sourceType, setSourceType] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
        search,
        type: typeTab,
        sourceType,
        paymentMethod,
        startDate,
        endDate,
      });

      const res = await api.get(`/transactions?${params.toString()}`);
      if (res.success) {
        setTransactions(res.data.transactions);
        setSummary(res.data.summary);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
  }, [typeTab, sourceType, paymentMethod, startDate, endDate, search]);

  const handleExportCSV = () => {
    const headers = [
      { label: 'Date', key: 'transaction_date' },
      { label: 'Type', key: 'transaction_type' },
      { label: 'Source Type', key: 'source_type' },
      { label: 'Description', key: 'description' },
      { label: 'Amount (INR)', key: 'amount' },
      { label: 'Payment Method', key: 'payment_method' },
      { label: 'Related Order', key: 'related_order_number' },
    ];
    exportToCSV('central_cash_ledger', headers, transactions);
    showToast('Ledger exported to CSV', 'info');
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Central Cash Ledger
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time audit trail of all funds entering & leaving the business
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="touch-target-44 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 font-mono">
        <div className="p-4 sm:p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">
              Liquid Cash In Hand
            </span>
            <span className="text-xl sm:text-2xl font-black text-white block mt-0.5">
              {formatCurrency(summary.cashInHand)}
            </span>
            <span className="text-[10px] text-emerald-400 font-sans font-medium">True liquid bank balance</span>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-800 text-white border border-slate-700 shrink-0">
            <Wallet className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans">
              Total Inflow (Money In)
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 block mt-0.5">
              +{formatCurrency(summary.totalMoneyIn)}
            </span>
            <span className="text-[10px] text-slate-400 font-sans font-medium">Investments & customer collections</span>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans">
              Total Outflow (Money Out)
            </span>
            <span className="text-xl sm:text-2xl font-black text-rose-700 block mt-0.5">
              -{formatCurrency(summary.totalMoneyOut)}
            </span>
            <span className="text-[10px] text-slate-400 font-sans font-medium">Vendors, overheads & partner draws</span>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Mobile Money Actions Section (Prompt Requirement #13) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Money In Panel */}
        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-emerald-900 tracking-tight">
              Money In (Record Inflow)
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/orders"
              className="touch-target-44 p-2.5 rounded-xl bg-white border border-emerald-200 text-xs font-bold text-emerald-900 hover:bg-emerald-50 text-center shadow-xs flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              <span>Customer Payment</span>
            </Link>
            <Link
              to="/partners"
              className="touch-target-44 p-2.5 rounded-xl bg-white border border-emerald-200 text-xs font-bold text-emerald-900 hover:bg-emerald-50 text-center shadow-xs flex items-center justify-center gap-1.5"
            >
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
              <span>Partner Investment</span>
            </Link>
          </div>
        </div>

        {/* Money Out Panel */}
        <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-xs">
              <Minus className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-rose-900 tracking-tight">
              Money Out (Record Outflow)
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Link
              to="/orders"
              className="touch-target-44 p-2.5 rounded-xl bg-white border border-rose-200 text-xs font-bold text-rose-900 hover:bg-rose-50 text-center shadow-xs flex items-center justify-center gap-1"
            >
              <span>Supplier</span>
            </Link>
            <Link
              to="/expenses"
              className="touch-target-44 p-2.5 rounded-xl bg-white border border-rose-200 text-xs font-bold text-rose-900 hover:bg-rose-50 text-center shadow-xs flex items-center justify-center gap-1"
            >
              <Receipt className="w-3.5 h-3.5 text-rose-600" />
              <span>Expense</span>
            </Link>
            <Link
              to="/partners"
              className="touch-target-44 p-2.5 rounded-xl bg-white border border-rose-200 text-xs font-bold text-rose-900 hover:bg-rose-50 text-center shadow-xs flex items-center justify-center gap-1"
            >
              <span>Draw</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
        {/* Type Tabs */}
        <div className="flex border-b border-slate-200 gap-3 sm:gap-6 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setTypeTab('')}
            className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
              typeTab === ''
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            All Ledger
          </button>
          <button
            type="button"
            onClick={() => setTypeTab('MONEY_IN')}
            className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all flex items-center gap-1 ${
              typeTab === 'MONEY_IN'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Money In</span>
          </button>
          <button
            type="button"
            onClick={() => setTypeTab('MONEY_OUT')}
            className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all flex items-center gap-1 ${
              typeTab === 'MONEY_OUT'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Money Out</span>
          </button>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description, reference..."
              className="w-full min-h-[44px] pl-10 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="w-full min-h-[44px] px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium bg-white"
          >
            <option value="">All Source Types</option>
            <option value="CUSTOMER_PAYMENT">Customer Payment</option>
            <option value="SUPPLIER_PAYMENT">Supplier Disbursement</option>
            <option value="BUSINESS_EXPENSE">Business Expense</option>
            <option value="PARTNER_INVESTMENT">Partner Investment</option>
            <option value="PARTNER_WITHDRAWAL">Partner Withdrawal</option>
          </select>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full min-h-[44px] px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium bg-white"
          >
            <option value="">All Payment Modes</option>
            <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
            <option value="UPI">UPI</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
          </select>
        </div>
      </div>

      {/* Transactions Content: Mobile Cards (<640px) vs Desktop Table (>=640px) */}
      {loading ? (
        <LoadingSkeleton rows={6} cols={4} />
      ) : transactions.length === 0 ? (
        <EmptyState
          title="No transactions recorded"
          description="Transactions are created when payments, investments, or expenses occur."
        />
      ) : (
        <>
          {/* Mobile Transaction Cards */}
          <div className="sm:hidden space-y-2.5">
            {transactions.map((tx) => {
              const isIn = tx.transaction_type === 'MONEY_IN';

              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${isIn ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        />
                        <span className="text-[11px] font-bold text-slate-800">
                          {tx.source_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-900 font-semibold mt-1">
                        {tx.description}
                      </p>
                    </div>
                    <span
                      className={`font-mono text-sm font-black ${
                        isIn ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {isIn ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                    <span>{formatDate(tx.transaction_date)} • {tx.payment_method}</span>
                    {tx.related_order_number && (
                      <span className="text-slate-600 font-bold">
                        Order: {tx.related_order_number}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (>=640px) */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Source</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Mode</th>
                    <th className="py-3.5 px-4">Ref Order</th>
                    <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {transactions.map((tx) => {
                    const isIn = tx.transaction_type === 'MONEY_IN';
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {formatDate(tx.transaction_date)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              isIn
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isIn ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {isIn ? 'Money In' : 'Money Out'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-mono text-[11px]">
                          {tx.source_type}
                        </td>
                        <td className="py-3.5 px-4 text-slate-900 max-w-xs truncate">
                          {tx.description}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {tx.payment_method}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                          {tx.related_order_number || '-'}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-mono font-bold text-sm ${
                            isIn ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isIn ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchTransactions(pagination.page - 1)}
              className="touch-target-44 px-3 py-1.5 bg-white border border-slate-300 rounded-xl disabled:opacity-40 font-semibold"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchTransactions(pagination.page + 1)}
              className="touch-target-44 px-3 py-1.5 bg-white border border-slate-300 rounded-xl disabled:opacity-40 font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Money;
