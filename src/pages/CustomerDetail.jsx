import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  MapPin,
  Download,
  Calendar,
  FileText,
  DollarSign,
  AlertCircle,
  Eye,
  CreditCard,
  Package,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToPDF, exportToCSV } from '../utils/exporter';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('statement'); // 'statement' | 'orders' | 'payments'

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/customers/${id}`);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleExportStatementPDF = () => {
    if (!data) return;
    const { customer, summary, statement } = data;

    const summaryData = [
      { label: 'Customer', value: customer.company_name },
      { label: 'Code', value: customer.customer_code },
      { label: 'Total Invoiced', value: formatCurrency(summary.totalSales) },
      { label: 'Total Paid', value: formatCurrency(summary.totalPaid) },
      { label: 'Outstanding Balance', value: formatCurrency(summary.outstanding) },
    ];

    const headers = ['Date', 'Type', 'Reference', 'Description', 'Invoice (Dr)', 'Payment (Cr)', 'Running Balance'];
    const rows = (statement || []).map((item) => [
      formatDate(item.date),
      item.type,
      item.reference,
      item.description,
      item.debit > 0 ? formatCurrency(item.debit) : '-',
      item.credit > 0 ? formatCurrency(item.credit) : '-',
      formatCurrency(item.runningBalance),
    ]);

    exportToPDF({
      title: `Customer Account Statement`,
      subtitle: `${customer.company_name} (${customer.customer_code})`,
      headers,
      rows,
      summary: summaryData,
      filename: `statement_${customer.customer_code}`,
    });
  };

  const handleExportStatementCSV = () => {
    if (!data) return;
    const headers = [
      { label: 'Date', key: 'date' },
      { label: 'Type', key: 'type' },
      { label: 'Reference', key: 'reference' },
      { label: 'Description', key: 'description' },
      { label: 'Debit (INR)', key: 'debit' },
      { label: 'Credit (INR)', key: 'credit' },
      { label: 'Running Balance (INR)', key: 'runningBalance' },
    ];
    exportToCSV(`statement_${data.customer.customer_code}`, headers, data.statement);
  };

  if (loading) return <LoadingSkeleton rows={8} cols={4} />;
  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-rose-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-900">{error || 'Customer not found'}</h3>
        <Link to="/customers" className="mt-4 inline-block px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold">
          ← Back to Customers
        </Link>
      </div>
    );
  }

  const { customer, summary, orders, payments, statement } = data;

  return (
    <div className="space-y-5 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate('/customers')}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm touch-target-44 flex items-center justify-center"
            aria-label="Back to Customers"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate">
                {customer.company_name}
              </h2>
              <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-700">
                {customer.customer_code}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              {customer.contact_person ? `${customer.contact_person} • ` : ''}
              {customer.phone || customer.email || 'No contact info'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportStatementCSV}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-sm touch-target-44"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button
            onClick={handleExportStatementPDF}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 shadow-sm touch-target-44"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF Statement
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Orders</span>
          <span className="text-lg sm:text-xl font-black font-mono text-slate-900 block mt-1">
            {summary.totalOrders}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">B2B contracts</span>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Invoiced</span>
          <span className="text-lg sm:text-xl font-black font-mono text-slate-900 block mt-1">
            {formatCurrency(summary.totalSales)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Delivered total</span>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Collected</span>
          <span className="text-lg sm:text-xl font-black font-mono text-emerald-700 block mt-1">
            {formatCurrency(summary.totalPaid)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Paid in bank</span>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Outstanding</span>
          <span className={`text-lg sm:text-xl font-black font-mono block mt-1 ${summary.outstanding > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
            {formatCurrency(summary.outstanding)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Due balance</span>
        </div>

        <div className="col-span-2 lg:col-span-1 p-3.5 bg-slate-950 text-white rounded-2xl shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Profit Generated</span>
          <span className="text-lg sm:text-xl font-black font-mono text-emerald-400 block mt-1">
            {formatCurrency(summary.profit)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Gross margin</span>
        </div>
      </div>

      {/* Tabs (Segmented) */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('statement')}
          className={`px-3 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all touch-target-44 flex items-center gap-1.5 ${
            activeTab === 'statement'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Statement ({statement?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all touch-target-44 flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Orders ({orders?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-3 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all touch-target-44 flex items-center gap-1.5 ${
            activeTab === 'payments'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          Payments ({payments?.length || 0})
        </button>
      </div>

      {/* 1. Statement Tab View */}
      {activeTab === 'statement' && (
        <div className="space-y-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Ledger Running Balance</span>
            <span className="font-mono font-bold text-slate-900">Closing: {formatCurrency(summary.outstanding)}</span>
          </div>

          {/* Mobile Cards for Statement */}
          <div className="sm:hidden space-y-3">
            {(!statement || statement.length === 0) ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border">No ledger entries.</div>
            ) : (
              statement.map((s, idx) => (
                <div key={idx} className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">{formatDate(s.date)}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      s.type === 'INVOICE' ? 'bg-slate-100 text-slate-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {s.type}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs">
                    {s.reference} {s.description ? `• ${s.description}` : ''}
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Debit</span>
                      <span className="font-mono font-bold text-slate-800">{s.debit > 0 ? formatCurrency(s.debit) : '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Credit</span>
                      <span className="font-mono font-bold text-emerald-700">{s.credit > 0 ? formatCurrency(s.credit) : '-'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Balance</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(s.runningBalance)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Debit (Invoice)</th>
                    <th className="py-3 px-4 text-right">Credit (Payment)</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium font-mono">
                  {statement?.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-sans text-slate-600">{formatDate(s.date)}</td>
                      <td className="py-3 px-4 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.type === 'INVOICE' ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {s.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{s.reference}</td>
                      <td className="py-3 px-4 font-sans text-slate-600">{s.description}</td>
                      <td className="py-3 px-4 text-right text-slate-900">{s.debit > 0 ? formatCurrency(s.debit) : '-'}</td>
                      <td className="py-3 px-4 text-right text-emerald-700">{s.credit > 0 ? formatCurrency(s.credit) : '-'}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{formatCurrency(s.runningBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Orders Tab View */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3">
            {(!orders || orders.length === 0) ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border">No orders found.</div>
            ) : (
              orders.map((o) => (
                <Link
                  key={o.id}
                  to={`/orders/${o.id}`}
                  className="block p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-slate-300 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 text-sm">{o.order_number}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {o.category_name || 'B2B Supplies'} • {formatDate(o.order_date)}
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Value</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(o.total_amount)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Paid</span>
                      <span className="font-mono font-bold text-emerald-700">{formatCurrency(o.paid_amount)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Balance</span>
                      <span className={`font-mono font-bold ${o.balance > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                        {formatCurrency(o.balance)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Value</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {orders?.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{o.order_number}</td>
                      <td className="py-3 px-4 text-slate-600">{o.category_name || '-'}</td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(o.order_date)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(o.total_amount)}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700">{formatCurrency(o.paid_amount)}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-amber-700">{formatCurrency(o.balance)}</td>
                      <td className="py-3 px-4 text-center"><StatusBadge status={o.status} /></td>
                      <td className="py-3 px-4 text-center">
                        <Link to={`/orders/${o.id}`} className="p-1 text-slate-400 hover:text-slate-900 inline-block">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Payments Tab View */}
      {activeTab === 'payments' && (
        <div className="space-y-3">
          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3">
            {(!payments || payments.length === 0) ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border">No payment records.</div>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">{formatDate(p.payment_date)}</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">{formatCurrency(p.amount)}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    Order: {p.order_number || 'Direct Payment'} • {p.payment_method}
                  </div>
                  {p.reference_number && (
                    <div className="text-[11px] font-mono text-slate-500">Ref: {p.reference_number}</div>
                  )}
                  {p.notes && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">{p.notes}</div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4">Related Order</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Reference</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Amount Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payments?.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 text-slate-600">{formatDate(p.payment_date)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.order_number || '-'}</td>
                      <td className="py-3 px-4 text-slate-700">{p.payment_method}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{p.reference_number || '-'}</td>
                      <td className="py-3 px-4 text-slate-500">{p.notes || '-'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">{formatCurrency(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
