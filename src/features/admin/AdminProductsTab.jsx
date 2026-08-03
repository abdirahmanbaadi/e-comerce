/**
 * ADMIN PRODUCTS TAB — list, filters, add/edit/view modals (Tailwind)
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiUrl, fetchWithTimeout } from '../../utils/data';
import { productImage } from '../../utils/format';
import { showTopFloatNotification } from '../../utils/notifications';
import {
  ADM_TABLE_CARD,
  ADM_TABLE,
  ADM_LABEL,
  ADM_INPUT,
  ADM_SELECT,
  BTN_PRIMARY,
  BTN_GHOST,
  BTN_SUCCESS,
  ADMIN_FETCH_TIMEOUT,
} from './adminShared.js';
import { ProductModalGallery, ProductModalHeroRow, ProductModalSpecsTable, PRODUCT_MODAL_BODY_CLASS, PRODUCT_MODAL_DETAILS_COL_CLASS, PRODUCT_MODAL_GALLERY_COL_CLASS } from '../products/ProductModalGallery';

const PRODUCTS_TABLE_MAX_HEIGHT = 'min(520px, 55vh)';
const MIN_PRODUCT_IMAGES = 3;
const MAX_PRODUCT_IMAGES = 5;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MIN_PRODUCT_PRICE = 0.01;

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

function exportProductsToCSV(rows) {
  if (!rows.length) {
    showTopFloatNotification('No products to export.', 'danger');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'ID,Title,Category,Price,Stock,Status,New Arrival\n';

  rows.forEach((p) => {
    const title = String(p.title || '').replace(/"/g, '""');
    csvContent += `"${p.id}","${title}","${formatCategory(p.category)}","${p.price}","${getStockVal(p)}","${getStatus(p)}","${p.isNewest ? 'Yes' : 'No'}"\n`;
  });

  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csvContent));
  link.setAttribute('download', `MMF_Products_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showTopFloatNotification('Product catalog exported as CSV.');
}

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
  discountPercent: '',
  imageSlots: [],
  coverSlotId: null,
};

function createImageSlot(file = null, existingPath = null) {
  const id = `img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  if (file) {
    return { id, file, preview: URL.createObjectURL(file), existingPath: null };
  }
  return {
    id,
    file: null,
    preview: existingPath ? productImage(existingPath) : '',
    existingPath,
  };
}

function orderImageSlotsWithCover(slots, coverSlotId) {
  if (!slots.length) return [];
  const cover = slots.find((slot) => slot.id === coverSlotId) || slots[0];
  return [cover, ...slots.filter((slot) => slot.id !== cover.id)];
}

function revokeSlotPreview(slot) {
  if (slot?.file && slot.preview?.startsWith('blob:')) {
    URL.revokeObjectURL(slot.preview);
  }
}

function parseOldPriceInput(value) {
  if (value === '' || value == null) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function parseProductPrice(value) {
  const n = Number(value);
  if (Number.isNaN(n) || n < MIN_PRODUCT_PRICE) return null;
  return n;
}

function buildProductFormData(form, orderedSlots) {
  const price = parseProductPrice(form.price);
  const oldPrice = parseOldPriceInput(form.oldPrice);
  const stockVal = Math.max(0, parseInt(form.stockVal, 10) || 0);
  const categoryLabels = Object.fromEntries(FALLBACK_CATEGORIES);
  const label = categoryLabels[form.category] || formatCategory(form.category);
  const materialType = form.materialType;
  const discount =
    oldPrice != null && oldPrice > 0 && oldPrice > price
      ? `${Math.round(((oldPrice - price) / oldPrice) * 100)}% off`
      : '';

  const formData = new FormData();
  formData.append('title', form.title.trim());
  formData.append('category', form.category);
  formData.append('label', label);
  formData.append('materialType', materialType);
  formData.append('materialLabel', materialType.charAt(0).toUpperCase() + materialType.slice(1));
  formData.append('material', form.material.trim());
  formData.append('dimensions', form.dimensions.trim());
  formData.append('description', form.description.trim());
  formData.append('price', String(price));
  if (oldPrice != null) formData.append('oldPrice', String(oldPrice));
  formData.append('discount', discount);
  formData.append('stockVal', String(stockVal));
  formData.append('stock', stockVal > 0 ? 'in-stock' : 'out-of-stock');
  formData.append('color', form.color.trim());
  formData.append('isNewest', String(Boolean(form.isNewest)));
  formData.append('status', form.status);
  formData.append('availability', stockVal > 0 ? 'In Stock' : 'Out of Stock');

  let fileIndex = 0;
  const imagesOrder = orderedSlots.map((slot) => {
    if (slot.file) {
      formData.append('images', slot.file);
      return { type: 'file', index: fileIndex++ };
    }
    return { type: 'path', value: slot.existingPath };
  });
  formData.append('imagesOrder', JSON.stringify(imagesOrder));
  return formData;
}

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

function FormSection({ title, hint, children }) {
  return (
    <section className="border-b border-gray-100 pb-5 last:border-0 last:pb-0 [.admin-dark_&]:border-white/10">
      <div className="mb-3">
        <h4 className="font-display text-[0.95rem] font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">{title}</h4>
        {hint ? <p className="mt-0.5 text-[0.72rem] leading-relaxed text-gray-500 [.admin-dark_&]:text-gray-400">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function ProductImagePicker({ slots, coverSlotId, onAdd, onRemove, onSetCover }) {
  const fileInputRef = useRef(null);
  const canAddMore = slots.length < MAX_PRODUCT_IMAGES;
  const imageCount = slots.length;
  const meetsMinimum = imageCount >= MIN_PRODUCT_IMAGES;

  const handleFiles = (fileList) => {
    if (!fileList?.length) return;
    const room = MAX_PRODUCT_IMAGES - slots.length;
    if (room <= 0) {
      showTopFloatNotification(`Maximum ${MAX_PRODUCT_IMAGES} images allowed.`, 'danger');
      return;
    }

    const accepted = [];
    for (const file of Array.from(fileList)) {
      if (accepted.length >= room) break;
      if (!file.type.startsWith('image/')) continue;
      if (file.size > MAX_IMAGE_BYTES) {
        showTopFloatNotification(`"${file.name}" is too large. Max 2MB per image.`, 'danger');
        continue;
      }
      accepted.push(file);
    }

    if (accepted.length) onAdd(accepted);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-bold ${
              meetsMinimum
                ? 'bg-emerald-100 text-emerald-700 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300'
                : 'bg-amber-100 text-amber-800 [.admin-dark_&]:bg-amber-500/15 [.admin-dark_&]:text-amber-300'
            }`}
          >
            {imageCount}/{MAX_PRODUCT_IMAGES} images
          </span>
          <span className="text-[0.72rem] text-gray-500 [.admin-dark_&]:text-gray-400">
            Min {MIN_PRODUCT_IMAGES} required
          </span>
        </div>
        {canAddMore ? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-deepGreen/20 bg-deepGreen/[0.04] px-3 py-1.5 text-[0.78rem] font-bold text-deepGreen transition hover:bg-deepGreen/[0.08] [.admin-dark_&]:border-emerald-500/25 [.admin-dark_&]:text-emerald-300"
            onClick={() => fileInputRef.current?.click()}
          >
            <i className="fa-solid fa-upload text-[0.72rem]" />
            Upload Images
          </button>
        ) : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div
        className={`grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 ${
          canAddMore ? 'cursor-pointer' : ''
        }`}
        onDragOver={(e) => {
          if (!canAddMore) return;
          e.preventDefault();
        }}
        onDrop={(e) => {
          if (!canAddMore) return;
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => {
          if (canAddMore && slots.length === 0) fileInputRef.current?.click();
        }}
        role="presentation"
      >
        {Array.from({ length: MAX_PRODUCT_IMAGES }).map((_, index) => {
          const slot = slots[index];
          if (!slot) {
            return (
              <button
                key={`empty-${index}`}
                type="button"
                disabled={!canAddMore}
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/80 text-gray-400 transition hover:border-deepGreen/30 hover:bg-deepGreen/[0.03] hover:text-deepGreen disabled:cursor-not-allowed disabled:opacity-40 [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-white/[0.02] [.admin-dark_&]:hover:border-emerald-500/30"
              >
                <i className="fa-solid fa-plus mb-1 text-lg" />
                <span className="text-[0.65rem] font-semibold">Add</span>
              </button>
            );
          }

          const isCover = slot.id === coverSlotId || (!coverSlotId && index === 0);
          return (
            <div
              key={slot.id}
              className={`group relative aspect-square overflow-hidden rounded-xl border-2 bg-gray-100 ${
                isCover
                  ? 'border-deepGreen shadow-[0_0_0_1px_rgba(7,61,53,0.15)] [.admin-dark_&]:border-emerald-400'
                  : 'border-transparent'
              }`}
            >
              <img src={slot.preview} alt="" className="h-full w-full object-cover" />
              {isCover ? (
                <span className="absolute left-1.5 top-1.5 rounded-md bg-deepGreen px-1.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-wide text-white">
                  Shop Cover
                </span>
              ) : null}
              <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
                {!isCover ? (
                  <button
                    type="button"
                    className="flex flex-1 items-center justify-center gap-1 rounded-md bg-white/95 px-1 py-1 text-[0.62rem] font-bold text-deepGreen"
                    onClick={() => onSetCover(slot.id)}
                    title="Set as shop card cover"
                  >
                    <i className="fa-solid fa-star text-[0.58rem]" />
                    Cover
                  </button>
                ) : null}
                <button
                  type="button"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-red-500 text-white"
                  onClick={() => onRemove(slot.id)}
                  aria-label="Remove image"
                >
                  <i className="fa-solid fa-xmark text-[0.72rem]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-2.5 text-[0.72rem] leading-relaxed text-gray-500 [.admin-dark_&]:text-gray-400">
        Upload {MIN_PRODUCT_IMAGES} to {MAX_PRODUCT_IMAGES} images. Click <strong>Cover</strong> on any image to choose
        the one shown on shop product cards.
      </p>
    </div>
  );
}

function ProductFormModal({
  open,
  title,
  form,
  categories,
  saving,
  onChange,
  onClose,
  onSubmit,
  onImagesAdd,
  onImageRemove,
  onSetCover,
}) {
  if (!open) return null;

  const imageReady = form.imageSlots.length >= MIN_PRODUCT_IMAGES;

  return createPortal(
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center bg-deepGreen/45 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-productModalIn flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_25px_60px_rgba(0,0,0,0.22)] dark:bg-[#243029] dark:border-white/14 [.admin-dark_&]:bg-[#243029] [.admin-dark_&]:border-white/14"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="productFormTitle"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4 [.admin-dark_&]:border-white/10">
          <div>
            <h3 id="productFormTitle" className="font-display text-xl font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
              {title}
            </h3>
            <p className="mt-0.5 text-[0.75rem] text-gray-500 [.admin-dark_&]:text-gray-400">
              Fill in product details and upload at least {MIN_PRODUCT_IMAGES} images.
            </p>
          </div>
          <button type="button" className="text-2xl text-gray-500 hover:text-gray-800 [.admin-dark_&]:hover:text-gray-200" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={onSubmit}>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <FormSection title="Basic information">
              <div className="space-y-3">
                <div>
                  <label className={ADM_LABEL} htmlFor="admProdTitle">Product Title *</label>
                  <input
                    id="admProdTitle"
                    className={ADM_INPUT}
                    required
                    value={form.title}
                    onChange={(e) => onChange('title', e.target.value)}
                    placeholder="e.g. Bloom Office Chair"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              </div>
            </FormSection>

            <FormSection title="Pricing">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className={ADM_LABEL} htmlFor="admProdOld">Old Price ($)</label>
                  <input
                    id="admProdOld"
                    type="number"
                    min="0"
                    step="0.01"
                    className={ADM_INPUT}
                    value={form.oldPrice ?? ''}
                    onChange={(e) => onChange('oldPrice', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className={ADM_LABEL} htmlFor="admProdDiscount">Discount (%)</label>
                  <input id="admProdDiscount" type="number" min="0" max="100" className={ADM_INPUT} value={form.discountPercent || ''} placeholder="e.g. 50" onChange={(e) => onChange('discountPercent', e.target.value)} />
                </div>
                <div>
                  <label className={ADM_LABEL} htmlFor="admProdPrice">Current Price ($) *</label>
                  <input id="admProdPrice" type="number" min="0.01" step="0.01" className={ADM_INPUT} required value={form.price || ''} onChange={(e) => onChange('price', e.target.value)} />
                </div>
              </div>
            </FormSection>

            <FormSection title="Inventory & status">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className={ADM_LABEL} htmlFor="admProdColor">Color Tone *</label>
                  <input id="admProdColor" className={ADM_INPUT} required value={form.color} onChange={(e) => onChange('color', e.target.value)} />
                </div>
                <div>
                  <label className={ADM_LABEL} htmlFor="admProdStock">Stock Quantity *</label>
                  <input id="admProdStock" type="number" min="0" className={ADM_INPUT} required value={form.stockVal} onChange={(e) => onChange('stockVal', e.target.value)} />
                </div>
                <div>
                  <label className={ADM_LABEL} htmlFor="admProdStatus">Catalog Status *</label>
                  <select id="admProdStatus" className={ADM_SELECT} value={form.status} onChange={(e) => onChange('status', e.target.value)}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <label className="mt-3 flex cursor-pointer items-center gap-2 text-[0.88rem] font-bold text-gray-700 [.admin-dark_&]:text-gray-300">
                <input type="checkbox" className="h-4 w-4 accent-deepGreen" checked={form.isNewest} onChange={(e) => onChange('isNewest', e.target.checked)} />
                Mark as New Arrival
              </label>
            </FormSection>

            <FormSection title="Description & specs">
              <div className="space-y-3">
                <div>
                  <label className={ADM_LABEL} htmlFor="admProdDesc">Product Description</label>
                  <textarea id="admProdDesc" rows={3} className={ADM_INPUT} value={form.description} onChange={(e) => onChange('description', e.target.value)} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className={ADM_LABEL} htmlFor="admProdMatSpec">Material Details *</label>
                    <input id="admProdMatSpec" className={ADM_INPUT} required value={form.material} onChange={(e) => onChange('material', e.target.value)} />
                  </div>
                  <div>
                    <label className={ADM_LABEL} htmlFor="admProdDim">Dimensions (Optional)</label>
                    <input id="admProdDim" className={ADM_INPUT} value={form.dimensions} onChange={(e) => onChange('dimensions', e.target.value)} />
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Product images *"
              hint={`Upload ${MIN_PRODUCT_IMAGES} to ${MAX_PRODUCT_IMAGES} images. The cover image appears on shop cards.`}
            >
              <ProductImagePicker
                slots={form.imageSlots}
                coverSlotId={form.coverSlotId}
                onAdd={onImagesAdd}
                onRemove={onImageRemove}
                onSetCover={onSetCover}
              />
            </FormSection>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-100 px-6 py-4 [.admin-dark_&]:border-white/10">
            <p className={`text-[0.72rem] font-semibold ${imageReady ? 'text-emerald-600' : 'text-amber-600'}`}>
              {imageReady ? 'Ready to save' : `Add ${MIN_PRODUCT_IMAGES - form.imageSlots.length} more image(s)`}
            </p>
            <div className="flex gap-2">
              <button type="button" className={BTN_GHOST} onClick={onClose}>Cancel</button>
              <button type="submit" className={BTN_PRIMARY} disabled={saving || !imageReady}>
                {saving ? 'Saving…' : 'Save Product'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function formatMaterialType(value) {
  if (!value) return '—';
  return String(value)
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatProductDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function DetailMetaField({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[0.65rem] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <div className="mt-1 text-[0.86rem] font-semibold text-gray-900 [.admin-dark_&]:text-gray-100">{children}</div>
    </div>
  );
}

function ProductDetailStat({ label, value, icon, tone = 'default', onClick }) {
  const tones = {
    default: 'bg-deepGreen/[0.06] text-deepGreen [.admin-dark_&]:text-emerald-300',
    amber: 'bg-amber-500/10 text-amber-700 [.admin-dark_&]:text-amber-300',
    blue: 'bg-blue-500/10 text-blue-700 [.admin-dark_&]:text-blue-300',
    red: 'bg-red-500/10 text-red-700 [.admin-dark_&]:text-red-300',
  };
  const className = [
    'w-full rounded-xl border border-black/[0.06] bg-white px-3 py-2.5 text-left transition',
    'hover:-translate-y-px hover:border-deepGreen/15 hover:shadow-[0_4px_14px_rgba(7,61,53,0.08)]',
    'cursor-pointer active:scale-[0.99]',
    '[.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#141f1b]',
  ].join(' ');

  return (
    <button type="button" className={className} onClick={onClick}>
      <div className="mb-1 flex items-center gap-1.5">
        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-[0.65rem] ${tones[tone] || tones.default}`}>
          <i className={`fa-solid ${icon}`} aria-hidden="true" />
        </span>
        <p className="text-[0.62rem] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      </div>
      <p className="font-display text-[1.05rem] font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">{value}</p>
    </button>
  );
}

function AdminRatingStars({ rating, size = '0.95rem' }) {
  const full = Math.floor(Number(rating) || 0);
  const half = (Number(rating) || 0) - full >= 0.5;
  return (
    <span className="inline-flex gap-0.5 text-amber-500" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={`fa-solid ${star <= full ? 'fa-star' : star === full + 1 && half ? 'fa-star-half-stroke' : 'fa-star text-gray-300'}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function buildStarBreakdown(reviews = []) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    if (r.status && r.status !== 'approved') return;
    const n = Math.min(5, Math.max(1, Number(r.rating) || 0));
    if (n >= 1) counts[n] += 1;
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { counts, total };
}

function ProductStatSubModal({ open, title, onClose, children, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined' || !document.body) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`animate-productModalIn w-full ${maxWidth} overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] [.admin-dark_&]:border-white/10 dark:bg-[#243029] dark:border-white/14 [.admin-dark_&]:bg-[#243029] [.admin-dark_&]:border-white/14`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3 [.admin-dark_&]:border-white/10">
          <h4 className="m-0 text-[0.92rem] font-bold text-deepGreen [.admin-dark_&]:text-emerald-300">{title}</h4>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 [.admin-dark_&]:hover:bg-white/10"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="max-h-[min(60vh,420px)] overflow-y-auto p-4 [scrollbar-width:thin]">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function RecentReviewsList({ reviews }) {
  if (!reviews.length) {
    return <p className="m-0 text-[0.84rem] text-gray-400">No reviews yet.</p>;
  }
  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <li key={r.id} className="border-b border-black/[0.04] pb-3 last:border-0 [.admin-dark_&]:border-white/[0.06]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="m-0 truncate text-[0.84rem] font-bold text-gray-900 [.admin-dark_&]:text-gray-100">
                {r.userName || 'Customer'}
              </p>
              <p className="m-0 mt-0.5 text-[0.72rem] text-gray-400">{formatProductDate(r.createdAt)}</p>
            </div>
            <AdminRatingStars rating={r.rating || 0} size="0.72rem" />
          </div>
          {r.comment && (
            <p className="m-0 mt-1.5 text-[0.8rem] leading-relaxed text-gray-600 [.admin-dark_&]:text-gray-300">
              {r.comment}
            </p>
          )}
          {r.status && r.status !== 'approved' && (
            <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[0.62rem] font-bold uppercase text-amber-800">
              {r.status}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function RecentOrdersTable({ orders }) {
  if (!orders.length) {
    return <p className="m-0 text-[0.84rem] text-gray-400">No orders for this product yet.</p>;
  }
  return (
    <table className="w-full border-collapse text-left text-[0.8rem]">
      <thead>
        <tr className="text-[0.62rem] font-extrabold uppercase tracking-wide text-gray-400">
          <th className="pb-2">Order</th>
          <th className="pb-2">Customer</th>
          <th className="pb-2">Payment</th>
          <th className="pb-2 text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o.id} className="border-t border-black/[0.04] [.admin-dark_&]:border-white/[0.06]">
            <td className="py-2 font-mono text-[0.76rem] font-bold text-deepGreen">{o.id}</td>
            <td className="py-2 text-gray-700 [.admin-dark_&]:text-gray-200">{o.customer}</td>
            <td className="py-2 text-gray-500">{o.payment || '—'}</td>
            <td className="py-2 text-right font-bold text-gray-900 [.admin-dark_&]:text-gray-100">
              {formatAdminPrice(Number(String(o.amount).replace(/[^0-9.]/g, '')) || 0)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ProductDetailsSkeleton() {
  return (
    <div className="animate-pulse">
      <ProductModalHeroRow
      gallery={
        <div className={PRODUCT_MODAL_GALLERY_COL_CLASS}>
          <div className="mb-3 h-[300px] rounded-[14px] border border-black/[0.05] bg-white md:h-[390px] [.admin-dark_&]:bg-[#141f1b]" />
          <div className="flex gap-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[74px] w-[74px] rounded-lg bg-white [.admin-dark_&]:bg-[#141f1b]" />
            ))}
          </div>
        </div>
      }
      details={
        <div className={`${PRODUCT_MODAL_DETAILS_COL_CLASS} space-y-3`}>
          <div className="h-8 w-2/3 rounded bg-gray-100 [.admin-dark_&]:bg-white/5" />
          <div className="h-4 w-1/3 rounded bg-gray-100 [.admin-dark_&]:bg-white/5" />
          <div className="h-20 rounded bg-gray-100 [.admin-dark_&]:bg-white/5" />
        </div>
      }
    />
    </div>
  );
}

/* ═══ PRODUCT DETAILS MODAL ═══ */

