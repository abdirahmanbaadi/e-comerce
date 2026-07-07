import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiUrl, clearDeliveryDistrictsCache } from '../../utils/data';
import { showTopFloatNotification } from '../../utils/notifications';
import { AVAILABILITY_OPTIONS, VEHICLE_TYPES } from '../../utils/districts';

const ADM_CARD =
  'rounded-2xl border border-deepGreen/8 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#1a2421] [.admin-dark_&]:shadow-[0_4px_20px_rgba(0,0,0,0.25)]';
const ADM_TITLE =
  'font-display text-2xl font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]';
const ADM_LABEL =
  'block text-[0.82rem] font-extrabold text-gray-800 mb-1.5 [.admin-dark_&]:text-gray-200';
const ADM_INPUT =
  'w-full rounded-[10px] border-[1.5px] border-black/8 bg-white px-3.5 py-2.5 text-[0.88rem] font-semibold text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-deepGreen focus:shadow-[0_0_0_3.5px_rgba(7,61,53,0.06)] [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#141f1b] [.admin-dark_&]:text-gray-100 [.admin-dark_&]:placeholder:text-gray-500 [.admin-dark_&]:focus:border-emerald-500/50';
const ADM_TABLE_CARD =
  'rounded-2xl border border-deepGreen/6 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#1a2421] [.admin-dark_&]:shadow-[0_4px_20px_rgba(0,0,0,0.25)]';

const ADM_TABLE =
  'w-full border-collapse text-[0.88rem] [&_th]:text-left [&_th]:px-4 [&_th]:py-3.5 [&_th]:font-extrabold [&_th]:text-gray-500 [&_th]:border-b-2 [&_th]:border-gray-100 [&_th]:text-[0.78rem] [&_th]:uppercase [&_th]:tracking-wide [&_td]:px-4 [&_td]:py-3.5 [&_td]:border-b [&_td]:border-gray-100 [&_td]:font-semibold [&_td]:align-middle [&_tbody_tr:last-child_td]:border-b-0 [&_tbody_tr]:transition [&_tbody_tr:hover]:bg-deepGreen/[0.015] [.admin-dark_&]:[&_th]:text-gray-400 [.admin-dark_&]:[&_th]:border-white/10 [.admin-dark_&]:[&_td]:border-white/10 [.admin-dark_&]:[&_td]:text-gray-200 [.admin-dark_&]:[&_tbody_tr:hover]:bg-white/[0.03]';
const ADM_ERROR =
  'mb-4 rounded-xl border border-red-500/18 bg-red-500/8 px-4 py-3 text-[0.86rem] font-semibold text-red-700 [.admin-dark_&]:text-red-300';
const BTN_SM_OUTLINE_SUCCESS =
  'inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-600 px-3 py-1.5 text-[0.78rem] font-bold text-emerald-700 transition hover:bg-emerald-50 [.admin-dark_&]:border-emerald-500/40 [.admin-dark_&]:text-emerald-400 [.admin-dark_&]:hover:bg-emerald-500/10';
const BTN_SM_OUTLINE_DANGER =
  'inline-flex items-center justify-center gap-1 rounded-lg border border-red-500 px-3 py-1.5 text-[0.78rem] font-bold text-red-600 transition hover:bg-red-50 [.admin-dark_&]:border-red-500/40 [.admin-dark_&]:text-red-400 [.admin-dark_&]:hover:bg-red-500/10';
const BTN_SM_SUCCESS =
  'inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[0.78rem] font-bold text-white transition hover:bg-emerald-700';
const BTN_SM_OUTLINE_SECONDARY =
  'inline-flex items-center justify-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-[0.78rem] font-bold text-gray-600 transition hover:bg-gray-50 [.admin-dark_&]:border-white/15 [.admin-dark_&]:text-gray-300 [.admin-dark_&]:hover:bg-white/5';
const BTN_SM_OUTLINE_WARNING =
  'inline-flex items-center justify-center gap-1 rounded-lg border border-amber-500 px-3 py-1.5 text-[0.78rem] font-bold text-amber-700 transition hover:bg-amber-50 [.admin-dark_&]:border-amber-500/40 [.admin-dark_&]:text-amber-400 [.admin-dark_&]:hover:bg-amber-500/10';
