import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  Download,
  AlertCircle,
  Clock,
  Plus,
  Truck,
  Building,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate, formatPercentage, getMarginBadge } from '../utils/formatters';
import { exportToPDF } from '../utils/exporter';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { AddPaymentModal } from '../components/orders/AddPaymentModal';
import { useToast } from '../context/ToastContext';

const ORDER_STATUS_FLOW = [
  'DRAFT',
  'CONFIRMED',
  'PROCUREMENT',
  'CUSTOMIZATION',
  'READY',
  'DELIVERED',
];

export const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState([]);

  // Modals
  const [customerPaymentOpen, setCustomerPaymentOpen] = useState(false);
  const [supplierPaymentOpen, setSupplierPaymentOpen] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const [orderRes, suppRes] = await Promise.all([
        api.get(`/orders/${id}`),
        api.get('/suppliers?limit=100'),
      ]);
      if (orderRes.success) {
        setOrder(orderRes.data);
      }
      setSuppliers(suppRes.data.suppliers || []);
    } catch (err) {
      setError(err.message || 'Failed to load order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await api.put(`/orders/${id}`, { status: newStatus });
      if (res.success) {
        showToast(`Order status updated to ${newStatus}`, 'success');
        fetchOrder();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update order status', 'error');
    }
  };

  const handleExportPDF = () => {
    if (!order) return;
    const summary = [
      { label: 'Order Number', value: order.order_number },
      { label: 'Customer', value: order.customer_name },
      { label: 'Order Date', value: formatDate(order.order_date) },
      { label: 'Total Value', value: formatCurrency(order.financialSummary.orderValue) },
      { label: 'Amount Paid', value: formatCurrency(order.financialSummary.amountPaid) },
      { label: 'Balance Due', value: formatCurrency(order.financialSummary.balance) },
    ];

    const headers = ['#', 'Item Description', 'Qty', 'Selling Price', 'Cost Price', 'Total Value', 'Direct Cost', 'Profit'];
    const rows = (order.items || []).map((item, idx) => [
      idx + 1,
      item.description,
      item.quantity,
      formatCurrency(item.unit_selling_price),
      formatCurrency(item.unit_cost_price),
      formatCurrency(item.total_selling_amount),
      formatCurrency(item.total_cost_amount),
      formatCurrency(item.profit),
    ]);

    exportToPDF({
      title: `Order Statement - ${order.order_number}`,
      subtitle: `Customer: ${order.customer_name} (${order.customer_code})`,
      headers,
      rows,
      summary,
      filename: `order_${order.order_number}`,
    });
    showToast('Order statement downloaded', 'info');
  };

  if (loading) return <LoadingSkeleton rows={8} cols={4} />;
  if (error || !order) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-rose-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-900">{error || 'Order not found'}</h3>
        <Link to="/orders" className="mt-4 inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  const { financialSummary } = order;
  const marginBadge = getMarginBadge(financialSummary.profitMargin, financialSummary.grossProfit);
  const currentStatusIndex = ORDER_STATUS_FLOW.indexOf(order.status);

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* Top Header: Order Number, Customer, Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="touch-target-44 p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-950 shadow-sm"
            aria-label="Back to orders"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 font-mono tracking-tight">
                {order.order_number}
              </h2>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Customer: <Link to={`/customers/${order.customer_id}`} className="font-bold text-slate-900 hover:underline">{order.customer_name}</Link> ({order.customer_code})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="touch-target-44 flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          {financialSummary.balance > 0 && order.status !== 'CANCELLED' && (
            <button
              onClick={() => setCustomerPaymentOpen(true)}
              className="touch-target-44 flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800 transition-colors shadow-sm"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Collect ₹{financialSummary.balance.toLocaleString('en-IN')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Vertical Key Metrics Strip (Prompt Requirement #10) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4 font-mono">
        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase font-sans">Order Value</span>
          <span className="text-base sm:text-lg font-black text-slate-900 block mt-0.5 truncate">
            {formatCurrency(financialSummary.orderValue)}
          </span>
          <span className="text-[10px] text-slate-400 font-sans font-medium">Customer billed</span>
        </div>

        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase font-sans">Amount Paid</span>
          <span className="text-base sm:text-lg font-black text-emerald-700 block mt-0.5 truncate">
            {formatCurrency(financialSummary.amountPaid)}
          </span>
          <span className="text-[10px] text-slate-400 font-sans font-medium">Received in cash</span>
        </div>

        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase font-sans">Outstanding</span>
          <span className={`text-base sm:text-lg font-black block mt-0.5 truncate ${financialSummary.balance > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
            {formatCurrency(financialSummary.balance)}
          </span>
          <span className="text-[10px] text-slate-400 font-sans font-medium">Balance due</span>
        </div>

        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase font-sans">Direct Cost</span>
          <span className="text-base sm:text-lg font-black text-slate-700 block mt-0.5 truncate">
            {formatCurrency(financialSummary.totalCost)}
          </span>
          <span className="text-[10px] text-slate-400 font-sans font-medium">Vendor cost</span>
        </div>

        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase font-sans">Gross Profit</span>
          <span className={`text-base sm:text-lg font-black block mt-0.5 truncate ${financialSummary.grossProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatCurrency(financialSummary.grossProfit)}
          </span>
          <span className="text-[10px] text-slate-400 font-sans font-medium">Order profit</span>
        </div>

        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase font-sans">Margin</span>
          <span className="text-base sm:text-lg font-black text-slate-900 block mt-0.5 truncate">
            {formatPercentage(financialSummary.profitMargin)}
          </span>
          <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold border font-sans ${marginBadge.className}`}>
            {marginBadge.text}
          </span>
        </div>
      </div>

      {/* Fulfillment Status Timeline */}
      {order.status !== 'CANCELLED' && (
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Order Timeline & Status
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {ORDER_STATUS_FLOW.map((st, idx) => {
              const isPassed = currentStatusIndex >= idx;
              const isCurrent = order.status === st;

              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusChange(st)}
                  className={`min-h-[44px] p-2 rounded-xl border text-xs font-bold text-center transition-all ${
                    isCurrent
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : isPassed
                      ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="block text-[9px] uppercase opacity-75">Step {idx + 1}</span>
                  <span className="leading-tight block">{st}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer & Supplier Payments Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Customer Payments */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Customer Payments
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                Paid: {formatCurrency(financialSummary.amountPaid)}
              </span>
            </div>
            {financialSummary.balance > 0 && (
              <button
                type="button"
                onClick={() => setCustomerPaymentOpen(true)}
                className="touch-target-44 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800"
              >
                + Collect
              </button>
            )}
          </div>

          <div className="p-4 flex-1">
            {order.customerPayments?.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">
                No payments collected yet.
              </p>
            ) : (
              <div className="space-y-2">
                {order.customerPayments.map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-emerald-800 font-mono text-sm block">
                        +{formatCurrency(p.amount)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(p.payment_date)} • {p.payment_method}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Credited
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Supplier Payments */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Supplier Payments
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                Disbursed: {formatCurrency(order.supplierPayments?.reduce((s, p) => s + parseFloat(p.amount), 0) || 0)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSupplierPaymentOpen(true)}
              className="touch-target-44 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
            >
              + Disburse
            </button>
          </div>

          <div className="p-4 flex-1">
            {order.supplierPayments?.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">
                No supplier disbursements recorded yet.
              </p>
            ) : (
              <div className="space-y-2">
                {order.supplierPayments.map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-rose-800 font-mono text-sm">
                          -{formatCurrency(p.amount)}
                        </span>
                        <span className="text-slate-700 font-semibold truncate max-w-[120px]">
                          to {p.supplier_name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(p.payment_date)} • {p.payment_method}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                      Disbursed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Line Items: Mobile Cards (<640px) vs Desktop Table (>=640px) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
            Order Items ({order.items?.length || 0})
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Category: <strong>{order.category_name || 'Standard'}</strong>
          </span>
        </div>

        {/* Mobile Item Cards (<640px) */}
        <div className="sm:hidden p-3.5 space-y-3">
          {order.items?.map((item, idx) => (
            <div key={item.id || idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h5 className="font-bold text-slate-900 text-xs">{item.description}</h5>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Qty: {item.quantity} {item.product_unit || 'pcs'}
                  </span>
                </div>
                <span className={`font-mono text-xs font-bold ${parseFloat(item.profit) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  +{formatCurrency(item.profit)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono p-2 rounded-lg bg-white border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[9px] uppercase block font-sans">Price</span>
                  <span>{formatCurrency(item.unit_selling_price)} / unit</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[9px] uppercase block font-sans">Cost</span>
                  <span>{formatCurrency(item.unit_cost_price)} / unit</span>
                </div>
              </div>

              {item.supplier_name && (
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Truck className="w-3 h-3 text-slate-400" />
                  <span>Vendor: <strong>{item.supplier_name}</strong></span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop Table (>=640px) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/60 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Item & Description</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-right">Selling Total</th>
                <th className="py-3 px-4 text-right">Cost Total</th>
                <th className="py-3 px-4 text-right">Profit</th>
                <th className="py-3 px-4">Procurement Vendor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {order.items?.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-bold text-slate-900">{item.description}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                    {item.quantity} {item.product_unit || 'pcs'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-800">
                    {formatCurrency(item.unit_selling_price)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500">
                    {formatCurrency(item.unit_cost_price)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(item.total_selling_amount)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">
                    {formatCurrency(item.total_cost_amount)}
                  </td>
                  <td className={`py-3 px-4 text-right font-mono font-bold ${parseFloat(item.profit) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatCurrency(item.profit)}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {item.supplier_name || <span className="text-slate-400 italic">None</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Payment Modal */}
      <AddPaymentModal
        isOpen={customerPaymentOpen}
        onClose={() => setCustomerPaymentOpen(false)}
        orderId={order.id}
        type="CUSTOMER"
        customerId={order.customer_id}
        maxAmount={financialSummary.balance}
        onSuccess={() => {
          showToast('Customer payment recorded successfully!', 'success');
          fetchOrder();
        }}
      />

      {/* Add Supplier Payment Modal */}
      <AddPaymentModal
        isOpen={supplierPaymentOpen}
        onClose={() => setSupplierPaymentOpen(false)}
        orderId={order.id}
        type="SUPPLIER"
        suppliers={suppliers}
        maxAmount={financialSummary.totalCost}
        onSuccess={() => {
          showToast('Supplier payment recorded successfully!', 'success');
          fetchOrder();
        }}
      />
    </div>
  );
};

export default OrderDetail;
