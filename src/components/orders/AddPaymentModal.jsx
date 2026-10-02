import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { ResponsiveModal } from '../common/ResponsiveModal';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

export const AddPaymentModal = ({
  isOpen,
  onClose,
  orderId,
  type = 'CUSTOMER', // 'CUSTOMER' | 'SUPPLIER'
  customerId,
  supplierId,
  suppliers = [],
  maxAmount = null,
  onSuccess,
}) => {
  const [amount, setAmount] = useState(maxAmount ? Math.max(0, maxAmount) : '');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [selectedSupplierId, setSelectedSupplierId] = useState(supplierId || '');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isCustomer = type === 'CUSTOMER';

  const numAmount = parseFloat(amount || 0);
  const outstanding = maxAmount !== null ? parseFloat(maxAmount) : null;
  const remaining = outstanding !== null ? Math.max(0, outstanding - numAmount) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    if (isCustomer && outstanding !== null && parsedAmount > outstanding + 0.01) {
      setError(`Amount cannot exceed the total balance outstanding (${formatCurrency(outstanding)}).`);
      return;
    }

    if (!isCustomer && !selectedSupplierId) {
      setError('Please select a supplier receiving the disbursement.');
      return;
    }

    setSubmitting(true);
    try {
      let endpoint = isCustomer
        ? `/orders/${orderId}/customer-payments`
        : `/orders/${orderId}/supplier-payments`;

      const payload = {
        amount: parsedAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
        notes: notes || null,
      };

      if (isCustomer) {
        payload.customer_id = customerId;
      } else {
        payload.supplier_id = selectedSupplierId;
      }

      const res = await api.post(endpoint, payload);
      if (res.success) {
        onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to record transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={isCustomer ? 'Record Customer Payment' : 'Disburse Supplier Payment'}
      subtitle={
        isCustomer
          ? 'Credits cash ledger & reduces customer balance'
          : 'Debits cash ledger & marks supplier payable'
      }
      maxWidth="max-w-lg"
    >
      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isCustomer && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Supplier *
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              required
              className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
            >
              <option value="">Select Supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.supplier_code} — {s.company_name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Amount Input with Live Remaining Balance Preview */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Payment Amount (₹) *
            </label>
            {outstanding !== null && (
              <span className="text-[11px] text-slate-500 font-medium">
                Outstanding: <strong>{formatCurrency(outstanding)}</strong>
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-base pointer-events-none">
              ₹
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="0.00"
              className="w-full min-h-[44px] pl-8 pr-4 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono font-bold"
            />
          </div>

          {/* Real-time remaining balance calculation */}
          {outstanding !== null && numAmount > 0 && (
            <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">Remaining Balance After Payment:</span>
              <span className={`font-mono font-bold ${remaining <= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {remaining <= 0 ? '₹0.00 (Fully Settled)' : formatCurrency(remaining)}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Payment Date *
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
            >
              <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
              <option value="UPI">UPI (GPay / PhonePe)</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Reference / UTR / Transaction ID
          </label>
          <input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="e.g. UTR-982103445"
            className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Notes / Remarks
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional remarks"
            className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none text-xs"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[44px] flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? 'Recording...' : 'Record Transaction'}
          </button>
        </div>
      </form>
    </ResponsiveModal>
  );
};

export default AddPaymentModal;
