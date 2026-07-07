/**
 * ADMIN PRODUCTS TAB — list, filters, add/edit/view modals (Tailwind)
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiUrl, fetchWithTimeout } from '../../utils/data';
import { productImage } from '../../utils/format';
import { showTopFloatNotification } from '../../utils/notifications';
import { AppSearchField } from '../nav/StoreNavbar';

const ADM_TABLE_CARD =
  'rounded-2xl border border-deepGreen/6 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#1a2421]';
const ADM_TABLE =
  'w-full border-collapse text-[0.88rem] [&_th]:border-b-2 [&_th]:border-gray-100 [&_th]:px-4 [&_th]:py-3.5 [&_th]:text-left [&_th]:text-[0.78rem] [&_th]:font-extrabold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-gray-500 [&_td]:border-b [&_td]:border-gray-100 [&_td]:px-4 [&_td]:py-3.5 [&_td]:align-middle [&_td]:font-semibold [&_tbody_tr:hover]:bg-deepGreen/[0.015] [.admin-dark_&]:[&_th]:border-white/10 [.admin-dark_&]:[&_td]:border-white/10 [.admin-dark_&]:[&_td]:text-gray-200';
const ADM_LABEL =
  'mb-1.5 block text-[0.82rem] font-extrabold text-gray-800 [.admin-dark_&]:text-gray-200';
const ADM_INPUT =
  'w-full rounded-[10px] border-[1.5px] border-black/8 bg-white px-3.5 py-2.5 text-[0.88rem] font-semibold text-gray-900 outline-none transition focus:border-deepGreen focus:shadow-[0_0_0_3.5px_rgba(7,61,53,0.06)] [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#141f1b] [.admin-dark_&]:text-gray-100';
const ADM_SELECT = `${ADM_INPUT} cursor-pointer`;
const BTN_ADD =
  'inline-flex items-center gap-2 rounded-[10px] bg-gradient-to-br from-deepGreen to-teal px-5 py-2.5 text-[0.88rem] font-extrabold text-white transition hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(7,61,53,0.15)]';
const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-[10px] bg-gradient-to-br from-deepGreen to-teal px-6 py-2.5 text-[0.88rem] font-extrabold text-white transition hover:-translate-y-0.5 disabled:opacity-60';
const BTN_GHOST =
  'inline-flex items-center justify-center gap-2 rounded-[10px] bg-gray-100 px-6 py-2.5 text-[0.88rem] font-extrabold text-gray-800 transition hover:bg-gray-200 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-gray-200';

const MATERIAL_TYPES = [
  ['wood', 'Wood'],
  ['velvet', 'Velvet'],
  ['linen', 'Linen Fabric'],
  ['rattan', 'Rattan'],
  ['marble', 'Marble'],
];

const FALLBACK_CATEGORIES = [
  ['chair', 'Chair'],
  ['bedroom', 'Bedroom'],
  ['living-room', 'Living Room'],
  ['dining-room', 'Dining Room'],
  ['outdoor', 'Outdoor'],
  ['office', 'Office'],
];

const FILTER_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'chair', label: 'Chairs' },
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'living-room', label: 'Living Room' },
  { value: 'dining-room', label: 'Dining Room' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'office', label: 'Office' },
];

const EMPTY_FORM = {
  id: null,
  title: '',
  category: 'chair',
  materialType: 'wood',
  price: '',
  oldPrice: '',
  color: '',
  stockVal: 10,
  status: 'Active',
  isNewest: false,
  description: '',
  material: '',
  dimensions: '',
  imageUrl: '',
  imageBase64: '',
};

function formatAdminPrice(price) {
  const n = Number(price);
  if (Number.isNaN(n)) return '$0';
  if (n > 0 && n < 1) return `$${n.toFixed(3)}`;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCategory(cat) {
  if (!cat) return '—';
  if (cat === 'living-room') return 'Living Room';
  if (cat === 'dining-room') return 'Dining Room';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

function getStockVal(p) {
  return typeof p.stockVal === 'number' ? p.stockVal : p.stock === 'in-stock' ? 12 : 0;
}

function getStatus(p) {
  const stockVal = getStockVal(p);
  return p.status || (stockVal > 0 ? 'Active' : 'Inactive');
}

/* ═══ PRODUCT FORM MODAL ═══ */

