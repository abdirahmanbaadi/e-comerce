import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { fetchTrackedOrder, resolveTrackStatus } from '../features/tracking/orderTrackingShared';
import { apiUrl } from '../utils/data';
import { productImage } from '../utils/format';
import { showTopFloatNotification } from '../utils/notifications';
import { canCustomerCancelOrder } from '../utils/orderCancel';
import { findMockOrder } from './mockOrders';

const TIMELINE = [
  { key: 'placed', label: 'Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'out', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

function addDays(base, days) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function formatShortDate(value) {
  return value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function timelineIndex(status) {
  if (status === 'delivered') return 4;
  if (status === 'shipped') return 3;
  if (status === 'cancelled') return -1;
  return 1;
}

function driverFromOrder(order) {
  if (order?.driverInfo?.name) return order.driverInfo;
  if (order?.driver && order.driver !== 'Not assigned yet') {
    return {
      name: order.driver,
      phone: order.driverPhone || '',
      avatar: order.driverAvatar || '',
      ratingAvg: order.driverRatingAvg || 0,
      ratingCount: order.driverRatingCount || 0,
    };
  }
  return null;
}

function DriverAvatar({ driver }) {
  const [broken, setBroken] = useState(false);
  const src = driver?.avatar ? productImage(driver.avatar) : '';
  const showPhoto = Boolean(src) && !broken;
  const initials = String(driver?.name || 'D')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <span className="relative inline-flex h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[#efe7dc] text-[0.95rem]">
      {showPhoto ? (
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-black text-[#6b4228]">{initials || 'D'}</span>
      )}
    </span>
  );
}

function looksMasked(value) {
  return /[*•xX]{2,}/.test(String(value || '')) || String(value || '').includes('…');
}

/** Full-screen QR only — no phone form / modal chrome. */
function QrOnlyOverlay({ open, onClose, order }) {
  const [dataUrl, setDataUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !order?.id) {
      setDataUrl('');
      return undefined;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      let payload = order.deliveryConfirmPayload || '';

      if (!payload && String(order.id).startsWith('ORD-2024-')) {
        payload = `mmf-delivery:${order.id}:preview`;
      }

      if (!payload) {
        try {
          const token = localStorage.getItem('token');
          const params = new URLSearchParams();
          if (order.phone && !looksMasked(order.phone)) params.set('phone', order.phone);
          const qs = params.toString() ? `?${params}` : '';
          const res = await fetch(apiUrl(`/api/orders/${encodeURIComponent(order.id)}/delivery-qr${qs}`), {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const data = await res.json();
          if (data.success && data.payload) payload = data.payload;
        } catch {
          /* ignore */
        }
      }

      if (!payload || cancelled) {
        if (!cancelled) {
          setDataUrl('');
          setLoading(false);
        }
        return;
      }

      try {
        const url = await QRCode.toDataURL(payload, {
          width: 320,
          margin: 2,
          color: { dark: '#1c140e', light: '#ffffff' },
        });
        if (!cancelled) setDataUrl(url);
      } catch {
        if (!cancelled) setDataUrl('');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [open, order]);

  if (!open || typeof document === 'undefined' || !document.body) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/55 p-6 backdrop-blur-[2px]"
      onClick={onClose}
      role="presentation"
    >
      <div onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        {loading ? (
          <p className="m-0 text-[0.9rem] font-bold text-white">
            <i className="fa-solid fa-spinner fa-spin mr-2" />
            Loading…
          </p>
        ) : dataUrl ? (
          <img
            src={dataUrl}
            alt="Delivery QR"
            className="h-[min(72vw,320px)] w-[min(72vw,320px)] rounded-[20px] bg-white p-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
          />
        ) : (
          <p className="m-0 rounded-2xl bg-white px-5 py-4 text-center text-[0.86rem] font-bold text-[#8b8178]">
            QR not available yet.
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}

export default function MobileTrackSheet({ open, orderId, fallbackOrder = null, onClose, onOrderUpdated }) {
  const [order, setOrder] = useState(fallbackOrder || findMockOrder(orderId));
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    setQrOpen(false);
    setLoadError('');
    const seed = fallbackOrder || findMockOrder(orderId);
    setOrder(seed || null);

    let cancelled = false;
    setLoading(true);
    fetchTrackedOrder(orderId)
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setOrder(result.order);
          setLoadError('');
        } else if (!seed) {
          setOrder(null);
          setLoadError(result.message || 'Order not found. Check the Order ID.');
        }
      })
      .catch(() => {
        if (!cancelled && !seed) {
          setOrder(null);
          setLoadError('Could not connect to server.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      cancelled = true;
      document.body.style.overflow = original;
    };
  }, [fallbackOrder, open, orderId]);

  const status = order ? resolveTrackStatus(order) : 'processing';
  const current = timelineIndex(status);
  const driver = driverFromOrder(order);
  const canCancel = canCustomerCancelOrder(order);
  const qrReady =
    Boolean(order?.deliveryQrPending) ||
    order?.deliveryConfirmStatus === 'pending' ||
    Boolean(order?.deliveryConfirmPayload);
  const estimated = order?.deliveryDate || order?.estimate || '';

  const dates = useMemo(() => {
    if (!order) return [];
    const placedAt = new Date(order.date || order.createdAt || Date.now());
    const safeDate = Number.isNaN(placedAt.getTime()) ? new Date() : placedAt;
    return [
      formatShortDate(addDays(safeDate, status === 'delivered' ? -4 : -2)),
      formatShortDate(addDays(safeDate, status === 'delivered' ? -4 : -2)),
      formatShortDate(addDays(safeDate, status === 'delivered' ? -2 : -1)),
      formatShortDate(safeDate),
      status === 'delivered' ? formatShortDate(safeDate) : '',
    ];
  }, [order, status]);

  const cancelOrder = async () => {
    if (!order?.id || !canCancel) return;
    if (!window.confirm('Cancel this order? Only possible before shipment.')) return;
    setCancelling(true);
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    let phone = order.phone;
    if (!token) {
      const entered = window.prompt('Enter phone used at checkout:');
      if (!entered?.trim()) {
        setCancelling(false);
        return;
      }
      phone = entered.trim();
    }
    try {
      const res = await fetch(apiUrl(`/api/orders/cancel/${encodeURIComponent(order.id)}`), {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        const next = { ...data.order, status: resolveTrackStatus(data.order), driverInfo: order.driverInfo };
        setOrder(next);
        onOrderUpdated?.(next);
        showTopFloatNotification(data.message || 'Order cancelled.');
      } else if (String(order.id).startsWith('ORD-2024-')) {
        const next = { ...order, status: 'cancelled', currentStep: 0 };
        setOrder(next);
        onOrderUpdated?.(next);
        showTopFloatNotification('Order cancelled.');
      } else {
        showTopFloatNotification(data.message || 'Could not cancel.', 'danger');
      }
    } catch {
      showTopFloatNotification('Server error.', 'danger');
    } finally {
      setCancelling(false);
    }
  };

  if (!open) return null;

  const callHref = driver?.phone ? `tel:${String(driver.phone).replace(/\s+/g, '')}` : '';
  const smsHref = driver?.phone ? `sms:${String(driver.phone).replace(/\s+/g, '')}` : '';
  const statusLabel =
    status === 'shipped' ? 'Out for Delivery' : status === 'processing' ? 'Processing' : status === 'delivered' ? 'Delivered' : 'Cancelled';
  const statusBadge =
    status === 'shipped'
      ? 'bg-[#e8f1ff] text-[#2563eb]'
      : status === 'delivered'
        ? 'bg-[#e8f7ee] text-[#087443]'
        : status === 'cancelled'
          ? 'bg-[#fdecec] text-[#c0392b]'
          : 'bg-[#eaf2ff] text-[#2b59db]';

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[2px]"
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
      role="presentation"
    >
      <aside
        className="mmf-sheet absolute bottom-0 left-0 right-0 mx-auto flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-24px_70px_rgba(0,0,0,0.3)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobileTrackTitle"
      >
        <div className="shrink-0 px-4 pb-2 pt-3">
          <div className="mx-auto mb-2 h-1 w-11 rounded-full bg-[#e4d8ca]" />
          <div className="grid grid-cols-[40px_1fr_40px] items-center">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center border-0 bg-transparent text-[#2f241a]"
              aria-label="Close tracking"
            >
              <i className="fa-solid fa-chevron-left text-[1.05rem]" />
            </button>
            <h2 id="mobileTrackTitle" className="m-0 text-center text-[1.05rem] font-black text-[#2f241a]">
              Order Tracking
            </h2>
            {qrReady ? (
              <button
                type="button"
                onClick={() => setQrOpen(true)}
                className="flex h-10 w-10 items-center justify-center border-0 bg-transparent text-[#2f241a]"
                aria-label="Show delivery QR"
              >
                <i className="fa-solid fa-qrcode text-[1.05rem]" />
              </button>
            ) : (
              <span className="h-10 w-10" aria-hidden="true" />
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {loading && !order ? (
            <p className="py-12 text-center text-[0.86rem] font-semibold text-[#8b8178]">Loading tracking...</p>
          ) : order ? (
            <>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="m-0 text-[1.15rem] font-black text-[#1c140e]">#{order.id}</h3>
                  {estimated ? (
                    <p className="mb-0 mt-1 text-[0.78rem] font-semibold text-[#8b8178]">Estimated delivery: {estimated}</p>
                  ) : null}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] font-black ${statusBadge}`}>
                  {statusLabel}
                </span>
              </div>

              {status !== 'cancelled' ? (
                <div className="mb-5 rounded-[22px] bg-[#faf7f2] px-3 py-4">
                  <div className="relative flex items-start justify-between">
                    <div className="absolute left-[10%] right-[10%] top-[13px] h-[2px] bg-[#ece3d8]" />
                    <div
                      className="absolute left-[10%] top-[13px] h-[2px] bg-[#2f241a]"
                      style={{ width: `${Math.max(0, (current / (TIMELINE.length - 1)) * 80)}%` }}
                    />
                    {TIMELINE.map((step, index) => {
                      const done = index < current || status === 'delivered';
                      const isCurrent = index === current && status !== 'delivered';
                      const showTruck = isCurrent && status === 'shipped';
                      return (
                        <div key={step.key} className="relative z-[1] flex w-[20%] flex-col items-center text-center">
                          <span
                            className={`flex items-center justify-center rounded-full ${
                              showTruck
                                ? 'h-8 w-8 bg-[#6b4228] text-white shadow-[0_8px_18px_rgba(107,66,40,0.28)]'
                                : isCurrent
                                  ? 'h-8 w-8 bg-[#6b4228] text-white'
                                  : done
                                    ? 'h-[22px] w-[22px] bg-[#1c140e] text-white'
                                    : 'h-[22px] w-[22px] border-2 border-[#d8cbbd] bg-white'
                            }`}
                          >
                            {showTruck ? (
                              <i className="fa-solid fa-truck text-[0.68rem]" />
                            ) : isCurrent ? (
                              <i className="fa-solid fa-box-open text-[0.68rem]" />
                            ) : done ? (
                              <i className="fa-solid fa-check text-[0.58rem]" />
                            ) : null}
                          </span>
                          <p className="mb-0 mt-2 text-[0.58rem] font-black leading-tight text-[#2f241a]">{step.label}</p>
                          {dates[index] ? (
                            <p className="mb-0 mt-0.5 text-[0.52rem] font-semibold text-[#9a8d82]">{dates[index]}</p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <section className="mb-5 rounded-[18px] bg-[#fdecec] px-4 py-4 text-center">
                  <p className="m-0 text-[0.88rem] font-black text-[#c0392b]">This order was cancelled.</p>
                </section>
              )}

              {driver && status !== 'cancelled' ? (
                <section className="mb-4">
                  <h4 className="mb-3 mt-0 text-[0.95rem] font-black text-[#1c140e]">Driver Information</h4>
                  <div className="flex items-center gap-3">
                    <DriverAvatar driver={driver} />
                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate text-[0.98rem] font-black text-[#1c140e]">{driver.name}</p>
                      {Number(driver.ratingAvg) > 0 ? (
                        <p className="mb-0 mt-0.5 flex items-center gap-1 text-[0.8rem] font-bold text-[#1c140e]">
                          <i className="fa-solid fa-star text-[0.72rem] text-[#f5b301]" />
                          {Number(driver.ratingAvg).toFixed(1)}
                        </p>
                      ) : (
                        <p className="mb-0 mt-0.5 text-[0.76rem] font-semibold text-[#8b8178]">Assigned driver</p>
                      )}
                    </div>
                    {callHref ? (
                      <a
                        href={callHref}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3ebe3] text-[#6b4228] no-underline"
                        aria-label="Call driver"
                      >
                        <i className="fa-solid fa-phone text-[0.85rem]" />
                      </a>
                    ) : null}
                    {smsHref ? (
                      <a
                        href={smsHref}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3ebe3] text-[#6b4228] no-underline"
                        aria-label="Message driver"
                      >
                        <i className="fa-solid fa-comment text-[0.85rem]" />
                      </a>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {canCancel ? (
                <button
                  type="button"
                  onClick={cancelOrder}
                  disabled={cancelling}
                  className="mb-2 w-full rounded-full border border-[#eadfce] bg-white py-3 text-[0.82rem] font-black text-[#8b8178] disabled:opacity-60"
                >
                  {cancelling ? 'Cancelling…' : 'Cancel Order'}
                </button>
              ) : null}
            </>
          ) : (
            <section className="rounded-[18px] bg-[#faf7f2] px-5 py-10 text-center">
              <i className="fa-solid fa-magnifying-glass mb-3 text-2xl text-[#d8c8b6]" />
              <p className="m-0 text-[0.9rem] font-black text-[#1c140e]">
                {loadError || 'Enter an Order ID to track.'}
              </p>
            </section>
          )}
        </div>

        {driver && status !== 'cancelled' ? (
          <div className="shrink-0 border-t border-[#f0e9df] px-4 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-3">
            <a
              href={callHref || '#'}
              onClick={(event) => {
                if (!callHref) event.preventDefault();
              }}
              className={`flex min-h-[50px] items-center justify-center rounded-full text-[0.92rem] font-black no-underline ${
                callHref ? 'bg-[#3d2a1c] text-white' : 'pointer-events-none bg-[#d8cbbd] text-white'
              }`}
            >
              Contact Driver
            </a>
          </div>
        ) : null}
      </aside>

      <QrOnlyOverlay open={qrOpen && qrReady} onClose={() => setQrOpen(false)} order={order} />
    </div>
  );
}
