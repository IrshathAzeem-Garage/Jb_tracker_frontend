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
  Building,
} from 'lucide-react';
import api from '../services/api';
import { formatDateTime } from '../utils/formatters';
import { ResponsiveModal } from '../components/common/ResponsiveModal';
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
    <div className="space-y-5 pb-16">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          System Settings & Administration
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Configure business profile, team roles, and system audit log
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('company')}
          className={`px-3 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all touch-target-44 flex items-center gap-1.5 ${
            activeTab === 'company'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          Company Profile
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-3 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all touch-target-44 flex items-center gap-1.5 ${
            activeTab === 'users'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Users & Roles ({users?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all touch-target-44 flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Audit Log ({auditLogs?.length || 0})
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {message}
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          {error}
        </div>
      )}

      {/* Tab: Company Profile */}
      {activeTab === 'company' && companySettings && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 max-w-2xl">
          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company Legal Name
              </label>
              <input
                type="text"
                required
                value={companySettings.company_name}
                onChange={(e) => setCompanySettings({ ...companySettings, company_name: e.target.value })}
                className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Business Trade Name
              </label>
              <input
                type="text"
                required
                value={companySettings.business_name}
                onChange={(e) => setCompanySettings({ ...companySettings, business_name: e.target.value })}
                className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Currency
                </label>
                <input
                  type="text"
                  required
                  value={companySettings.currency}
                  onChange={(e) => setCompanySettings({ ...companySettings, currency: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Timezone
                </label>
                <input
                  type="text"
                  required
                  value={companySettings.timezone}
                  onChange={(e) => setCompanySettings({ ...companySettings, timezone: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  FY Start (MM-DD)
                </label>
                <input
                  type="text"
                  required
                  value={companySettings.financial_year_start}
                  onChange={(e) => setCompanySettings({ ...companySettings, financial_year_start: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50 touch-target-44 shadow-sm active:scale-95 transition-all"
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Team Accounts ({users?.length || 0})
            </h3>
            <button
              onClick={() => setUserModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 touch-target-44 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add User
            </button>
          </div>

          {/* Mobile Cards for Users */}
          <div className="sm:hidden space-y-3">
            {users?.map((u) => (
              <div key={u.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border">
                    {u.role}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-500">{u.email}</div>
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ACTIVE
                  </span>
                  <span className="text-slate-400 font-mono">{formatDateTime(u.created_at)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
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
        </div>
      )}

      {/* Tab: Audit Log */}
      {activeTab === 'audit' && (
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
            System Activity Log ({auditLogs?.length || 0})
          </h3>

          {/* Mobile Cards for Audit */}
          <div className="sm:hidden space-y-3">
            {auditLogs?.map((log) => (
              <div key={log.id} className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{log.action}</span>
                  <span className="text-[10px] font-mono text-slate-400">{formatDateTime(log.created_at)}</span>
                </div>
                <div className="text-xs text-slate-600">
                  By: <span className="font-semibold text-slate-800">{log.user_name || 'System'}</span> • Entity: <span className="font-medium text-slate-700">{log.entity_type}</span>
                </div>
                {log.new_values && (
                  <div className="p-2 bg-slate-50 rounded-lg text-[10px] font-mono text-slate-500 truncate">
                    {JSON.stringify(log.new_values)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
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
                      <td className="py-2.5 px-4 text-slate-500">{formatDateTime(log.created_at)}</td>
                      <td className="py-2.5 px-4 text-slate-800 font-sans font-semibold">{log.user_name || 'System / Service'}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{log.action}</td>
                      <td className="py-2.5 px-4 text-slate-600">{log.entity_type}</td>
                      <td className="py-2.5 px-4 text-slate-400 font-mono text-[10px] max-w-xs truncate">
                        {log.new_values ? JSON.stringify(log.new_values) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add User Responsive Modal */}
      <ResponsiveModal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title="Create Team Member Account"
        subtitle="Grant role-based access to Just Business Things team"
      >
        <form onSubmit={handleCreateUser} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="e.g. Sales Executive"
              className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Work Email Address *
            </label>
            <input
              type="email"
              required
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="name@justbusinessthings.com"
              className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              minLength="6"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Assigned Role *
            </label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium bg-white"
            >
              <option value="STAFF">STAFF (Orders, Products, Customers, Suppliers)</option>
              <option value="MANAGER">MANAGER (Business operations & financial insights)</option>
              <option value="ADMIN">ADMIN (Full administrative & equity access)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setUserModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 touch-target-44"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={userSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50 touch-target-44"
            >
              {userSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </ResponsiveModal>
    </div>
  );
};
