import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  Layers,
  DollarSign,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const Partners = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [addPartnerOpen, setAddPartnerOpen] = useState(false);
  const [investmentModal, setInvestmentModal] = useState({ open: false, partnerId: null, partnerName: '' });
  const [withdrawalModal, setWithdrawalModal] = useState({ open: false, partnerId: null, partnerName: '' });

  // Partner Form State
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [ownershipPct, setOwnershipPct] = useState('50');
  const [profitSharePct, setProfitSharePct] = useState('50');

  // Investment Form State
  const [invAmount, setInvAmount] = useState('');
  const [invType, setInvType] = useState('ADDITIONAL');
  const [invDate, setInvDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [invMethod, setInvMethod] = useState('BANK_TRANSFER');
  const [invRef, setInvRef] = useState('');
  const [invDesc, setInvDesc] = useState('');

  // Withdrawal Form State
  const [wthAmount, setWthAmount] = useState('');
  const [wthDate, setWthDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [wthMethod, setWthMethod] = useState('BANK_TRANSFER');
  const [wthReason, setWthReason] = useState('Personal Draw');
  const [wthDesc, setWthDesc] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await api.get('/partners');
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load partners data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleCreatePartner = async (e) => {
    e.preventDefault();
    setActionError('');
    setSubmitting(true);
    try {
      const res = await api.post('/partners', {
        name: partnerName,
        email: partnerEmail || null,
        phone: partnerPhone || null,
        ownership_percentage: parseFloat(ownershipPct),
        profit_share_percentage: parseFloat(profitSharePct),
      });
      if (res.success) {
        setAddPartnerOpen(false);
        setPartnerName('');
        setPartnerEmail('');
        setPartnerPhone('');
        fetchPartners();
      }
    } catch (err) {
      setActionError(err.message || 'Failed to add partner');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordInvestment = async (e) => {
    e.preventDefault();
    setActionError('');
    setSubmitting(true);
    try {
      const res = await api.post(`/partners/${investmentModal.partnerId}/investments`, {
        amount: parseFloat(invAmount),
        investment_type: invType,
        investment_date: invDate,
        payment_method: invMethod,
        reference: invRef || null,
        description: invDesc || null,
      });
      if (res.success) {
        setInvestmentModal({ open: false, partnerId: null, partnerName: '' });
        setInvAmount('');
        setInvRef('');
        setInvDesc('');
        fetchPartners();
      }
    } catch (err) {
      setActionError(err.message || 'Failed to record investment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordWithdrawal = async (e) => {
    e.preventDefault();
    setActionError('');
    setSubmitting(true);
    try {
      const res = await api.post(`/partners/${withdrawalModal.partnerId}/withdrawals`, {
        amount: parseFloat(wthAmount),
        withdrawal_date: wthDate,
        payment_method: wthMethod,
        reason: wthReason || null,
        description: wthDesc || null,
      });
      if (res.success) {
        setWithdrawalModal({ open: false, partnerId: null, partnerName: '' });
        setWthAmount('');
        setWthDesc('');
        fetchPartners();
      }
    } catch (err) {
      setActionError(err.message || 'Failed to record withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={5} cols={4} />;
  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-rose-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-900">{error || 'Failed to load partners'}</h3>
      </div>
    );
  }

  const { partners, companyNetProfit, totalCapital } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Partner Capital & Equity Accounts
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Track founder investments, personal withdrawals & cumulative profit allocations
          </p>
        </div>

        <button
          onClick={() => {
            setActionError('');
            setAddPartnerOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Partner
        </button>
      </div>

      {/* Critical Rule Callout (Requirement 29 & 32) */}
      <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 shadow-sm flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-white">
            Important Partner Accounting Separation:
          </p>
          <p className="text-slate-300">
            <strong>Profit Allocation</strong> is earned equity according to profit share % (e.g. 50%), based on business Net Profit ({formatCurrency(companyNetProfit)}).
            <strong> Partner Withdrawal</strong> is actual cash taken out of the bank. A partner can earn profit without withdrawing cash, and withdrawals are <em>never</em> counted as operating business expenses.
          </p>
        </div>
      </div>

      {/* Partner Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {partners.map((p) => {
          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 hover:border-slate-300 card-hover-subtle"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 font-black text-slate-900 text-lg">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                      {p.name}
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">
                      Ownership: <strong>{p.ownership_percentage}%</strong> • Profit Share: <strong>{p.profit_share_percentage}%</strong>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Current Capital
                  </span>
                  <span className="text-2xl font-black font-mono text-slate-900">
                    {formatCurrency(p.current_capital)}
                  </span>
                </div>
              </div>

              {/* Financial Matrix for Partner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Total Invested
                  </span>
                  <span className="text-sm font-bold font-mono text-slate-900 mt-0.5 block">
                    {formatCurrency(p.total_investment)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Init: {formatCurrency(p.initial_investment)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Additional Infused
                  </span>
                  <span className="text-sm font-bold font-mono text-slate-900 mt-0.5 block">
                    {formatCurrency(p.additional_investment)}
                  </span>
                  <span className="text-[10px] text-slate-400">Expansion funds</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Cash Withdrawn
                  </span>
                  <span className="text-sm font-bold font-mono text-rose-700 mt-0.5 block">
                    -{formatCurrency(p.total_withdrawn)}
                  </span>
                  <span className="text-[10px] text-slate-400">Personal draw</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Allocated Profit
                  </span>
                  <span className="text-sm font-bold font-mono text-emerald-700 mt-0.5 block">
                    +{formatCurrency(p.allocated_profit)}
                  </span>
                  <span className="text-[10px] text-slate-400">{p.profit_share_percentage}% of net</span>
                </div>
              </div>

              {/* Action Buttons for this Partner */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActionError('');
                    setWithdrawalModal({ open: true, partnerId: p.id, partnerName: p.name });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Record Withdrawal
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActionError('');
                    setInvestmentModal({ open: true, partnerId: p.id, partnerName: p.name });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  Record Investment
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Partner Modal */}
      <Modal
        isOpen={addPartnerOpen}
        onClose={() => setAddPartnerOpen(false)}
        title="Add Business Partner"
        subtitle="Founders and equity shareholders in Just Business Things"
      >
        {actionError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {actionError}
          </div>
        )}

        <form onSubmit={handleCreatePartner} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Partner Full Name *
            </label>
            <input
              type="text"
              required
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="e.g. Partner C"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                placeholder="partner@justbusinessthings.com"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={partnerPhone}
                onChange={(e) => setPartnerPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ownership % *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                required
                value={ownershipPct}
                onChange={(e) => setOwnershipPct(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Profit Share % *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                required
                value={profitSharePct}
                onChange={(e) => setProfitSharePct(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddPartnerOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Add Partner'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Investment Modal */}
      <Modal
        isOpen={investmentModal.open}
        onClose={() => setInvestmentModal({ open: false, partnerId: null, partnerName: '' })}
        title={`Record Investment — ${investmentModal.partnerName}`}
        subtitle="Infuses funds into central cash ledger & builds partner capital"
      >
        {actionError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {actionError}
          </div>
        )}

        <form onSubmit={handleRecordInvestment} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={invAmount}
                onChange={(e) => setInvAmount(e.target.value)}
                placeholder="25000"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Investment Type *
              </label>
              <select
                value={invType}
                onChange={(e) => setInvType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
              >
                <option value="ADDITIONAL">ADDITIONAL (Expansion capital)</option>
                <option value="INITIAL">INITIAL (Founding capital)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={invDate}
                onChange={(e) => setInvDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method *
              </label>
              <select
                value={invMethod}
                onChange={(e) => setInvMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
              >
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Bank Reference / UTR
            </label>
            <input
              type="text"
              value={invRef}
              onChange={(e) => setInvRef(e.target.value)}
              placeholder="e.g. UTR-CAPITAL-004"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Notes
            </label>
            <textarea
              rows="2"
              value={invDesc}
              onChange={(e) => setInvDesc(e.target.value)}
              placeholder="Capital expansion infusion for inventory procurement..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setInvestmentModal({ open: false, partnerId: null, partnerName: '' })}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Record Investment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Withdrawal Modal */}
      <Modal
        isOpen={withdrawalModal.open}
        onClose={() => setWithdrawalModal({ open: false, partnerId: null, partnerName: '' })}
        title={`Record Partner Draw — ${withdrawalModal.partnerName}`}
        subtitle="Reduces liquid business cash (not classified as a business expense)"
      >
        {actionError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {actionError}
          </div>
        )}

        <form onSubmit={handleRecordWithdrawal} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Withdrawal Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={wthAmount}
                onChange={(e) => setWthAmount(e.target.value)}
                placeholder="5000"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason / Type
              </label>
              <input
                type="text"
                value={wthReason}
                onChange={(e) => setWthReason(e.target.value)}
                placeholder="e.g. Partner personal draw"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={wthDate}
                onChange={(e) => setWthDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Disbursement Method *
              </label>
              <select
                value={wthMethod}
                onChange={(e) => setWthMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
              >
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                <option value="UPI">UPI</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Notes
            </label>
            <textarea
              rows="2"
              value={wthDesc}
              onChange={(e) => setWthDesc(e.target.value)}
              placeholder="Partner quarterly profit draw..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setWithdrawalModal({ open: false, partnerId: null, partnerName: '' })}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Disburse Withdrawal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
