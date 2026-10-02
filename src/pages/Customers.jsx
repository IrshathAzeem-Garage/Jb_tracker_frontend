import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Download,
  Eye,
  Mail,
  Phone,
  Building,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { exportToCSV } from '../utils/exporter';
import { Modal } from '../components/common/Modal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';

export const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  // Add Customer Modal
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

  const fetchCustomers = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
        search,
        status,
      });
      const res = await api.get(`/customers?${params.toString()}`);
      if (res.success) {
        setCustomers(res.data.customers);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, [search, status]);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/customers', {
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
        fetchCustomers(1);
      }
    } catch (err) {
      setError(err.message || 'Failed to create customer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      { label: 'Customer Code', key: 'customer_code' },
      { label: 'Company Name', key: 'company_name' },
      { label: 'Contact Person', key: 'contact_person' },
      { label: 'Email', key: 'email' },
      { label: 'Phone', key: 'phone' },
      { label: 'GST Number', key: 'gst_number' },
      { label: 'Total Orders', key: 'total_orders' },
      { label: 'Total Sales (INR)', key: 'total_sales' },
      { label: 'Amount Paid (INR)', key: 'amount_paid' },
      { label: 'Outstanding Balance (INR)', key: 'outstanding_balance' },
      { label: 'Profit Generated (INR)', key: 'profit_generated' },
    ];
    exportToCSV('customers_directory', headers, customers);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Customer Directory
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Client relationships, billing history & accounts receivable tracking
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
            Add Customer
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, contact person, code, email..."
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
      ) : customers.length === 0 ? (
        <EmptyState
          title="No customers found"
          description="Create your first client account to begin recording orders."
          actionLabel="Add Customer"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Customer / Company</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4 text-center">Orders</th>
                  <th className="py-3.5 px-4 text-right">Total Sales</th>
                  <th className="py-3.5 px-4 text-right">Amount Paid</th>
                  <th className="py-3.5 px-4 text-right">Outstanding</th>
                  <th className="py-3.5 px-4 text-right">Profit Generated</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {customers.map((c) => {
                  const outstanding = parseFloat(c.outstanding_balance);
                  const isSettled = outstanding <= 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                        {c.customer_code}
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          to={`/customers/${c.id}`}
                          className="font-bold text-slate-900 hover:underline hover:text-slate-700 block"
                        >
                          {c.company_name}
                        </Link>
                        {c.gst_number && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            GST: {c.gst_number}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="block font-semibold text-slate-800">
                          {c.contact_person || '-'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {c.email || c.phone || ''}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                        {c.total_orders}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(c.total_sales)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-emerald-700">
                        {formatCurrency(c.amount_paid)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold">
                        {isSettled ? (
                          <span className="text-emerald-600 text-[11px] font-bold">Settled</span>
                        ) : (
                          <span className="text-amber-700 font-bold">{formatCurrency(outstanding)}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(c.profit_generated)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Link
                          to={`/customers/${c.id}`}
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

      {/* Add Customer Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Customer"
        subtitle="Automatic customer code generation (e.g. CUS-0006)"
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Company / Client Name *
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Technologies India Pvt Ltd"
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
                placeholder="e.g. Rahul Mehta"
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
                placeholder="e.g. 27AABCA1234F1Z5"
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
                placeholder="procurement@acme.com"
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
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Billing & Delivery Address
            </label>
            <textarea
              rows="2"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Unit #, Tech Park, City, State, PIN"
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
              {submitting ? 'Saving...' : 'Add Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
