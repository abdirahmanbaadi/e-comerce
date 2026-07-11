import { useEffect, useState } from 'react';
import StoreNavbar from '../features/nav/StoreNavbar';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { apiUrl } from '../utils/data';
import { formatMoney } from '../utils/format';
import { showTopFloatNotification } from '../utils/notifications';

const STEPS = [
  { key: 'processing', label: 'Processing', icon: 'fa-box-open' },
  { key: 'shipped', label: 'Shipped', icon: 'fa-truck' },
  { key: 'delivered', label: 'Delivered', icon: 'fa-circle-check' },
];

const STATUS_LABEL = {
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_BADGE = {
  processing: 'bg-[#F2ECE1] text-deepGreen ring-1 ring-gold/30',
  shipped: 'bg-nav text-deepGreen ring-1 ring-gold/20',
  delivered: 'bg-deepGreen text-white ring-1 ring-gold/40',
  cancelled: 'bg-softBg text-[#666666] ring-1 ring-black/10',
};

function resolveStatus(order) {
  if (order?.status) return order.status;
  const step = typeof order?.currentStep === 'number' ? order.currentStep : 1;
  if (step === 0) return 'cancelled';
  if (step >= 5) return 'delivered';
  if (step >= 4) return 'shipped';
  return 'processing';
}

function stepIndex(status) {
  const i = STEPS.findIndex((s) => s.key === status);
  return i >= 0 ? i : 0;
}

function GoldLine() {
  return (
    <div className="my-3 flex items-center justify-center gap-3">
      <span className="h-px w-10 bg-gold/35" />
      <span className="text-[0.7rem] text-gold">✦</span>
      <span className="h-px w-10 bg-gold/35" />
    </div>
  );
}

function Stepper({ status }) {
  if (status === 'cancelled') {
    return (
      <p className="m-0 rounded-xl bg-softBg px-4 py-3 text-center text-[0.88rem] font-semibold text-[#666666]">
        <i className="fa-solid fa-ban mr-2 text-gold" />
        Order cancelled before shipment
      </p>
    );
  }

  const active = stepIndex(status);

  return (
    <div>
      <div className="relative mb-4 h-1 overflow-hidden rounded-full bg-[#E8E4DC]">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-deepGreen transition-all duration-700"
          style={{ width: active === 0 ? '16%' : active === 1 ? '50%' : '100%' }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gold/80 transition-all duration-700"
          style={{ width: active === 0 ? '8%' : active === 1 ? '25%' : '100%' }}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {STEPS.map((step, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={[
                  'flex h-10 w-10 items-center justify-center rounded-full text-[0.88rem] transition-all',
                  done
                    ? 'bg-deepGreen text-white shadow-[0_4px_12px_rgba(7,61,53,0.2)]'
                    : current
                      ? 'bg-base text-deepGreen ring-2 ring-gold'
                      : 'bg-softBg text-[#AAAAAA]',
                ].join(' ')}
              >
                <i className={`fa-solid ${step.icon}`} />
              </span>
              <span
                className={[
                  'text-[0.72rem] font-bold',
                  done || current ? 'text-deepGreen' : 'text-[#999999]',
                ].join(' ')}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatChip({ icon, label, value, highlight }) {
  return (
    <div className="rounded-xl border border-black/[0.05] bg-softBg/60 px-3 py-2.5">
      <div className="mb-1 flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wide text-[#888888]">
        <i className={`fa-solid ${icon} text-gold`} />
        {label}
      </div>
      <p className={`m-0 truncate text-[0.84rem] font-bold ${highlight || 'text-deepGreen'}`}>
        {value || '—'}
      </p>
    </div>
  );
}

export default function TrackOrder() {
  const { syncFromStorage: syncAuth } = useAuth();
  const { syncFromStorage: syncCart } = useCart();

  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState('');
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    syncAuth();
    syncCart();
  }, [syncAuth, syncCart]);

  useEffect(() => {
    const last = localStorage.getItem('lastTrackingCode');
    if (last) setOrderId(last);
  }, []);

  const trackOrder = async (e) => {
    e?.preventDefault();
    const code = orderId.trim().toUpperCase().replace(/^#/, '');
    if (!code) {
      showTopFloatNotification('Please enter your Order ID!', 'danger');
      return;
    }

    setLoading(true);
    setNotFound('');
    setOrder(null);

    try {
      const res = await fetch(apiUrl(`/api/orders/track/${encodeURIComponent(code)}`));
      const data = await res.json();
      if (data.success && data.order) {
        localStorage.setItem('lastTrackingCode', data.order.id || code);
        setOrder({ ...data.order, status: resolveStatus(data.order) });
      } else {
        setNotFound(data.message || 'Order not found.');
      }
    } catch {
      setNotFound('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setOrder(null);
    setNotFound('');
  };

  const cancelOrder = async () => {
    if (!order?.id) return;
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
        setOrder({ ...data.order, status: resolveStatus(data.order) });
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

  const status = order ? resolveStatus(order) : null;
  const canCancel = status === 'processing';
  const items = order?.items?.length
    ? order.items
    : order
      ? [{ title: order.product, quantity: 1, price: order.amount }]
      : [];
  const isPaid = order?.paymentType === 'paid';
  const itemSummary = items
    .map((item) => `${item.title} ×${item.quantity || 1}`)
    .join(' · ');

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-softBg font-sans text-[#111]">
      <StoreNavbar />

      <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-5">
        <div className="w-full max-w-[640px] animate-cardRise">
          <div className="overflow-hidden rounded-[28px] border border-black/[0.06] bg-base shadow-[0_20px_50px_rgba(7,61,53,0.1)]">
            {/* Header */}
            <div className="border-b border-black/[0.05] bg-[linear-gradient(180deg,#FAF8F2_0%,#F4EFE6_100%)] px-6 py-5 text-center sm:px-8">
              <span className="mb-2 inline-block text-[0.72rem] font-extrabold uppercase tracking-[2.5px] text-gold">
                Delivery Tracking
              </span>
              <h1 className="mb-0 font-display text-[2rem] font-bold text-deepGreen sm:text-[2.35rem]">
                Track Your Order
              </h1>
              <GoldLine />
              <p className="mx-auto mb-0 max-w-[400px] text-[0.84rem] leading-relaxed text-[#666666]">
                Geli Order ID-gaaga si aad u aragto xaaladda dalabkaaga.
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-5 sm:px-8 sm:py-6">
              {!order ? (
                <form onSubmit={trackOrder}>
                  <label htmlFor="trackingInput" className="mb-2 block text-[0.8rem] font-bold text-deepGreen">
                    Order ID
                  </label>
                  <div className="flex flex-col gap-2.5 sm:flex-row">
                    <div className="relative min-w-0 flex-1">
                      <i className="fa-regular fa-file-lines pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gold" />
                      <input
                        id="trackingInput"
                        type="text"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        placeholder="MF-260703-962"
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
                    <p
                      className="mt-3 flex items-center gap-2 rounded-xl border border-gold/30 bg-[#FBF7EE] px-3 py-2.5 text-[0.84rem] font-semibold text-deepGreen"
                      role="alert"
                    >
                      <i className="fa-solid fa-circle-exclamation text-gold" />
                      {notFound}
                    </p>
                  )}

                  <p className="mt-4 mb-0 text-center text-[0.78rem] text-[#888888]">
                    Order ID-ga waxaad ka heli kartaa SMS, email, ama{' '}
                    <strong className="text-deepGreen">My Orders</strong>.
                  </p>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="mb-0.5 text-[0.68rem] font-bold uppercase tracking-wider text-[#888888]">
                        Order ID
                      </p>
                      <p className="truncate font-display text-[1.25rem] font-bold text-deepGreen">{order.id}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[0.68rem] font-extrabold uppercase tracking-wide ${STATUS_BADGE[status] || STATUS_BADGE.processing}`}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                      <button
                        type="button"
                        onClick={resetSearch}
                        title="Track another order"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.08] bg-white text-[#888888] transition hover:border-gold/40 hover:text-deepGreen"
                      >
                        <i className="fa-solid fa-rotate-left text-[0.78rem]" />
                      </button>
                    </div>
                  </div>

                  <Stepper status={status} />

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <StatChip icon="fa-user" label="Customer" value={order.customer} />
                    <StatChip icon="fa-tag" label="Total" value={order.amount} />
                    <StatChip
                      icon={isPaid ? 'fa-circle-check' : 'fa-clock'}
                      label="Payment"
                      value={order.payment}
                      highlight={isPaid ? 'text-deepGreen' : 'text-gold'}
                    />
                    <StatChip icon="fa-calendar-days" label="ETA" value={order.estimate} />
                  </div>

                  <div className="rounded-xl border border-black/[0.05] bg-softBg/50 px-4 py-3">
                    <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-wide text-[#888888]">
                      Items
                    </p>
                    <p className="mb-2 line-clamp-2 text-[0.84rem] font-semibold text-[#333333]">{itemSummary}</p>
                    <div className="flex items-start gap-2 border-t border-black/[0.05] pt-2">
                      <i className="fa-solid fa-location-dot mt-0.5 shrink-0 text-[0.8rem] text-gold" />
                      <p className="m-0 line-clamp-2 text-[0.8rem] leading-snug text-[#666666]">
                        {order.address || '—'}
                      </p>
                    </div>
                    {order.driver && order.driver !== 'Not assigned yet' && (
                      <div className="mt-2 flex items-center gap-2 text-[0.8rem] text-[#666666]">
                        <i className="fa-solid fa-id-badge text-gold" />
                        Driver: <span className="font-semibold text-deepGreen">{order.driver}</span>
                      </div>
                    )}
                    {items.length === 1 && typeof items[0].price === 'number' && (
                      <p className="mb-0 mt-2 text-right text-[0.88rem] font-bold text-deepGreen">
                        {formatMoney(items[0].price * (items[0].quantity || 1))}
                      </p>
                    )}
                  </div>

                  {canCancel && (
                    <button
                      type="button"
                      onClick={cancelOrder}
                      disabled={cancelling}
                      className="w-full rounded-xl border border-black/[0.1] bg-white py-2.5 text-[0.82rem] font-bold text-[#666666] transition hover:border-gold/40 hover:text-deepGreen disabled:opacity-60"
                    >
                      <i className={`fa-solid ${cancelling ? 'fa-spinner fa-spin' : 'fa-xmark'} mr-1.5 text-gold`} />
                      {cancelling ? 'Cancelling…' : 'Cancel Order'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
