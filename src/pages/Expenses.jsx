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
  Calendar,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToCSV } from '../utils/exporter';
import { ResponsiveModal } from '../components/common/ResponsiveModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';

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
  const { showToast } = useToast();
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

  // Delete Confirmation Modal (Prompt Requirement #43)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, expense: null });

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

  const confirmDeleteExpense = async () => {
    if (!deleteConfirm.expense) return;
    try {
      const res = await api.delete(`/expenses/${deleteConfirm.expense.id}`);
      if (res.success) {
        showToast('Expense deleted and ledger debits reversed', 'info');
        setDeleteConfirm({ open: false, expense: null });
        fetchExpenses(pagination.page);
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete expense', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsed = parseFloat(expAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid expense amount greater than zero.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        category: expCategory,
        description: expDescription,
        amount: parsed,
        expense_date: expDate,
        payment_method: expMethod,
        receipt_reference: expRef || null,
        notes: expNotes || null,
      };

      if (editingId) {
        await api.put(`/expenses/${editingId}`, payload);
        showToast('Expense updated successfully', 'success');
      } else {
        await api.post('/expenses', payload);
        showToast('Expense recorded & deducted from central cash ledger', 'success');
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
    showToast('Expenses exported to CSV', 'info');
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Operating Expenses
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Day-to-day administrative & operational overheads
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="touch-target-44 flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="touch-target-44 flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 font-mono">
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans">
            Expenses This Month
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 block mt-0.5">
            {formatCurrency(summary.thisMonth)}
          </span>
          <span className="text-[10px] text-slate-400 font-sans font-medium">Calendar month overheads</span>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans">
            Financial Year Total
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 block mt-0.5">
            {formatCurrency(summary.thisYear)}
          </span>
          <span className="text-[10px] text-slate-400 font-sans font-medium">Current financial year</span>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans">
            All-Time Overheads
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 block mt-0.5">
            {formatCurrency(summary.total)}
          </span>
          <span className="text-[10px] text-slate-400 font-sans font-medium">Cumulative business expenses</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
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
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full min-h-[44px] px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium bg-white"
          >
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full min-h-[44px] px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium bg-white"
          >
            <option value="">All Payment Modes</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="UPI">UPI</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
          </select>
        </div>
      </div>

      {/* Expense Content: Mobile Cards (<640px) vs Desktop Table (>=640px) */}
      {loading ? (
        <LoadingSkeleton rows={6} cols={4} />
      ) : expenses.length === 0 ? (
        <EmptyState
          title="No expenses recorded"
          description="Click 'Add Expense' to record administrative or operational overheads."
          actionLabel="Add Expense"
          onAction={handleOpenAdd}
        />
      ) : (
        <>
          {/* Mobile Expense Cards (<640px) */}
          <div className="sm:hidden space-y-2.5">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {exp.category}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {exp.expense_number}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">
                      {exp.description}
                    </h4>
                  </div>
                  <span className="font-mono text-sm font-black text-slate-900">
                    {formatCurrency(exp.amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                  <span>{formatDate(exp.expense_date)} • {exp.payment_method}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(exp)}
                      className="touch-target-44 p-1.5 text-slate-600 hover:text-slate-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ open: true, expense: exp })}
                      className="touch-target-44 p-1.5 text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (>=640px) */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Expense #</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Mode</th>
                    <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {exp.expense_number}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(exp.expense_date)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-900 max-w-xs truncate">
                        {exp.description}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {exp.payment_method}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(exp.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(exp)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ open: true, expense: exp })}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Expense Modal (ResponsiveModal: BottomSheet on mobile, modal on desktop) */}
      <ResponsiveModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Expense Record' : 'Record Operating Expense'}
        subtitle="Recorded expenses immediately debit liquid cash and deduct from Net Profit"
        maxWidth="max-w-md"
      >
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Expense Category *
            </label>
            <select
              value={expCategory}
              onChange={(e) => setExpCategory(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Amount (₹) *
              </label>
              {parseFloat(expAmount || 0) > 0 && (
                <span className="text-xs font-mono font-bold text-slate-900">
                  Formatted: {formatCurrency(expAmount)}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-base pointer-events-none">
                ₹
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                required
                placeholder="2500"
                className="w-full min-h-[44px] pl-8 pr-4 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Expense Date *
              </label>
              <input
                type="date"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                required
                className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Payment Method *
              </label>
              <select
                value={expMethod}
                onChange={(e) => setExpMethod(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
              >
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description *
            </label>
            <input
              type="text"
              value={expDescription}
              onChange={(e) => setExpDescription(e.target.value)}
              required
              placeholder="e.g. Google Workspace monthly subscription"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Receipt / Invoice Reference
            </label>
            <input
              type="text"
              value={expRef}
              onChange={(e) => setExpRef(e.target.value)}
              placeholder="e.g. INV-2026-9921"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? 'Saving...' : editingId ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* Financial Safety Confirm Delete Dialog (Prompt Requirement #43) */}
      <ConfirmModal
        isOpen={deleteConfirm.open}
        title="Delete Expense Record?"
        message={
          deleteConfirm.expense
            ? `Are you sure you want to delete ${deleteConfirm.expense.expense_number} (${formatCurrency(deleteConfirm.expense.amount)} - ${deleteConfirm.expense.category})? This will reverse the disbursement in the central cash ledger.`
            : ''
        }
        confirmLabel="Confirm & Delete"
        onConfirm={confirmDeleteExpense}
        onClose={() => setDeleteConfirm({ open: false, expense: null })}
      />
    </div>
  );
};

export default Expenses;
