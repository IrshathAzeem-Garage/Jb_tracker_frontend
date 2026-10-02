import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Download,
  Filter,
  Calendar,
  Layers,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToCSV } from '../utils/exporter';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';

export const Money = () => {
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
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Central Cash Ledger
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Complete, immutable audit trail of every rupee entering or leaving the business
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          Export Ledger CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Money In (Inflow)
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-700 block mt-1">
              +{formatCurrency(summary.totalMoneyIn)}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Investments & customer receipts</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Money Out (Disbursed)
            </span>
            <span className="text-2xl font-bold font-mono text-rose-700 block mt-1">
              -{formatCurrency(summary.totalMoneyOut)}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Vendors, expenses & draws</span>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-100">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Cash Available (In Hand)
            </span>
            <span className="text-2xl font-bold font-mono text-white block mt-1">
              {formatCurrency(summary.cashInHand)}
            </span>
            <span className="text-[11px] text-slate-300 font-medium">True liquid balance (In - Out)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800 text-white border border-slate-700">
            <Wallet className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-4">
        {/* Type Tabs */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setTypeTab('')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              typeTab === ''
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            All Transactions
          </button>
          <button
            onClick={() => setTypeTab('MONEY_IN')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              typeTab === 'MONEY_IN'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            Money In (Receipts)
          </button>
          <button
            onClick={() => setTypeTab('MONEY_OUT')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
              typeTab === 'MONEY_OUT'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Money Out (Disbursements)
          </button>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description, reference..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
          >
            <option value="">All Source Types</option>
            <option value="CUSTOMER_PAYMENT">CUSTOMER_PAYMENT</option>
            <option value="SUPPLIER_PAYMENT">SUPPLIER_PAYMENT</option>
            <option value="BUSINESS_EXPENSE">BUSINESS_EXPENSE</option>
            <option value="PARTNER_INVESTMENT">PARTNER_INVESTMENT</option>
            <option value="PARTNER_WITHDRAWAL">PARTNER_WITHDRAWAL</option>
            <option value="OTHER_INCOME">OTHER_INCOME</option>
            <option value="OTHER_EXPENSE">OTHER_EXPENSE</option>
          </select>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
          >
            <option value="">All Payment Methods</option>
            <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
            <option value="UPI">UPI</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="OTHER">Other</option>
          </select>

          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-1/2 px-2 py-2 text-[11px] border border-slate-300 rounded-lg"
              title="From date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-1/2 px-2 py-2 text-[11px] border border-slate-300 rounded-lg"
              title="To date"
            />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <LoadingSkeleton rows={6} cols={5} />
      ) : transactions.length === 0 ? (
        <EmptyState
          title="No transactions recorded"
          description="Cash movements are automatically registered when recording payments, expenses, or partner investments."
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Source Category</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4 text-center">Payment Method</th>
                  <th className="py-3.5 px-4 text-center">Related Order</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {transactions.map((t) => {
                  const isMoneyIn = t.transaction_type === 'MONEY_IN';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {formatDate(t.transaction_date)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isMoneyIn
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {isMoneyIn ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {t.transaction_type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {t.source_type}
                      </td>

                      <td className="py-3.5 px-4 text-slate-900 font-semibold">
                        {t.description}
                      </td>

                      <td className="py-3.5 px-4 text-center text-slate-600 font-medium">
                        {t.payment_method}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                        {t.related_order_number || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm">
                        <span className={isMoneyIn ? 'text-emerald-700' : 'text-slate-900'}>
                          {isMoneyIn ? '+' : '-'}{formatCurrency(t.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
            <span>
              Showing {transactions.length} of {pagination.total} ledger entries
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchTransactions(pagination.page - 1)}
                className="px-2.5 py-1 rounded bg-white border border-slate-300 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2.5 py-1 font-semibold text-slate-700">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchTransactions(pagination.page + 1)}
                className="px-2.5 py-1 rounded bg-white border border-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