function ProductDetailsModal({
  open,
  loading,
  data,
  listProduct,
  acting,
  onClose,
  onEdit,
  onDelete,
  onToggleStatus,
}) {
  const [statPanel, setStatPanel] = useState(null);

  useEffect(() => {
    if (open) {
      setStatPanel(null);
    }
  }, [open, listProduct?.id, data?.product?.id]);

  const p = data?.product || listProduct;
  const stats = data?.stats || {};
  const recentReviews = data?.recentReviews || [];
  const recentOrders = data?.recentOrders || [];

  const status = p ? getStatus(p) : 'Active';
  const isActive = status === 'Active';
  const stockVal = stats.stockVal ?? (p ? getStockVal(p) : 0);
  const inStock = stockVal > 0;

  const handleStatusSelect = (e) => {
    const nextActive = e.target.value === 'true';
    if (nextActive === isActive || !p) return;
    onToggleStatus?.(p);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined' || !document.body) return null;

  const isAdminDark =
    typeof document !== 'undefined' && Boolean(document.querySelector('[data-theme="dark"]'));

  const oldPrice = Number(p?.oldPrice);
  const hasDiscount = oldPrice > 0 && oldPrice > Number(p?.price);
  const discountLabel =
    p?.discount ||
    (hasDiscount ? `${Math.round(((oldPrice - Number(p.price)) / oldPrice) * 100)}% off` : '');

  const stockLabel =
    stockVal <= 0 ? 'Out of stock' : stats.lowStock ? `Low stock (${stockVal})` : `${stockVal} units`;

  const avgRating = stats.avgRating ?? p?.rating ?? 0;
  const starBreakdown = buildStarBreakdown(recentReviews);

  return createPortal(
    <div className={isAdminDark ? 'admin-dark' : ''} data-theme={isAdminDark ? 'dark' : 'light'}>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-deepGreen/45 p-4 backdrop-blur-[4px]"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="animate-productModalIn relative flex max-h-[92vh] w-full max-w-[930px] flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_25px_60px_rgba(0,0,0,0.22)] dark:bg-[#243029] dark:border-white/14 [.admin-dark_&]:bg-[#243029] [.admin-dark_&]:border-white/14"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="productDetailTitle"
        >
          <button
            type="button"
            className="absolute right-[15px] top-[15px] z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 bg-white text-[1.4rem] leading-none text-[#111] shadow-[0_2px_10px_rgba(0,0,0,0.15)] [.admin-dark_&]:bg-[#243029] [.admin-dark_&]:text-gray-200"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
            {loading && !p ? (
              <div className={PRODUCT_MODAL_BODY_CLASS}>
                <ProductDetailsSkeleton />
              </div>
            ) : p ? (
              <>
                <div className={PRODUCT_MODAL_BODY_CLASS}>
                  <ProductModalHeroRow
                    gallery={<ProductModalGallery images={p.images} title={p.title} resetKey={p.id} />}
                    details={
                      <div className={PRODUCT_MODAL_DETAILS_COL_CLASS}>
                    <h2
                      id="productDetailTitle"
                      className="mb-2 pr-8 font-display text-[1.75rem] font-bold leading-[1.15] text-deepGreen md:text-[2.15rem] [.admin-dark_&]:text-[#e8f0ed]"
                    >
                      {p.title}
                    </h2>

                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <AdminRatingStars rating={avgRating} />
                      <span className="text-[0.85rem] text-[#666666] [.admin-dark_&]:text-gray-400">
                        {avgRating} rating
                        {(stats.reviewCount ?? 0) > 0
                          ? ` · ${stats.reviewCount} review${stats.reviewCount === 1 ? '' : 's'}`
                          : ''}
                      </span>
                    </div>

                    {p.id != null && (
                      <p className="mb-3 font-mono text-[0.76rem] font-semibold text-gray-400">
                        ID #{p.id}
                      </p>
                    )}

                    <div className="mb-3 flex flex-wrap gap-2">
                      <span
                        className={`inline-flex rounded-md px-2.5 py-1 text-[0.72rem] font-bold ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-700 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300'
                            : 'bg-red-100 text-red-600 [.admin-dark_&]:bg-red-500/15 [.admin-dark_&]:text-red-300'
                        }`}
                      >
                        {status}
                      </span>
                      {p.isNewest && (
                        <span className="inline-flex rounded-md bg-blue-100 px-2.5 py-1 text-[0.72rem] font-bold text-blue-700 [.admin-dark_&]:bg-blue-500/15 [.admin-dark_&]:text-blue-300">
                          New Arrival
                        </span>
                      )}
                      {stats.lowStock && stockVal > 0 && (
                        <span className="inline-flex rounded-md bg-amber-100 px-2.5 py-1 text-[0.72rem] font-bold text-amber-800 [.admin-dark_&]:bg-amber-500/15 [.admin-dark_&]:text-amber-300">
                          Low Stock
                        </span>
                      )}
                      {stockVal <= 0 && (
                        <span className="inline-flex rounded-md bg-red-100 px-2.5 py-1 text-[0.72rem] font-bold text-red-700 [.admin-dark_&]:bg-red-500/15 [.admin-dark_&]:text-red-300">
                          Out of Stock
                        </span>
                      )}
                    </div>

                    {discountLabel && (
                      <span className="mb-1 inline-block rounded-md bg-red-500/10 px-2 py-0.5 text-[0.68rem] font-bold text-red-600 [.admin-dark_&]:text-red-300">
                        {discountLabel}
                      </span>
                    )}
                    <div className="mb-3 text-[1.55rem] font-extrabold text-[#111111] [.admin-dark_&]:text-gray-100">
                      {formatAdminPrice(p.price)}
                    </div>

                    <p className="mb-4 text-[0.9rem] leading-relaxed text-[#555555] [.admin-dark_&]:text-gray-300">
                      {p.description?.trim() ||
                        'Crafted with premium materials and modern detail, designed to bring comfort, beauty, and long-lasting quality to your home.'}
                    </p>

                    <ProductModalSpecsTable
                      material={p.material}
                      color={p.color}
                      dimensions={p.dimensions}
                      availability={p.availability || (inStock ? 'In Stock' : 'Out of Stock')}
                      inStock={inStock}
                    />
                      </div>
                    }
                  />
                </div>

                <div className={`${PRODUCT_MODAL_BODY_CLASS} pt-0`}>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <ProductDetailStat
                    label="Orders"
                    value={stats.totalOrders ?? 0}
                    icon="fa-bag-shopping"
                    tone="blue"
                    onClick={() => setStatPanel('orders')}
                  />
                  <ProductDetailStat
                    label="Rating"
                    value={`${avgRating} ★`}
                    icon="fa-star"
                    tone="amber"
                    onClick={() => setStatPanel('rating')}
                  />
                  <ProductDetailStat
                    label="Reviews"
                    value={stats.reviewCount ?? 0}
                    icon="fa-comment-dots"
                    onClick={() => setStatPanel('reviews')}
                  />
                  <ProductDetailStat
                    label="Popularity"
                    value={p.popularity ?? 0}
                    icon="fa-chart-line"
                    onClick={() => setStatPanel('popularity')}
                  />
                </div>

                <div className="mt-5 border-t border-black/[0.06] pt-5 [.admin-dark_&]:border-white/10">
                  <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-wide text-gray-400">
                    Product specifications
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                    <DetailMetaField label="Category">
                      <span>{formatCategory(p.category)}</span>
                    </DetailMetaField>
                    <DetailMetaField label="Catalog label">
                      <span>{p.label || formatCategory(p.category)}</span>
                    </DetailMetaField>
                    <DetailMetaField label="Material type">
                      <span>{p.materialLabel || formatMaterialType(p.materialType)}</span>
                    </DetailMetaField>
                    <DetailMetaField label="Material">
                      <span>{p.material || '—'}</span>
                    </DetailMetaField>
                    <DetailMetaField label="Color">
                      <span>{p.color || '—'}</span>
                    </DetailMetaField>
                    <DetailMetaField label="Dimensions">
                      <span>{p.dimensions?.trim() || '—'}</span>
                    </DetailMetaField>
                    <DetailMetaField label="Stock">
                      <span>{stockLabel}</span>
                    </DetailMetaField>
                    <DetailMetaField label="Availability">
                      <span>{p.availability || (stockVal > 0 ? 'In Stock' : 'Out of Stock')}</span>
                    </DetailMetaField>
                    <DetailMetaField label="Catalog status">
                      <select
                        className={`${ADM_SELECT} !py-1.5 text-[0.82rem]`}
                        value={isActive ? 'true' : 'false'}
                        disabled={acting}
                        onChange={handleStatusSelect}
                        aria-label="Catalog status"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </DetailMetaField>
                    <DetailMetaField label="Added">
                      <span>{formatProductDate(p.createdAt)}</span>
                    </DetailMetaField>
                    <DetailMetaField label="Last updated">
                      <span>{formatProductDate(p.updatedAt)}</span>
                    </DetailMetaField>
                    <DetailMetaField label="Pending reviews">
                      <span>{stats.pendingReviews ?? 0}</span>
                    </DetailMetaField>
                  </div>
                </div>
                </div>

                <ProductStatSubModal
                  open={statPanel === 'orders'}
                  title={`Recent Orders (${stats.totalOrders ?? 0})`}
                  onClose={() => setStatPanel(null)}
                  maxWidth="max-w-lg"
                >
                  <RecentOrdersTable orders={recentOrders} />
                </ProductStatSubModal>

                <ProductStatSubModal
                  open={statPanel === 'reviews'}
                  title={`Reviews (${stats.reviewCount ?? 0})`}
                  onClose={() => setStatPanel(null)}
                >
                  <RecentReviewsList reviews={recentReviews} />
                </ProductStatSubModal>

                <ProductStatSubModal
                  open={statPanel === 'rating'}
                  title="Rating Breakdown"
                  onClose={() => setStatPanel(null)}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <AdminRatingStars rating={avgRating} size="1.2rem" />
                    <div>
                      <p className="m-0 font-display text-[1.5rem] font-bold text-deepGreen [.admin-dark_&]:text-emerald-300">
                        {avgRating}
                      </p>
                      <p className="m-0 text-[0.72rem] text-gray-400">
                        {stats.reviewCount ?? 0} approved review{(stats.reviewCount ?? 0) === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = starBreakdown.counts[star] || 0;
                      const pct = starBreakdown.total ? Math.round((count / starBreakdown.total) * 100) : 0;
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="w-8 shrink-0 text-[0.75rem] font-bold text-gray-500">{star} ★</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 [.admin-dark_&]:bg-white/10">
                            <div
                              className="h-full rounded-full bg-amber-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-10 shrink-0 text-right text-[0.72rem] font-semibold text-gray-500">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {starBreakdown.total === 0 && (
                    <p className="mt-3 text-[0.8rem] text-gray-400">No approved reviews to show breakdown yet.</p>
                  )}
                </ProductStatSubModal>

                <ProductStatSubModal
                  open={statPanel === 'popularity'}
                  title="Popularity"
                  onClose={() => setStatPanel(null)}
                >
                  <p className="m-0 font-display text-[2rem] font-bold text-deepGreen [.admin-dark_&]:text-emerald-300">
                    {p.popularity ?? 0}
                  </p>
                  <p className="mt-2 text-[0.84rem] leading-relaxed text-gray-600 [.admin-dark_&]:text-gray-300">
                    Popularity score is based on sales activity and customer interest. Higher scores appear more
                    prominently in store listings.
                  </p>
                </ProductStatSubModal>
              </>
            ) : null}
          </div>

          {p && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.06] bg-gray-50/80 px-6 py-3.5 [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#141f1b]">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-[0.8rem] font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50 [.admin-dark_&]:hover:bg-red-500/10"
                disabled={acting}
                onClick={() => onDelete?.(p)}
              >
                <i className="fa-regular fa-trash-can text-[0.75rem]" />
                Delete
              </button>
              <button type="button" className={BTN_PRIMARY} disabled={acting} onClick={() => onEdit?.(p)}>
                <i className="fa-regular fa-pen-to-square" />
                Edit Product
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function ProductsStatCard({ label, value, icon, iconWrapClass, active, onClick }) {
  const className = [
    'group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all duration-300',
    active
      ? 'border-deepGreen/20 bg-deepGreen/[0.04] shadow-[0_6px_20px_rgba(7,61,53,0.08)]'
      : 'border-deepGreen/[0.06] bg-white hover:-translate-y-px hover:border-deepGreen/12 hover:shadow-[0_6px_20px_rgba(7,61,53,0.07)]',
    'cursor-pointer active:scale-[0.99]',
    '[.admin-dark_&]:border-white/[0.08] dark:bg-[#1a2421] [.admin-dark_&]:bg-[#1a2421] [.admin-dark_&]:hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)]',
    active ? '[.admin-dark_&]:border-emerald-500/25 [.admin-dark_&]:bg-emerald-500/10' : '',
  ].join(' ');

  return (
    <button type="button" className={className} onClick={onClick}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconWrapClass}`}>
        <i className={`fa-solid ${icon} text-[0.9rem]`} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-[0.65rem] font-semibold uppercase tracking-wide text-gray-400 [.admin-dark_&]:text-gray-500">
          {label}
        </p>
        <p className="font-display text-[1.15rem] font-bold leading-tight text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
          {value}
        </p>
      </div>
      <i
        className="fa-solid fa-chevron-right shrink-0 text-[0.55rem] text-gray-300 transition group-hover:text-deepGreen [.admin-dark_&]:text-gray-600 [.admin-dark_&]:group-hover:text-emerald-300"
        aria-hidden="true"
      />
    </button>
  );
}

function ProductsFilterToolbar({
  filterCategory,
  categoryOptions,
  filterNewArrivals,
  onCategoryChange,
  onAddProduct,
  onExport,
  onToggleNewArrivals,
}) {
  const quickBtnClass =
    'inline-flex items-center gap-2 rounded-lg border border-deepGreen/[0.08] bg-[#fdfbf8] px-3 py-1.5 text-[0.76rem] font-semibold text-deepGreen transition hover:border-deepGreen/15 hover:bg-white hover:shadow-[0_2px_8px_rgba(7,61,53,0.06)] [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-white/[0.04] [.admin-dark_&]:text-[#e8f0ed]';

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-deepGreen/[0.06] bg-white px-3 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.03)] [.admin-dark_&]:border-white/[0.08] dark:bg-[#1a2421] [.admin-dark_&]:bg-[#1a2421]">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="me-1 text-[0.65rem] font-bold uppercase tracking-wide text-gray-400">Quick</span>
        <button type="button" onClick={onAddProduct} className={quickBtnClass}>
          <i className="fa-solid fa-plus text-[0.72rem] text-gold" aria-hidden="true" />
          Add Product
        </button>
        <button
          type="button"
          onClick={onToggleNewArrivals}
          className={[
            quickBtnClass,
            filterNewArrivals ? 'border-deepGreen/20 bg-deepGreen/[0.06] shadow-sm' : '',
          ].join(' ')}
        >
          <i className="fa-solid fa-star text-[0.72rem] text-gold" aria-hidden="true" />
          New Arrivals
        </button>
      </div>

      <span
        className="hidden h-5 w-px shrink-0 bg-gray-200 sm:inline [.admin-dark_&]:bg-white/10"
        aria-hidden="true"
      />

      <div className="flex items-center gap-1.5">
        <span className="text-[0.62rem] font-bold uppercase tracking-wide text-gray-400">Category</span>
        <select
          id="admProdCategoryFilter"
          className={`${ADM_SELECT} !min-h-0 w-auto min-w-[10rem] !py-1 !pl-2 !pr-7 !text-[0.68rem] !font-semibold`}
          value={filterCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          aria-label="Filter by category"
        >
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <button
          type="button"
          className={`${BTN_SUCCESS} !min-h-0 shrink-0 !px-3 !py-1.5 !text-[0.72rem]`}
          onClick={onExport}
        >
          <i className="fa-solid fa-download text-[0.7rem]" aria-hidden="true" />
          Export
        </button>
      </div>
    </div>
  );
}

/* ═══ MAIN TAB ═══ */

export default function AdminProductsTab({ headerSearch = '' }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterNewArrivals, setFilterNewArrivals] = useState(false);
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [actingId, setActingId] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formTitle, setFormTitle] = useState('Add New Product');
  const [saving, setSaving] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsData, setDetailsData] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const searchQuery = headerSearch.toLowerCase().trim();

  const token = () => localStorage.getItem('token');
  const productAuthHeaders = (multipart = false) => ({
    ...(multipart ? {} : { 'Content-Type': 'application/json' }),
    Authorization: `Bearer ${token()}`,
  });

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/categories/all'), { headers: productAuthHeaders() });
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
      const res = await fetchWithTimeout(apiUrl('/api/products'), {}, ADMIN_FETCH_TIMEOUT);
      const data = await res.json();
      if (data.success) setProducts(data.products || []);
    } catch {
      showTopFloatNotification('Failed to load products.', 'danger');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  const openAdd = useCallback(() => {
    setForm({ ...EMPTY_FORM, stockVal: 10, imageSlots: [], coverSlotId: null });
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
    const onFilter = (e) => {
      const title = e.detail?.title;
      const productId = e.detail?.productId;
      const q = title || (productId ? String(productId) : '');
      if (q) {
        window.applyAdminHeaderSearch?.(q, 'products');
        window.dispatchEvent(new CustomEvent('admin-header-search-sync'));
      }
    };
    window.addEventListener('admin-products-invalidate', onInvalidate);
    window.addEventListener('admin-products-open-add', onOpenAdd);
    window.addEventListener('admin-products-filter', onFilter);
    return () => {
      window.removeEventListener('admin-products-invalidate', onInvalidate);
      window.removeEventListener('admin-products-open-add', onOpenAdd);
      window.removeEventListener('admin-products-filter', onFilter);
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

      const status = getStatus(p);
      const matchStatus = filterStatus === 'all' || status.toLowerCase() === filterStatus.toLowerCase();
      const matchNew = !filterNewArrivals || Boolean(p.isNewest);
      const stockVal = getStockVal(p);
      const matchLowStock = !filterLowStock || (stockVal > 0 && stockVal <= 5);

      return matchQuery && matchCategory && matchStatus && matchNew && matchLowStock;
    });
  }, [products, searchQuery, filterCategory, filterStatus, filterNewArrivals, filterLowStock]);

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'All Categories' },
      ...categories.map(([slug, name]) => ({ value: slug, label: name })),
    ],
    [categories]
  );

  const productStats = useMemo(() => {
    let active = 0;
    let inactive = 0;
    let lowStock = 0;
    products.forEach((p) => {
      const status = getStatus(p);
      const stockVal = getStockVal(p);
      if (status === 'Active') active += 1;
      else inactive += 1;
      if (stockVal > 0 && stockVal <= 5) lowStock += 1;
    });
    return { total: products.length, active, inactive, lowStock };
  }, [products]);

  const activeStatKey = filterLowStock
    ? 'lowStock'
    : filterStatus === 'all'
      ? 'total'
      : filterStatus === 'Active'
        ? 'active'
        : filterStatus === 'Inactive'
          ? 'inactive'
          : null;

  const closeDetails = () => {
    setDetailsOpen(false);
    setDetailsData(null);
    setSelectedProduct(null);
  };

  const openEdit = (product) => {
    const oldPriceNum = Number(product.oldPrice);
    const priceNum = Number(product.price);
    const discountPercent = oldPriceNum && oldPriceNum > priceNum
      ? Math.round(((oldPriceNum - priceNum) / oldPriceNum) * 100)
      : '';

    const imagePaths = (product.images || []).slice(0, MAX_PRODUCT_IMAGES);
    const imageSlots = imagePaths.map((path) => createImageSlot(null, path));
    const coverSlotId = imageSlots[0]?.id || null;

    setForm({
      id: product.id,
      title: product.title || '',
      category: product.category || 'chair',
      materialType: product.materialType || 'wood',
      price: product.price ?? '',
      oldPrice: product.oldPrice != null ? product.oldPrice : '',
      discountPercent: discountPercent,
      color: product.color || '',
      stockVal: getStockVal(product),
      status: getStatus(product),
      isNewest: Boolean(product.isNewest),
      description: product.description || '',
      material: product.material || '',
      dimensions: product.dimensions || '',
      imageSlots,
      coverSlotId,
    });
    setFormTitle(`Edit Product: ${product.title}`);
    setFormOpen(true);
  };

  const openView = async (product) => {
    const item = typeof product === 'object' ? product : products.find((p) => p.id === product);
    if (!item) return;

    setSelectedProduct(item);
    setDetailsOpen(true);
    setDetailsLoading(true);
    setDetailsData(null);
    try {
      const res = await fetch(apiUrl(`/api/products/${item.id}/details`), {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) {
        setDetailsData(data);
        if (data.product) setSelectedProduct((prev) => ({ ...prev, ...data.product }));
      } else {
        showTopFloatNotification(data.message || 'Failed to load product.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not load product details.', 'danger');
    } finally {
      setDetailsLoading(false);
    }
  };

  const toggleProductStatus = async (product) => {
    const current = getStatus(product);
    const nextStatus = current === 'Active' ? 'Inactive' : 'Active';
    const stockVal = getStockVal(product);

    setActingId(product.id);
    try {
      const res = await fetch(apiUrl(`/api/products/${product.id}`), {
        method: 'PUT',
        headers: productAuthHeaders(),
        body: JSON.stringify({
          ...product,
          status: nextStatus,
          stockVal,
          stock: stockVal > 0 ? 'in-stock' : 'out-of-stock',
          availability: stockVal > 0 ? 'In Stock' : 'Out of Stock',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification(`Product marked as ${nextStatus}.`);
        loadProducts({ quiet: true });
        window.dispatchEvent(new CustomEvent('admin-products-invalidate'));
        setSelectedProduct((prev) => (prev?.id === product.id ? { ...prev, status: nextStatus } : prev));
        setDetailsData((prev) =>
          prev?.product?.id === product.id
            ? { ...prev, product: { ...prev.product, status: nextStatus } }
            : prev
        );
      } else {
        showTopFloatNotification(data.message || 'Update failed.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not connect to server.', 'danger');
    } finally {
      setActingId('');
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Are you sure you want to delete product '${product.title}'?`)) return;

    setActingId(product.id);
    try {
      const res = await fetch(apiUrl(`/api/products/${product.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('Product deleted successfully.');
        closeDetails();
        setFormOpen(false);
        loadProducts({ quiet: true });
        window.dispatchEvent(new CustomEvent('admin-products-invalidate'));
      } else {
        showTopFloatNotification(data.message || 'Delete failed.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not connect to server.', 'danger');
    } finally {
      setActingId('');
    }
  };

  const handleFormChange = (field, value) => {
    setForm((f) => {
      const updated = { ...f, [field]: value };
      
      if (field === 'oldPrice' || field === 'discountPercent') {
        const oldP = Number(field === 'oldPrice' ? value : f.oldPrice);
        const pct = Number(field === 'discountPercent' ? value : f.discountPercent);
        if (oldP > 0 && pct >= 0 && pct <= 100) {
          updated.price = Math.max(
            MIN_PRODUCT_PRICE,
            Math.round(oldP * (1 - pct / 100) * 100) / 100
          );
        }
        if (field === 'oldPrice' && (value === '' || Number(value) <= 0)) {
          updated.discountPercent = '';
        }
      } else if (field === 'price') {
        const oldP = Number(f.oldPrice);
        const newP = Number(value);
        if (oldP > 0 && newP > 0 && oldP > newP) {
          updated.discountPercent = Math.round(((oldP - newP) / oldP) * 100);
        } else {
          updated.discountPercent = '';
        }
      }
      
      return updated;
    });
  };

  const handleImagesAdd = (files) => {
    setForm((current) => {
      const room = MAX_PRODUCT_IMAGES - current.imageSlots.length;
      if (room <= 0) return current;
      const nextSlots = [...current.imageSlots];
      files.slice(0, room).forEach((file) => {
        nextSlots.push(createImageSlot(file));
      });
      return {
        ...current,
        imageSlots: nextSlots,
        coverSlotId: current.coverSlotId || nextSlots[0]?.id || null,
      };
    });
  };

  const handleImageRemove = (slotId) => {
    setForm((current) => {
      const removed = current.imageSlots.find((slot) => slot.id === slotId);
      revokeSlotPreview(removed);
      const nextSlots = current.imageSlots.filter((slot) => slot.id !== slotId);
      let nextCover = current.coverSlotId;
      if (current.coverSlotId === slotId) {
        nextCover = nextSlots[0]?.id || null;
      }
      return { ...current, imageSlots: nextSlots, coverSlotId: nextCover };
    });
  };

  const handleSetCover = (slotId) => {
    setForm((current) => ({ ...current, coverSlotId: slotId }));
  };

  const closeFormModal = () => {
    form.imageSlots.forEach(revokeSlotPreview);
    setFormOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.imageSlots.length < MIN_PRODUCT_IMAGES) {
      showTopFloatNotification(`Upload at least ${MIN_PRODUCT_IMAGES} product images.`, 'danger');
      return;
    }
    if (form.imageSlots.length > MAX_PRODUCT_IMAGES) {
      showTopFloatNotification(`Maximum ${MAX_PRODUCT_IMAGES} images allowed.`, 'danger');
      return;
    }

    const price = parseProductPrice(form.price);
    if (price == null) {
      showTopFloatNotification(`Current price must be at least $${MIN_PRODUCT_PRICE.toFixed(2)}.`, 'danger');
      return;
    }

    setSaving(true);
    const isEdit = Boolean(form.id);
    const orderedSlots = orderImageSlotsWithCover(form.imageSlots, form.coverSlotId);
    const body = buildProductFormData(form, orderedSlots);

    try {
      const res = await fetch(
        isEdit ? apiUrl(`/api/products/${form.id}`) : apiUrl('/api/products'),
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: productAuthHeaders(true),
          body,
        }
      );
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification(
          isEdit ? `Product '${form.title.trim()}' updated successfully!` : `Product '${form.title.trim()}' added successfully!`
        );
        form.imageSlots.forEach(revokeSlotPreview);
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
    <div className="animate-cardRise space-y-2.5">
      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <ProductsStatCard
          label="Total Products"
          value={loading ? '…' : productStats.total.toLocaleString()}
          icon="fa-couch"
          iconWrapClass="bg-blue-500/10 text-blue-600"
          active={activeStatKey === 'total'}
          onClick={() => {
            setFilterStatus('all');
            setFilterCategory('all');
            setFilterNewArrivals(false);
            setFilterLowStock(false);
          }}
        />
        <ProductsStatCard
          label="Active"
          value={loading ? '…' : productStats.active.toLocaleString()}
          icon="fa-circle-check"
          iconWrapClass="bg-emerald-500/10 text-emerald-600"
          active={activeStatKey === 'active'}
          onClick={() => {
            setFilterStatus('Active');
            setFilterNewArrivals(false);
            setFilterLowStock(false);
          }}
        />
        <ProductsStatCard
          label="Inactive"
          value={loading ? '…' : productStats.inactive.toLocaleString()}
          icon="fa-circle-pause"
          iconWrapClass="bg-amber-500/10 text-amber-600"
          active={activeStatKey === 'inactive'}
          onClick={() => {
            setFilterStatus('Inactive');
            setFilterNewArrivals(false);
            setFilterLowStock(false);
          }}
        />
        <ProductsStatCard
          label="Low Stock"
          value={loading ? '…' : productStats.lowStock.toLocaleString()}
          icon="fa-triangle-exclamation"
          iconWrapClass="bg-red-500/10 text-red-600"
          active={activeStatKey === 'lowStock'}
          onClick={() => {
            setFilterLowStock((v) => !v);
            setFilterStatus('all');
            setFilterNewArrivals(false);
          }}
        />
      </div>

      <ProductsFilterToolbar
        filterCategory={filterCategory}
        categoryOptions={categoryOptions}
        filterNewArrivals={filterNewArrivals}
        onCategoryChange={setFilterCategory}
        onAddProduct={openAdd}
        onExport={() => exportProductsToCSV(filtered)}
        onToggleNewArrivals={() => setFilterNewArrivals((v) => !v)}
      />

      <div className={`${ADM_TABLE_CARD} !p-0 overflow-hidden`}>
        <div
          className="overflow-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-deepGreen/15 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5"
          style={{ maxHeight: PRODUCTS_TABLE_MAX_HEIGHT }}
        >
          <table className={`${ADM_TABLE} [&_tbody_tr]:cursor-pointer [&_tbody_tr]:transition-colors`}>
            <thead className="sticky top-0 z-[5] bg-white dark:bg-[#1a2421] [.admin-dark_&]:bg-[#1a2421]">
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="cursor-default py-8 text-center text-gray-400">
                    <i className="fa-solid fa-spinner fa-spin me-2" /> Loading products…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="cursor-default py-10 text-center">
                    <div className="mx-auto max-w-xs">
                      <i className="fa-solid fa-inbox mb-2 text-2xl text-gray-300" aria-hidden="true" />
                      <p className="text-[0.85rem] font-semibold text-gray-500 [.admin-dark_&]:text-gray-400">
                        No matching products
                      </p>
                      <p className="mt-1 text-[0.75rem] text-gray-400">
                        Try changing filters or search from the header.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((p) => {
                  const stockVal = getStockVal(p);
                  const status = getStatus(p);
                  const isActive = status === 'Active';
                  return (
                    <tr
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openView(p)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openView(p);
                        }
                      }}
                      className="hover:bg-deepGreen/[0.03]"
                    >
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
        onClose={closeFormModal}
        onSubmit={handleSubmit}
        onImagesAdd={handleImagesAdd}
        onImageRemove={handleImageRemove}
        onSetCover={handleSetCover}
      />

      <ProductDetailsModal
        open={detailsOpen}
        loading={detailsLoading}
        data={detailsData}
        listProduct={selectedProduct}
        acting={Boolean(actingId && selectedProduct && actingId === selectedProduct.id)}
        onClose={closeDetails}
        onEdit={(product) => {
          openEdit(product);
        }}
        onDelete={handleDelete}
        onToggleStatus={toggleProductStatus}
      />
    </div>
  );
}
