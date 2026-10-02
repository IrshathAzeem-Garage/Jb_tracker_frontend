import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  Search,
  Plus,
  Download,
  Eye,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { exportToCSV } from '../utils/exporter';
import { ResponsiveModal } from '../components/common/ResponsiveModal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';

export const Suppliers = () => {
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  // Add Supplier Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchSuppliers = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
        search,
        status,
      });
      const res = await api.get(`/suppliers?${params.toString()}`);
      if (res.success) {
        setSuppliers(res.data.suppliers);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers(1);
  }, [search, status]);

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/suppliers', {
        company_name: companyName,
        contact_person: contactPerson || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        gst_number: gstNumber || null,
        notes: notes || null,
      });
      if (res.success) {
        setModalOpen(false);
        setCompanyName('');
        setContactPerson('');
        setEmail('');
        setPhone('');
        setAddress('');
        setGstNumber('');
        setNotes('');
        showToast('Supplier vendor registered successfully!', 'success');
        fetchSuppliers(1);
      }
    } catch (err) {
      setError(err.message || 'Failed to create supplier.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      { label: 'Supplier Code', key: 'supplier_code' },
      { label: 'Company Name', key: 'company_name' },
      { label: 'Contact Person', key: 'contact_person' },
      { label: 'Email', key: 'email' },
      { label: 'Phone', key: 'phone' },
      { label: 'Total Orders', key: 'total_orders' },
      { label: 'Purchase Cost (INR)', key: 'total_purchase_cost' },
      { label: 'Amount Paid (INR)', key: 'amount_paid' },
      { label: 'Outstanding Payable (INR)', key: 'outstanding_balance' },
    ];
    exportToCSV('suppliers_directory', headers, suppliers);
    showToast('Supplier directory exported to CSV', 'info');
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Suppliers & Vendors
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Procurement partners, vendor payables & purchase disbursements
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
            onClick={() => {
              setError('');
              setModalOpen(true);
            }}
            className="touch-target-44 flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by vendor name, code, contact..."
          className="w-full min-h-[44px] pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
        />
      </div>

      {/* Content: Mobile Cards (<640px - Prompt Requirement #23) vs Desktop Table */}
      {loading ? (
        <LoadingSkeleton rows={6} cols={4} />
      ) : suppliers.length === 0 ? (
        <EmptyState
          title="No suppliers found"
          description="Click 'Add Supplier' to register a manufacturing or wholesale partner."
          actionLabel="Add Supplier"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <>
          {/* Mobile Supplier Cards (<640px) */}
          <div className="sm:hidden space-y-2.5">
            {suppliers.map((s) => {
              const outstanding = parseFloat(s.outstanding_balance);
              const isSettled = outstanding <= 0;

              return (
                <Link
                  key={s.id}
                  to={`/suppliers/${s.id}`}
                  className="block p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5 hover:bg-slate-50 transition-colors touch-manipulation"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                        {s.company_name}
                      </h4>
                      <span className="font-mono text-[10px] text-slate-400">
                        {s.supplier_code} • {s.total_orders} Orders
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 mt-0.5" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-sans block">Procurement</span>
                      <strong className="text-slate-900 font-bold">{formatCurrency(s.total_purchase_cost)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-sans block">Payable Due</span>
                      <strong className={isSettled ? 'text-emerald-700' : 'text-rose-700'}>
                        {isSettled ? '₹0.00 (Settled)' : formatCurrency(outstanding)}
                      </strong>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Desktop Table (>=640px) */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Vendor / Supplier</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4 text-center">Orders</th>
                    <th className="py-3.5 px-4 text-right">Purchase Cost</th>
                    <th className="py-3.5 px-4 text-right">Amount Paid</th>
                    <th className="py-3.5 px-4 text-right">Payable Due</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {suppliers.map((s) => {
                    const outstanding = parseFloat(s.outstanding_balance);
                    const isSettled = outstanding <= 0;

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                          {s.supplier_code}
                        </td>

                        <td className="py-3.5 px-4">
                          <Link
                            to={`/suppliers/${s.id}`}
                            className="font-bold text-slate-900 hover:underline hover:text-slate-700 block"
                          >
                            {s.company_name}
                          </Link>
                          {s.gst_number && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              GST: {s.gst_number}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          <span className="block font-semibold text-slate-800">
                            {s.contact_person || '-'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {s.email || s.phone || ''}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                          {s.total_orders}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(s.total_purchase_cost)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-emerald-700">
                          {formatCurrency(s.amount_paid)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-semibold">
                          {isSettled ? (
                            <span className="text-emerald-600 text-[11px] font-bold">Settled</span>
                          ) : (
                            <span className="text-rose-700 font-bold">{formatCurrency(outstanding)}</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <Link
                            to={`/suppliers/${s.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Statement
                          </Link>
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchSuppliers(pagination.page - 1)}
              className="touch-target-44 px-3 py-1.5 bg-white border border-slate-300 rounded-xl disabled:opacity-40 font-semibold"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchSuppliers(pagination.page + 1)}
              className="touch-target-44 px-3 py-1.5 bg-white border border-slate-300 rounded-xl disabled:opacity-40 font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      <ResponsiveModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Supplier / Vendor"
        subtitle="Automatic code generation (e.g. SUP-0006)"
        maxWidth="max-w-md"
      >
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Supplier / Company Name *
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. ABC Textiles Mills Ltd"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Contact Person
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@abctextiles.in"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                placeholder="33AAAAA0000A1Z5"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Warehouse / Factory Address
            </label>
            <textarea
              rows="2"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full factory or warehouse address..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="min-h-[44px] px-4 py-2 text-sm font-semibold text-slate-600 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] px-5 py-2 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </ResponsiveModal>
    </div>
  );
};

export default Suppliers;
