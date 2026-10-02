import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Download,
  Trash2,
  Edit,
  AlertCircle,
  Tag,
  DollarSign,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToCSV } from '../utils/exporter';
import { Modal } from '../components/common/Modal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';

const EXPENSE_CATEGORIES = [
  'Advertising',
  'Travel',
  'Courier',
  'Software',
  'Domain & Hosting',
  'Office',
  'Communication',
  'Bank Charges',
  'Printing',
  'Packaging',
  'Miscellaneous',
  'Other',
];

export const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ thisMonth: 0, thisYear: 0, total: 0, topCategories: [] });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expCategory, setExpCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expMethod, setExpMethod] = useState('BANK_TRANSFER');
  const [expRef, setExpRef] = useState('');
  const [expNotes, setExpNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchExpenses = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
        search,
        category,
        paymentMethod,
        startDate,
        endDate,
      });

      const res = await api.get(`/expenses?${params.toString()}`);
      if (res.success) {
        setExpenses(res.data.expenses);
        setSummary(res.data.summary);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses(1);
  }, [search, category, paymentMethod, startDate, endDate]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setExpCategory(EXPENSE_CATEGORIES[0]);
    setExpDescription('');
    setExpAmount('');
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpMethod('BANK_TRANSFER');
    setExpRef('');
    setExpNotes('');
    setError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (exp) => {
    setEditingId(exp.id);
    setExpCategory(exp.category);
    setExpDescription(exp.description);
    setExpAmount(exp.amount);
    setExpDate(exp.expense_date.split('T')[0]);
    setExpMethod(exp.payment_method);
    setExpRef(exp.receipt_reference || '');
    setExpNotes(exp.notes || '');
    setError('');
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense? This will also remove the corresponding transaction from the central cash ledger.')) {
      return;
    }
    try {
      const res = await api.delete(`/expenses/${id}`);
      if (res.success) {
        fetchExpenses(pagination.page);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete expense.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        category: expCategory,
        description: expDescription,
        amount: parseFloat(expAmount),
        expense_date: expDate,
        payment_method: expMethod,
        receipt_reference: expRef || null,
        notes: expNotes || null,
      };

      if (editingId) {
        await api.put(`/expenses/${editingId}`, payload);
      } else {
        await api.post('/expenses', payload);
      }

      setModalOpen(false);
      fetchExpenses(editingId ? pagination.page : 1);
    } catch (err) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      { label: 'Expense #', key: 'expense_number' },
      { label: 'Category', key: 'category' },
      { label: 'Description', key: 'description' },
      { label: 'Amount (INR)', key: 'amount' },
      { label: 'Date', key: 'expense_date' },
      { label: 'Payment Method', key: 'payment_method' },
      { label: 'Receipt Reference', key: 'receipt_reference' },
    ];
    exportToCSV('business_expenses', headers, expenses);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Operating Expenses
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            General business overheads (distinct from direct order procurement costs)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Record Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Expenses This Month
          </span>
          <span className="text-2xl font-bold font-mono text-slate-900 block mt-1">
            {formatCurrency(summary.thisMonth)}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Current calendar month</span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Expenses This Year
          </span>
          <span className="text-2xl font-bold font-mono text-slate-900 block mt-1">
            {formatCurrency(summary.thisYear)}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Current financial period</span>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total All-Time Overhead
          </span>
          <span className="text-2xl font-bold font-mono text-rose-700 block mt-1">
            {formatCurrency(summary.total)}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">Deducted from gross profit</span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description, number, ref..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
        >
          <option value="">All Categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
        >
          <option value="">All Payment Methods</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
          <option value="UPI">UPI</option>
          <option value="CARD">Card</option>
          <option value="CASH">Cash</option>
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

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={5} cols={5} />
      ) : expenses.length === 0 ? (
        <EmptyState
          title="No expenses found"
          description="Track administrative overheads, advertising, software, travel, or courier expenses."
          actionLabel="Record Expense"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Expense #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Method / Ref</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                      {e.expense_number}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {formatDate(e.expense_date)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-800">
                        <Tag className="w-2.5 h-2.5 text-slate-500" />
                        {e.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {e.description}
                      {e.notes && (
                        <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                          {e.notes}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="block font-semibold">{e.payment_method}</span>
                      {e.receipt_reference && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          Ref: {e.receipt_reference}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-slate-900">
                      {formatCurrency(e.amount)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(e)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          title="Edit Expense"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Expense Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Business Expense' : 'Record Operating Expense'}
        subtitle="Automatically records a money-out entry in central cash ledger"
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expense Category *
              </label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description *
            </label>
            <input
              type="text"
              required
              value={expDescription}
              onChange={(e) => setExpDescription(e.target.value)}
              placeholder="e.g. Google Cloud & Workspace monthly plan"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expense Date *
              </label>
              <input
                type="date"
                required
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method *
              </label>
              <select
                value={expMethod}
                onChange={(e) => setExpMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
              >
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Company Card</option>
                <option value="CASH">Petty Cash</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Receipt Reference / Invoice Number
            </label>
            <input
              type="text"
              value={expRef}
              onChange={(e) => setExpRef(e.target.value)}
              placeholder="e.g. INV-GSUITE-2026-09"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes / Tax Breakdown
            </label>
            <textarea
              rows="2"
              value={expNotes}
              onChange={(e) => setExpNotes(e.target.value)}
              placeholder="Additional internal audit notes..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingId ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
