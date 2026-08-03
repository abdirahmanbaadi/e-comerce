import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../utils/data';
import { formatMoney } from '../../utils/format';
import { DeliveryQrModal } from '../../features/tracking/DeliveryQrPanel';
import { AppTopBar } from '../MobileUi';

function statusTone(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'delivered') return 'bg-emerald-100 text-emerald-800';
  if (s === 'shipped') return 'bg-blue-100 text-blue-800';
  if (s === 'cancelled') return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-900';
}

export default function MobileOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrOrder, setQrOrder] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(apiUrl('/api/orders'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!cancelled && data.success) setOrders(data.orders || []);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <div className="animate-cardRise">
      <AppTopBar title="Orders" subtitle="Track & delivery QR" />
      <main className="space-y-3 px-4 pb-8 pt-4">
        {!user?.isLoggedIn ? (
          <div className="rounded-[24px] bg-white px-5 py-10 text-center shadow-sm">
            <p className="m-0 text-[0.95rem] font-extrabold text-deepGreen">Sign in to see orders</p>
            <Link to="/login" className="mt-4 inline-flex min-h-[44px] items-center rounded-2xl bg-deepGreen px-5 text-[0.86rem] font-extrabold text-white no-underline">
              Login
            </Link>
          </div>
        ) : loading ? (
          <p className="text-center text-[0.88rem] font-semibold text-[#888]">Loading…</p>
        ) : orders.length === 0 ? (
          <div className="rounded-[24px] bg-white px-5 py-10 text-center shadow-sm">
            <p className="m-0 font-extrabold text-deepGreen">No orders yet</p>
            <Link to="/app/shop" className="mt-4 inline-flex text-[0.86rem] font-bold text-teal no-underline">
              Start shopping
            </Link>
          </div>
        ) : (
          orders.map((order) => {
            const qrReady = order.deliveryQrPending || order.deliveryConfirmStatus === 'pending';
            return (
              <article key={order.id} className="rounded-[22px] border border-black/[0.04] bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="m-0 font-mono text-[0.82rem] font-extrabold text-deepGreen">{order.id}</p>
                    <p className="mb-0 mt-1 text-[0.78rem] font-semibold text-[#888]">{order.date || order.product}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-extrabold capitalize ${statusTone(order.status)}`}>
                    {order.status || 'processing'}
                  </span>
                </div>
                <p className="mb-0 mt-3 text-[1.05rem] font-black text-[#1a2e28]">
                  {order.amount?.startsWith?.('$') ? order.amount : formatMoney(order.amount)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    to={`/track-order?order=${encodeURIComponent(order.id)}${qrReady ? '&qr=1' : ''}`}
                    className="inline-flex min-h-[40px] items-center rounded-xl bg-deepGreen/10 px-3 text-[0.78rem] font-extrabold text-deepGreen no-underline"
                  >
                    Track
                  </Link>
                  {qrReady && (
                    <button
                      type="button"
                      onClick={() => setQrOrder(order)}
                      className="inline-flex min-h-[40px] items-center rounded-xl border-0 bg-emerald-600 px-3 text-[0.78rem] font-extrabold text-white"
                    >
                      <i className="fa-solid fa-qrcode me-1.5" /> QR code
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </main>

      <DeliveryQrModal
        open={Boolean(qrOrder)}
        onClose={() => setQrOrder(null)}
        orderId={qrOrder?.id}
        phone={qrOrder?.phone || ''}
      />
    </div>
  );
}
