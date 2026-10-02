import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  Layers,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';
import { ResponsiveModal } from '../components/common/ResponsiveModal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { useToast } from '../context/ToastContext';

export const Partners = () => {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cashBalance, setCashBalance] = useState(0);

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
      const [pRes, dRes] = await Promise.all([
        api.get('/partners'),
        api.get('/dashboard'),
      ]);
      if (pRes.success) {
        setData(pRes.data);
      }
      if (dRes.success) {
        setCashBalance(parseFloat(dRes.data.metrics.cashAvailable || 0));
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
        showToast('Partner added successfully!', 'success');
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

    const parsed = parseFloat(invAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setActionError('Investment amount must be greater than zero.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await api.post(`/partners/${investmentModal.partnerId}/investments`, {
        amount: parsed,
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
        showToast('Investment recorded & liquid cash updated in central ledger!', 'success');
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

    const parsed = parseFloat(wthAmount);
    if (isNaN(parsed) || parsed <= 0) {
      setActionError('Withdrawal amount must be greater than zero.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await api.post(`/partners/${withdrawalModal.partnerId}/withdrawals`, {
        amount: parsed,
        withdrawal_date: wthDate,
        payment_method: wthMethod,
        reason: wthReason || null,
        description: wthDesc || null,
      });
      if (res.success) {
        setWithdrawalModal({ open: false, partnerId: null, partnerName: '' });
        setWthAmount('');
        setWthDesc('');
        showToast('Partner draw recorded in central ledger (not counted as business expense)', 'success');
        fetchPartners();
      }
    } catch (err) {
      setActionError(err.message || 'Failed to record withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={4} cols={2} />;
  if (error || !data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-rose-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-900">{error || 'Failed to load partners'}</h3>
      </div>
    );
  }

  const { partners, companyNetProfit } = data;
  const numInvAmount = parseFloat(invAmount || 0);

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Partners & Equity
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Founder investments, personal draws & cumulative profit accounts
          </p>
        </div>

        <button
          onClick={() => {
            setActionError('');
            setAddPartnerOpen(true);
          }}
          className="touch-target-44 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Partner</span>
        </button>
      </div>

      {/* Critical Rule Notice */}
      <div className="p-3.5 sm:p-4 bg-slate-900 text-slate-200 rounded-2xl border border-slate-800 shadow-sm flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-white">
            Partner Accounting Principles:
          </p>
          <p className="text-slate-300 leading-snug">
            <strong>Profit Allocation</strong> is earned equity based on net business profit ({formatCurrency(companyNetProfit)}).
            <strong> Partner Withdrawals</strong> are personal draws of liquid cash and are strictly separated from operating expenses.
          </p>
        </div>
      </div>

      {/* Partner Cards Grid (Prompt Requirement #24) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {partners.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4 hover:border-slate-300 card-hover-subtle"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-100 font-black text-slate-900 text-base">
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    {p.name}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium block">
                    Ownership: <strong>{p.ownership_percentage}%</strong> • Profit Share: <strong>{p.profit_share_percentage}%</strong>
                  </span>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-sans">
                  Current Capital
                </span>
                <span className="text-lg sm:text-xl font-black text-slate-900">
                  {formatCurrency(p.current_capital)}
                </span>
              </div>
            </div>

            {/* Financial Matrix (Prompt Requirement #24 format) */}
            <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-mono text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">
                  Total Invested
                </span>
                <span className="font-bold text-slate-900 mt-0.5 block truncate">
                  {formatCurrency(p.total_investment)}
                </span>
                <span className="text-[10px] text-slate-400 font-sans">Init: {formatCurrency(p.initial_investment)}</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">
                  Additional Infused
                </span>
                <span className="font-bold text-slate-900 mt-0.5 block truncate">
                  {formatCurrency(p.additional_investment)}
                </span>
                <span className="text-[10px] text-slate-400 font-sans">Expansion</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">
                  Withdrawals
                </span>
                <span className="font-bold text-rose-700 mt-0.5 block truncate">
                  -{formatCurrency(p.total_withdrawn)}
                </span>
                <span className="text-[10px] text-slate-400 font-sans">Personal draw</span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">
                  Profit Share
                </span>
                <span className="font-bold text-emerald-700 mt-0.5 block truncate">
                  +{formatCurrency(p.allocated_profit)}
                </span>
                <span className="text-[10px] text-slate-400 font-sans">{p.profit_share_percentage}% of net</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setActionError('');
                  setWithdrawalModal({ open: true, partnerId: p.id, partnerName: p.name });
                }}
                className="touch-target-44 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors"
              >
                <ArrowUpRight className="w-3.5 h-3.5 mr-1 inline" />
                <span>Withdrawal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActionError('');
                  setInvestmentModal({ open: true, partnerId: p.id, partnerName: p.name });
                }}
                className="touch-target-44 px-3.5 py-2 text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 mr-1 inline" />
                <span>+ Investment</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Partner Modal */}
      <ResponsiveModal
        isOpen={addPartnerOpen}
        onClose={() => setAddPartnerOpen(false)}
        title="Add Business Partner"
        subtitle="Configure partner equity, ownership & profit share percentages"
        maxWidth="max-w-md"
      >
        {actionError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        <form onSubmit={handleCreatePartner} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Partner Full Name *
            </label>
            <input
              type="text"
              required
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                inputMode="email"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                placeholder="partner@company.com"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Phone
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={partnerPhone}
                onChange={(e) => setPartnerPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ownership % *
              </label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="0.01"
                required
                value={ownershipPct}
                onChange={(e) => setOwnershipPct(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Profit Share % *
              </label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="0.01"
                required
                value={profitSharePct}
                onChange={(e) => setProfitSharePct(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddPartnerOpen(false)}
              className="min-h-[44px] px-4 py-2 text-sm font-semibold text-slate-600 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] px-5 py-2 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Add Partner'}
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* Record Investment Modal with Live Cash Preview (Prompt Requirement #16) */}
      <ResponsiveModal
        isOpen={investmentModal.open}
        onClose={() => setInvestmentModal({ open: false, partnerId: null, partnerName: '' })}
        title={`Record Investment — ${investmentModal.partnerName}`}
        subtitle="Infuses funds into central cash ledger & increases partner capital"
        maxWidth="max-w-md"
      >
        {actionError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        <form onSubmit={handleRecordInvestment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Investment Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-base pointer-events-none">
                ₹
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                required
                value={invAmount}
                onChange={(e) => setInvAmount(e.target.value)}
                placeholder="25000"
                className="w-full min-h-[44px] pl-8 pr-4 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono font-bold"
              />
            </div>
          </div>

          {/* Live Cash Balance Preview (Prompt Requirement #16) */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="font-sans">Current Business Cash:</span>
              <span className="font-bold">{formatCurrency(cashBalance)}</span>
            </div>
            {numInvAmount > 0 && (
              <div className="flex items-center justify-between text-emerald-800 pt-1 border-t border-slate-200/60 font-bold">
                <span className="font-sans">After Investment:</span>
                <span>{formatCurrency(cashBalance + numInvAmount)}</span>
              </div>
            )}
            <span className="text-[10px] text-slate-400 font-sans block pt-0.5">
              Preview estimate; final balance confirmed by central ledger
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Investment Type *
              </label>
              <select
                value={invType}
                onChange={(e) => setInvType(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
              >
                <option value="ADDITIONAL">ADDITIONAL (Expansion capital)</option>
                <option value="INITIAL">INITIAL (Founding capital)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Payment Method *
              </label>
              <select
                value={invMethod}
                onChange={(e) => setInvMethod(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
              >
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Date *
            </label>
            <input
              type="date"
              required
              value={invDate}
              onChange={(e) => setInvDate(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Bank Reference / UTR
            </label>
            <input
              type="text"
              value={invRef}
              onChange={(e) => setInvRef(e.target.value)}
              placeholder="e.g. UTR-CAPITAL-004"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setInvestmentModal({ open: false, partnerId: null, partnerName: '' })}
              className="min-h-[44px] px-4 py-2 text-sm font-semibold text-slate-600 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] px-5 py-2 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Record Investment'}
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* Record Withdrawal Modal */}
      <ResponsiveModal
        isOpen={withdrawalModal.open}
        onClose={() => setWithdrawalModal({ open: false, partnerId: null, partnerName: '' })}
        title={`Record Partner Draw — ${withdrawalModal.partnerName}`}
        subtitle="Reduces liquid business cash (not classified as a business expense)"
        maxWidth="max-w-md"
      >
        {actionError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        <form onSubmit={handleRecordWithdrawal} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Withdrawal Amount (₹) *
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                required
                value={wthAmount}
                onChange={(e) => setWthAmount(e.target.value)}
                placeholder="5000"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Reason / Type
              </label>
              <input
                type="text"
                value={wthReason}
                onChange={(e) => setWthReason(e.target.value)}
                placeholder="e.g. Partner personal draw"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Date *
              </label>
              <input
                type="date"
                required
                value={wthDate}
                onChange={(e) => setWthDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Disbursement Method *
              </label>
              <select
                value={wthMethod}
                onChange={(e) => setWthMethod(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
              >
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/IMPS)</option>
                <option value="UPI">UPI</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows="2"
              value={wthDesc}
              onChange={(e) => setWthDesc(e.target.value)}
              placeholder="Partner quarterly profit draw..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setWithdrawalModal({ open: false, partnerId: null, partnerName: '' })}
              className="min-h-[44px] px-4 py-2 text-sm font-semibold text-slate-600 rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] px-5 py-2 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Disburse Withdrawal'}
            </button>
          </div>
        </form>
      </ResponsiveModal>
    </div>
  );
};

export default Partners;