const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-[10px] bg-gradient-to-br from-deepGreen to-teal px-6 py-3 text-[0.9rem] font-extrabold text-white transition hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(7,61,53,0.15)] disabled:opacity-60 disabled:hover:translate-y-0';
const BTN_SECONDARY =
  'inline-flex items-center justify-center gap-2 rounded-[10px] bg-gray-100 px-6 py-3 text-[0.9rem] font-extrabold text-gray-800 transition hover:bg-gray-200 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-gray-200 [.admin-dark_&]:hover:bg-white/15';

// =============================================================================
// CmsAdminTab
// =============================================================================

const EMPTY_BANNER = {
  id: '',
  title: '',
  subtitle: '',
  image: '',
  link: '/products',
  active: true,
  order: 1,
};

const EMPTY_PROMO = {
  id: '',
  code: '',
  description: '',
  discountAmount: 0,
  discountPercent: 0,
  active: true,
};

const EMPTY_FAQ = {
  id: '',
  question: '',
  answer: '',
  order: 1,
};

function newId(prefix) {
  return `${prefix}-${Date.now()}`;
}

function formatUpdatedAt(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function CmsAdminTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [hero, setHero] = useState({
    smallTitle: '',
    title: '',
    description: '',
    ctaText: '',
    ctaLink: '',
    image: '',
  });
  const [banners, setBanners] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [deliveryFees, setDeliveryFees] = useState([]);

  const token = () => localStorage.getItem('token');
  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token()}`,
  });

  const loadCms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/cms'), {
        headers: token() ? { Authorization: `Bearer ${token()}` } : {},
      });
      const data = await res.json();
      if (data.success && data.cms) {
        setHero(data.cms.hero || {});
        setBanners(data.cms.banners || []);
        setPromotions(data.cms.promotions || []);
        setFaqs(data.cms.faqs || []);
        setDeliveryFees(data.cms.deliveryFees || []);
        setUpdatedAt(data.cms.updatedAt || null);
      }
    } catch {
      showTopFloatNotification('Failed to load CMS content.', 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCms();
  }, [loadCms]);

  const stats = useMemo(
    () => ({
      banners: banners.filter((b) => b.active).length,
      promos: promotions.filter((p) => p.active).length,
      faqs: faqs.length,
      districts: deliveryFees.length,
    }),
    [banners, promotions, faqs, deliveryFees]
  );

  const updateBanner = (index, field, value) => {
    setBanners((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const updatePromo = (index, field, value) => {
    setPromotions((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const updateFaq = (index, field, value) => {
    setFaqs((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const updateDeliveryFee = (index, field, value) => {
    setDeliveryFees((rows) =>
      rows.map((row, i) =>
        i === index ? { ...row, [field]: field === 'fee' ? Number(value) : value } : row
      )
    );
  };

  const handleSave = async () => {
    if (!hero.title?.trim()) {
      showTopFloatNotification('Hero main title is required.', 'danger');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(apiUrl('/api/cms'), {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ hero, banners, promotions, faqs, deliveryFees }),
      });
      const data = await response.json();
      if (data.success) {
        setUpdatedAt(data.updatedAt || data.cms?.updatedAt || new Date().toISOString());
        clearDeliveryDistrictsCache();
        window.dispatchEvent(new Event('delivery-fees-updated'));
        showTopFloatNotification('Site content updated successfully!');
      } else {
        showTopFloatNotification(data.message || 'Failed to save CMS content', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not save CMS content.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`${ADM_CARD} p-4`}>
        <p className="text-muted mb-0">
          <i className="fa-solid fa-spinner fa-spin me-2" />
          Loading CMS content…
        </p>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className={`${ADM_CARD} p-4 mb-3`}>
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div>
            <h3 className={`${ADM_TITLE} mb-1`}>
              <i className="fa-solid fa-pen-to-square me-2" />
              Content Management (CMS)
            </h3>
            <p className="text-muted small mb-0">
              Manage homepage hero, promotional banners, coupon codes, help FAQs, and district delivery fees.
              Changes appear on the public site immediately after save.
            </p>
          </div>
          <div className="text-end">
            <div className="small text-muted">Last updated</div>
            <div className="fw-semibold">{formatUpdatedAt(updatedAt)}</div>
            <Link to="/" target="_blank" className={`${BTN_SM_OUTLINE_SUCCESS} mt-2`}>
              <i className="fa-solid fa-arrow-up-right-from-square me-1" />
              Preview homepage
            </Link>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2 mt-3">
          <span className="badge bg-success-subtle text-success">{stats.banners} active banners</span>
          <span className="badge bg-success-subtle text-success">{stats.promos} active promos</span>
          <span className="badge bg-secondary-subtle text-secondary">{stats.faqs} FAQs</span>
          <span className="badge bg-secondary-subtle text-secondary">{stats.districts} delivery districts</span>
        </div>
      </div>

      <div className={`${ADM_CARD} p-4 mb-3`}>
        <h3 className="mb-3">Homepage Hero</h3>
        <div className="row g-3">
          <div className="col-md-6">
            <label className={ADM_LABEL}>Small Title</label>
            <input
              className={ADM_INPUT}
              value={hero.smallTitle || ''}
              onChange={(e) => setHero((h) => ({ ...h, smallTitle: e.target.value }))}
            />
          </div>
          <div className="col-md-6">
            <label className={ADM_LABEL}>Hero Image Path</label>
            <input
              className={ADM_INPUT}
              value={hero.image || ''}
              onChange={(e) => setHero((h) => ({ ...h, image: e.target.value }))}
              placeholder="/product-images/hero1.jpeg"
            />
          </div>
          <div className="col-12">
            <label className={ADM_LABEL}>Main Title (use Enter for line break)</label>
            <textarea
              className={ADM_INPUT}
              rows={2}
              value={hero.title || ''}
              onChange={(e) => setHero((h) => ({ ...h, title: e.target.value }))}
            />
          </div>
          <div className="col-12">
            <label className={ADM_LABEL}>Description</label>
            <textarea
              className={ADM_INPUT}
              rows={3}
              value={hero.description || ''}
              onChange={(e) => setHero((h) => ({ ...h, description: e.target.value }))}
            />
          </div>
          <div className="col-md-6">
            <label className={ADM_LABEL}>Button Text</label>
            <input
              className={ADM_INPUT}
              value={hero.ctaText || ''}
              onChange={(e) => setHero((h) => ({ ...h, ctaText: e.target.value }))}
            />
          </div>
          <div className="col-md-6">
            <label className={ADM_LABEL}>Button Link</label>
            <input
              className={ADM_INPUT}
              value={hero.ctaLink || ''}
              onChange={(e) => setHero((h) => ({ ...h, ctaLink: e.target.value }))}
              placeholder="/products"
            />
          </div>
        </div>
      </div>

      <div className={`${ADM_CARD} p-4 mb-3`}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0">Promotional Banners</h3>
          <button
            type="button"
            className={BTN_SM_OUTLINE_SUCCESS}
            onClick={() => setBanners((rows) => [...rows, { ...EMPTY_BANNER, id: newId('banner'), order: rows.length + 1 }])}
          >
            <i className="fa-solid fa-plus me-1" />
            Add Banner
          </button>
        </div>

        {banners.length === 0 && (
          <p className="text-muted small">No banners yet. Add one to show cards on the homepage.</p>
        )}

        {banners.map((banner, index) => (
          <div key={banner.id || index} className="border rounded-3 p-3 mb-3">
            <div className="row g-2">
              <div className="col-md-4">
                <label className={ADM_LABEL}>Title</label>
                <input
                  className={ADM_INPUT}
                  value={banner.title || ''}
                  onChange={(e) => updateBanner(index, 'title', e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className={ADM_LABEL}>Subtitle</label>
                <input
                  className={ADM_INPUT}
                  value={banner.subtitle || ''}
                  onChange={(e) => updateBanner(index, 'subtitle', e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label className={ADM_LABEL}>Order</label>
                <input
                  type="number"
                  className={ADM_INPUT}
                  value={banner.order ?? index + 1}
                  onChange={(e) => updateBanner(index, 'order', Number(e.target.value))}
                />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <label className="d-flex align-items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={banner.active !== false}
                    onChange={(e) => updateBanner(index, 'active', e.target.checked)}
                  />
                  Active
                </label>
              </div>
              <div className="col-md-6">
                <label className={ADM_LABEL}>Image Path</label>
                <input
                  className={ADM_INPUT}
                  value={banner.image || ''}
                  onChange={(e) => updateBanner(index, 'image', e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className={ADM_LABEL}>Link</label>
                <input
                  className={ADM_INPUT}
                  value={banner.link || ''}
                  onChange={(e) => updateBanner(index, 'link', e.target.value)}
                />
              </div>
            </div>
            <button
              type="button"
              className={`${BTN_SM_OUTLINE_DANGER} mt-2`}
              onClick={() => setBanners((rows) => rows.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className={`${ADM_CARD} p-4 mb-3`}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0">Promotions / Coupon Codes</h3>
          <button
            type="button"
            className={BTN_SM_OUTLINE_SUCCESS}
            onClick={() => setPromotions((rows) => [...rows, { ...EMPTY_PROMO, id: newId('promo') }])}
          >
            <i className="fa-solid fa-plus me-1" />
            Add Promo
          </button>
        </div>
        <p className="text-muted small">
          These codes work at checkout (Cart). Use either a fixed discount amount or a percentage — not both.
        </p>

        {promotions.map((promo, index) => (
          <div key={promo.id || index} className="border rounded-3 p-3 mb-3">
            <div className="row g-2">
              <div className="col-md-3">
                <label className={ADM_LABEL}>Code</label>
                <input
                  className={`${ADM_INPUT} uppercase`}
                  value={promo.code || ''}
                  onChange={(e) => updatePromo(index, 'code', e.target.value.toUpperCase())}
                  placeholder="MMF10"
                />
              </div>
              <div className="col-md-5">
                <label className={ADM_LABEL}>Description</label>
                <input
                  className={ADM_INPUT}
                  value={promo.description || ''}
                  onChange={(e) => updatePromo(index, 'description', e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label className={ADM_LABEL}>Fixed ($)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  className={ADM_INPUT}
                  value={promo.discountAmount ?? 0}
                  onChange={(e) => updatePromo(index, 'discountAmount', Number(e.target.value))}
                />
              </div>
              <div className="col-md-2">
                <label className={ADM_LABEL}>Percent (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className={ADM_INPUT}
                  value={promo.discountPercent ?? 0}
                  onChange={(e) => updatePromo(index, 'discountPercent', Number(e.target.value))}
                />
              </div>
              <div className="col-12">
                <label className="d-flex align-items-center gap-2">
                  <input
                    type="checkbox"
                    checked={promo.active !== false}
                    onChange={(e) => updatePromo(index, 'active', e.target.checked)}
                  />
                  Active at checkout
                </label>
              </div>
            </div>
            <button
              type="button"
              className={`${BTN_SM_OUTLINE_DANGER} mt-2`}
              onClick={() => setPromotions((rows) => rows.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className={`${ADM_CARD} p-4 mb-3`}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0">Help Center FAQs</h3>
          <button
            type="button"
            className={BTN_SM_OUTLINE_SUCCESS}
            onClick={() => setFaqs((rows) => [...rows, { ...EMPTY_FAQ, id: newId('faq'), order: rows.length + 1 }])}
          >
            <i className="fa-solid fa-plus me-1" />
            Add FAQ
          </button>
        </div>
        <p className="text-muted small">Shown in Profile → Help after save.</p>

        {faqs.map((faq, index) => (
          <div key={faq.id || index} className="border rounded-3 p-3 mb-3">
            <div className="row g-2">
              <div className="col-md-10">
                <label className={ADM_LABEL}>Question</label>
                <input
                  className={ADM_INPUT}
                  value={faq.question || ''}
                  onChange={(e) => updateFaq(index, 'question', e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label className={ADM_LABEL}>Order</label>
                <input
                  type="number"
                  className={ADM_INPUT}
                  value={faq.order ?? index + 1}
                  onChange={(e) => updateFaq(index, 'order', Number(e.target.value))}
                />
              </div>
              <div className="col-12">
                <label className={ADM_LABEL}>Answer</label>
                <textarea
                  className={ADM_INPUT}
                  rows={3}
                  value={faq.answer || ''}
                  onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                />
              </div>
            </div>
            <button
              type="button"
              className={`${BTN_SM_OUTLINE_DANGER} mt-2`}
              onClick={() => setFaqs((rows) => rows.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className={`${ADM_CARD} p-4 mb-3`}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0">District Delivery Fees</h3>
          <button
            type="button"
            className={BTN_SM_OUTLINE_SUCCESS}
            onClick={() => setDeliveryFees((rows) => [...rows, { district: '', fee: 0.001 }])}
          >
            <i className="fa-solid fa-plus me-1" />
            Add District
          </button>
        </div>
        <p className="text-muted small">
          Used at Cart/Checkout and validated when placing orders. Also editable under Settings → Delivery.
        </p>

        <div className="table-responsive">
          <table className={`${ADM_TABLE} w-full`}>
            <thead>
              <tr>
                <th>District</th>
                <th style={{ width: 160 }}>Fee ($)</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveryFees.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-muted py-3">
                    No delivery districts configured.
                  </td>
                </tr>
              )}
              {deliveryFees.map((row, index) => (
                <tr key={`${row.district}-${index}`}>
                  <td>
                    <input
                      className={ADM_INPUT}
                      value={row.district || ''}
                      onChange={(e) => updateDeliveryFee(index, 'district', e.target.value)}
                      placeholder="Hodan"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      className={ADM_INPUT}
                      value={row.fee ?? 0}
                      onChange={(e) => updateDeliveryFee(index, 'fee', e.target.value)}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={BTN_SM_OUTLINE_DANGER}
                      onClick={() => setDeliveryFees((rows) => rows.filter((_, i) => i !== index))}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button type="button" className={`${BTN_PRIMARY} px-4`} onClick={handleSave} disabled={saving}>
        {saving ? (
          <>
            <i className="fa-solid fa-spinner fa-spin me-2" />
            Saving…
          </>
        ) : (
          <>
            <i className="fa-solid fa-floppy-disk me-2" />
            Save CMS Content
          </>
        )}
      </button>
    </div>
  );
}


// =============================================================================
// CategoriesAdminTab
// =============================================================================

const EMPTY_FORM = { name: '', description: '', image: '', order: 0, active: true };

export function CategoriesAdminTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const token = () => localStorage.getItem('token');
  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token()}`,
  });

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/categories/all'), { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setCategories(data.categories || []);
    } catch {
      showTopFloatNotification('Failed to load categories.', 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name || '',
      description: cat.description || '',
      image: cat.image || '',
      order: cat.order || 0,
      active: cat.active !== false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showTopFloatNotification('Category name is required.', 'danger');
      return;
    }

    setSaving(true);
    try {
      const url = editingId
        ? apiUrl(`/api/categories/${editingId}`)
        : apiUrl('/api/categories');
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification(editingId ? 'Category updated.' : 'Category created.');
        resetForm();
        loadCategories();
      } else {
        showTopFloatNotification(data.message || 'Save failed.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not save category.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      const res = await fetch(apiUrl(`/api/categories/${id}`), {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('Category deleted.');
        loadCategories();
      }
    } catch {
      showTopFloatNotification('Delete failed.', 'danger');
    }
  };

  return (
    <div className={`${ADM_CARD} p-4`}>
      <h3 className={`${ADM_TITLE} mb-4`}>
        <i className="fa-solid fa-layer-group me-2" />
        Product Categories
      </h3>

      <form className="row g-3 mb-4" onSubmit={handleSubmit}>
        <div className="col-md-4">
          <label className={ADM_LABEL}>Name</label>
          <input
            className={ADM_INPUT}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Living Room"
          />
        </div>
        <div className="col-md-4">
          <label className={ADM_LABEL}>Image path (optional)</label>
          <input
            className={ADM_INPUT}
            value={form.image}
            onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
            placeholder="product-images/hero.png"
          />
        </div>
        <div className="col-md-2">
          <label className={ADM_LABEL}>Sort order</label>
          <input
            type="number"
            className={ADM_INPUT}
            value={form.order}
            onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
          />
        </div>
        <div className="col-md-2 d-flex align-items-end">
          <label className="d-flex align-items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Active
          </label>
        </div>
        <div className="col-12">
          <label className={ADM_LABEL}>Description</label>
          <textarea
            className={ADM_INPUT}
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="col-12 d-flex gap-2">
          <button type="submit" className={BTN_PRIMARY} disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Update Category' : 'Add Category'}
          </button>
          {editingId && (
            <button type="button" className={BTN_SECONDARY} onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="text-muted">Loading categories…</p>
      ) : (
        <div className="table-responsive">
          <table className={`${ADM_TABLE} w-full`}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    No categories yet.
                  </td>
                </tr>
              )}
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td className="fw-bold">{cat.name}</td>
                  <td>{cat.slug}</td>
                  <td>{cat.order}</td>
                  <td>
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[0.75rem] font-extrabold ${
                        cat.active
                          ? 'bg-emerald-100 text-emerald-700 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300'
                          : 'bg-red-100 text-red-600 [.admin-dark_&]:bg-red-500/15 [.admin-dark_&]:text-red-300'
                      }`}
                    >
                      {cat.active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`${BTN_SM_OUTLINE_SUCCESS} me-2`}
                      onClick={() => handleEdit(cat)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={BTN_SM_OUTLINE_DANGER}
                      onClick={() => handleDelete(cat.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


// =============================================================================
// ReviewsAdminTab
// =============================================================================

const REVIEW_FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
];

function renderStars(rating) {
  return Array.from({ length: 5 }, (_, index) => (
    <i
      key={index}
      className={index < rating ? 'fa-solid fa-star text-warning' : 'fa-regular fa-star text-secondary'}
    />
  ));
}

function statusBadge(status) {
  if (status === 'approved') return 'bg-success-subtle text-success';
  if (status === 'rejected') return 'bg-danger-subtle text-danger';
  return 'bg-warning-subtle text-warning';
}

export function ReviewsAdminTab() {
  const [filter, setFilter] = useState('pending');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actingId, setActingId] = useState('');

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('/api/reviews'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setReviews(data.reviews || []);
      else {
        setReviews([]);
        setLoadError(data.message || 'Could not load reviews.');
      }
    } catch (err) {
      console.error(err);
      setReviews([]);
      setLoadError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const filtered = useMemo(() => {
    if (filter === 'all') return reviews;
    return reviews.filter((rev) => rev.status === filter);
  }, [reviews, filter]);

  const stats = useMemo(
    () => ({
      pending: reviews.filter((r) => r.status === 'pending').length,
      approved: reviews.filter((r) => r.status === 'approved').length,
      rejected: reviews.filter((r) => r.status === 'rejected').length,
    }),
    [reviews]
  );

  const moderate = async (reviewId, status) => {
    setActingId(reviewId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/reviews/${reviewId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification(status === 'approved' ? '✅ Review approved!' : 'Review rejected.');
        loadReviews();
      } else {
        showTopFloatNotification(data.message || 'Action failed', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not update review', 'danger');
    } finally {
      setActingId('');
    }
  };

  const remove = async (reviewId) => {
    if (!window.confirm('Delete this review permanently?')) return;
    setActingId(reviewId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/reviews/${reviewId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('Review deleted.');
        loadReviews();
      } else {
        showTopFloatNotification(data.message || 'Delete failed', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not delete review', 'danger');
    } finally {
      setActingId('');
    }
  };

  return (
    <div className={ADM_TABLE_CARD}>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h3 className={`${ADM_TITLE} mb-1`}>
            <i className="fa-solid fa-star me-2" />
            Customer Ratings & Reviews
          </h3>
          <p className="text-muted mb-0 small">
            Pending {stats.pending} · Approved {stats.approved} · Rejected {stats.rejected}
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {REVIEW_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${BTN_SM_OUTLINE_SECONDARY} px-3.5 py-2 ${filter === item.id ? '!border-emerald-600 !bg-emerald-600 !text-white hover:!bg-emerald-700' : ''}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <div className={ADM_ERROR} role="alert">
          <i className="fa-solid fa-circle-exclamation me-2" />
          {loadError}
        </div>
      )}

      <div className="table-responsive">
        <table className={`${ADM_TABLE} align-middle`}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Customer</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted">
                  <i className="fa-solid fa-spinner fa-spin me-2" />
                  Loading reviews…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted">
                  No reviews in this filter.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((rev) => {
                const busy = actingId === rev.id;
                const date = rev.createdAt
                  ? new Date(rev.createdAt).toLocaleDateString()
                  : '—';

                return (
                  <tr key={rev.id}>
                    <td className="fw-bold text-success">{rev.productTitle || '—'}</td>
                    <td className="fw-semibold">{rev.userName || 'Customer'}</td>
                    <td>{renderStars(rev.rating || 0)}</td>
                    <td className="text-secondary" style={{ maxWidth: 280 }}>
                      {rev.comment || '—'}
                    </td>
                    <td>{date}</td>
                    <td>
                      <span className={`badge border-0 px-2 py-1 fw-bold ${statusBadge(rev.status)}`}>
                        {rev.status}
                      </span>
                    </td>
                    <td>
                      {rev.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            className={`${BTN_SM_SUCCESS} me-1`}
                            disabled={busy}
                            onClick={() => moderate(rev.id, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className={BTN_SM_OUTLINE_WARNING}
                            disabled={busy}
                            onClick={() => moderate(rev.id, 'rejected')}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className={BTN_SM_OUTLINE_DANGER}
                          disabled={busy}
                          onClick={() => remove(rev.id)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// =============================================================================
// DriverApplicationsTab
// =============================================================================

const DRIVER_FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
];

function labelFor(value, options) {
  return options.find((o) => o.value === value)?.label || value || '—';
}

function driverStatusClass(status) {
  if (status === 'pending') return 'bg-amber-100 text-amber-700 [.admin-dark_&]:bg-amber-500/15 [.admin-dark_&]:text-amber-300';
  if (status === 'approved') return 'bg-emerald-100 text-emerald-700 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300';
  if (status === 'rejected') return 'bg-red-100 text-red-600 [.admin-dark_&]:bg-red-500/15 [.admin-dark_&]:text-red-300';
  return 'bg-gray-100 text-gray-600 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-gray-300';
}

export function DriverApplicationsTab() {
  const [filter, setFilter] = useState('pending');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(false);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/drivers/applications?status=${filter}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications || []);
      } else {
        setLoadError(data.message || 'Could not load driver applications.');
      }
    } catch (err) {
      console.error(err);
      setLoadError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const approve = async (userId) => {
    setActing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/drivers/applications/${userId}/approve`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('✅ Driver approved!');
        setSelected(null);
        loadApplications();
      } else {
        showTopFloatNotification(`❌ ${data.message}`, 'danger');
      }
    } catch {
      showTopFloatNotification('❌ Action failed', 'danger');
    } finally {
      setActing(false);
    }
  };

  const reject = async (userId) => {
    setActing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/drivers/applications/${userId}/reject`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason || 'Application not accepted.' }),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('Application rejected.');
        setSelected(null);
        setRejectReason('');
        loadApplications();
      } else {
        showTopFloatNotification(`❌ ${data.message}`, 'danger');
      }
    } catch {
      showTopFloatNotification('❌ Action failed', 'danger');
    } finally {
      setActing(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="mb-1 text-[1.45rem] font-bold text-gray-900 [.admin-dark_&]:text-[#e8f0ed]">
            Driver Applications
          </h2>
          <p className="mb-0 text-[0.86rem] text-gray-500 [.admin-dark_&]:text-gray-400">
            Review and approve delivery driver requests.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {DRIVER_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`cursor-pointer rounded-full border px-3.5 py-2 text-[0.78rem] font-extrabold transition ${
                filter === f.id
                  ? 'border-deepGreen bg-deepGreen text-white [.admin-dark_&]:border-emerald-500 [.admin-dark_&]:bg-emerald-500'
                  : 'border-deepGreen/12 bg-white text-gray-600 hover:border-deepGreen/25 [.admin-dark_&]:border-white/8 [.admin-dark_&]:bg-white/[0.04] [.admin-dark_&]:text-[#d7e2de]'
              }`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <div className={ADM_ERROR} role="alert">
          <i className="fa-solid fa-circle-exclamation me-2" />
          {loadError}
        </div>
      )}

      <div className={`${ADM_TABLE_CARD} !mb-0 !p-4`}>
        {loading ? (
          <div className="px-5 py-9 text-center text-gray-500 [.admin-dark_&]:text-gray-400">
            <i className="fa-solid fa-spinner fa-spin mb-3 block text-2xl" />
            <h4 className="mb-0 text-base font-bold">Loading applications…</h4>
          </div>
        ) : applications.length === 0 ? (
          <div className="px-5 py-9 text-center text-gray-500 [.admin-dark_&]:text-gray-400">
            <i className="fa-solid fa-id-card mb-3 block text-2xl" />
            <h4 className="mb-1 text-base font-bold">No applications here</h4>
            <p className="mb-0 text-sm">Try another filter or check back later.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={ADM_TABLE}>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Phone</th>
                  <th>District</th>
                  <th>Vehicle</th>
                  <th>Applied</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const da = app.driverApplication || {};
                  const status = da.status || 'none';
                  return (
                    <tr key={app.id}>
                      <td className="font-bold">{app.firstName} {app.lastName}</td>
                      <td>{app.phone}</td>
                      <td>{da.district || '—'}</td>
                      <td>{labelFor(da.vehicleType, VEHICLE_TYPES)}</td>
                      <td>{da.appliedAt ? new Date(da.appliedAt).toLocaleDateString() : '—'}</td>
                      <td>
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-[0.72rem] font-extrabold capitalize ${driverStatusClass(status)}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td>
                        <button type="button" className={`${BTN_SM_OUTLINE_SUCCESS} font-bold`} onClick={() => setSelected(app)}>
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/45 p-4"
          onClick={() => setSelected(null)}
          role="presentation"
        >
          <div
            className="relative max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-[20px] bg-white p-6 shadow-[0_24px_48px_rgba(0,0,0,0.18)] [.admin-dark_&]:bg-[#141f1b] [.admin-dark_&]:text-[#e8eeec]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <button
              type="button"
              className="absolute right-3.5 top-3.5 flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full border-0 bg-gray-100 [.admin-dark_&]:bg-white/10"
              onClick={() => setSelected(null)}
              aria-label="Close"
            >
              <i className="fa-solid fa-xmark" />
            </button>
            <div className="mb-4 flex items-center gap-3.5">
              <img
                className="h-16 w-16 rounded-full border-2 border-gold object-cover"
                src={selected.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selected.firstName)}&background=073D35&color=fff`}
                alt=""
              />
              <div>
                <h3 className="mb-1 text-[1.2rem] font-extrabold">{selected.firstName} {selected.lastName}</h3>
                <p className="mb-0 text-[0.82rem] text-gray-500 [.admin-dark_&]:text-gray-400">{selected.email}</p>
                <p className="mb-0 text-[0.82rem] text-gray-500 [.admin-dark_&]:text-gray-400">{selected.phone}</p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 text-[0.88rem]">
              <div>
                <strong className="mb-0.5 block text-[0.72rem] uppercase text-gray-400">District</strong>
                <span>{selected.driverApplication?.district || '—'}</span>
              </div>
              <div>
                <strong className="mb-0.5 block text-[0.72rem] uppercase text-gray-400">Vehicle</strong>
                <span>{labelFor(selected.driverApplication?.vehicleType, VEHICLE_TYPES)}</span>
              </div>
              <div>
                <strong className="mb-0.5 block text-[0.72rem] uppercase text-gray-400">Availability</strong>
                <span>{labelFor(selected.driverApplication?.availability, AVAILABILITY_OPTIONS)}</span>
              </div>
              <div>
                <strong className="mb-0.5 block text-[0.72rem] uppercase text-gray-400">Address</strong>
                <span>{selected.address || '—'}</span>
              </div>
            </div>

            {selected.driverApplication?.experience && (
              <div className="mb-4 rounded-xl bg-[#faf8f2] p-3.5 text-[0.88rem] [.admin-dark_&]:bg-white/[0.04]">
                <strong className="block">Experience</strong>
                <p className="mb-0 mt-1">{selected.driverApplication.experience}</p>
              </div>
            )}

            {selected.driverApplication?.status === 'pending' && (
              <div>
                <div className="mb-3">
                  <label className={ADM_LABEL} htmlFor="rejectReason">Reject reason (optional)</label>
                  <input
                    id="rejectReason"
                    className={ADM_INPUT}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason shown to applicant..."
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={BTN_PRIMARY} disabled={acting} onClick={() => approve(selected.id)}>
                    Approve Driver
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-[10px] border border-red-500 px-6 py-3 text-[0.9rem] font-extrabold text-red-600 transition hover:bg-red-50 disabled:opacity-60 [.admin-dark_&]:text-red-400 [.admin-dark_&]:hover:bg-red-500/10"
                    disabled={acting}
                    onClick={() => reject(selected.id)}
                  >
                    Reject Permanently
                  </button>
                </div>
              </div>
            )}

            {selected.driverApplication?.status === 'rejected' && selected.driverApplication.rejectReason && (
              <div className="rounded-xl bg-[#faf8f2] p-3.5 text-[0.88rem] [.admin-dark_&]:bg-white/[0.04]">
                <strong>Reject reason:</strong> {selected.driverApplication.rejectReason}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
