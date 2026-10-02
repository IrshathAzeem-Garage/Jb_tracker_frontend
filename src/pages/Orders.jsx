import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  CreditCard,
  X,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate, formatPercentage, getMarginBadge } from '../utils/formatters';
import { exportToCSV } from '../utils/exporter';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { OrderFormModal } from '../components/orders/OrderFormModal';
import { AddPaymentModal } from '../components/orders/AddPaymentModal';
import { MobileFilterSheet } from '../components/common/MobileFilterSheet';
import { useToast } from '../context/ToastContext';

export const Orders = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('order_date');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [paymentModalState, setPaymentModalState] = useState({
    open: false,
    orderId: null,
    customerId: null,
    maxAmount: 0,
  });

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
        search,
        status,
        categoryId,
        customerId,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      });

      const res = await api.get(`/orders?${params.toString()}`);
      if (res.success) {
        setOrders(res.data.orders);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [catRes, custRes] = await Promise.all([
          api.get('/categories'),
          api.get('/customers?limit=100'),
        ]);
        setCategories(catRes.data || []);
        setCustomers(custRes.data.customers || []);
      } catch (err) {
        console.error('Filter loading failed:', err);
      }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    fetchOrders(1);
  }, [search, status, categoryId, customerId, startDate, endDate, sortBy, sortOrder]);

  const activeFilterCount = [status, categoryId, customerId, startDate, endDate].filter(Boolean).length;

  const handleClearFilters = () => {
    setStatus('');
    setCategoryId('');
    setCustomerId('');
    setStartDate('');
    setEndDate('');
  };

  const handleExportCSV = () => {
    const headers = [
      { label: 'Order Number', key: 'order_number' },
      { label: 'Customer Code', key: 'customer_code' },
      { label: 'Customer Name', key: 'customer_name' },
      { label: 'Category', key: 'category_name' },
      { label: 'Order Date', key: 'order_date' },
      { label: 'Status', key: 'status' },
      { label: 'Total Value (INR)', key: 'total_amount' },
      { label: 'Direct Cost (INR)', key: 'total_cost' },
      { label: 'Gross Profit (INR)', key: 'gross_profit' },
      { label: 'Margin (%)', key: 'margin_percentage' },
      { label: 'Amount Paid (INR)', key: 'paid_amount' },
      { label: 'Balance Due (INR)', key: 'balance_amount' },
    ];
    exportToCSV('orders_export', headers, orders);
    showToast('Orders exported to CSV', 'info');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile-First Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Orders
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage customer purchase orders, procurement costs, & profit margins
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
            onClick={() => setCreateModalOpen(true)}
            className="touch-target-44 flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Order</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
        {/* Full-width responsive search with clear button */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, customer, or code..."
            className="w-full min-h-[44px] pl-10 pr-9 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 touch-target-44"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile Filter Button (opens bottom sheet on mobile) */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterSheetOpen(true)}
            className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={handleClearFilters}
              className="min-h-[44px] px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 rounded-xl"
            >
              Reset
            </button>
          )}
        </div>

        {/* Desktop Filter Row (Hidden on mobile) */}
        <div className="hidden sm:flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-medium min-h-[44px]"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PROCUREMENT">PROCUREMENT</option>
            <option value="CUSTOMIZATION">CUSTOMIZATION</option>
            <option value="READY">READY</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-medium min-h-[44px]"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white font-medium min-h-[44px]"
          >
            <option value="">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Content: Mobile Cards (<640px) vs Desktop Table (>=640px) */}
      {loading ? (
        <LoadingSkeleton rows={5} cols={4} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders found"
          description="Try changing your filters or create a new order."
          actionLabel="Create Order"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : (
        <>
          {/* MOBILE ORDER CARDS (<640px) */}
          <div className="sm:hidden space-y-3">
            {orders.map((o) => {
              const balanceDue = parseFloat(o.balance_amount);
              const isPaid = balanceDue <= 0;
              const grossProfit = parseFloat(o.gross_profit);

              return (
                <div
                  key={o.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 relative touch-manipulation"
                >
                  {/* Card Header: Order #, Customer & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        to={`/orders/${o.id}`}
                        className="font-mono text-sm font-extrabold text-slate-900 hover:underline"
                      >
                        {o.order_number}
                      </Link>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug mt-0.5">
                        {o.customer_name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-medium text-slate-500">
                          {o.category_name || 'Standard Order'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          • {formatDate(o.order_date)}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={o.status} />
                  </div>

                  {/* Financial Metrics Strip */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">Total</span>
                      <strong className="text-xs text-slate-900 font-bold">{formatCurrency(o.total_amount)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">Paid</span>
                      <strong className="text-xs text-emerald-700 font-bold">{formatCurrency(o.paid_amount)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-sans font-bold">Balance</span>
                      <strong className={`text-xs font-bold ${isPaid ? 'text-emerald-600' : 'text-amber-700'}`}>
                        {isPaid ? 'Settled' : formatCurrency(balanceDue)}
                      </strong>
                    </div>
                  </div>

                  {/* Profit & Margin info */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-slate-500">Gross Profit:</span>
                      <strong className={`font-bold ${grossProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatCurrency(grossProfit)}
                      </strong>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold font-sans">
                        {o.margin_percentage}%
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isPaid && (
                        <button
                          type="button"
                          onClick={() =>
                            setPaymentModalState({
                              open: true,
                              orderId: o.id,
                              customerId: o.customer_id,
                              maxAmount: balanceDue,
                            })
                          }
                          className="touch-target-44 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold hover:bg-emerald-100"
                        >
                          + Pay
                        </button>
                      )}
                      <Link
                        to={`/orders/${o.id}`}
                        className="touch-target-44 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold hover:bg-slate-200"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP ORDERS TABLE (>=640px) */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Order Value</th>
                    <th className="py-3.5 px-4 text-right">Paid</th>
                    <th className="py-3.5 px-4 text-right">Balance</th>
                    <th className="py-3.5 px-4 text-right">Cost</th>
                    <th className="py-3.5 px-4 text-right">Profit</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {orders.map((o) => {
                    const balanceDue = parseFloat(o.balance_amount);
                    const isPaid = balanceDue <= 0;
                    const marginInfo = getMarginBadge(parseFloat(o.margin_percentage), parseFloat(o.gross_profit));

                    return (
                      <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          <Link to={`/orders/${o.id}`} className="hover:underline">
                            {o.order_number}
                          </Link>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{o.customer_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{o.customer_code}</div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">{o.category_name || '-'}</td>
                        <td className="py-3.5 px-4 text-slate-500">{formatDate(o.order_date)}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(o.total_amount)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-emerald-700">
                          {formatCurrency(o.paid_amount)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold">
                          {isPaid ? (
                            <span className="text-emerald-600 text-[11px] font-bold">Settled</span>
                          ) : (
                            <span className="text-amber-700">{formatCurrency(balanceDue)}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                          {formatCurrency(o.total_cost)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono">
                          <div className={`font-bold ${parseFloat(o.gross_profit) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {formatCurrency(o.gross_profit)}
                          </div>
                          <span className={`px-1.5 py-0.2 rounded border font-semibold text-[10px] ${marginInfo.className}`}>
                            {o.margin_percentage}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {!isPaid && (
                              <button
                                onClick={() =>
                                  setPaymentModalState({
                                    open: true,
                                    orderId: o.id,
                                    customerId: o.customer_id,
                                    maxAmount: balanceDue,
                                  })
                                }
                                title="Record payment"
                                className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                              >
                                <CreditCard className="w-4 h-4" />
                              </button>
                            )}
                            <Link
                              to={`/orders/${o.id}`}
                              title="View details"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          </div>
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

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 text-xs text-slate-500">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} orders)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchOrders(pagination.page - 1)}
              className="touch-target-44 px-3 py-1.5 bg-white border border-slate-300 rounded-xl disabled:opacity-40 font-semibold"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchOrders(pagination.page + 1)}
              className="touch-target-44 px-3 py-1.5 bg-white border border-slate-300 rounded-xl disabled:opacity-40 font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Mobile Filter Bottom Sheet */}
      <MobileFilterSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="Filter Orders"
        onClear={handleClearFilters}
        onApply={() => fetchOrders(1)}
      >
        <div className="space-y-4 text-xs font-semibold text-slate-700">
          <div>
            <label className="block mb-1.5">Order Status</label>
            <div className="grid grid-cols-2 gap-2">
              {['', 'CONFIRMED', 'PROCUREMENT', 'CUSTOMIZATION', 'READY', 'DELIVERED', 'DRAFT'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-left border ${
                    status === st
                      ? 'bg-slate-900 text-white border-slate-900 font-bold'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {st || 'All Statuses'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block mb-1.5">Business Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1.5">Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block mb-1.5">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block mb-1.5">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>
          </div>
        </div>
      </MobileFilterSheet>

      {/* Modals */}
      <OrderFormModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          showToast('Order created successfully!', 'success');
          fetchOrders(1);
        }}
      />

      <AddPaymentModal
        isOpen={paymentModalState.open}
        onClose={() => setPaymentModalState({ ...paymentModalState, open: false })}
        orderId={paymentModalState.orderId}
        customerId={paymentModalState.customerId}
        maxAmount={paymentModalState.maxAmount}
        onSuccess={() => {
          showToast('Customer payment recorded successfully!', 'success');
          fetchOrders(pagination.page);
        }}
      />
    </div>
  );
};

export default Orders;
