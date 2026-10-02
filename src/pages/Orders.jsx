import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  AlertTriangle,
  ArrowUpDown,
  CreditCard,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate, formatPercentage, getMarginBadge } from '../utils/formatters';
import { exportToCSV } from '../utils/exporter';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { OrderFormModal } from '../components/orders/OrderFormModal';
import { AddPaymentModal } from '../components/orders/AddPaymentModal';

export const Orders = () => {
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
    // Load categories and customers for filters
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

  const handleExportCSV = () => {
    const headers = [
      { label: 'Order Number', key: 'order_number' },
      { label: 'Customer', key: 'customer_name' },
      { label: 'Category', key: 'category_name' },
      { label: 'Date', key: 'order_date' },
      { label: 'Status', key: 'status' },
      { label: 'Total Value (INR)', key: 'total_amount' },
      { label: 'Total Cost (INR)', key: 'total_cost' },
      { label: 'Gross Profit (INR)', key: 'gross_profit' },
      { label: 'Margin %', key: 'margin_percentage' },
      { label: 'Amount Paid (INR)', key: 'paid_amount' },
      { label: 'Balance Receivable (INR)', key: 'balance_amount' },
    ];
    exportToCSV('orders_report', headers, orders);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Customer Orders
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage procurement, fulfillment statuses & calculate exact margins
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Order
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order #, customer..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
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

          {/* Category Filter */}
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Customer Filter */}
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
          >
            <option value="">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </select>

          {/* Date range quick */}
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

      {/* Orders Table */}
      {loading ? (
        <LoadingSkeleton rows={6} cols={6} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders found"
          description="Try changing your filters or create a new order."
          actionLabel="Create Order"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                  const marginInfo = getMarginBadge(parseFloat(o.margin_percentage), parseFloat(o.gross_profit));
                  const balanceDue = parseFloat(o.balance_amount);
                  const isPaid = balanceDue <= 0;

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <Link
                          to={`/orders/${o.id}`}
                          className="hover:underline hover:text-slate-700"
                        >
                          {o.order_number}
                        </Link>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {o.customer_name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {o.customer_code}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {o.category_name || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(o.order_date)}
                      </td>

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
                        <div className="text-[10px]">
                          <span className={`px-1.5 py-0.2 rounded border font-semibold ${marginInfo.className}`}>
                            {o.margin_percentage}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={o.status} />
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            to={`/orders/${o.id}`}
                            title="View Full Details"
                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {balanceDue > 0 && o.status !== 'CANCELLED' && (
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
                              title="Record Customer Payment"
                              className="p-1.5 rounded-md text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 transition-colors"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
            <span>
              Showing {orders.length} of {pagination.total} orders
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchOrders(pagination.page - 1)}
                className="px-2.5 py-1 rounded bg-white border border-slate-300 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-2.5 py-1 font-semibold text-slate-700">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchOrders(pagination.page + 1)}
                className="px-2.5 py-1 rounded bg-white border border-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      <OrderFormModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => fetchOrders(1)}
      />

      {/* Customer Payment Modal */}
      <AddPaymentModal
        isOpen={paymentModalState.open}
        onClose={() => setPaymentModalState({ ...paymentModalState, open: false })}
        orderId={paymentModalState.orderId}
        type="CUSTOMER"
        customerId={paymentModalState.customerId}
        maxAmount={paymentModalState.maxAmount}
        onSuccess={() => fetchOrders(pagination.page)}
      />
    </div>
  );
};
