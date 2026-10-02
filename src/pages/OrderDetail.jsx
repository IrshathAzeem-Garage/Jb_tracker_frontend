import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Building,
  CreditCard,
  Truck,
  Plus,
  Printer,
  Download,
  AlertTriangle,
  AlertCircle,
  Clock,
  User,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate, formatDateTime, formatPercentage, getMarginBadge } from '../utils/formatters';
import { exportToPDF } from '../utils/exporter';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { AddPaymentModal } from '../components/orders/AddPaymentModal';

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
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState([]);

  // Modals
  const [customerPaymentOpen, setCustomerPaymentOpen] = useState(false);
  const [supplierPaymentOpen, setSupplierPaymentOpen] = useState(false);
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState(null);

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
        fetchOrder();
      }
    } catch (err) {
      alert(err.message || 'Failed to update order status');
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
  };

  if (loading) return <LoadingSkeleton rows={8} cols={4} />;
  if (error || !order) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-rose-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-900">{error || 'Order not found'}</h3>
        <Link to="/orders" className="mt-4 inline-block px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  const { financialSummary } = order;
  const marginBadge = getMarginBadge(financialSummary.profitMargin, financialSummary.grossProfit);
  const currentStatusIndex = ORDER_STATUS_FLOW.indexOf(order.status);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                {order.order_number}
              </h2>
              <StatusBadge status={order.status} />
              {order.status === 'CANCELLED' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                  Cancelled
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Customer: <Link to={`/customers/${order.customer_id}`} className="font-bold text-slate-900 hover:underline">{order.customer_name}</Link> ({order.customer_code})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>

          {financialSummary.balance > 0 && order.status !== 'CANCELLED' && (
            <button
              onClick={() => setCustomerPaymentOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors shadow-sm"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Collect Payment
            </button>
          )}
        </div>
      </div>

      {/* Fulfillment Status Timeline */}
      {order.status !== 'CANCELLED' && (
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
            Fulfillment Workflow
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {ORDER_STATUS_FLOW.map((st, idx) => {
              const isPassed = currentStatusIndex >= idx;
              const isCurrent = order.status === st;

              return (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  className={`p-2 rounded-lg border text-xs font-bold text-center transition-all ${
                    isCurrent
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : isPassed
                      ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="block text-[9px] uppercase opacity-75">Step {idx + 1}</span>
                  <span>{st}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Financial Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Order Value</span>
          <span className="text-xl font-bold font-mono text-slate-900 block mt-1">
            {formatCurrency(financialSummary.orderValue)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Billed to client</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Amount Paid</span>
          <span className="text-xl font-bold font-mono text-emerald-700 block mt-1">
            {formatCurrency(financialSummary.amountPaid)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">{order.customerPayments?.length || 0} transaction(s)</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Receivable</span>
          <span className={`text-xl font-bold font-mono block mt-1 ${financialSummary.balance > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
            {formatCurrency(financialSummary.balance)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Customer pending</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Direct Cost</span>
          <span className="text-xl font-bold font-mono text-slate-700 block mt-1">
            {formatCurrency(financialSummary.totalCost)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Total supplier cost</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Gross Profit</span>
          <span className={`text-xl font-bold font-mono block mt-1 ${financialSummary.grossProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatCurrency(financialSummary.grossProfit)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Value minus direct cost</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Profit Margin</span>
          <span className="text-xl font-bold font-mono text-slate-900 block mt-1">
            {formatPercentage(financialSummary.profitMargin)}
          </span>
          <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold border ${marginBadge.className}`}>
            {marginBadge.text}
          </span>
        </div>
      </div>

      {/* Margin Warnings if negative or low */}
      {financialSummary.grossProfit < 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <strong className="text-sm font-bold block">Loss-making Order Alert</strong>
            <span>Direct procurement cost of {formatCurrency(financialSummary.totalCost)} exceeds order price of {formatCurrency(financialSummary.orderValue)}. Loss: {formatCurrency(Math.abs(financialSummary.grossProfit))}.</span>
          </div>
        </div>
      )}

      {/* Order Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Order Line Items ({order.items?.length || 0})
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Category: <strong>{order.category_name || 'General'}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
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
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{item.description}</span>
                    {item.product_name && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Base: {item.product_name} {item.product_sku ? `(${item.product_sku})` : ''}
                      </span>
                    )}
                  </td>
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
                    {item.supplier_name ? (
                      <Link to={`/suppliers/${item.supplier_id}`} className="hover:underline text-slate-800 font-semibold">
                        {item.supplier_name}
                      </Link>
                    ) : (
                      <span className="text-slate-400 italic">None assigned</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two column: Customer Payments & Supplier Payments Ledgers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Payments */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Customer Payments Received
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                Total: <strong>{formatCurrency(financialSummary.amountPaid)}</strong>
              </span>
            </div>
            {financialSummary.balance > 0 && (
              <button
                type="button"
                onClick={() => setCustomerPaymentOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-slate-900 rounded-md hover:bg-slate-800"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Payment
              </button>
            )}
          </div>

          <div className="p-4 flex-1">
            {order.customerPayments?.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">
                No customer payments recorded yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {order.customerPayments.map((p) => (
                  <div key={p.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-emerald-800 font-mono text-sm block">
                        +{formatCurrency(p.amount)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(p.payment_date)} • {p.payment_method} {p.reference_number ? `(${p.reference_number})` : ''}
                      </span>
                      {p.notes && <p className="text-[10px] text-slate-500 mt-0.5">{p.notes}</p>}
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

        {/* Supplier Disbursements */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Supplier Payments Disbursed
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                Direct costs committed: <strong>{formatCurrency(financialSummary.totalCost)}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSupplierPaymentOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Pay Supplier
            </button>
          </div>

          <div className="p-4 flex-1">
            {order.supplierPayments?.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">
                No supplier payments disbursed for this order yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {order.supplierPayments.map((p) => (
                  <div key={p.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-800 font-mono text-sm">
                          -{formatCurrency(p.amount)}
                        </span>
                        <span className="font-semibold text-slate-700">
                          to {p.supplier_name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(p.payment_date)} • {p.payment_method} {p.reference_number ? `(${p.reference_number})` : ''}
                      </span>
                      {p.notes && <p className="text-[10px] text-slate-500 mt-0.5">{p.notes}</p>}
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

      {/* Add Customer Payment Modal */}
      <AddPaymentModal
        isOpen={customerPaymentOpen}
        onClose={() => setCustomerPaymentOpen(false)}
        orderId={order.id}
        type="CUSTOMER"
        customerId={order.customer_id}
        maxAmount={financialSummary.balance}
        onSuccess={fetchOrder}
      />

      {/* Add Supplier Payment Modal */}
      <AddPaymentModal
        isOpen={supplierPaymentOpen}
        onClose={() => setSupplierPaymentOpen(false)}
        orderId={order.id}
        type="SUPPLIER"
        suppliers={suppliers}
        maxAmount={financialSummary.totalCost}
        onSuccess={fetchOrder}
      />
    </div>
  );
};
