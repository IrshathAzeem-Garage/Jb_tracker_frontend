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
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/customers')}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {customer.company_name}
              </h2>
              <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 text-slate-700">
                {customer.customer_code}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Contact: {customer.contact_person || 'N/A'} • {customer.email || 'No email'} • {customer.phone || 'No phone'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportStatementCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={handleExportStatementPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            Statement PDF
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Orders</span>
          <span className="text-xl font-bold font-mono text-slate-900 block mt-1">
            {summary.totalOrders}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">B2B contracts</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Invoiced</span>
          <span className="text-xl font-bold font-mono text-slate-900 block mt-1">
            {formatCurrency(summary.totalSales)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Delivered & confirmed</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Amount Paid</span>
          <span className="text-xl font-bold font-mono text-emerald-700 block mt-1">
            {formatCurrency(summary.totalPaid)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Collected to bank</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Outstanding</span>
          <span className={`text-xl font-bold font-mono block mt-1 ${summary.outstanding > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
            {formatCurrency(summary.outstanding)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Current balance due</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Profit Generated</span>
          <span className="text-xl font-bold font-mono text-emerald-700 block mt-1">
            {formatCurrency(summary.profit)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Cumulative gross profit</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-4">
        <button
          onClick={() => setActiveTab('statement')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'statement'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Customer Statement ({statement?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'orders'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Orders ({orders?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'payments'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Payments Received ({payments?.length || 0})
        </button>
      </div>

      {/* Statement Tab View */}
      {activeTab === 'statement' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Chronological Ledger & Running Balance
            </span>
            <span className="text-xs font-mono font-bold text-slate-700">
              Closing Balance: {formatCurrency(summary.outstanding)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
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
                    <td className="py-3 px-4 font-sans text-slate-600">
                      {formatDate(s.date)}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.type === 'INVOICE'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {s.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {s.reference}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-600">
                      {s.description}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-900">
                      {s.debit > 0 ? formatCurrency(s.debit) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-700">
                      {s.credit > 0 ? formatCurrency(s.credit) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(s.runningBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Tab View */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {o.order_number}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {o.category_name || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatDate(o.order_date)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(o.total_amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700">
                      {formatCurrency(o.paid_amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-amber-700">
                      {formatCurrency(o.balance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        to={`/orders/${o.id}`}
                        className="p-1 text-slate-400 hover:text-slate-900 inline-block"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payments Tab View */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                    <td className="py-3 px-4 text-slate-600">
                      {formatDate(p.payment_date)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {p.order_number || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {p.payment_method}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {p.reference_number || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {p.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {formatCurrency(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
