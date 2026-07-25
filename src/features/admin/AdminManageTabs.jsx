import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  applicableCategory: '',
  applicableProduct: '',
  durationDays: 0,
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

function cmsImageSrc(path) {
  if (!path) return '';
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('data:')) return path;
  const clean = String(path).trim().replace(/^\/+/, '');
  if (clean.startsWith('uploads/')) {
    const apiBase = import.meta.env.VITE_API_URL || '';
    return `${apiBase}/${clean}`;
  }
  if (clean.startsWith('product-images/')) return `/${clean}`;
  if (/\.(png|jpe?g|gif|webp)$/i.test(clean) && !clean.includes('/')) return `/product-images/${clean}`;
  return path.startsWith('/') ? path : `/${clean}`;
}

function CmsSection({ step, title, hint, children, action }) {
  return (
    <section className={`${ADM_CARD} mb-3 overflow-hidden`}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/[0.05] px-5 py-4 [.admin-dark_&]:border-white/10">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-deepGreen text-[0.7rem] font-extrabold text-white">
              {step}
            </span>
            <h3 className="text-[1.05rem] font-bold text-gray-900 [.admin-dark_&]:text-gray-100">{title}</h3>
          </div>
          {hint && <p className="ms-8 text-[0.78rem] text-gray-500 [.admin-dark_&]:text-gray-400">{hint}</p>}
        </div>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function ImageChooser({ label, value, onChange, previewHeight = 'h-40' }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);
  const preview = cmsImageSrc(value);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showTopFloatNotification('Please choose an image file.', 'danger');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showTopFloatNotification('Image must be 3MB or smaller.', 'danger');
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append('image', file);
      const res = await fetch(apiUrl('/api/cms/upload'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (data.success && (data.path || data.url)) {
        onChange(data.path || data.url);
        showTopFloatNotification('Image uploaded. Click Save CMS to publish.');
      } else {
        showTopFloatNotification(data.message || 'Upload failed.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not upload image. Is the backend running?', 'danger');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className={ADM_LABEL}>{label}</label>
      <div className="overflow-hidden rounded-[12px] border border-black/[0.08] bg-gray-50 [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#141f1b]">
        <div className={`${previewHeight} relative bg-black/[0.03] [.admin-dark_&]:bg-black/20`}>
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-400">
              <i className="fa-regular fa-image text-2xl" />
              <span className="text-[0.75rem]">No image selected</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-black/[0.06] p-3 [.admin-dark_&]:border-white/10">
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFile} />
          <button
            type="button"
            className={BTN_SM_OUTLINE_SUCCESS}
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" /> Uploading…
              </>
            ) : (
              <>
                <i className="fa-solid fa-upload" /> Upload / Choose Image
              </>
            )}
          </button>
          {value && (
            <button type="button" className={BTN_SM_OUTLINE_DANGER} onClick={() => onChange('')} disabled={uploading}>
              Remove
            </button>
          )}
          <p className="w-full text-[0.7rem] text-gray-400">JPG, PNG, or WebP · max 3MB</p>
        </div>
      </div>
    </div>
  );
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
      const res = await fetch(apiUrl('/api/cms/admin'), {
        headers: authHeaders(),
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
      <div className={`${ADM_CARD} p-6`}>
        <p className="mb-0 text-gray-500">
          <i className="fa-solid fa-spinner fa-spin me-2" />
          Loading CMS content…
        </p>
      </div>
    );
  }

  return (
    <div className="animate-cardRise space-y-0 pb-20">
      <div className={`${ADM_CARD} mb-3 p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-xl">
            <h2 className="mb-1 text-[1.25rem] font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
              Site content
            </h2>
            <p className="text-[0.84rem] leading-relaxed text-gray-500">
              Edit what customers see on the storefront. Each section below controls one part of the site.
              Click <strong className="font-bold text-gray-700 [.admin-dark_&]:text-gray-200">Save CMS</strong> when
              finished.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-[10px] border border-black/[0.06] bg-gray-50 px-3 py-2 text-right [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#141f1b]">
              <div className="text-[0.65rem] font-bold uppercase tracking-wide text-gray-400">Last saved</div>
              <div className="text-[0.82rem] font-semibold text-gray-800 [.admin-dark_&]:text-gray-200">
                {formatUpdatedAt(updatedAt)}
              </div>
            </div>
            <Link to="/" target="_blank" className={BTN_SM_OUTLINE_SECONDARY}>
              <i className="fa-solid fa-arrow-up-right-from-square" />
              Preview site
            </Link>
            <button type="button" className={BTN_PRIMARY} onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" /> Saving…
                </>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk" /> Save CMS
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: 'Active offers', value: stats.banners },
            { label: 'Active coupons', value: stats.promos },
            { label: 'FAQs', value: stats.faqs },
            { label: 'Delivery areas', value: stats.districts },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[12px] border border-deepGreen/[0.08] bg-deepGreen/[0.03] px-3 py-2.5 [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-white/[0.03]"
            >
              <p className="text-[0.65rem] font-bold uppercase tracking-wide text-gray-400">{item.label}</p>
              <p className="font-display text-xl font-bold text-deepGreen [.admin-dark_&]:text-emerald-300">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 1 — Hero */}
      <CmsSection
        step={1}
        title="Homepage hero"
        hint="Big first screen on the homepage — title, text, button, and background image."
      >
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-7">
            <div>
              <label className={ADM_LABEL}>Small label (above title)</label>
              <input
                className={ADM_INPUT}
                value={hero.smallTitle || ''}
                onChange={(e) => setHero((h) => ({ ...h, smallTitle: e.target.value }))}
                placeholder="Premium Furniture Collection"
              />
            </div>
            <div>
              <label className={ADM_LABEL}>Main title</label>
              <textarea
                className={ADM_INPUT}
                rows={2}
                value={hero.title || ''}
                onChange={(e) => setHero((h) => ({ ...h, title: e.target.value }))}
                placeholder={'Elevate Your Home\nwith Modern Comfort'}
              />
              <p className="mt-1 text-[0.7rem] text-gray-400">Press Enter for a new line.</p>
            </div>
            <div>
              <label className={ADM_LABEL}>Short description</label>
              <textarea
                className={ADM_INPUT}
                rows={3}
                value={hero.description || ''}
                onChange={(e) => setHero((h) => ({ ...h, description: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={ADM_LABEL}>Button text</label>
                <input
                  className={ADM_INPUT}
                  value={hero.ctaText || ''}
                  onChange={(e) => setHero((h) => ({ ...h, ctaText: e.target.value }))}
                  placeholder="Explore Products"
                />
              </div>
              <div>
                <label className={ADM_LABEL}>Button link</label>
                <input
                  className={ADM_INPUT}
                  value={hero.ctaLink || ''}
                  onChange={(e) => setHero((h) => ({ ...h, ctaLink: e.target.value }))}
                  placeholder="/products"
                />
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <ImageChooser
              label="Hero background image"
              value={hero.image || ''}
              onChange={(path) => setHero((h) => ({ ...h, image: path }))}
              previewHeight="h-52"
            />
          </div>
        </div>
      </CmsSection>

      {/* 2 — Banners / Weekend offers */}
      <CmsSection
        step={2}
        title="Promotional banners & offers"
        hint="Cards like “Weekend Offer” on the homepage. Turn Active on/off per banner."
        action={
          <button
            type="button"
            className={BTN_SM_OUTLINE_SUCCESS}
            onClick={() =>
              setBanners((rows) => [...rows, { ...EMPTY_BANNER, id: newId('banner'), order: rows.length + 1 }])
            }
          >
            <i className="fa-solid fa-plus" /> Add banner
          </button>
        }
      >
        {banners.length === 0 && (
          <p className="text-[0.84rem] text-gray-400">No banners yet. Add one for a homepage offer card.</p>
        )}

        <div className="space-y-4">
          {banners.map((banner, index) => (
            <div
              key={banner.id || index}
              className="rounded-[14px] border border-black/[0.07] p-4 [.admin-dark_&]:border-white/10"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[0.78rem] font-bold text-gray-700 [.admin-dark_&]:text-gray-200">
                  Offer #{index + 1}
                  {banner.title ? ` — ${banner.title}` : ''}
                </p>
                <div className="flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 text-[0.8rem] font-bold text-gray-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-deepGreen"
                      checked={banner.active !== false}
                      onChange={(e) => updateBanner(index, 'active', e.target.checked)}
                    />
                    Active on site
                  </label>
                  <button
                    type="button"
                    className={BTN_SM_OUTLINE_DANGER}
                    onClick={() => setBanners((rows) => rows.filter((_, i) => i !== index))}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-12">
                <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
                  <div className="sm:col-span-2">
                    <label className={ADM_LABEL}>Title</label>
                    <input
                      className={ADM_INPUT}
                      value={banner.title || ''}
                      onChange={(e) => updateBanner(index, 'title', e.target.value)}
                      placeholder="Weekend Offer"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={ADM_LABEL}>Subtitle</label>
                    <input
                      className={ADM_INPUT}
                      value={banner.subtitle || ''}
                      onChange={(e) => updateBanner(index, 'subtitle', e.target.value)}
                      placeholder="Up to 15% off selected sets"
                    />
                  </div>
                  <div>
                    <label className={ADM_LABEL}>Link when clicked</label>
                    <input
                      className={ADM_INPUT}
                      value={banner.link || ''}
                      onChange={(e) => updateBanner(index, 'link', e.target.value)}
                      placeholder="/products"
                    />
                  </div>
                  <div>
                    <label className={ADM_LABEL}>Display order</label>
                    <input
                      type="number"
                      className={ADM_INPUT}
                      value={banner.order ?? index + 1}
                      onChange={(e) => updateBanner(index, 'order', Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="lg:col-span-5">
                  <ImageChooser
                    label="Offer image"
                    value={banner.image || ''}
                    onChange={(path) => updateBanner(index, 'image', path)}
                    previewHeight="h-44"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CmsSection>

      {/* 3 — Coupons */}
      <CmsSection
        step={3}
        title="Coupon codes"
        hint="Codes customers enter at checkout (Cart). Use either a fixed $ amount or a %, not both."
        action={
          <button
            type="button"
            className={BTN_SM_OUTLINE_SUCCESS}
            onClick={() => setPromotions((rows) => [...rows, { ...EMPTY_PROMO, id: newId('promo') }])}
          >
            <i className="fa-solid fa-plus" /> Add coupon
          </button>
        }
      >
        {promotions.length === 0 && (
          <p className="text-[0.84rem] text-gray-400">No coupons yet.</p>
        )}
        <div className="space-y-3">
          {promotions.map((promo, index) => (
            <div
              key={promo.id || index}
              className="rounded-[14px] border border-black/[0.07] p-4 [.admin-dark_&]:border-white/10"
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className={ADM_LABEL}>Code</label>
                  <input
                    className={`${ADM_INPUT} uppercase`}
                    value={promo.code || ''}
                    onChange={(e) => updatePromo(index, 'code', e.target.value.toUpperCase())}
                    placeholder="MMF10"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className={ADM_LABEL}>Description</label>
                  <input
                    className={ADM_INPUT}
                    value={promo.description || ''}
                    onChange={(e) => updatePromo(index, 'description', e.target.value)}
                  />
                </div>
                <div>
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
                <div>
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
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className={ADM_LABEL}>Restricted to Category (Optional)</label>
                  <select
                    className={ADM_INPUT}
                    value={promo.applicableCategory || ''}
                    onChange={(e) => updatePromo(index, 'applicableCategory', e.target.value)}
                  >
                    <option value="">All Categories</option>
                    <option value="chair">Chairs</option>
                    <option value="bedroom">Bedroom</option>
                    <option value="living-room">Living Room</option>
                    <option value="dining-room">Dining Room</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="office">Office</option>
                  </select>
                </div>
                <div>
                  <label className={ADM_LABEL}>Restricted to Product (Optional ID/Title)</label>
                  <input
                    className={ADM_INPUT}
                    value={promo.applicableProduct || ''}
                    placeholder="e.g. 12 or Bloom Chair"
                    onChange={(e) => updatePromo(index, 'applicableProduct', e.target.value)}
                  />
                </div>
                <div>
                  <label className={ADM_LABEL}>Coupon Duration (Days) *0 for unlimited*</label>
                  <input
                    type="number"
                    min="0"
                    className={ADM_INPUT}
                    value={promo.durationDays ?? 0}
                    placeholder="e.g. 7"
                    onChange={(e) => updatePromo(index, 'durationDays', Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-[0.8rem] font-bold text-gray-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-deepGreen"
                    checked={promo.active !== false}
                    onChange={(e) => updatePromo(index, 'active', e.target.checked)}
                  />
                  Active at checkout
                </label>
                <button
                  type="button"
                  className={BTN_SM_OUTLINE_DANGER}
                  onClick={() => setPromotions((rows) => rows.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </CmsSection>

      {/* 4 — FAQs */}
      <CmsSection
        step={4}
        title="Help FAQs"
        hint="Shown in Profile → Help after you save."
        action={
          <button
            type="button"
            className={BTN_SM_OUTLINE_SUCCESS}
            onClick={() =>
              setFaqs((rows) => [...rows, { ...EMPTY_FAQ, id: newId('faq'), order: rows.length + 1 }])
            }
          >
            <i className="fa-solid fa-plus" /> Add FAQ
          </button>
        }
      >
        {faqs.length === 0 && <p className="text-[0.84rem] text-gray-400">No FAQs yet.</p>}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={faq.id || index}
              className="rounded-[14px] border border-black/[0.07] p-4 [.admin-dark_&]:border-white/10"
            >
              <div className="grid gap-3 sm:grid-cols-12">
                <div className="sm:col-span-9">
                  <label className={ADM_LABEL}>Question</label>
                  <input
                    className={ADM_INPUT}
                    value={faq.question || ''}
                    onChange={(e) => updateFaq(index, 'question', e.target.value)}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className={ADM_LABEL}>Order</label>
                  <input
                    type="number"
                    className={ADM_INPUT}
                    value={faq.order ?? index + 1}
                    onChange={(e) => updateFaq(index, 'order', Number(e.target.value))}
                  />
                </div>
                <div className="sm:col-span-12">
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
                className={`${BTN_SM_OUTLINE_DANGER} mt-3`}
                onClick={() => setFaqs((rows) => rows.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </CmsSection>

      {/* 5 — Delivery */}
      <CmsSection
        step={5}
        title="District delivery fees"
        hint="Used at Cart/Checkout. Also editable under Settings → Delivery."
        action={
          <button
            type="button"
            className={BTN_SM_OUTLINE_SUCCESS}
            onClick={() => setDeliveryFees((rows) => [...rows, { district: '', fee: 0.001 }])}
          >
            <i className="fa-solid fa-plus" /> Add district
          </button>
        }
      >
        <div className="overflow-x-auto rounded-[12px] border border-black/[0.07] [.admin-dark_&]:border-white/10">
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
                  <td colSpan={3} className="py-6 text-center text-gray-400">
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
      </CmsSection>

      <div className="sticky bottom-3 z-20 flex justify-end">
        <button type="button" className={`${BTN_PRIMARY} shadow-lg`} onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" /> Saving…
            </>
          ) : (
            <>
              <i className="fa-solid fa-floppy-disk" /> Save CMS Content
            </>
          )}
        </button>
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
  if (status === 'pending') return 'bg-amber-100 text-amber-800 [.admin-dark_&]:bg-amber-500/15 [.admin-dark_&]:text-amber-300';
  if (status === 'approved') return 'bg-emerald-100 text-emerald-800 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300';
  if (status === 'rejected') return 'bg-red-100 text-red-800 [.admin-dark_&]:bg-red-500/15 [.admin-dark_&]:text-red-300';
  return 'bg-gray-100 text-gray-600 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-gray-300';
}

function driverStatusIcon(status) {
  if (status === 'pending') return 'fa-clock';
  if (status === 'approved') return 'fa-circle-check';
  if (status === 'rejected') return 'fa-circle-xmark';
  return 'fa-circle-info';
}

function formatAppliedDate(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DriverApplicationModal({
  applicant,
  rejectReason,
  acting,
  onRejectReasonChange,
  onClose,
  onApprove,
  onReject,
}) {
  useEffect(() => {
    if (!applicant) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !acting) onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [applicant, acting, onClose]);

  if (!applicant || typeof document === 'undefined' || !document.body) return null;

  const da = applicant.driverApplication || {};
  const status = da.status || 'none';
  const isAdminDark = Boolean(document.querySelector('[data-theme="dark"]'));

  return createPortal(
    <div className={isAdminDark ? 'admin-dark' : ''} data-theme={isAdminDark ? 'dark' : 'light'}>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-deepGreen/45 p-4 backdrop-blur-[4px]"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="animate-productModalIn relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_25px_60px_rgba(0,0,0,0.22)] [.admin-dark_&]:bg-[#1a2421]"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="driver-application-title"
        >
          <button
            type="button"
            className="absolute right-[15px] top-[15px] z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 bg-white text-[1.4rem] leading-none text-[#111] shadow-[0_2px_10px_rgba(0,0,0,0.15)] [.admin-dark_&]:bg-[#243029] [.admin-dark_&]:text-gray-200"
            onClick={onClose}
            disabled={acting}
            aria-label="Close"
          >
            ×
          </button>

          <div className="border-b border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
            <div className="flex items-start gap-3 pr-10">
              <img
                className="h-14 w-14 shrink-0 rounded-2xl border-2 border-gold object-cover"
                src={
                  applicant.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(`${applicant.firstName} ${applicant.lastName}`)}&background=073D35&color=D8A128`
                }
                alt=""
              />
              <div className="min-w-0 flex-1">
                <h3 id="driver-application-title" className="mb-0 truncate text-[1.1rem] font-extrabold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
                  {applicant.firstName} {applicant.lastName}
                </h3>
                <p className="mb-0 mt-1 truncate text-[0.8rem] text-gray-500 [.admin-dark_&]:text-gray-400">{applicant.email}</p>
                <p className="mb-0 truncate text-[0.8rem] text-gray-500 [.admin-dark_&]:text-gray-400">{applicant.phone}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[0.72rem] font-extrabold capitalize ${driverStatusClass(status)}`}>
                    <i className={`fa-solid ${driverStatusIcon(status)}`} aria-hidden="true" />
                    {status}
                  </span>
                  <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-[0.72rem] font-bold text-gray-600 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-gray-300">
                    Applied {formatAppliedDate(da.appliedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {status === 'rejected' && da.rejectReason && (
            <div className="border-b border-red-100 bg-red-50 px-5 py-3 [.admin-dark_&]:border-red-500/20 [.admin-dark_&]:bg-red-500/10">
              <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-wide text-red-600 [.admin-dark_&]:text-red-300">
                Reject reason
              </p>
              <p className="mb-0 text-[0.86rem] font-semibold leading-relaxed text-red-800 [.admin-dark_&]:text-red-100">
                {da.rejectReason}
              </p>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 [scrollbar-width:thin]">
            <div className="grid gap-3 rounded-xl border border-gray-100 bg-[#fdfbf8] p-4 sm:grid-cols-2 [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-white/[0.03]">
              <div>
                <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-wide text-gray-400">District</p>
                <p className="mb-0 text-[0.88rem] font-semibold text-gray-800 [.admin-dark_&]:text-gray-100">{da.district || '—'}</p>
              </div>
              <div>
                <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-wide text-gray-400">Vehicle</p>
                <p className="mb-0 text-[0.88rem] font-semibold text-gray-800 [.admin-dark_&]:text-gray-100">
                  {labelFor(da.vehicleType, VEHICLE_TYPES)}
                </p>
              </div>
              <div>
                <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-wide text-gray-400">Availability</p>
                <p className="mb-0 text-[0.88rem] font-semibold text-gray-800 [.admin-dark_&]:text-gray-100">
                  {labelFor(da.availability, AVAILABILITY_OPTIONS)}
                </p>
              </div>
              <div>
                <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-wide text-gray-400">Address</p>
                <p className="mb-0 text-[0.88rem] font-semibold text-gray-800 [.admin-dark_&]:text-gray-100">{applicant.address || '—'}</p>
              </div>
            </div>

            {da.experience && (
              <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4 [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-white/[0.02]">
                <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-wide text-gray-400">Experience</p>
                <p className="mb-0 text-[0.88rem] leading-relaxed text-gray-700 [.admin-dark_&]:text-gray-200">{da.experience}</p>
              </div>
            )}

            {status === 'pending' && (
              <div className="mt-4">
                <label className={ADM_LABEL} htmlFor="rejectReason">
                  Reject reason <span className="font-semibold text-gray-400">(optional)</span>
                </label>
                <input
                  id="rejectReason"
                  className={ADM_INPUT}
                  value={rejectReason}
                  onChange={(e) => onRejectReasonChange(e.target.value)}
                  placeholder="Reason shown to applicant if rejected…"
                  disabled={acting}
                />
              </div>
            )}
          </div>

          {status === 'pending' && (
            <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
              <button type="button" className={BTN_SECONDARY} onClick={onClose} disabled={acting}>
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] border border-red-500 px-5 text-[0.88rem] font-extrabold text-red-600 transition hover:bg-red-50 disabled:opacity-60 [.admin-dark_&]:text-red-400 [.admin-dark_&]:hover:bg-red-500/10"
                disabled={acting}
                onClick={() => onReject(applicant.id)}
              >
                {acting ? 'Rejecting…' : 'Reject'}
              </button>
              <button type="button" className={BTN_PRIMARY} disabled={acting} onClick={() => onApprove(applicant.id)}>
                {acting ? 'Approving…' : 'Approve driver'}
              </button>
            </div>
          )}

          {status !== 'pending' && (
            <div className="flex justify-end border-t border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
              <button type="button" className={BTN_SECONDARY} onClick={onClose}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
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

  const openApplicant = (app) => {
    setRejectReason('');
    setSelected(app);
  };

  const closeModal = () => {
    if (acting) return;
    setSelected(null);
    setRejectReason('');
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
            <table className={`${ADM_TABLE} [&_tbody_tr]:cursor-pointer [&_tbody_tr]:transition-colors`}>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Phone</th>
                  <th>District</th>
                  <th>Vehicle</th>
                  <th>Applied</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const da = app.driverApplication || {};
                  const status = da.status || 'none';
                  return (
                    <tr
                      key={app.id}
                      tabIndex={0}
                      role="button"
                      onClick={() => openApplicant(app)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openApplicant(app);
                        }
                      }}
                      className="hover:bg-deepGreen/[0.03] focus-visible:bg-deepGreen/[0.04] focus-visible:outline-none"
                    >
                      <td className="font-bold">{app.firstName} {app.lastName}</td>
                      <td>{app.phone}</td>
                      <td>{da.district || '—'}</td>
                      <td>{labelFor(da.vehicleType, VEHICLE_TYPES)}</td>
                      <td>{formatAppliedDate(da.appliedAt)}</td>
                      <td>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.72rem] font-extrabold capitalize ${driverStatusClass(status)}`}
                        >
                          <i className={`fa-solid ${driverStatusIcon(status)} text-[0.62rem]`} aria-hidden="true" />
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DriverApplicationModal
        applicant={selected}
        rejectReason={rejectReason}
        acting={acting}
        onRejectReasonChange={setRejectReason}
        onClose={closeModal}
        onApprove={approve}
        onReject={reject}
      />
    </div>
  );
}
