import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../utils/data';
import {
  OrderTrackingResults,
  OrderTrackingSearchCard,
  fetchTrackedOrder,
  resolveTrackStatus,
  trackOrderIdOrNotify,
} from '../tracking/orderTrackingShared';
import { showTopFloatNotification } from '../../utils/notifications';

export default function ProfileTrackOrderTab({ initialOrderId = '' }) {
  const { user } = useAuth();
  const [, setSearchParams] = useSearchParams();

  const [orderId, setOrderId] = useState(initialOrderId || '');
  const [order, setOrder] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [itemsModalOpen, setItemsModalOpen] = useState(false);

  const trackById = async (rawCode) => {
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

  useEffect(() => {
    if (initialOrderId) {
      setOrderId(initialOrderId);
      trackById(initialOrderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrderId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await trackById(orderId);
  };

  const resetSearch = () => {
    setOrder(null);
    setActivities([]);
    setNotFound('');
    setItemsModalOpen(false);
    setOrderId('');
    setSearchParams({ tab: 'track' });
  };

  const cancelOrder = async () => {
    if (!order?.id) return;
    if (!window.confirm('Cancel this order? Only possible before out for delivery.')) return;

    setCancelling(true);
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(apiUrl(`/api/orders/cancel/${encodeURIComponent(order.id)}`), {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ phone: user?.phone || order.phone }),
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

  if (!order) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center px-2 py-6 sm:py-10">
        <div className="w-full max-w-[560px]">
          <OrderTrackingSearchCard
            inputId="profileTrackInput"
            orderId={orderId}
            onOrderIdChange={(e) => setOrderId(e.target.value)}
            loading={loading}
            notFound={notFound}
            onSubmit={handleSubmit}
            helperText={
              <>
                Order ID-ga waxaad ka heli kartaa SMS, email, ama{' '}
                <strong className="text-deepGreen">My Orders</strong>.
              </>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[940px]">
      <OrderTrackingResults
        order={order}
        activities={activities}
        onReset={resetSearch}
        backLabel="Back to search"
        onCancel={cancelOrder}
        cancelling={cancelling}
        itemsModalOpen={itemsModalOpen}
        onItemsModalOpen={() => setItemsModalOpen(true)}
        onItemsModalClose={() => setItemsModalOpen(false)}
      />
    </div>
  );
}
