import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  Search,
  Plus,
  Download,
  Eye,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { exportToCSV } from '../utils/exporter';
import { Modal } from '../components/common/Modal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';

export const Suppliers = () => {
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
      { label: 'GST Number', key: 'gst_number' },
      { label: 'Orders Supplied', key: 'total_orders' },
      { label: 'Total Purchase Cost (INR)', key: 'total_purchase_cost' },
      { label: 'Amount Paid (INR)', key: 'amount_paid' },
      { label: 'Outstanding Payable (INR)', key: 'outstanding_balance' },
    ];
    exportToCSV('suppliers_directory', headers, suppliers);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Suppliers & Vendors
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Procurement partners, costs committed & accounts payable tracking
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
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor name, code, contact person..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={5} cols={5} />
      ) : suppliers.length === 0 ? (
        <EmptyState
          title="No suppliers found"
          description="Register your manufacturing vendors and raw material suppliers."
          actionLabel="Add Supplier"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
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
      )}

      {/* Add Supplier Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Supplier / Vendor"
        subtitle="Automatic code generation (e.g. SUP-0006)"
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supplier / Company Name *
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Tirupur Garments Hub Pvt Ltd"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Person Name
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Murugan S."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GST Number
              </label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                placeholder="e.g. 33AAACT1234D1Z2"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sales@vendor.in"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 94433 11220"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Factory / Office Address
            </label>
            <textarea
              rows="2"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Industrial Estate, City, State, PIN"
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
              {submitting ? 'Saving...' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
