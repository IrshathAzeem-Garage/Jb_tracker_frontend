import React, { useState } from 'react';
import { AlertCircle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Modal } from '../common/Modal';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Payment amount must be greater than zero.');
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCustomer ? 'Record Customer Payment (Money In)' : 'Disburse Supplier Payment (Money Out)'}
      subtitle={
        isCustomer
          ? 'Credits cash balance and marks order receivable as paid'
          : 'Debits cash balance and marks supplier payable as disbursed'
      }
      maxWidth="max-w-lg"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isCustomer && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Supplier *
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
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

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              Amount (₹) *
            </label>
            {maxAmount !== null && (
              <span className="text-[11px] text-slate-500 font-medium">
                Outstanding: <strong>{formatCurrency(maxAmount)}</strong>
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">
              ₹
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full pl-8 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Date *
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
            >
              <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
              <option value="UPI">UPI (GPay / PhonePe / QR)</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reference / UTR / Transaction ID
          </label>
          <input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="e.g. UTR-982103445 or UPI-REF-1102"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Notes / Remarks
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. 50% advance against procurement"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none text-xs"
          />
        </div>

        {/* Ledger Confirmation Callout */}
        <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
          isCustomer ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {isCustomer ? <ArrowDownLeft className="w-4 h-4 text-emerald-600 shrink-0" /> : <ArrowUpRight className="w-4 h-4 text-amber-600 shrink-0" />}
          <span>
            This transaction will update the <strong>Central Cash Ledger ({isCustomer ? 'Money In' : 'Money Out'})</strong> atomically.
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
