import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Users,
  Shield,
  Clock,
  Save,
  Plus,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import api from '../services/api';
import { formatDateTime } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('company'); // 'company' | 'users' | 'audit'
  const [companySettings, setCompanySettings] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Add User Modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('STAFF');
  const [userSubmitting, setUserSubmitting] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const [compRes, usersRes, auditRes] = await Promise.all([
        api.get('/settings/company'),
        api.get('/settings/users').catch(() => ({ success: false, data: [] })),
        api.get('/settings/audit-logs').catch(() => ({ success: false, data: { logs: [] } })),
      ]);
      if (compRes.success) setCompanySettings(compRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (auditRes.success) setAuditLogs(auditRes.data.logs || []);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await api.put('/settings/company', companySettings);
      if (res.success) {
        setMessage('Company settings updated successfully.');
      }
    } catch (err) {
      setError(err.message || 'Failed to update company settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserSubmitting(true);
    setError('');
    try {
      const res = await api.post('/settings/users', {
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });
      if (res.success) {
        setUserModalOpen(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        fetchSettings();
      }
    } catch (err) {
      setError(err.message || 'Failed to create user account');
    } finally {
      setUserSubmitting(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={6} cols={3} />;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          System Settings & Administration
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Configure business profile, manage user accounts & inspect system audit trail
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-6">
        <button
          onClick={() => setActiveTab('company')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'company'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Company Profile
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'users'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Users & Roles ({users?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'audit'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Audit Log ({auditLogs?.length || 0})
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {message}
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          {error}
        </div>
      )}

      {/* Tab: Company Profile */}
      {activeTab === 'company' && companySettings && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl">
          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Legal Name
              </label>
              <input
                type="text"
                required
                value={companySettings.company_name}
                onChange={(e) => setCompanySettings({ ...companySettings, company_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business Trade Name
              </label>
              <input
                type="text"
                required
                value={companySettings.business_name}
                onChange={(e) => setCompanySettings({ ...companySettings, business_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Currency
                </label>
                <input
                  type="text"
                  required
                  value={companySettings.currency}
                  onChange={(e) => setCompanySettings({ ...companySettings, currency: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Timezone
                </label>
                <input
                  type="text"
                  required
                  value={companySettings.timezone}
                  onChange={(e) => setCompanySettings({ ...companySettings, timezone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  FY Start (MM-DD)
                </label>
                <input
                  type="text"
                  required
                  value={companySettings.financial_year_start}
                  onChange={(e) => setCompanySettings({ ...companySettings, financial_year_start: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono text-xs"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Users & Roles */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Team Accounts
            </h3>
            <button
              onClick={() => setUserModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
            >
              <Plus className="w-3.5 h-3.5" />
              Add User
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4 text-center">Assigned Role</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {users?.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{u.email}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ACTIVE
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {formatDateTime(u.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            System Activity & Change Log
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Change Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium font-mono text-[11px]">
                {auditLogs?.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-500">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800 font-sans font-semibold">
                      {log.user_name || 'System / Service'}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {log.entity_type}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 font-mono text-[10px] max-w-xs truncate">
                      {log.new_values ? JSON.stringify(log.new_values) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title="Create Team Member Account"
        subtitle="Grant role-based access to Just Business Things team"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="e.g. Sales Executive"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Email Address *
            </label>
            <input
              type="email"
              required
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="name@justbusinessthings.com"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              minLength="6"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assigned Role *
            </label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
            >
              <option value="STAFF">STAFF (Orders, Products, Customers, Suppliers)</option>
              <option value="MANAGER">MANAGER (Business operations & financial insights)</option>
              <option value="ADMIN">ADMIN (Full administrative & equity access)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setUserModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={userSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50"
            >
              {userSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
