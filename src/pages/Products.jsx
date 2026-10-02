import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Tag,
  AlertCircle,
  FolderPlus,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { Modal } from '../components/common/Modal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  // Form State - Product
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCatId, setProdCatId] = useState('');
  const [prodUnit, setProdUnit] = useState('pcs');
  const [prodSellingPrice, setProdSellingPrice] = useState('');
  const [prodCostPrice, setProdCostPrice] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [submittingProd, setSubmittingProd] = useState(false);
  const [prodError, setProdError] = useState('');

  // Form State - Category
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [submittingCat, setSubmittingCat] = useState(false);
  const [catError, setCatError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get(`/products?limit=100&search=${search}&categoryId=${categoryId}`),
        api.get('/categories'),
      ]);
      if (prodRes.success) setProducts(prodRes.data.products);
      if (catRes.success) setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load products/categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, categoryId]);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setProdError('');
    setSubmittingProd(true);
    try {
      const res = await api.post('/products', {
        name: prodName,
        sku: prodSku || null,
        category_id: prodCatId || null,
        unit: prodUnit,
        default_selling_price: parseFloat(prodSellingPrice) || 0,
        default_cost_price: parseFloat(prodCostPrice) || 0,
        description: prodDesc || null,
      });
      if (res.success) {
        setProductModalOpen(false);
        setProdName('');
        setProdSku('');
        setProdSellingPrice('');
        setProdCostPrice('');
        setProdDesc('');
        fetchData();
      }
    } catch (err) {
      setProdError(err.message || 'Failed to create product');
    } finally {
      setSubmittingProd(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setCatError('');
    setSubmittingCat(true);
    try {
      const res = await api.post('/categories', {
        name: catName,
        description: catDesc || null,
      });
      if (res.success) {
        setCategoryModalOpen(false);
        setCatName('');
        setCatDesc('');
        fetchData();
      }
    } catch (err) {
      setCatError(err.message || 'Failed to create category');
    } finally {
      setSubmittingCat(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Products & Business Categories
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Pre-defined catalog items used to quickly generate orders with custom historical pricing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Add Category
          </button>
          <button
            onClick={() => setProductModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product name, SKU, description..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
          />
        </div>

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium"
        >
          <option value="">All Categories ({categories.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.product_count || 0})
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      {loading ? (
        <LoadingSkeleton rows={6} cols={5} />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Create your initial standard products or customize directly during order entry."
          actionLabel="Add Product"
          onAction={() => setProductModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-center">Unit</th>
                  <th className="py-3.5 px-4 text-right">Default Sell Price</th>
                  <th className="py-3.5 px-4 text-right">Default Cost Price</th>
                  <th className="py-3.5 px-4 text-right">Default Margin</th>
                  <th className="py-3.5 px-4 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {products.map((p) => {
                  const marginPct = parseFloat(p.default_margin_percentage);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                        {p.sku || '-'}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {p.name}
                        {p.description && (
                          <span className="block font-normal text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                            {p.description}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          <Tag className="w-2.5 h-2.5" />
                          {p.category_name || 'General'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                        {p.unit}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(p.default_selling_price)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        {formatCurrency(p.default_cost_price)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(p.default_margin)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                        {formatPercentage(marginPct)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title="Add New Standard Product"
        subtitle="Benchmark catalog pricing (does not lock future order custom quotes)"
      >
        {prodError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {prodError}
          </div>
        )}

        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="e.g. Premium Cotton Hoodie"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SKU / Code
              </label>
              <input
                type="text"
                value={prodSku}
                onChange={(e) => setProdSku(e.target.value)}
                placeholder="e.g. CLO-HOD-003"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={prodCatId}
                onChange={(e) => setProdCatId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit of Measurement
              </label>
              <input
                type="text"
                value={prodUnit}
                onChange={(e) => setProdUnit(e.target.value)}
                placeholder="pcs, kit, set, roll..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Selling Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={prodSellingPrice}
                onChange={(e) => setProdSellingPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Cost Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={prodCostPrice}
                onChange={(e) => setProdCostPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Specs
            </label>
            <textarea
              rows="2"
              value={prodDesc}
              onChange={(e) => setProdDesc(e.target.value)}
              placeholder="Material, GSM, print techniques..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setProductModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingProd}
              className="px-5 py-2 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50"
            >
              {submittingProd ? 'Saving...' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Add New Business Category"
        subtitle="Used for category-wise revenue & profitability reports"
      >
        {catError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {catError}
          </div>
        )}

        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Employee Onboarding Kits"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows="2"
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              placeholder="What types of products or requirements fall under this category..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCategoryModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingCat}
              className="px-5 py-2 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50"
            >
              {submittingCat ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
