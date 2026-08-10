import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  buildTelHref,
  extractDistrict,
  getDriverOrderPhase,
} from '../../../features/driver/driverShared';
import { apiUrl } from '../../../utils/data';
import { formatMoney, productImage } from '../../../utils/format';
import { showTopFloatNotification } from '../../../utils/notifications';
import { DRIVER_PICKUP } from '../driverMockData';
import DriverCustomerChatSheet from '../DriverCustomerChatSheet';
import { useDriverContext } from '../DriverShell';

function deliveryFee(order) {
  const fee = Number(order?.deliveryFee ?? order?.deliveryCost ?? order?.shippingFee ?? 0);
  if (fee > 0) return formatMoney(fee);
  if (order?.amount) return order.amount;
  return '—';
}

function formatAssignedOn(order) {
  const raw = order?.assignedAt || order?.deliveryDate || order?.createdAt || order?.date;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '—';
  return d
    .toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .replace(',', '');
}

function formatClock(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function statusBadge(phase) {
  if (phase === 'delivered') {
    return { label: 'Delivered', icon: 'fa-circle-check', cls: 'bg-[#e7f4ea] text-[#2f6b45]' };
  }
  if (phase === 'pending') {
    return { label: 'Assigned', icon: 'fa-bell', cls: 'bg-[#fff1e8] text-[#c45c26]' };
  }
  if (phase === 'accepted') {
    return { label: 'Accepted', icon: 'fa-box', cls: 'bg-[#e7f4ea] text-[#2f6b45]' };
  }
  if (phase === 'at_customer') {
    return { label: 'At Customer', icon: 'fa-house', cls: 'bg-[#e7f4ea] text-[#2f6b45]' };
  }
  return { label: 'Out for Delivery', icon: 'fa-truck', cls: 'bg-[#e7f4ea] text-[#2f6b45]' };
}

const FALLBACK_ITEM_IMAGE = '/product-images/luxury-sofa-set.png';

function resolveItems(order) {
  const raw = order?.items || order?.products || order?.cartItems || [];
  if (Array.isArray(raw) && raw.length) {
    return raw.map((item) => {
      const rawImage =
        item.image || item.img || item.images?.[0] || item.productImage || '';
      return {
        name: item.name || item.title || item.productTitle || 'Item',
        color: item.color || item.variant || item.option || null,
        qty: Number(item.qty ?? item.quantity ?? 1) || 1,
        price: Number(item.price ?? item.unitPrice ?? 0) || 0,
        image: productImage(rawImage) || FALLBACK_ITEM_IMAGE,
      };
    });
  }
  return [
    {
      name: 'Furniture item',
      color: null,
      qty: 1,
      price: 0,
      image: FALLBACK_ITEM_IMAGE,
    },
  ];
}

function deliveryActionSteps(order, phase) {
  const assignedTime = formatClock(order?.assignedAt || order?.deliveryDate) || '—';
  const pickedTime = formatClock(order?.pickedUpAt);
  const outTime = formatClock(
    order?.outForDeliveryAt ||
      (phase === 'transit' || phase === 'at_customer' ? order?.updatedAt : null)
  );
  const deliveredTime = formatClock(
    order?.deliveredAt || (phase === 'delivered' ? order?.updatedAt : null)
  );

  let current = 0;
  if (phase === 'pending') current = 0;
  else if (phase === 'accepted') current = 1;
  else if (phase === 'transit' || phase === 'at_customer') current = 2;
  else if (phase === 'delivered') current = 3;

  const defs = [
    { key: 'assigned', label: 'Assigned', icon: 'fa-check', time: assignedTime },
    {
      key: 'picked',
      label: 'Picked Up',
      icon: 'fa-check',
      time: pickedTime || (current >= 1 ? assignedTime : null),
    },
    { key: 'out', label: 'Out for Delivery', icon: 'fa-truck', time: outTime },
    { key: 'delivered', label: 'Delivered', icon: 'fa-box', time: deliveredTime },
  ];

  return defs.map((step, i) => {
    let state = 'idle';
    if (phase === 'delivered' || i < current) state = 'done';
    else if (i === current && phase !== 'pending') state = 'current';
    else if (i === 0 && phase === 'pending') state = 'current';
    return { ...step, state };
  });
}

/** Full-page Delivery Details */
export default function DriverJobDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, loading, refreshAll } = useDriverContext();
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [chatOpen, setChatOpen] = useState(false);

  const order = useMemo(
    () => orders.find((o) => String(o.id) === String(orderId)),
    [orders, orderId]
  );

  const phase = order ? getDriverOrderPhase(order) : null;
  const badge = phase ? statusBadge(phase) : null;
  const tel = order ? buildTelHref(order.phone) : null;
  const isPending = phase === 'pending';
  const isAccepted = phase === 'accepted';
  const isTransit = phase === 'transit';
  const canTrack = isTransit || phase === 'at_customer';
  const items = useMemo(() => (order ? resolveItems(order) : []), [order]);
  const steps = useMemo(
    () => (order && phase ? deliveryActionSteps(order, phase) : []),
    [order, phase]
  );

  const pickupName = order?.pickupName || DRIVER_PICKUP.name;
  const pickupAddress = order?.pickupAddress || DRIVER_PICKUP.address;
  const dropDistrict = extractDistrict(order?.address) || 'Delivery';
  const dropAddress = order?.address || 'Mogadishu';

  const goBack = () => navigate('/app/driver/jobs');

  const startOutForDelivery = async () => {
    if (!order) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setBusy(true);
    try {
      const res = await fetch(
        apiUrl(`/api/drivers/assignments/${encodeURIComponent(order.id)}/start-delivery`),
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification(data.message || 'Out for delivery.');
        await refreshAll(true);
      } else {
        showTopFloatNotification(data.message || 'Could not start delivery.', 'danger');
      }
    } catch {
      showTopFloatNotification('Connection failed.', 'danger');
    } finally {
      setBusy(false);
    }
  };

  const markArrived = async () => {
    if (!order) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setBusy(true);
    try {
      const res = await fetch(apiUrl(`/api/orders/${encodeURIComponent(order.id)}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          driverArrived: true,
          estimate: 'Driver arrived — handing over order',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('Arrival confirmed. Ask customer for Track Order QR, then scan it.');
        await refreshAll(true);
      } else {
        showTopFloatNotification(data.message || 'Could not confirm arrival.', 'danger');
      }
    } catch {
      showTopFloatNotification('Connection failed.', 'danger');
    } finally {
      setBusy(false);
    }
  };

  const accept = async () => {
    if (!order) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setBusy(true);
    try {
      const res = await fetch(apiUrl(`/api/drivers/assignments/${encodeURIComponent(order.id)}/accept`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('Delivery accepted.');
        await refreshAll(true);
        navigate(`/app/driver/jobs/${encodeURIComponent(order.id)}/active`);
      } else {
        showTopFloatNotification(data.message || 'Could not accept.', 'danger');
      }
    } catch {
      showTopFloatNotification('Connection failed.', 'danger');
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!reason.trim()) {
      showTopFloatNotification('Please enter a reason.', 'warning');
      return;
    }
    if (!order) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setBusy(true);
    try {
      const res = await fetch(apiUrl(`/api/drivers/assignments/${encodeURIComponent(order.id)}/reject`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('Delivery declined.');
        await refreshAll(true);
        setRejectOpen(false);
        navigate('/app/driver/jobs');
      } else {
        showTopFloatNotification(data.message || 'Could not decline.', 'danger');
      }
    } catch {
      showTopFloatNotification('Connection failed.', 'danger');
    } finally {
      setBusy(false);
    }
  };

  if (!order || !badge) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-[#f7f7f7] px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={goBack}
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white text-[#1a1a1a] shadow-sm"
          aria-label="Back"
        >
          <i className="fa-solid fa-chevron-left" />
        </button>
        <p className="m-0 text-center text-[0.9rem] font-semibold text-[#8a8a8a]">
          {loading ? 'Loading delivery…' : 'Delivery not found.'}
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-[#f7f7f7]">
      <header className="sticky top-0 z-20 border-b border-[#efefef] bg-white/95 px-4 pb-3 pt-[max(0.65rem,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={goBack}
            className="absolute left-0 flex h-9 w-9 items-center justify-center rounded-full border-0 bg-transparent text-[#1a1a1a]"
            aria-label="Back"
          >
            <i className="fa-solid fa-chevron-left text-[1rem]" />
          </button>
          <h1 className="m-0 text-[1.05rem] font-bold text-[#1a1a1a]">Delivery Details</h1>
        </div>
      </header>

      <div className="flex-1 space-y-4 px-4 py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        <section className="rounded-2xl border border-[#ececec] bg-white p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e7f4ea] text-[#2f6b45]">
              <i className="fa-solid fa-box-open text-[1.1rem]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="m-0 truncate text-[0.98rem] font-bold text-[#1a1a1a]">{order.id}</p>
                  <span
                    className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${badge.cls}`}
                  >
                    <i className={`fa-solid ${badge.icon} text-[0.62rem]`} />
                    {badge.label}
                  </span>
                  <p className="mb-0 mt-1.5 text-[0.7rem] leading-snug text-[#8a8a8a]">
                    Assigned on {formatAssignedOn(order)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="mb-0.5 mt-0 text-[0.65rem] font-medium text-[#8a8a8a]">Delivery Fee</p>
                  <p className="m-0 text-[1.05rem] font-bold text-[#2f6b45]">{deliveryFee(order)}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-2 mt-0 text-[0.88rem] font-bold text-[#1a1a1a]">Customer Information</h2>
          <div className="flex items-center gap-3 rounded-2xl border border-[#ececec] bg-white p-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f0f0f0] text-[#8a8a8a]">
              <i className="fa-solid fa-user text-[1.1rem]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-[0.92rem] font-bold text-[#1a1a1a]">{order.customer}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              {tel ? (
                <a
                  href={tel}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-[#2f6b45] no-underline"
                  aria-label="Call"
                >
                  <i className="fa-solid fa-phone text-[0.85rem]" />
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-[#2f6b45]"
                aria-label="Message"
              >
                <i className="fa-solid fa-comment text-[0.85rem]" />
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#ececec] bg-white p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <div className="relative flex gap-3">
            <div className="relative flex w-4 shrink-0 flex-col items-center pt-1.5">
              <span className="z-[1] h-2.5 w-2.5 rounded-full bg-[#2f6b45]" />
              <span className="my-1 w-px flex-1 border-l border-dashed border-[#cfcfcf]" />
              <span className="z-[1] h-2.5 w-2.5 rounded-full bg-[#e07a3a]" />
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              <div className="min-w-0">
                <p className="mb-0.5 mt-0 text-[0.72rem] font-bold text-[#2f6b45]">Pickup Location</p>
                <p className="m-0 text-[0.86rem] font-bold text-[#1a1a1a]">{pickupName}</p>
                <p className="mb-0 mt-0.5 text-[0.72rem] leading-snug text-[#8a8a8a]">{pickupAddress}</p>
              </div>
              <div className="min-w-0">
                <p className="mb-0.5 mt-0 text-[0.72rem] font-bold text-[#e07a3a]">Delivery Location</p>
                <p className="m-0 text-[0.86rem] font-bold text-[#1a1a1a]">{dropDistrict}</p>
                <p className="mb-0 mt-0.5 text-[0.72rem] leading-snug text-[#8a8a8a]">{dropAddress}</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-2 mt-0 text-[0.88rem] font-bold text-[#1a1a1a]">Order Items</h2>
          <div className="overflow-hidden rounded-2xl border border-[#ececec] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
            <div className="divide-y divide-[#f0f0f0]">
              {items.map((item, idx) => (
                <div key={`${item.name}-${idx}`} className="flex items-center gap-3 px-3 py-3">
                  <img
                    src={item.image}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-xl bg-[#f5f5f5] object-cover"
                    onError={(e) => {
                      if (e.currentTarget.src.includes(FALLBACK_ITEM_IMAGE)) return;
                      e.currentTarget.src = FALLBACK_ITEM_IMAGE;
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-[0.86rem] font-bold text-[#1a1a1a]">{item.name}</p>
                    <p className="mb-0 mt-0.5 text-[0.7rem] text-[#8a8a8a]">
                      {item.color ? `Color: ${item.color}  ·  ` : null}
                      Qty: {item.qty}
                    </p>
                  </div>
                  <p className="m-0 shrink-0 text-[0.86rem] font-bold text-[#1a1a1a]">
                    {item.price > 0 ? formatMoney(item.price) : '—'}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between bg-[#f7f7f7] px-3 py-2.5">
              <span className="text-[0.78rem] font-semibold text-[#6b6b6b]">Total Items</span>
              <span className="text-[0.78rem] font-bold text-[#1a1a1a]">
                {items.reduce((n, it) => n + it.qty, 0)} Items
              </span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 mt-0 text-[0.88rem] font-bold text-[#1a1a1a]">Delivery Actions</h2>
          <div className="px-1">
            <div className="relative flex items-start justify-between">
              <div className="absolute left-[12%] right-[12%] top-[18px] h-0.5 bg-[#e8e8e8]" />
              {steps.map((step) => (
                <div key={step.key} className="relative z-[1] flex w-1/4 flex-col items-center text-center">
                  <span
                    className={`flex items-center justify-center rounded-full ${
                      step.state === 'current'
                        ? 'h-10 w-10 bg-[#2f6b45] text-white shadow-[0_4px_12px_rgba(47,107,69,0.35)]'
                        : step.state === 'done'
                          ? 'h-9 w-9 bg-[#2f6b45] text-white'
                          : 'h-9 w-9 bg-[#ececec] text-[#9a9a9a]'
                    }`}
                  >
                    <i className={`fa-solid ${step.icon} text-[0.75rem]`} />
                  </span>
                  <p
                    className={`mb-0 mt-2 text-[0.62rem] font-bold leading-tight ${
                      step.state === 'idle' ? 'text-[#9a9a9a]' : 'text-[#1a1a1a]'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mb-0 mt-0.5 text-[0.58rem] text-[#8a8a8a]">{step.time || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t border-[#efefef] bg-white px-4 py-3 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
        {isPending ? (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setRejectOpen(true)}
              className="min-h-[50px] flex-1 rounded-full border border-[#e0b4a8] bg-white text-[0.88rem] font-bold text-[#9b3b2e] disabled:opacity-60"
            >
              Decline
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={accept}
              className="min-h-[50px] flex-[1.35] rounded-full border-0 bg-[#2f6b45] text-[0.88rem] font-bold text-white disabled:opacity-60"
            >
              {busy ? '…' : 'Accept delivery'}
            </button>
          </div>
        ) : isAccepted ? (
          <button
            type="button"
            disabled={busy}
            onClick={startOutForDelivery}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border-0 bg-[#2f6b45] text-[0.92rem] font-bold text-white disabled:opacity-60"
          >
            <i className="fa-solid fa-truck" />
            Out for Delivery
          </button>
        ) : canTrack ? (
          <div className="flex flex-col gap-2">
            <Link
              to={`/app/driver/jobs/${encodeURIComponent(order.id)}/active`}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-[#d8d8d8] bg-white text-[0.88rem] font-bold text-[#1a1a1a] no-underline"
            >
              <i className="fa-solid fa-location-arrow" />
              Location Tracking
            </Link>
            {isTransit ? (
              <button
                type="button"
                disabled={busy}
                onClick={markArrived}
                className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border-0 bg-[#2f6b45] text-[0.92rem] font-bold text-white disabled:opacity-60"
              >
                <i className="fa-solid fa-house-chimney" />
                {busy ? '…' : "I've Arrived"}
              </button>
            ) : (
              <Link
                to={`/app/driver/jobs/${encodeURIComponent(order.id)}/scan`}
                className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border-0 bg-[#2f6b45] text-[0.92rem] font-bold text-white no-underline"
              >
                <i className="fa-solid fa-qrcode" />
                Scan QR to confirm
              </Link>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={goBack}
            className="flex min-h-[50px] w-full items-center justify-center rounded-full border-0 bg-[#f0f0f0] text-[0.88rem] font-bold text-[#3d3d3d]"
          >
            Back to Deliveries
          </button>
        )}
      </div>

      {rejectOpen ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40 sm:items-center sm:justify-center sm:p-4">
          <div className="w-full max-w-md rounded-t-[24px] bg-white p-5 pb-[max(1.1rem,env(safe-area-inset-bottom))] shadow-xl sm:rounded-[24px]">
            <h3 className="mb-2 mt-0 text-[1.05rem] font-bold text-[#1a1a1a]">Decline delivery</h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you declining?"
              className="mb-3 min-h-[96px] w-full resize-none rounded-2xl border border-[#e8e0d6] bg-[#faf8f5] px-3 py-2.5 text-[0.88rem] outline-none focus:border-[#2f6b45]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="min-h-[46px] flex-1 rounded-full border-0 bg-[#f0ebe4] font-bold text-[#3d3d3d]"
                onClick={() => setRejectOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                className="min-h-[46px] flex-1 rounded-full border-0 bg-[#9b3b2e] font-bold text-white disabled:opacity-60"
                onClick={reject}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <DriverCustomerChatSheet
        order={order}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </div>
  );
}
