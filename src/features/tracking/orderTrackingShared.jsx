import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiUrl, normalizeOrderId } from '../../utils/data';
import { formatMoney, productImage } from '../../utils/format';
import { showTopFloatNotification } from '../../utils/notifications';
import { canCustomerCancelOrder } from '../../utils/orderCancel';

const PROGRESS_STEPS = [
  { key: 'placed', label: 'Order Placed', icon: 'fa-bag-shopping' },
  { key: 'payment', label: 'Payment Verified', icon: 'fa-credit-card' },
  { key: 'processing', label: 'Processing', icon: 'fa-box' },
  { key: 'shipped', label: 'Out for Delivery', icon: 'fa-truck' },
  { key: 'delivered', label: 'Delivered', icon: 'fa-circle-check' },
];

const DELIVERY_STATUS_LABEL = {
  processing: 'Processing',
  shipped: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function resolveTrackStatus(order) {
  if (order?.status) return order.status;
  const step = typeof order?.currentStep === 'number' ? order.currentStep : 1;
  if (step === 0) return 'cancelled';
  if (step >= 5) return 'delivered';
  if (step >= 4) return 'shipped';
  return 'processing';
}

function activeProgressStep(order) {
  const status = resolveTrackStatus(order);
  if (status === 'cancelled') return 0;
  const step = typeof order?.currentStep === 'number' ? order.currentStep : 1;
  if (status === 'delivered' || step >= 5) return 5;
  if (status === 'shipped' || step >= 4) return 4;
  if (step >= 3) return 3;
  if (step >= 2) return 2;
  return 1;
}

function formatDisplayDate(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  return String(value);
}

function buildStepDates(order, activities = []) {
  const dates = { placed: formatDisplayDate(order?.date) };

  for (const activity of activities) {
    const when = formatDisplayDate(activity.createdAt);
    if (!when) continue;

    if (activity.action === 'order_placed') dates.placed = when;
    if (activity.action === 'payment_updated') dates.payment = when;

    const step = Number(activity.metadata?.currentStep);
    const nextStatus = activity.metadata?.status;

    if (activity.action === 'status_changed' || step) {
      if (step >= 2 || nextStatus === 'processing') dates.payment = dates.payment || when;
      if (step >= 3) dates.processing = dates.processing || when;
      if (step >= 4 || nextStatus === 'shipped') dates.shipped = dates.shipped || when;
      if (step >= 5 || nextStatus === 'delivered') dates.delivered = dates.delivered || when;
    }
  }

  const active = activeProgressStep(order);
  if (active >= 2 && !dates.payment) dates.payment = dates.placed;
  if (active >= 3 && !dates.processing) dates.processing = dates.payment || dates.placed;
  if (active >= 4 && !dates.shipped) dates.shipped = dates.processing || dates.placed;

  return dates;
}

export function normalizeTrackItems(order) {
  if (order?.items?.length) return order.items;
  if (!order) return [];
  return [{ title: order.product, quantity: 1, price: parseTrackAmount(order.amount), image: '' }];
}

function parseTrackAmount(value) {
  if (typeof value === 'number') return value;
  const n = Number(String(value || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function itemsSubtotal(items) {
  return items.reduce((sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1), 0);
}

function MetaField({ label, value, children }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[0.72rem] font-semibold text-[#888888]">{label}</p>
      {children || (
        <p className="m-0 truncate text-[0.9rem] font-bold text-[#222222]">{value || '—'}</p>
      )}
    </div>
  );
}

function StatusBadge({ tone, icon, children }) {
  const tones = {
    delivery: 'bg-[#EEEAF8] text-[#5B4E96]',
    cancelled: 'bg-[#F3F3F3] text-[#666666]',
    processing: 'bg-[#E8F5EE] text-[#1B7A4A]',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.76rem] font-bold ${tones[tone] || tones.delivery}`}>
      {icon ? <i className={`fa-solid ${icon} text-[0.7rem]`} /> : null}
      {children}
    </span>
  );
}

function OrderProgressStepper({ order, activities }) {
  const status = resolveTrackStatus(order);
  const active = activeProgressStep(order);
  const dates = buildStepDates(order, activities);

  if (status === 'cancelled') {
    return (
      <div className="rounded-2xl border border-black/[0.06] bg-white px-5 py-5 text-center shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
        <i className="fa-solid fa-ban mb-1.5 text-[1.2rem] text-[#B42318]" />
        <p className="m-0 text-[0.88rem] font-bold text-[#666666]">This order was cancelled.</p>
      </div>
    );
  }

  const linePct = active <= 1 ? 0 : ((active - 1) / (PROGRESS_STEPS.length - 1)) * 100;

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white px-4 py-4 shadow-[0_6px_20px_rgba(0,0,0,0.05)] sm:px-5">
      <h2 className="mb-4 text-center text-[1rem] font-bold text-[#222222]">Order Progress</h2>

      <div className="relative mx-2 sm:mx-4">
        <div className="absolute left-[10%] right-[10%] top-4 h-0.5 bg-[#E5E7EB]" />
        <div
          className="absolute left-[10%] top-4 h-0.5 bg-[#1B7A4A] transition-all duration-500"
          style={{ width: `calc(${linePct}% * 0.8)` }}
        />
        <div className="relative grid grid-cols-5 gap-1">
          {PROGRESS_STEPS.map((step, index) => {
            const stepNo = index + 1;
            const done = stepNo < active;
            const current = stepNo === active;
            const pending = stepNo > active;
            const date = dates[step.key];

            return (
              <div key={step.key} className="flex flex-col items-center text-center">
                <span
                  className={[
                    'relative z-[1] mb-1.5 flex h-9 w-9 items-center justify-center rounded-full text-[0.75rem] transition-all',
                    done
                      ? 'bg-[#1B7A4A] text-white'
                      : current
                        ? 'bg-[#111111] text-white ring-[3px] ring-[#111111]/10'
                        : 'border-2 border-dashed border-[#D1D5DB] bg-white text-[#B0B7C3]',
                  ].join(' ')}
                >
                  <i className={`fa-solid ${step.icon}`} />
                </span>
                <span className={`text-[0.68rem] font-bold leading-tight sm:text-[0.74rem] ${pending ? 'text-[#B0B7C3]' : 'text-[#222222]'}`}>
                  {step.label}
                </span>
                <span className={`mt-0.5 text-[0.65rem] sm:text-[0.68rem] ${pending ? 'text-[#C4C9D4]' : 'text-[#888888]'}`}>
                  {pending ? 'Pending' : date || '—'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function OrderItemsModal({ items, totalLabel, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    const prev = document.body.style.overflow;
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (typeof document === 'undefined' || !document.body) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1060] overflow-y-auto bg-black/45" role="presentation">
      <div className="flex min-h-full items-center justify-center p-4" onClick={onClose}>
        <div
          className="my-auto w-full max-h-[min(90dvh,560px)] max-w-[520px] overflow-y-auto rounded-2xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="allOrderItemsTitle"
        >
          <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
            <h3 id="allOrderItemsTitle" className="m-0 text-[1rem] font-bold text-[#222222]">
              All Order Items
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="border-0 bg-transparent p-1 text-[1.1rem] text-[#888888] hover:text-[#333333]"
              aria-label="Close"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <div className="divide-y divide-black/[0.05] px-5">
            {items.map((item, idx) => (
              <div key={`${item.title}-${idx}`} className="flex items-center gap-3 py-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-black/[0.06] bg-[#FAF8F5]">
                  {item.image ? (
                    <img
                      src={productImage(item.image)}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = productImage('product-images/hero1.jpeg');
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#BBBBBB]">
                      <i className="fa-solid fa-couch" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-[0.92rem] font-bold text-[#222222]">{item.title}</p>
                  <p className="m-0 mt-1 text-[0.8rem] text-[#888888]">Qty: {item.quantity || 1}</p>
                </div>
                <span className="shrink-0 text-[0.92rem] font-bold text-[#222222]">
                  {formatMoney((Number(item.price) || 0) * (item.quantity || 1))}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-black/[0.06] px-5 py-4">
            <span className="text-[0.88rem] font-bold text-[#666666]">Total</span>
            <span className="text-[1rem] font-extrabold text-[#222222]">{totalLabel}</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function OrderTrackingSearchCard({
  orderId,
  onOrderIdChange,
  loading,
  notFound,
  onSubmit,
  inputId = 'trackingInput',
  helperText = 'Order ID-ga waxaad ka heli kartaa SMS, email, ama My Orders.',
}) {
  return (
    <div className="animate-cardRise overflow-hidden rounded-[24px] border border-black/[0.06] bg-white shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
      <div className="border-b border-black/[0.05] bg-[linear-gradient(180deg,#FAF8F2_0%,#F4EFE6_100%)] px-6 py-6 text-center sm:px-8">
        <span className="mb-2 inline-block text-[0.72rem] font-extrabold uppercase tracking-[2px] text-[#C39D63]">
          Delivery Tracking
        </span>
        <h2 className="mb-2 font-display text-[2rem] font-bold text-deepGreen">Track Your Order</h2>
        <p className="mx-auto mb-0 max-w-[400px] text-[0.84rem] leading-relaxed text-[#666666]">
          Geli Order ID-gaaga si aad u aragto xaaladda dalabkaaga.
        </p>
      </div>

      <div className="px-5 py-5 sm:px-7 sm:py-6">
        <form onSubmit={onSubmit}>
          <label htmlFor={inputId} className="mb-2 block text-[0.8rem] font-bold text-deepGreen">
            Order ID
          </label>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <i className="fa-regular fa-file-lines pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#C39D63]" />
              <input
                id={inputId}
                type="text"
                value={orderId}
                onChange={onOrderIdChange}
                placeholder="#MF-260703-962"
                autoComplete="off"
                className="w-full rounded-xl border border-black/[0.1] bg-white py-3 pl-10 pr-4 text-[0.92rem] font-semibold text-[#111111] outline-none transition focus:border-deepGreen focus:shadow-[0_0_0_3px_rgba(7,61,53,0.08)]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border-0 bg-deepGreen px-6 py-3 text-[0.88rem] font-bold text-white transition hover:bg-[#052b25] disabled:opacity-60"
            >
              <i className={`fa-solid ${loading ? 'fa-spinner fa-spin' : 'fa-magnifying-glass'}`} />
              {loading ? 'Searching…' : 'Track'}
            </button>
          </div>

          {notFound && (
            <p className="mt-3 flex items-center gap-2 rounded-xl border border-[#F0D9A8] bg-[#FFF8EB] px-3 py-2.5 text-[0.84rem] font-semibold text-deepGreen" role="alert">
              <i className="fa-solid fa-circle-exclamation text-[#C39D63]" />
              {notFound}
            </p>
          )}

          <p className="mt-4 mb-0 text-center text-[0.78rem] text-[#888888]">
            {helperText}
          </p>
        </form>
      </div>
    </div>
  );
}

export function OrderTrackingResults({
  order,
  activities = [],
  onReset,
  backLabel = 'Back to Track Order',
  resetLabel = 'New search',
  onCancel,
  cancelling = false,
  itemsModalOpen,
  onItemsModalOpen,
  onItemsModalClose,
}) {
  const status = resolveTrackStatus(order);
  const canCancel = canCustomerCancelOrder(order) && typeof onCancel === 'function';
  const items = useMemo(() => normalizeTrackItems(order), [order]);
  const previewItem = items[0];
  const totalLabel = order?.amount?.startsWith?.('$')
    ? order.amount
    : formatMoney(itemsSubtotal(items) || parseTrackAmount(order?.amount));
  const estimatedDelivery = order?.deliveryDate || order?.estimate || '—';

  return (
    <div className="animate-cardRise space-y-4">
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-2 rounded-lg border-0 bg-transparent px-0 py-1 text-[0.88rem] font-bold text-deepGreen transition hover:text-[#052b25] hover:underline"
      >
        <i className="fa-solid fa-arrow-left text-[0.8rem]" />
        {backLabel}
      </button>

      <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.05] px-5 py-3">
          <h2 className="m-0 text-[1.05rem] font-bold text-[#222222]">Order Tracking</h2>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-deepGreen/15 bg-deepGreen/[0.06] px-3 py-1.5 text-[0.78rem] font-semibold text-deepGreen transition hover:bg-deepGreen/[0.1]"
          >
            <i className="fa-solid fa-magnifying-glass text-[0.75rem]" />
            {resetLabel}
          </button>
        </div>

        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetaField label="Order ID" value={order.id} />
          <MetaField label="Customer Name" value={order.customer} />
          <MetaField label="Order Date" value={order.date}>
            <p className="m-0 flex items-center gap-1.5 text-[0.9rem] font-bold text-[#222222]">
              <i className="fa-regular fa-calendar text-[0.78rem] text-[#888888]" />
              {order.date || '—'}
            </p>
          </MetaField>
          <MetaField label="Estimated Delivery" value={estimatedDelivery}>
            <p className="m-0 flex items-center gap-1.5 text-[0.9rem] font-bold text-[#222222]">
              <i className="fa-regular fa-calendar text-[0.78rem] text-[#888888]" />
              {estimatedDelivery}
            </p>
          </MetaField>
          <MetaField label="Delivery Status">
            <StatusBadge
              tone={status === 'cancelled' ? 'cancelled' : status === 'processing' ? 'processing' : 'delivery'}
              icon="fa-truck-fast"
            >
              {DELIVERY_STATUS_LABEL[status] || status}
            </StatusBadge>
          </MetaField>
        </div>
      </div>

      <OrderProgressStepper order={order} activities={activities} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between border-b border-black/[0.05] px-5 py-3">
            <h3 className="m-0 text-[0.92rem] font-bold text-[#222222]">Order Items</h3>
            {items.length > 0 && (
              <button
                type="button"
                onClick={onItemsModalOpen}
                className="border-0 bg-transparent p-0 text-[0.82rem] font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
              >
                All
              </button>
            )}
          </div>

          {previewItem ? (
            <>
              <div className="flex items-center gap-3.5 px-5 py-3.5">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-black/[0.06] bg-[#FAF8F5]">
                  {previewItem.image ? (
                    <img
                      src={productImage(previewItem.image)}
                      alt={previewItem.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = productImage('product-images/hero1.jpeg');
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#BBBBBB]">
                      <i className="fa-solid fa-couch text-[1.2rem]" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-[0.9rem] font-bold text-[#222222]">{previewItem.title}</p>
                  <p className="m-0 mt-0.5 text-[0.78rem] text-[#888888]">Qty: {previewItem.quantity || 1}</p>
                </div>
                <span className="shrink-0 text-[0.9rem] font-bold text-[#222222]">
                  {formatMoney((Number(previewItem.price) || 0) * (previewItem.quantity || 1))}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-black/[0.05] bg-[#FAFAFA] px-5 py-2.5">
                <span className="text-[0.84rem] font-bold text-[#666666]">Total</span>
                <span className="text-[0.95rem] font-extrabold text-[#222222]">{totalLabel}</span>
              </div>
            </>
          ) : (
            <p className="px-5 py-5 text-[0.86rem] text-[#888888]">No items found.</p>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_6px_20px_rgba(0,0,0,0.05)]">
          <div className="border-b border-black/[0.05] px-5 py-3">
            <h3 className="m-0 text-[0.92rem] font-bold text-[#222222]">Delivery Information</h3>
          </div>
          <div className="space-y-3 px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-[0.72rem] text-[#666666]">
                <i className="fa-solid fa-location-dot" />
              </span>
              <p className="m-0 text-[0.86rem] leading-relaxed text-[#444444]">{order.address || '—'}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-[0.72rem] text-[#666666]">
                <i className="fa-solid fa-phone" />
              </span>
              <p className="m-0 text-[0.86rem] font-semibold text-[#444444]">{order.phone || '—'}</p>
            </div>
            {order.driver && order.driver !== 'Not assigned yet' && (
              <div className="flex items-center gap-3 border-t border-black/[0.05] pt-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-[0.72rem] text-[#666666]">
                  <i className="fa-solid fa-id-badge" />
                </span>
                <div>
                  <p className="m-0 text-[0.7rem] font-semibold uppercase tracking-wide text-[#888888]">Driver</p>
                  <p className="m-0 text-[0.86rem] font-bold text-deepGreen">{order.driver}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {canCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={cancelling}
          className="w-full rounded-xl border border-black/[0.08] bg-white py-2.5 text-[0.82rem] font-bold text-[#666666] shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
        >
          <i className={`fa-solid ${cancelling ? 'fa-spinner fa-spin' : 'fa-xmark'} mr-1.5`} />
          {cancelling ? 'Cancelling…' : 'Cancel Order'}
        </button>
      )}

      {itemsModalOpen && items.length > 0 && (
        <OrderItemsModal items={items} totalLabel={totalLabel} onClose={onItemsModalClose} />
      )}
    </div>
  );
}

export async function fetchTrackedOrder(rawCode) {
  const code = normalizeOrderId(rawCode);
  if (!code) return { success: false, message: 'Please enter your Order ID!' };

  const res = await fetch(apiUrl(`/api/orders/track/${encodeURIComponent(code)}`));
  const data = await res.json();

  if (data.success && data.order) {
    return {
      success: true,
      order: { ...data.order, status: resolveTrackStatus(data.order) },
      activities: Array.isArray(data.activities) ? data.activities : [],
      orderId: data.order.id || code,
    };
  }

  return { success: false, message: data.message || 'Order not found.' };
}

export function trackOrderIdOrNotify(rawCode) {
  const code = normalizeOrderId(rawCode);
  if (!code) {
    showTopFloatNotification('Please enter your Order ID!', 'danger');
    return false;
  }
  return code;
}
