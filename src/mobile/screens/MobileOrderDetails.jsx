import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchTrackedOrder } from '../../features/tracking/orderTrackingShared';
import { apiUrl } from '../../utils/data';
import { formatMoney, productImage } from '../../utils/format';
import { downloadInvoice } from '../../utils/invoiceActions';
import { showTopFloatNotification } from '../../utils/notifications';
import { resolveOrderStatus } from '../../utils/orderStatus';
import { findMockOrder, updateMockOrderAddress } from '../mockOrders';
import { MOCK_REVIEW_INBOX } from '../mockReviewInbox';
import MobileReviewSheet from '../MobileReviewSheet';

const STATUS_META = {
  processing: {
    label: 'Processing',
    badge: 'bg-[#eaf2ff] text-[#2b59db]',
  },
  shipped: {
    label: 'Out for Delivery',
    badge: 'bg-[#e8f1ff] text-[#2563eb]',
  },
  delivered: {
    label: 'Delivered',
    badge: 'bg-[#e8f7ee] text-[#087443]',
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-[#fdecec] text-[#c0392b]',
  },
};

function formatLongDateTime(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value || '');
  return parsed.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function moneyNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return parseFloat(String(value || 0).replace(/[^0-9.]/g, '')) || 0;
}

export default function MobileOrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const backTo =
    typeof location.state?.from === 'string' && location.state.from.startsWith('/app/')
      ? location.state.from
      : '/app/profile/orders';
  const [order, setOrder] = useState(() => findMockOrder(orderId));
  const [loading, setLoading] = useState(!findMockOrder(orderId));
  const [loadError, setLoadError] = useState('');
  const [reviewSession, setReviewSession] = useState(null);
  const [sheetTarget, setSheetTarget] = useState(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const mock = findMockOrder(orderId);
    if (mock) {
      setOrder(mock);
      setLoading(false);
      setLoadError('');
      return undefined;
    }

    setLoading(true);
    setLoadError('');
    fetchTrackedOrder(orderId)
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setOrder(result.order);
          setLoadError('');
        } else {
          setOrder(null);
          setLoadError(result.message || 'Order not found.');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOrder(null);
          setLoadError('Could not connect to server.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const loadReviewSession = async () => {
    const token = localStorage.getItem('token');
    if (!orderId) {
      setReviewSession(null);
      return null;
    }

    const mockSession =
      (MOCK_REVIEW_INBOX.toRate || []).find((s) => String(s.orderId) === String(orderId)) || null;

    if (!token || !user?.isLoggedIn) {
      setReviewSession(mockSession);
      return mockSession;
    }
    try {
      const res = await fetch(apiUrl('/api/reviews/inbox'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        const session =
          (data.toRate || []).find((s) => String(s.orderId) === String(orderId)) || null;
        if (session) {
          setReviewSession(session);
          return session;
        }
      }
    } catch {
      /* use mock fallback */
    }

    setReviewSession(mockSession);
    return mockSession;
  };

  useEffect(() => {
    if (!user?.isLoggedIn || !orderId) return undefined;
    loadReviewSession();
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.isLoggedIn, orderId, order?.id]);

  const details = useMemo(() => {
    if (!order) return null;
    const status = resolveOrderStatus(order);
    const meta = STATUS_META[status] || STATUS_META.processing;

    const items = (order.items || []).map((item) => ({
      ...item,
      quantity: Math.max(1, Number(item.quantity) || 1),
      price: moneyNumber(item.price ?? item.unitPrice),
      image: productImage(item.image || ''),
    }));

    const subtotal =
      moneyNumber(order.subtotal) ||
      items.reduce((sum, item) => sum + item.price * item.quantity, 0) ||
      moneyNumber(order.amount || order.total);
    const deliveryFee = moneyNumber(order.deliveryFee ?? order.shippingFee ?? 0);
    const discount = moneyNumber(order.discount);
    const total = moneyNumber(order.total ?? order.amount) || Math.max(0, subtotal + deliveryFee - discount);

    return {
      status,
      meta,
      items,
      subtotal,
      deliveryFee,
      discount,
      total,
      customer: order.customer || order.customerName || 'Customer',
      phone: order.phone || '',
      address: order.address || 'Mogadishu, Somalia',
      canChangeAddress: status === 'processing',
    };
  }, [order]);

  useEffect(() => {
    setEditingAddress(false);
    setAddressDraft(order?.address || '');
  }, [order?.id, order?.address]);

  const showRateSection = Boolean(reviewSession);

  const copyOrderId = async () => {
    const id = String(order?.id || '').replace(/^#/, '');
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(true);
      showTopFloatNotification('Order ID copied.');
      window.setTimeout(() => setCopiedId(false), 1600);
    } catch {
      showTopFloatNotification('Could not copy Order ID.', 'danger');
    }
  };

  const openAddressEditor = () => {
    if (!details?.canChangeAddress) {
      showTopFloatNotification('Address can only be changed before shipment.', 'warning');
      return;
    }
    setAddressDraft(details.address || '');
    setEditingAddress(true);
  };

  const saveAddress = async () => {
    const next = addressDraft.trim();
    if (next.length < 8) {
      showTopFloatNotification('Please enter a fuller delivery address.', 'warning');
      return;
    }
    if (!order?.id) return;

    setSavingAddress(true);
    try {
      const mock = findMockOrder(order.id);
      if (mock) {
        const updated = updateMockOrderAddress(order.id, next);
        if (updated) setOrder(updated);
        showTopFloatNotification('Delivery address updated.');
        setEditingAddress(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        showTopFloatNotification('Please sign in to update the address.', 'danger');
        return;
      }
      const res = await fetch(apiUrl(`/api/orders/${encodeURIComponent(order.id)}/address`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ address: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        showTopFloatNotification(data.message || 'Could not update address.', 'danger');
        return;
      }
      setOrder((prev) => ({ ...(prev || {}), address: next, ...(data.order || {}) }));
      showTopFloatNotification('Delivery address updated.');
      setEditingAddress(false);
    } catch {
      showTopFloatNotification('Connection failed.', 'danger');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleInvoice = () => {
    if (!order || !details) return;
    downloadInvoice({
      trackingCode: order.id,
      customer: details.customer,
      phone: details.phone,
      address: details.address,
      date: order.date,
      items: details.items.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: details.subtotal,
      deliveryFee: details.deliveryFee,
      discount: details.discount,
      total: formatMoney(details.total),
    });
  };

  const continueRating = () => {
    if (!reviewSession) {
      navigate(`/app/profile/reviews?orderId=${encodeURIComponent(orderId)}`);
      return;
    }
    const localOnly = String(reviewSession.orderId || '').startsWith('ORD-2024-');
    if (reviewSession.delivery?.status === 'missing') {
      setSheetTarget({
        type: 'delivery',
        orderId: reviewSession.orderId,
        driverName: reviewSession.delivery?.driverName,
        localOnly,
      });
      return;
    }
    const nextProduct = (reviewSession.products || []).find((p) => p.status === 'missing');
    if (nextProduct) {
      setSheetTarget({
        type: 'product',
        orderId: reviewSession.orderId,
        productId: nextProduct.productId,
        title: nextProduct.title,
        image: nextProduct.image,
        localOnly,
      });
      return;
    }
    navigate(`/app/profile/reviews?orderId=${encodeURIComponent(orderId)}`);
  };

  const afterSubmit = async (target, rating, comment) => {
    if (target?.localOnly) {
      setSheetTarget(null);
      // Refresh from static mock shape for next missing item
      const session =
        (MOCK_REVIEW_INBOX.toRate || []).find((s) => String(s.orderId) === String(orderId)) || null;
      setReviewSession(session);
      navigate(`/app/profile/reviews?orderId=${encodeURIComponent(orderId)}`);
      return;
    }

    const session = await loadReviewSession();
    if (!session) {
      setSheetTarget(null);
      return;
    }
    if (session.delivery?.status === 'missing') {
      setSheetTarget({
        type: 'delivery',
        orderId: session.orderId,
        driverName: session.delivery?.driverName,
      });
      return;
    }
    const nextProduct = (session.products || []).find((p) => p.status === 'missing');
    if (nextProduct) {
      setSheetTarget({
        type: 'product',
        orderId: session.orderId,
        productId: nextProduct.productId,
        title: nextProduct.title,
        image: nextProduct.image,
      });
      return;
    }
    setSheetTarget(null);
  };

  return (
    <div className="mmf-pwa min-h-[100dvh] bg-[#fff7ed] font-sans text-[#111111]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#f0e9df] bg-[#fff7ed] px-4 py-3 pt-[max(0.7rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => navigate(backTo)}
          className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white text-[#2f241a] shadow-sm"
          aria-label="Back to orders"
        >
          <i className="fa-solid fa-chevron-left text-[0.85rem]" />
        </button>
        <h1 className="m-0 text-[0.98rem] font-black text-[#2f241a]">Order Details</h1>
        <button
          type="button"
          onClick={() => navigate('/app/profile/support')}
          className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white text-[#2f241a] shadow-sm"
          aria-label="Support"
        >
          <i className="fa-solid fa-headset text-[0.95rem]" />
        </button>
      </header>

      <main className="mx-auto max-w-md px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-4">
        {loading ? (
          <p className="py-16 text-center text-[0.86rem] font-semibold text-[#8b8178]">Loading order...</p>
        ) : loadError || !order || !details ? (
          <section className="rounded-[22px] bg-white px-5 py-8 text-center shadow-sm ring-1 ring-[#eee7df]">
            <p className="m-0 text-[0.86rem] font-semibold text-[#8b8178]">{loadError || 'Order not found.'}</p>
            <button
              type="button"
              onClick={() => navigate(backTo)}
              className="mt-4 rounded-full border-0 bg-[#111111] px-5 py-2.5 text-[0.78rem] font-black text-white"
            >
              Back to Orders
            </button>
          </section>
        ) : (
          <>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="m-0 truncate text-[1.05rem] font-black text-[#1c140e]">#{order.id}</h2>
                  <button
                    type="button"
                    onClick={copyOrderId}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-0 bg-white text-[#6b4228] shadow-sm ring-1 ring-[#eadfce]"
                    aria-label="Copy order ID"
                    title="Copy order ID"
                  >
                    <i className={`fa-solid ${copiedId ? 'fa-check' : 'fa-copy'} text-[0.75rem]`} />
                  </button>
                </div>
                <p className="mb-0 mt-1 text-[0.78rem] font-semibold text-[#8b8178]">
                  {formatLongDateTime(order.date || order.createdAt)}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] font-black ${details.meta.badge}`}>
                {details.meta.label}
              </span>
            </div>

            {showRateSection ? (
              <section className="mb-5 rounded-[18px] bg-white px-4 py-3.5 shadow-sm ring-1 ring-[#f0e9df]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="m-0 text-[0.95rem] font-black text-[#1c140e]">Rate this order</h3>
                    <p className="mb-0 mt-1 text-[0.78rem] font-semibold text-[#8b8178]">
                      {reviewSession
                        ? `${reviewSession.progress?.rated || 0} of ${reviewSession.progress?.total || 0} rated · delivery & products`
                        : 'Rate delivery and each piece after delivery'}
                    </p>
                  </div>
                  <i className="fa-regular fa-star mt-0.5 text-[#d4a017]" />
                </div>
                {reviewSession ? (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#efe7dc]">
                    <div
                      className="h-full rounded-full bg-[#6b4228]"
                      style={{
                        width: `${
                          reviewSession.progress?.total
                            ? Math.round(
                                (reviewSession.progress.rated / reviewSession.progress.total) * 100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                ) : null}
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={continueRating}
                    className="flex min-h-[44px] flex-1 items-center justify-center rounded-full border-0 bg-[#6b4228] text-[0.82rem] font-black text-white"
                  >
                    {reviewSession ? 'Continue rating' : 'Rate order'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/app/profile/reviews?orderId=${encodeURIComponent(order.id)}`)
                    }
                    className="flex min-h-[44px] items-center justify-center rounded-full border border-[#eadfce] bg-white px-4 text-[0.82rem] font-black text-[#6b4228]"
                  >
                    Reviews
                  </button>
                </div>
              </section>
            ) : null}

            <section className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="m-0 text-[0.95rem] font-black text-[#1c140e]">Delivery Address</h3>
                {details.canChangeAddress && !editingAddress ? (
                  <button
                    type="button"
                    onClick={openAddressEditor}
                    className="border-0 bg-transparent p-0 text-[0.78rem] font-black text-[#8a5a33]"
                  >
                    Change
                  </button>
                ) : null}
              </div>
              <div className="rounded-[18px] bg-white px-4 py-3.5 shadow-sm ring-1 ring-[#f0e9df]">
                <p className="m-0 text-[0.88rem] font-black text-[#1c140e]">{details.customer}</p>
                {editingAddress ? (
                  <div className="mt-2 space-y-2.5">
                    <textarea
                      value={addressDraft}
                      onChange={(e) => setAddressDraft(e.target.value)}
                      rows={3}
                      maxLength={300}
                      className="w-full resize-none rounded-xl border border-[#eadfce] bg-[#faf7f2] px-3 py-2.5 text-[0.84rem] font-semibold text-[#1c140e] outline-none focus:border-[#6b4228]"
                      placeholder="Street, district, Mogadishu…"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAddress(false);
                          setAddressDraft(details.address || '');
                        }}
                        className="flex min-h-[42px] flex-1 items-center justify-center rounded-full border border-[#eadfce] bg-white text-[0.8rem] font-black text-[#6b4228]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveAddress}
                        disabled={savingAddress}
                        className="flex min-h-[42px] flex-[1.2] items-center justify-center rounded-full border-0 bg-[#6b4228] text-[0.8rem] font-black text-white disabled:opacity-60"
                      >
                        {savingAddress ? 'Saving…' : 'Save address'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mb-0 mt-1 text-[0.78rem] font-semibold leading-relaxed text-[#7d6d60]">
                    {details.address}
                  </p>
                )}
              </div>
            </section>

            <section className="mb-5">
              <h3 className="mb-2 mt-0 text-[0.95rem] font-black text-[#1c140e]">
                Items ({details.items.reduce((sum, item) => sum + item.quantity, 0) || 1})
              </h3>
              <div className="space-y-2.5">
                {(details.items.length
                  ? details.items
                  : [{ title: order.product || 'Order item', quantity: 1, price: details.total }]
                ).map((item, index) => (
                  <div
                    key={`${item.title}-${index}`}
                    className="flex items-center gap-3 rounded-[18px] bg-white p-2.5 shadow-sm ring-1 ring-[#f0e9df]"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#efe7dc]">
                      {item.image ? (
                        <img src={item.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#cbbba8]">
                          <i className="fa-solid fa-couch" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-[0.86rem] font-black text-[#1c140e]">{item.title}</p>
                      {item.color ? (
                        <p className="mb-0 mt-0.5 text-[0.72rem] font-semibold text-[#8b8178]">
                          Color: {item.color}
                        </p>
                      ) : null}
                      <p className="mb-0 mt-0.5 text-[0.72rem] font-semibold text-[#8b8178]">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="m-0 text-[0.88rem] font-black text-[#1c140e]">
                      {formatMoney(item.price * item.quantity || details.total)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[18px] bg-white px-4 py-3.5 shadow-sm ring-1 ring-[#f0e9df]">
              <div className="flex items-center justify-between text-[0.82rem] font-semibold text-[#7d6d60]">
                <span>Subtotal</span>
                <span>{formatMoney(details.subtotal)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[0.82rem] font-semibold text-[#7d6d60]">
                <span>Delivery Fee</span>
                <span>{formatMoney(details.deliveryFee)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[0.82rem] font-semibold text-[#7d6d60]">
                <span>Discount</span>
                <span>
                  {details.discount > 0 ? `-${formatMoney(details.discount)}` : formatMoney(0)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-[#eadfce] pt-3">
                <span className="text-[1.05rem] font-black text-[#6b4228]">Total</span>
                <span className="text-[1.05rem] font-black text-[#6b4228]">
                  {formatMoney(details.total)}
                </span>
              </div>
            </section>
          </>
        )}
      </main>

      {order && details ? (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-[#f0e9df] bg-[#fff7ed] px-4 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-3">
          <button
            type="button"
            onClick={handleInvoice}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border-0 bg-[#6b4228] text-[0.86rem] font-black text-white"
          >
            <i className="fa-regular fa-file-lines" />
            View Invoice
          </button>
        </div>
      ) : null}

      <MobileReviewSheet
        open={Boolean(sheetTarget)}
        target={sheetTarget}
        onClose={() => setSheetTarget(null)}
        onSubmitted={afterSubmit}
      />
    </div>
  );
}
