import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { apiUrl } from '../../utils/data';
import {
  countDriverOrdersByPhase,
  filterDriverOrders,
  sortDriverOrders,
} from '../../features/driver/driverShared';
import { showTopFloatNotification } from '../../utils/notifications';

export default function useDriverData() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [driverStatus, setDriverStatus] = useState('available');
  const [activeDeliveries, setActiveDeliveries] = useState(0);
  const [earnings, setEarnings] = useState({
    totalRevenue: 0,
    weekRevenue: 0,
    completedDeliveries: 0,
    weekDeliveries: 0,
  });

  const loadOrders = useCallback(async ({ quiet = false } = {}) => {
    const token = localStorage.getItem('token');
    if (!token) return [];
    if (quiet) setRefreshing(true);
    try {
      const res = await fetch(apiUrl('/api/orders'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const next = data.orders || [];
        setOrders(next);
        return next;
      }
      if (!quiet) showTopFloatNotification('Could not load jobs.', 'danger');
      return [];
    } catch {
      if (!quiet) showTopFloatNotification('Could not load jobs.', 'danger');
      return [];
    } finally {
      if (!quiet) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadStatus = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(apiUrl('/api/drivers/my-status'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDriverStatus(data.driverStatus || 'available');
        setActiveDeliveries(data.activeDeliveries || 0);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const loadEarnings = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(apiUrl('/api/drivers/my-earnings'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.earnings) setEarnings(data.earnings);
    } catch {
      /* ignore */
    }
  }, []);

  const refreshAll = useCallback(
    async (quiet = true) => {
      await Promise.all([loadOrders({ quiet }), loadStatus(), loadEarnings()]);
    },
    [loadOrders, loadStatus, loadEarnings]
  );

  const setAvailability = useCallback(async (nextStatus) => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const res = await fetch(apiUrl('/api/drivers/my-status'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setDriverStatus(data.driverStatus || nextStatus);
        setActiveDeliveries(data.activeDeliveries || 0);
        return true;
      }
      showTopFloatNotification(data.message || 'Could not update status.', 'danger');
      return false;
    } catch {
      showTopFloatNotification('Connection failed.', 'danger');
      return false;
    }
  }, []);

  useEffect(() => {
    if (!user?.isLoggedIn) return;
    refreshAll(false);
  }, [user?.isLoggedIn, refreshAll]);

  const handleNewNotifications = useCallback(
    (freshItems) => {
      if (!freshItems.some((item) => item.type === 'delivery_assigned')) return;
      refreshAll(true);
      showTopFloatNotification('New delivery request.');
    },
    [refreshAll]
  );

  const {
    items: notifications,
    unreadCount: notificationUnread,
    loading: notificationsLoading,
    error: notificationsError,
    refresh: refreshNotifications,
    markRead: markNotificationRead,
    markAllRead: markAllNotificationsRead,
  } = useNotifications({
    enabled: Boolean(user?.isLoggedIn),
    pollMs: 30000,
    onNewItems: handleNewNotifications,
  });

  const assigned = useMemo(() => sortDriverOrders(filterDriverOrders(orders)), [orders]);
  const counts = useMemo(() => countDriverOrdersByPhase(orders), [orders]);
  const pendingCount = useMemo(
    () => notifications.filter((n) => n.type === 'delivery_assigned' && n.unread).length,
    [notifications]
  );

  return {
    user,
    orders: assigned,
    allOrders: orders,
    loading,
    refreshing,
    driverStatus,
    activeDeliveries,
    earnings,
    counts,
    pendingCount,
    notifications,
    notificationUnread,
    notificationsLoading,
    notificationsError,
    refreshNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    refreshAll,
    setAvailability,
    loadOrders,
  };
}
