import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUrl } from '../utils/data';

export function useNotifications({ enabled = true, pollMs = 20000 } = {}) {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setItems([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    try {
      const [listRes, countRes] = await Promise.all([
        fetch(apiUrl('/api/notifications'), { headers: getHeaders() }),
        fetch(apiUrl('/api/notifications/unread-count'), { headers: getHeaders() }),
      ]);

      const listData = await listRes.json();
      const countData = await countRes.json();

      if (!mountedRef.current) return;

      if (listData.success) {
        setItems(listData.notifications || []);
      }
      if (countData.success) {
        setUnreadCount(countData.count || 0);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id) => {
    const token = localStorage.getItem('token');
    if (!token || !id) return;

    try {
      await fetch(apiUrl(`/api/notifications/${id}/read`), {
        method: 'PATCH',
        headers: getHeaders(),
      });
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, unread: false, read: true, dot: 'grey' } : item))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch(apiUrl('/api/notifications/read-all'), {
        method: 'PATCH',
        headers: getHeaders(),
      });
      setItems((prev) => prev.map((item) => ({ ...item, unread: false, read: true, dot: 'grey' })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all read:', error);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, pollMs);
    return () => clearInterval(interval);
  }, [enabled, fetchNotifications, pollMs]);

  return {
    items,
    unreadCount,
    loading,
    refresh: fetchNotifications,
    markRead,
    markAllRead,
  };
}
