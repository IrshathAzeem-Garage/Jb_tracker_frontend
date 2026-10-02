import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Tag,
  AlertCircle,
  FolderPlus,
  X,
  TrendingUp,
} from 'lucide-react';
import api from '../services/api';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { ResponsiveModal } from '../components/common/ResponsiveModal';
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
    <div className="space-y-5 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Products & Categories
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Standard catalog items with default pricing and units
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-sm touch-target-44 active:scale-95 transition-all"
          >
            <FolderPlus className="w-4 h-4" />
            Category
          </button>
          <button
            onClick={() => setProductModalOpen(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 shadow-sm touch-target-44 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Product
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or SKU..."
            className="w-full pl-9 pr-9 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-bold bg-white"
        >
          <option value="">All Categories ({categories.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.product_count || 0})
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton rows={6} cols={4} />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Create your initial standard products or customize directly during order entry."
          actionLabel="Add Product"
          onAction={() => setProductModalOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {/* Mobile Cards View */}
          <div className="sm:hidden space-y-3">
            {products.map((p) => {
              const marginPct = parseFloat(p.default_margin_percentage);

              return (
                <div
                  key={p.id}
                  className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                      {p.sku && (
                        <span className="font-mono text-[10px] text-slate-400 font-bold block mt-0.5">
                          SKU: {p.sku}
                        </span>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 shrink-0">
                      {p.category_name || 'General'}
                    </span>
                  </div>

                  {p.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>
                  )}

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Sell Price</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(p.default_selling_price)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Cost Price</span>
                      <span className="font-mono font-medium text-slate-600">{formatCurrency(p.default_cost_price)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Margin</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {formatPercentage(marginPct)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
        </div>
      )}

      {/* Add Product Responsive Modal */}
      <ResponsiveModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title="Add New Standard Product"
        subtitle="Catalog item for quick order quoting"
      >
        {prodError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {prodError}
          </div>
        )}

        <form onSubmit={handleCreateProduct} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="e.g. Premium Cotton Hoodie"
                className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                SKU / Item Code
              </label>
              <input
                type="text"
                value={prodSku}
                onChange={(e) => setProdSku(e.target.value)}
                placeholder="e.g. CLO-HOD-003"
                className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Business Category
              </label>
              <select
                value={prodCatId}
                onChange={(e) => setProdCatId(e.target.value)}
                className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-medium bg-white"
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Unit of Measure
              </label>
              <input
                type="text"
                value={prodUnit}
                onChange={(e) => setProdUnit(e.target.value)}
                placeholder="pcs, kits, sets..."
                className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Selling Price (₹)
              </label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={prodSellingPrice}
                onChange={(e) => setProdSellingPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cost Price (₹)
              </label>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={prodCostPrice}
                onChange={(e) => setProdCostPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={prodDesc}
              onChange={(e) => setProdDesc(e.target.value)}
              placeholder="Material specs, standard sizes, vendor contacts..."
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setProductModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 touch-target-44"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingProd}
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50 touch-target-44"
            >
              {submittingProd ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* Add Category Responsive Modal */}
      <ResponsiveModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Add Business Category"
        subtitle="Organize corporate supplies and kits"
      >
        {catError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {catError}
          </div>
        )}

        <form onSubmit={handleCreateCategory} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Employee Onboarding Kits"
              className="w-full px-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              placeholder="Category scope or notes..."
              className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCategoryModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 touch-target-44"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingCat}
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 disabled:opacity-50 touch-target-44"
            >
              {submittingCat ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </ResponsiveModal>
    </div>
  );
};