function ProductFormModal({ open, title, form, categories, saving, onChange, onClose, onSubmit, onFile }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1060] flex items-center justify-center bg-deepGreen/45 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-productModalIn max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-[0_25px_60px_rgba(0,0,0,0.22)] [.admin-dark_&]:bg-[#1a2421]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
          <h3 className="font-display text-xl font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">{title}</h3>
          <button type="button" className="text-2xl text-gray-500 hover:text-gray-800" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form className="space-y-3 p-5" onSubmit={onSubmit}>
          <div>
            <label className={ADM_LABEL} htmlFor="admProdTitle">Product Title *</label>
            <input id="admProdTitle" className={ADM_INPUT} required value={form.title} onChange={(e) => onChange('title', e.target.value)} placeholder="e.g. Bloom Office Chair" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={ADM_LABEL} htmlFor="admProdCat">Category *</label>
              <select id="admProdCat" className={ADM_SELECT} required value={form.category} onChange={(e) => onChange('category', e.target.value)}>
                {categories.map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={ADM_LABEL} htmlFor="admProdMat">Material Type *</label>
              <select id="admProdMat" className={ADM_SELECT} required value={form.materialType} onChange={(e) => onChange('materialType', e.target.value)}>
                {MATERIAL_TYPES.map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={ADM_LABEL} htmlFor="admProdPrice">Price ($) *</label>
              <input id="admProdPrice" type="number" min="1" className={ADM_INPUT} required value={form.price} onChange={(e) => onChange('price', e.target.value)} />
            </div>
            <div>
              <label className={ADM_LABEL} htmlFor="admProdOld">Old Price ($)</label>
              <input id="admProdOld" type="number" min="1" className={ADM_INPUT} value={form.oldPrice} onChange={(e) => onChange('oldPrice', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={ADM_LABEL} htmlFor="admProdColor">Color Tone *</label>
              <input id="admProdColor" className={ADM_INPUT} required value={form.color} onChange={(e) => onChange('color', e.target.value)} />
            </div>
            <div>
              <label className={ADM_LABEL} htmlFor="admProdStock">Stock Quantity *</label>
              <input id="admProdStock" type="number" min="0" className={ADM_INPUT} required value={form.stockVal} onChange={(e) => onChange('stockVal', e.target.value)} />
            </div>
          </div>

          <div>
            <label className={ADM_LABEL} htmlFor="admProdStatus">Catalog Status *</label>
            <select id="admProdStatus" className={ADM_SELECT} value={form.status} onChange={(e) => onChange('status', e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-[0.88rem] font-bold text-gray-700 [.admin-dark_&]:text-gray-300">
            <input type="checkbox" className="h-4 w-4 accent-deepGreen" checked={form.isNewest} onChange={(e) => onChange('isNewest', e.target.checked)} />
            Mark as New Arrival
          </label>

          <div>
            <label className={ADM_LABEL} htmlFor="admProdDesc">Product Description</label>
            <textarea id="admProdDesc" rows={3} className={ADM_INPUT} value={form.description} onChange={(e) => onChange('description', e.target.value)} />
          </div>

          <div>
            <label className={ADM_LABEL} htmlFor="admProdMatSpec">Material Details *</label>
            <input id="admProdMatSpec" className={ADM_INPUT} required value={form.material} onChange={(e) => onChange('material', e.target.value)} />
          </div>

          <div>
            <label className={ADM_LABEL} htmlFor="admProdDim">Dimensions (Optional)</label>
            <input id="admProdDim" className={ADM_INPUT} value={form.dimensions} onChange={(e) => onChange('dimensions', e.target.value)} />
          </div>

          <div>
            <label className={ADM_LABEL} htmlFor="admProdFile">Product Image (Upload)</label>
            <input id="admProdFile" type="file" accept="image/*" className={ADM_INPUT} onChange={onFile} />
            <p className="mt-1 text-[0.72rem] text-gray-500">Max 2MB. Converts to Base64 data URL.</p>
          </div>

          <div>
            <label className={ADM_LABEL} htmlFor="admProdUrl">Or Image URL Path</label>
            <input id="admProdUrl" className={ADM_INPUT} value={form.imageUrl} onChange={(e) => onChange('imageUrl', e.target.value)} placeholder="product-images/..." />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className={BTN_GHOST} onClick={onClose}>Cancel</button>
            <button type="submit" className={BTN_PRIMARY} disabled={saving}>
              {saving ? 'Saving…' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══ PRODUCT DETAILS MODAL ═══ */

function ProductDetailsModal({ open, loading, data, onClose }) {
  if (!open) return null;

  const p = data?.product;
  const stats = data?.stats || {};

  return (
    <div className="fixed inset-0 z-[1060] flex items-center justify-center bg-deepGreen/45 p-4 backdrop-blur-sm" onClick={onClose} role="presentation">
      <div
        className="animate-productModalIn max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-[0_25px_60px_rgba(0,0,0,0.22)] [.admin-dark_&]:bg-[#1a2421]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
          <h3 className="font-display text-xl font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
            {p ? `Product Details — ${p.title}` : 'Product Details'}
          </h3>
          <button type="button" className="text-2xl text-gray-500" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="p-5">
          {loading && (
            <p className="py-8 text-center text-gray-500">
              <i className="fa-solid fa-spinner fa-spin me-2" /> Loading…
            </p>
          )}
          {!loading && p && (
            <>
              <div className="mb-4 grid gap-4 md:grid-cols-12">
                <div className="md:col-span-4">
                  <img src={productImage(p.images?.[0])} alt={p.title} className="max-h-[220px] w-full rounded-xl border border-gray-100 object-cover" />
                </div>
                <div className="md:col-span-8">
                  <h4 className="mb-2 text-lg font-bold text-gray-900 [.admin-dark_&]:text-gray-100">{p.title}</h4>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-[0.75rem] font-bold ${getStatus(p) === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {getStatus(p)}
                    </span>
                    <span className={`rounded-md px-2 py-0.5 text-[0.75rem] font-bold ${(stats.stockVal || 0) <= 0 ? 'bg-red-100 text-red-700' : stats.lowStock ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>
                      {(stats.stockVal || 0) <= 0 ? 'Out of Stock' : stats.lowStock ? `Low Stock (${stats.stockVal})` : `In Stock (${stats.stockVal})`}
                    </span>
                    {p.isNewest && <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[0.75rem] font-bold text-blue-700">New Arrival</span>}
                  </div>
                  <p className="mb-3 text-sm text-gray-500">{p.description || 'No description.'}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Category:</span> <strong>{formatCategory(p.category)}</strong></div>
                    <div><span className="text-gray-500">Price:</span> <strong>{formatAdminPrice(p.price)}</strong></div>
                    <div><span className="text-gray-500">Material:</span> <strong>{p.material || '—'}</strong></div>
                    <div><span className="text-gray-500">Dimensions:</span> <strong>{p.dimensions || '—'}</strong></div>
                    <div><span className="text-gray-500">Color:</span> <strong>{p.color || '—'}</strong></div>
                    <div><span className="text-gray-500">Rating:</span> <strong>{stats.avgRating || p.rating || 0} ({stats.reviewCount || 0} reviews)</strong></div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h5 className="mb-3 font-bold text-deepGreen [.admin-dark_&]:text-emerald-300">
                    <i className="fa-solid fa-star me-2" />Recent Reviews
                  </h5>
                  {(data.recentReviews || []).length === 0 ? (
                    <p className="text-sm text-gray-500">No reviews yet.</p>
                  ) : (
                    data.recentReviews.map((r) => (
                      <div key={r.id} className="mb-2 border-b border-gray-100 pb-2">
                        <div className="flex justify-between">
                          <span className="font-semibold">{r.userName || 'Customer'}</span>
                          <span className="text-amber-500">{'★'.repeat(r.rating || 0)}</span>
                        </div>
                        <p className="text-sm text-gray-500">{r.comment || ''}</p>
                      </div>
                    ))
                  )}
                </div>
                <div>
                  <h5 className="mb-3 font-bold text-deepGreen [.admin-dark_&]:text-emerald-300">
                    <i className="fa-solid fa-receipt me-2" />Recent Orders ({stats.totalOrders || 0} total)
                  </h5>
                  {(data.recentOrders || []).length === 0 ? (
                    <p className="text-sm text-gray-500">No orders for this product yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500">
                            <th className="pb-1">Order</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.recentOrders.map((o) => (
                            <tr key={o.id} className="border-t border-gray-50">
                              <td className="py-1 font-semibold">{o.id}</td>
                              <td>{o.customer}</td>
                              <td>${Number(o.amount || 0).toFixed(3)}</td>
                              <td>{o.status || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ MAIN TAB ═══ */

export default function AdminProductsTab({ headerSearch = '' }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [localSearch, setLocalSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStock, setFilterStock] = useState('all');

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formTitle, setFormTitle] = useState('Add New Product');
  const [saving, setSaving] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsData, setDetailsData] = useState(null);

  const searchQuery = (headerSearch || localSearch).toLowerCase().trim();

  const token = () => localStorage.getItem('token');
  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token()}`,
  });

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/categories/all'), { headers: authHeaders() });
      const data = await res.json();
      if (data.success && data.categories?.length) {
        setCategories(
          data.categories
            .filter((c) => c.active !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((c) => [c.slug, c.name])
        );
      }
    } catch {
      /* fallback */
    }
  }, []);

  const loadProducts = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetchWithTimeout(apiUrl('/api/products'), {}, 8000);
      const data = await res.json();
      if (data.success) setProducts(data.products || []);
    } catch {
      showTopFloatNotification('Failed to load products.', 'danger');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  const openAdd = useCallback(() => {
    setForm({ ...EMPTY_FORM, stockVal: 10 });
    setFormTitle('Add New Product');
    setFormOpen(true);
  }, []);

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [loadCategories, loadProducts]);

  useEffect(() => {
    const onInvalidate = () => loadProducts({ quiet: true });
    const onOpenAdd = () => openAdd();
    window.addEventListener('admin-products-invalidate', onInvalidate);
    window.addEventListener('admin-products-open-add', onOpenAdd);
    return () => {
      window.removeEventListener('admin-products-invalidate', onInvalidate);
      window.removeEventListener('admin-products-open-add', onOpenAdd);
    };
  }, [loadProducts, openAdd]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchQuery =
        !searchQuery ||
        p.title?.toLowerCase().includes(searchQuery) ||
        p.material?.toLowerCase().includes(searchQuery) ||
        String(p.id).includes(searchQuery);

      const matchCategory = filterCategory === 'all' || p.category?.toLowerCase() === filterCategory;

      const stockVal = getStockVal(p);
      const status = getStatus(p);
      const matchStatus = filterStatus === 'all' || status.toLowerCase() === filterStatus.toLowerCase();
      const stockState = stockVal > 0 ? 'in-stock' : 'out-of-stock';
      const matchStock = filterStock === 'all' || stockState === filterStock;

      return matchQuery && matchCategory && matchStatus && matchStock;
    });
  }, [products, searchQuery, filterCategory, filterStatus, filterStock]);

  const openEdit = (product) => {
    setForm({
      id: product.id,
      title: product.title || '',
      category: product.category || 'chair',
      materialType: product.materialType || 'wood',
      price: product.price ?? '',
      oldPrice: product.oldPrice || '',
      color: product.color || '',
      stockVal: getStockVal(product),
      status: getStatus(product),
      isNewest: Boolean(product.isNewest),
      description: product.description || '',
      material: product.material || '',
      dimensions: product.dimensions || '',
      imageUrl: product.images?.[0] || '',
      imageBase64: '',
    });
    setFormTitle(`Edit Product: ${product.title}`);
    setFormOpen(true);
  };

  const openView = async (productId) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsData(null);
    try {
      const res = await fetch(apiUrl(`/api/products/${productId}/details`), {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) setDetailsData(data);
      else showTopFloatNotification(data.message || 'Failed to load product.', 'danger');
    } catch {
      showTopFloatNotification('Could not load product details.', 'danger');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Are you sure you want to delete product '${product.title}'?`)) return;
    try {
      const res = await fetch(apiUrl(`/api/products/${product.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('Product deleted successfully.');
        loadProducts({ quiet: true });
        window.dispatchEvent(new CustomEvent('admin-products-invalidate'));
      } else {
        showTopFloatNotification(data.message || 'Delete failed.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not connect to server.', 'danger');
    }
  };

  const handleFormChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showTopFloatNotification('File is too large! Choose an image under 2MB.', 'danger');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((f) => ({ ...f, imageBase64: ev.target?.result || '', imageUrl: '' }));
    };
    reader.readAsDataURL(file);
  };

  const buildPayload = () => {
    const price = Number(form.price);
    const oldPrice = form.oldPrice ? Number(form.oldPrice) : null;
    const stockVal = Math.max(0, parseInt(form.stockVal, 10) || 0);
    const category = form.category;

    let finalImage = 'product-images/hero1.jpeg';
    if (form.imageBase64) finalImage = form.imageBase64;
    else if (form.imageUrl.trim()) finalImage = form.imageUrl.trim();

    const categoryLabels = Object.fromEntries(FALLBACK_CATEGORIES);
    const label = categoryLabels[category] || formatCategory(category);
    const discount =
      oldPrice && oldPrice > price ? `${Math.round(((oldPrice - price) / oldPrice) * 100)}% off` : '';
    const materialType = form.materialType;

    return {
      title: form.title.trim(),
      category,
      label,
      materialType,
      materialLabel: materialType.charAt(0).toUpperCase() + materialType.slice(1),
      material: form.material.trim(),
      dimensions: form.dimensions.trim(),
      description: form.description.trim(),
      price,
      oldPrice,
      discount,
      stockVal,
      stock: stockVal > 0 ? 'in-stock' : 'out-of-stock',
      color: form.color.trim(),
      isNewest: form.isNewest,
      images: [finalImage, finalImage, finalImage, finalImage],
      status: form.status,
      availability: stockVal > 0 ? 'In Stock' : 'Out of Stock',
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = buildPayload();
    const isEdit = Boolean(form.id);

    try {
      const res = await fetch(
        isEdit ? apiUrl(`/api/products/${form.id}`) : apiUrl('/api/products'),
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification(
          isEdit ? `Product '${payload.title}' updated successfully!` : `Product '${payload.title}' added successfully!`
        );
        setFormOpen(false);
        loadProducts({ quiet: true });
        window.dispatchEvent(new CustomEvent('admin-products-invalidate'));
      } else {
        showTopFloatNotification(data.message || 'Save failed.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not connect to server.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-cardRise">
      <div className={ADM_TABLE_CARD}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <AppSearchField
            value={localSearch || headerSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search products..."
            className="max-w-[320px]"
          />
          <button type="button" className={BTN_ADD} onClick={openAdd}>
            <i className="fa-solid fa-plus" /> Add Product
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <select className={`${ADM_SELECT} w-auto min-w-[160px]`} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            {FILTER_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select className={`${ADM_SELECT} w-auto min-w-[140px]`} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select className={`${ADM_SELECT} w-auto min-w-[140px]`} value={filterStock} onChange={(e) => setFilterStock(e.target.value)}>
            <option value="all">All Stock</option>
            <option value="in-stock">In Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className={ADM_TABLE}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    <i className="fa-solid fa-spinner fa-spin me-2" /> Loading products…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No matching products found.
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((p) => {
                  const stockVal = getStockVal(p);
                  const status = getStatus(p);
                  const isActive = status === 'Active';
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <img
                            src={productImage(p.images?.[0])}
                            alt=""
                            className="h-11 w-11 rounded-lg object-cover"
                          />
                          <span className="font-bold text-gray-900 [.admin-dark_&]:text-gray-100">{p.title}</span>
                        </div>
                      </td>
                      <td className="font-medium text-gray-600 [.admin-dark_&]:text-gray-400">{formatCategory(p.category)}</td>
                      <td className="font-bold text-gray-900 [.admin-dark_&]:text-gray-100">{formatAdminPrice(p.price)}</td>
                      <td className="font-medium text-gray-600">
                        {stockVal <= 5 && stockVal > 0 ? (
                          <span className="font-bold text-amber-600">{stockVal} <small>(Low)</small></span>
                        ) : (
                          stockVal
                        )}
                      </td>
                      <td>
                        <span
                          className={`inline-block rounded-md px-2.5 py-1 text-[0.78rem] font-bold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-600 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300'
                              : 'bg-red-100 text-red-500 [.admin-dark_&]:bg-red-500/15 [.admin-dark_&]:text-red-300'
                          }`}
                        >
                          {status}{p.isNewest ? ' · New' : ''}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button type="button" className="text-deepGreen hover:text-teal" title="View" onClick={() => openView(p.id)}>
                            <i className="fa-regular fa-eye" />
                          </button>
                          <button type="button" className="text-blue-600 hover:text-blue-800" title="Edit" onClick={() => openEdit(p)}>
                            <i className="fa-solid fa-pencil" />
                          </button>
                          <button type="button" className="text-red-500 hover:text-red-700" title="Delete" onClick={() => handleDelete(p)}>
                            <i className="fa-solid fa-trash-can" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <ProductFormModal
        open={formOpen}
        title={formTitle}
        form={form}
        categories={categories}
        saving={saving}
        onChange={handleFormChange}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        onFile={handleFile}
      />

      <ProductDetailsModal
        open={detailsOpen}
        loading={detailsLoading}
        data={detailsData}
        onClose={() => setDetailsOpen(false)}
      />
    </div>
  );
}
