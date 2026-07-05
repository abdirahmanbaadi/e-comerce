import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiUrl, clearDeliveryDistrictsCache } from '../../utils/data';
import { showTopFloatNotification } from '../../utils/notifications';

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

export default function CmsAdminTab() {
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
      <div className="admin-card p-4">
        <p className="text-muted mb-0">
          <i className="fa-solid fa-spinner fa-spin me-2" />
          Loading CMS content…
        </p>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="admin-card p-4 mb-3">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div>
            <h3 className="card-title mb-1">
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
            <Link to="/" target="_blank" className="btn btn-sm btn-outline-success mt-2">
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

      <div className="admin-card p-4 mb-3">
        <h3 className="mb-3">Homepage Hero</h3>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="admin-form-label">Small Title</label>
            <input
              className="admin-form-control"
              value={hero.smallTitle || ''}
              onChange={(e) => setHero((h) => ({ ...h, smallTitle: e.target.value }))}
            />
          </div>
          <div className="col-md-6">
            <label className="admin-form-label">Hero Image Path</label>
            <input
              className="admin-form-control"
              value={hero.image || ''}
              onChange={(e) => setHero((h) => ({ ...h, image: e.target.value }))}
              placeholder="/hero1.jpeg"
            />
          </div>
          <div className="col-12">
            <label className="admin-form-label">Main Title (use Enter for line break)</label>
            <textarea
              className="admin-form-control"
              rows={2}
              value={hero.title || ''}
              onChange={(e) => setHero((h) => ({ ...h, title: e.target.value }))}
            />
          </div>
          <div className="col-12">
            <label className="admin-form-label">Description</label>
            <textarea
              className="admin-form-control"
              rows={3}
              value={hero.description || ''}
              onChange={(e) => setHero((h) => ({ ...h, description: e.target.value }))}
            />
          </div>
          <div className="col-md-6">
            <label className="admin-form-label">Button Text</label>
            <input
              className="admin-form-control"
              value={hero.ctaText || ''}
              onChange={(e) => setHero((h) => ({ ...h, ctaText: e.target.value }))}
            />
          </div>
          <div className="col-md-6">
            <label className="admin-form-label">Button Link</label>
            <input
              className="admin-form-control"
              value={hero.ctaLink || ''}
              onChange={(e) => setHero((h) => ({ ...h, ctaLink: e.target.value }))}
              placeholder="/products"
            />
          </div>
        </div>
      </div>

      <div className="admin-card p-4 mb-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0">Promotional Banners</h3>
          <button
            type="button"
            className="btn btn-sm btn-outline-success"
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
                <label className="admin-form-label">Title</label>
                <input
                  className="admin-form-control"
                  value={banner.title || ''}
                  onChange={(e) => updateBanner(index, 'title', e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="admin-form-label">Subtitle</label>
                <input
                  className="admin-form-control"
                  value={banner.subtitle || ''}
                  onChange={(e) => updateBanner(index, 'subtitle', e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label className="admin-form-label">Order</label>
                <input
                  type="number"
                  className="admin-form-control"
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
                <label className="admin-form-label">Image Path</label>
                <input
                  className="admin-form-control"
                  value={banner.image || ''}
                  onChange={(e) => updateBanner(index, 'image', e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="admin-form-label">Link</label>
                <input
                  className="admin-form-control"
                  value={banner.link || ''}
                  onChange={(e) => updateBanner(index, 'link', e.target.value)}
                />
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger mt-2"
              onClick={() => setBanners((rows) => rows.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="admin-card p-4 mb-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0">Promotions / Coupon Codes</h3>
          <button
            type="button"
            className="btn btn-sm btn-outline-success"
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
                <label className="admin-form-label">Code</label>
                <input
                  className="admin-form-control text-uppercase"
                  value={promo.code || ''}
                  onChange={(e) => updatePromo(index, 'code', e.target.value.toUpperCase())}
                  placeholder="MMF10"
                />
              </div>
              <div className="col-md-5">
                <label className="admin-form-label">Description</label>
                <input
                  className="admin-form-control"
                  value={promo.description || ''}
                  onChange={(e) => updatePromo(index, 'description', e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label className="admin-form-label">Fixed ($)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  className="admin-form-control"
                  value={promo.discountAmount ?? 0}
                  onChange={(e) => updatePromo(index, 'discountAmount', Number(e.target.value))}
                />
              </div>
              <div className="col-md-2">
                <label className="admin-form-label">Percent (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="admin-form-control"
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
              className="btn btn-sm btn-outline-danger mt-2"
              onClick={() => setPromotions((rows) => rows.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="admin-card p-4 mb-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0">Help Center FAQs</h3>
          <button
            type="button"
            className="btn btn-sm btn-outline-success"
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
                <label className="admin-form-label">Question</label>
                <input
                  className="admin-form-control"
                  value={faq.question || ''}
                  onChange={(e) => updateFaq(index, 'question', e.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label className="admin-form-label">Order</label>
                <input
                  type="number"
                  className="admin-form-control"
                  value={faq.order ?? index + 1}
                  onChange={(e) => updateFaq(index, 'order', Number(e.target.value))}
                />
              </div>
              <div className="col-12">
                <label className="admin-form-label">Answer</label>
                <textarea
                  className="admin-form-control"
                  rows={3}
                  value={faq.answer || ''}
                  onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                />
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger mt-2"
              onClick={() => setFaqs((rows) => rows.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="admin-card p-4 mb-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0">District Delivery Fees</h3>
          <button
            type="button"
            className="btn btn-sm btn-outline-success"
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
          <table className="admin-table w-100">
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
                      className="admin-form-control"
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
                      className="admin-form-control"
                      value={row.fee ?? 0}
                      onChange={(e) => updateDeliveryFee(index, 'fee', e.target.value)}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
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

      <button type="button" className="btn btn-success px-4" onClick={handleSave} disabled={saving}>
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
