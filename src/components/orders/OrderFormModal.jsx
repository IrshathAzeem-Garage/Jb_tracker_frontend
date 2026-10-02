import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertTriangle, AlertCircle, ShoppingBag } from 'lucide-react';
import { Modal } from '../common/Modal';
import api from '../../services/api';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

export const OrderFormModal = ({ isOpen, onClose, onSuccess }) => {
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [status, setStatus] = useState('CONFIRMED');
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [orderTax, setOrderTax] = useState(0);
  const [notes, setNotes] = useState('');

  // Items State
  const [items, setItems] = useState([
    {
      product_id: '',
      description: '',
      quantity: 100,
      unit_selling_price: 399,
      unit_cost_price: 270,
      discount: 0,
      tax: 0,
      supplier_id: '',
      notes: '',
    },
  ]);

  // Load prerequisites when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        setLoading(true);
        try {
          const [cRes, catRes, pRes, sRes] = await Promise.all([
            api.get('/customers?limit=100'),
            api.get('/categories'),
            api.get('/products?limit=100'),
            api.get('/suppliers?limit=100'),
          ]);
          setCustomers(cRes.data.customers || []);
          setCategories(catRes.data || []);
          setProducts(pRes.data.products || []);
          setSuppliers(sRes.data.suppliers || []);
          if (cRes.data.customers?.length > 0 && !customerId) {
            setCustomerId(cRes.data.customers[0].id);
          }
          if (catRes.data?.length > 0 && !categoryId) {
            setCategoryId(catRes.data[0].id);
          }
        } catch (err) {
          setError('Failed to load customers or products.');
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [isOpen]);

  const handleProductSelect = (index, prodId) => {
    const selected = products.find((p) => p.id === prodId);
    const updated = [...items];
    if (selected) {
      updated[index] = {
        ...updated[index],
        product_id: selected.id,
        description: selected.name,
        unit_selling_price: parseFloat(selected.default_selling_price || 0),
        unit_cost_price: parseFloat(selected.default_cost_price || 0),
      };
    } else {
      updated[index].product_id = '';
    }
    setItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        product_id: '',
        description: '',
        quantity: 1,
        unit_selling_price: 0,
        unit_cost_price: 0,
        discount: 0,
        tax: 0,
        supplier_id: '',
        notes: '',
      },
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Computations
  let subtotal = 0;
  let totalCost = 0;

  items.forEach((item) => {
    const qty = parseFloat(item.quantity || 0);
    const sell = parseFloat(item.unit_selling_price || 0);
    const cost = parseFloat(item.unit_cost_price || 0);
    const disc = parseFloat(item.discount || 0);
    const tax = parseFloat(item.tax || 0);

    const itemSellingTotal = qty * sell - disc + tax;
    const itemCostTotal = qty * cost;

    subtotal += itemSellingTotal;
    totalCost += itemCostTotal;
  });

  const discVal = parseFloat(orderDiscount || 0);
  const taxVal = parseFloat(orderTax || 0);
  const totalAmount = subtotal - discVal + taxVal;
  const grossProfit = totalAmount - totalCost;
  const marginPercentage = totalAmount > 0 ? (grossProfit / totalAmount) * 100 : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!customerId) {
      setError('Please select a customer.');
      return;
    }

    if (items.some((i) => !i.description.trim() || parseFloat(i.quantity) <= 0)) {
      setError('All items must have a valid description and quantity > 0.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer_id: customerId,
        category_id: categoryId || null,
        order_date: orderDate,
        expected_delivery_date: deliveryDate || null,
        status,
        discount: discVal,
        tax: taxVal,
        notes,
        items: items.map((i) => ({
          product_id: i.product_id || null,
          description: i.description,
          quantity: parseFloat(i.quantity),
          unit_selling_price: parseFloat(i.unit_selling_price),
          unit_cost_price: parseFloat(i.unit_cost_price || 0),
          discount: parseFloat(i.discount || 0),
          tax: parseFloat(i.tax || 0),
          supplier_id: i.supplier_id || null,
          notes: i.notes || null,
        })),
      };

      const res = await api.post('/orders', payload);
      if (res.success) {
        onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to create order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Customer Order"
      subtitle="Orders record historical price agreements & calculate live margin"
      maxWidth="max-w-4xl"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Top order meta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer *
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
            >
              <option value="">Select Customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customer_code} — {c.company_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Business Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
            >
              <option value="">Select Category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Order Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PROCUREMENT">PROCUREMENT</option>
              <option value="CUSTOMIZATION">CUSTOMIZATION</option>
              <option value="READY">READY</option>
              <option value="DELIVERED">DELIVERED</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Order Date
            </label>
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Expected Delivery Date
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Order Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-slate-600" />
              Order Items ({items.length})
            </span>
            <button
              type="button"
              onClick={addItemRow}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </button>
          </div>

          <div className="divide-y divide-slate-200 overflow-x-auto">
            {items.map((item, index) => {
              const qty = parseFloat(item.quantity || 0);
              const sell = parseFloat(item.unit_selling_price || 0);
              const cost = parseFloat(item.unit_cost_price || 0);
              const itemTotal = qty * sell;
              const itemCostTotal = qty * cost;
              const itemProfit = itemTotal - itemCostTotal;

              return (
                <div key={index} className="p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-400">
                      Item #{index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Select Standard Product (Optional)
                      </label>
                      <select
                        value={item.product_id || ''}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-slate-50"
                      >
                        <option value="">-- Custom Customization / Item --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.sku ? `[${p.sku}] ` : ''}{p.name} (Sell: ₹{p.default_selling_price}, Cost: ₹{p.default_cost_price})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Procurement Supplier
                      </label>
                      <select
                        value={item.supplier_id || ''}
                        onChange={(e) => handleItemChange(index, 'supplier_id', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-slate-50"
                      >
                        <option value="">-- No Supplier Assigned Yet --</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.supplier_code} — {s.company_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    <div className="col-span-2 sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Item Description *
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="e.g. Corporate Polo T-Shirt (Navy, L)"
                        required
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Selling Price (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_selling_price}
                        onChange={(e) => handleItemChange(index, 'unit_selling_price', e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Cost Price (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_cost_price}
                        onChange={(e) => handleItemChange(index, 'unit_cost_price', e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md font-mono"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1 bg-slate-50 p-2 rounded-md border border-slate-100 flex flex-col justify-center">
                      <span className="text-[10px] text-slate-500 font-medium">Profit</span>
                      <span className={`text-xs font-bold font-mono ${itemProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatCurrency(itemProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial Summary & Live Profit / Margin calculation */}
        <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <span className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Order Value
              </span>
              <span className="text-xl font-bold font-mono text-white">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            <div>
              <span className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Direct Cost
              </span>
              <span className="text-xl font-bold font-mono text-slate-300">
                {formatCurrency(totalCost)}
              </span>
            </div>

            <div>
              <span className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Gross Profit
              </span>
              <span
                className={`text-xl font-bold font-mono ${
                  grossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatCurrency(grossProfit)}
              </span>
            </div>

            <div>
              <span className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Profit Margin
              </span>
              <span
                className={`text-xl font-bold font-mono ${
                  grossProfit < 0
                    ? 'text-rose-400'
                    : marginPercentage < 10
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {formatPercentage(marginPercentage)}
              </span>
            </div>
          </div>

          {/* Negative Profit / Low Margin Warnings */}
          {grossProfit < 0 && (
            <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>Loss-making Order Warning:</strong> Direct procurement costs exceed order selling value by {formatCurrency(Math.abs(grossProfit))}.
              </span>
            </div>
          )}

          {grossProfit >= 0 && marginPercentage < 10 && (
            <div className="p-2.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Low Margin Alert:</strong> Margin is under 10% ({formatPercentage(marginPercentage)}). Review pricing or supplier quotes.
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Order Notes / Special Instructions
          </label>
          <textarea
            rows="2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add delivery terms, packaging instructions, customization proofs..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
          ></textarea>
        </div>

        {/* Action Buttons */}
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
            {submitting ? 'Creating Order...' : 'Confirm & Create Order'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
