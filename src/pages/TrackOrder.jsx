import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import StoreNavbar from '../features/nav/StoreNavbar';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { apiUrl } from '../utils/data';
import {
  OrderTrackingResults,
  OrderTrackingSearchCard,
  fetchTrackedOrder,
  resolveTrackStatus,
  trackOrderIdOrNotify,
} from '../features/tracking/orderTrackingShared';
import { showTopFloatNotification } from '../utils/notifications';

export default function TrackOrder() {
  const { syncFromStorage: syncAuth } = useAuth();
  const { syncFromStorage: syncCart } = useCart();
  const [searchParams] = useSearchParams();
  const bootstrapped = useRef(false);

  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [activities, setActivities] = useState([]);
  const [notFound, setNotFound] = useState('');
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const openQrFromQuery = searchParams.get('qr') === '1';

  useEffect(() => {
    syncAuth();
    syncCart();
  }, [syncAuth, syncCart]);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    const fromQuery = searchParams.get('order') || searchParams.get('id') || '';
    const last = fromQuery || localStorage.getItem('lastTrackingCode') || '';
    if (last) {
      setOrderId(last);
      trackOrderById(last);
    }
  }, [searchParams]);

  const trackOrderById = async (rawCode) => {
    const code = trackOrderIdOrNotify(rawCode);
    if (!code) return;

    setLoading(true);
    setNotFound('');
    setOrder(null);
    setActivities([]);
    setItemsModalOpen(false);

    try {
      const result = await fetchTrackedOrder(code);
      if (result.success) {
        localStorage.setItem('lastTrackingCode', result.orderId);
        setOrderId(result.orderId);
        setOrder(result.order);
        setActivities(result.activities);
      } else {
        setNotFound(result.message || 'Order not found.');
      }
    } catch {
      setNotFound('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const trackOrder = async (e) => {
    e?.preventDefault();
    await trackOrderById(orderId);
  };

  const resetSearch = () => {
    setOrder(null);
    setActivities([]);
    setNotFound('');
    setItemsModalOpen(false);
    setOrderId('');
    localStorage.removeItem('lastTrackingCode');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        setOrder({ ...data.order, status: resolveTrackStatus(data.order) });
        showTopFloatNotification(data.message || 'Order cancelled.');
      } else {
        showTopFloatNotification(data.message || 'Could not cancel.', 'danger');
      }
    } catch {
      showTopFloatNotification('Server error.', 'danger');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#F3F4F6] font-sans text-[#111]">
      <StoreNavbar />

      <main className="mx-auto max-w-[940px] px-4 py-4 sm:py-5">
        {!order ? (
          <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-[560px] items-center justify-center">
            <div className="w-full">
              <OrderTrackingSearchCard
                orderId={orderId}
                onOrderIdChange={(e) => setOrderId(e.target.value)}
                loading={loading}
                notFound={notFound}
                onSubmit={trackOrder}
                helperText={
                  <>
                    Order ID-ga waxaad ka heli kartaa SMS, email, ama{' '}
                    <strong className="text-deepGreen">My Orders</strong>.
                  </>
                }
              />
            </div>
          </div>
        ) : (
          <OrderTrackingResults
            order={order}
            activities={activities}
            onReset={resetSearch}
            onCancel={cancelOrder}
            cancelling={cancelling}
            itemsModalOpen={itemsModalOpen}
            onItemsModalOpen={() => setItemsModalOpen(true)}
            onItemsModalClose={() => setItemsModalOpen(false)}
            initialQrOpen={openQrFromQuery}
          />
        )}
      </main>
    </div>
  );
}
