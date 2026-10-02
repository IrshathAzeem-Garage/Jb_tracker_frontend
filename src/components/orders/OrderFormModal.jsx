import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle, ShoppingBag, Check, Calculator } from 'lucide-react';
import { ResponsiveModal } from '../common/ResponsiveModal';
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

  // Active step for mobile stepper navigation
  const [mobileStep, setMobileStep] = useState(1); // 1: Info, 2: Items, 3: Review

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
      setMobileStep(1);
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
    if (e) e.preventDefault();
    setError('');

    if (!customerId) {
      setError('Please select a customer.');
      setMobileStep(1);
      return;
    }

    if (items.some((i) => !i.description.trim() || parseFloat(i.quantity) <= 0)) {
      setError('All items must have a valid description and quantity > 0.');
      setMobileStep(2);
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
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Order"
      subtitle="B2B Order Entry with live margin & direct cost calculation"
      maxWidth="max-w-4xl"
      fullHeightOnMobile={true}
    >
      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Mobile Stepper Navigation (<640px) */}
      <div className="sm:hidden flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        {[
          { num: 1, label: 'Customer' },
          { num: 2, label: 'Items & Margin' },
          { num: 3, label: 'Review' },
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setMobileStep(s.num)}
            className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg ${
              mobileStep === s.num
                ? 'bg-slate-900 text-white'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
              {s.num}
            </span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Customer & Order Metadata */}
        <div className={`${mobileStep === 1 ? 'block' : 'hidden sm:block'} space-y-4`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer *
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
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
                className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
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
                className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-semibold text-slate-800"
              >
                <option value="CONFIRMED">CONFIRMED (Active Order)</option>
                <option value="PROCUREMENT">PROCUREMENT (Vendor sourcing)</option>
                <option value="CUSTOMIZATION">CUSTOMIZATION (Branding)</option>
                <option value="READY">READY (Ready to ship)</option>
                <option value="DELIVERED">DELIVERED (Fulfilled)</option>
                <option value="DRAFT">DRAFT</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Order Date *
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
                className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
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
                className="w-full min-h-[44px] px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Mobile step 1 next button */}
          <div className="sm:hidden pt-2">
            <button
              type="button"
              onClick={() => setMobileStep(2)}
              className="w-full min-h-[44px] py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm"
            >
              Continue to Items & Pricing →
            </button>
          </div>
        </div>

        {/* Step 2: Line Items Entry with Instant Margin Calculations */}
        <div className={`${mobileStep === 2 ? 'block' : 'hidden sm:block'} space-y-4`}>
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Order Items ({items.length})
            </h4>
            <button
              type="button"
              onClick={addItemRow}
              className="touch-target-44 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => {
              const qty = parseFloat(item.quantity || 0);
              const sell = parseFloat(item.unit_selling_price || 0);
              const cost = parseFloat(item.unit_cost_price || 0);
              const itemSales = qty * sell;
              const itemCost = qty * cost;
              const itemProfit = itemSales - itemCost;

              return (
                <div
                  key={index}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative transition-all"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <span className="text-xs font-bold text-slate-900">
                      Item #{index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        className="touch-target-44 p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Product Preset (Optional)
                      </label>
                      <select
                        value={item.product_id}
                        onChange={(e) => handleProductSelect(index, e.target.value)}
                        className="w-full min-h-[44px] px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      >
                        <option value="">Custom / Select from catalog...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Default: ₹{p.default_selling_price})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Item Description *
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        required
                        placeholder="e.g. 100% Bio-Washed Cotton T-Shirt with Chest Embroidery"
                        className="w-full min-h-[44px] px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Quantity, Selling, Cost & Supplier */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        required
                        className="w-full min-h-[44px] px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Selling Price (₹) *
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={item.unit_selling_price}
                        onChange={(e) => handleItemChange(index, 'unit_selling_price', e.target.value)}
                        required
                        className="w-full min-h-[44px] px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Cost Price (₹) *
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={item.unit_cost_price}
                        onChange={(e) => handleItemChange(index, 'unit_cost_price', e.target.value)}
                        required
                        className="w-full min-h-[44px] px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Supplier / Vendor
                      </label>
                      <select
                        value={item.supplier_id}
                        onChange={(e) => handleItemChange(index, 'supplier_id', e.target.value)}
                        className="w-full min-h-[44px] px-2.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      >
                        <option value="">Select Supplier...</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.company_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Immediate automatic calculations card per prompt requirement #12 */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase block">Sales</span>
                      <strong className="text-slate-900">{formatCurrency(itemSales)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase block">Cost</span>
                      <strong className="text-slate-600">{formatCurrency(itemCost)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase block">Profit</span>
                      <strong className={itemProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {formatCurrency(itemProfit)}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile step 2 buttons */}
          <div className="sm:hidden flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMobileStep(1)}
              className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-slate-300 font-bold text-sm text-slate-700"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setMobileStep(3)}
              className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm"
            >
              Review Order →
            </button>
          </div>
        </div>

        {/* Step 3: Review, Summary & Submit */}
        <div className={`${mobileStep === 3 ? 'block' : 'hidden sm:block'} space-y-4`}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Order Notes & Instructions
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Include custom thank you card in each box, deliver by 11 AM"
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          {/* Live Order Profit & Margin Summary Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs text-slate-400 font-medium">Subtotal Value:</span>
              <span className="font-mono text-sm font-bold">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs text-slate-400 font-medium">Direct Procurement Cost:</span>
              <span className="font-mono text-sm font-semibold text-slate-300">{formatCurrency(totalCost)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-slate-300">Expected Gross Profit:</span>
              <div className="text-right">
                <span className={`font-mono text-sm font-bold ${grossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(grossProfit)}
                </span>
                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white">
                  {formatPercentage(marginPercentage)} Margin
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-extrabold text-white">Total Customer Invoice:</span>
              <span className="font-mono text-lg font-black text-white">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
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
              {submitting ? 'Creating Order...' : 'Confirm & Create Order'}
            </button>
          </div>
        </div>
      </form>
    </ResponsiveModal>
  );
};

export default OrderFormModal;
