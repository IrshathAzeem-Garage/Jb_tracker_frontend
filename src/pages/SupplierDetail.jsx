import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Truck,
  Mail,
  Phone,
  Download,
  FileText,
  AlertCircle,
  Eye,
  Plus,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToPDF, exportToCSV } from '../utils/exporter';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const SupplierDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('statement'); // 'statement' | 'items' | 'payments'

  const fetchSupplier = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/suppliers/${id}`);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load supplier details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplier();
  }, [id]);

  const handleExportStatementPDF = () => {
    if (!data) return;
    const { supplier, summary, statement } = data;

    const summaryData = [
      { label: 'Supplier', value: supplier.company_name },
      { label: 'Code', value: supplier.supplier_code },
      { label: 'Total Purchases', value: formatCurrency(summary.totalPurchases) },
      { label: 'Total Paid', value: formatCurrency(summary.totalPaid) },
      { label: 'Payable Due', value: formatCurrency(summary.outstanding) },
    ];

    const headers = ['Date', 'Type', 'Reference', 'Description', 'Purchase (Dr)', 'Disbursed (Cr)', 'Running Balance'];
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
      title: `Supplier Account Statement`,
      subtitle: `${supplier.company_name} (${supplier.supplier_code})`,
      headers,
      rows,
      summary: summaryData,
      filename: `supplier_statement_${supplier.supplier_code}`,
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
    exportToCSV(`statement_${data.supplier.supplier_code}`, headers, data.statement);
  };

  if (loading) return <LoadingSkeleton rows={8} cols={4} />;
  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-rose-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-900">{error || 'Supplier not found'}</h3>
        <Link to="/suppliers" className="mt-4 inline-block px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold">
          ← Back to Suppliers
        </Link>
      </div>
    );
  }

  const { supplier, summary, procurementItems, payments, statement } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/suppliers')}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {supplier.company_name}
              </h2>
              <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-100 text-slate-700">
                {supplier.supplier_code}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Contact: {supplier.contact_person || 'N/A'} • {supplier.email || 'No email'} • {supplier.phone || 'No phone'}
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
            Supplier Statement PDF
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Orders Supplied</span>
          <span className="text-xl font-bold font-mono text-slate-900 block mt-1">
            {summary.totalOrders}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Distinct orders</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Purchase Cost</span>
          <span className="text-xl font-bold font-mono text-slate-900 block mt-1">
            {formatCurrency(summary.totalPurchases)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Committed costs</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Amount Disbursed</span>
          <span className="text-xl font-bold font-mono text-emerald-700 block mt-1">
            {formatCurrency(summary.totalPaid)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Bank payments made</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Payable Balance</span>
          <span className={`text-xl font-bold font-mono block mt-1 ${summary.outstanding > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
            {formatCurrency(summary.outstanding)}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Owed to vendor</span>
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
          Vendor Statement ({statement?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('items')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'items'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Procured Items ({procurementItems?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'payments'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Payments Disbursed ({payments?.length || 0})
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
              Outstanding Payable: {formatCurrency(summary.outstanding)}
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
                  <th className="py-3 px-4 text-right">Purchase (Dr)</th>
                  <th className="py-3 px-4 text-right">Paid (Cr)</th>
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
                          s.type === 'PURCHASE'
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

      {/* Procured Items Tab View */}
      {activeTab === 'items' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Item Description</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Total Committed</th>
                  <th className="py-3 px-4 text-center">Order Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {procurementItems?.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <Link to={`/orders/${i.order_id}`} className="hover:underline">
                        {i.order_number}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {i.customer_name}
                    </td>
                    <td className="py-3 px-4 text-slate-900 font-semibold">
                      {i.description}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      {i.quantity}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {formatCurrency(i.unit_cost_price)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(i.total_cost_amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={i.order_status} />
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
                  <th className="py-3 px-4">Disbursement Date</th>
                  <th className="py-3 px-4">Related Order</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Amount Disbursed</th>
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
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
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
