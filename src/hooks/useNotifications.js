import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUrl } from '../utils/data';

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return { success: false };
  }
}

export function useNotifications({ enabled = true, pollMs = 20000 } = {}) {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setItems([]);
      setUnreadCount(0);
      setError(null);
      return;
    }

    setLoading(true);
    try {
      const [listRes, countRes] = await Promise.all([
        fetch(apiUrl('/api/notifications'), { headers: getHeaders() }),
        fetch(apiUrl('/api/notifications/unread-count'), { headers: getHeaders() }),
      ]);

      const listData = await parseJsonSafe(listRes);
      const countData = await parseJsonSafe(countRes);

      if (!mountedRef.current) return;

      if (listRes.status === 401 || countRes.status === 401) {
        setItems([]);
        setUnreadCount(0);
        setError('Session expired. Fadlan dib u soo gal.');
        return;
      }

      if (!listRes.ok || !countRes.ok) {
        setError('Could not reach notification server.');
        return;
      }

      if (listData.success) {
        setItems(listData.notifications || []);
        setError(null);
      }
      if (countData.success) {
        setUnreadCount(countData.count || 0);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError('Failed to load notifications.');
      }
      console.error('Failed to load notifications:', err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [getHeaders]);

  const markRead = useCallback(
    async (id) => {
      const token = localStorage.getItem('token');
      if (!token || !id) return false;

      try {
        const res = await fetch(apiUrl(`/api/notifications/${id}/read`), {
          method: 'PATCH',
          headers: getHeaders(),
        });
        const data = await parseJsonSafe(res);
        if (!res.ok || !data.success) return false;

        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, unread: false, read: true, dot: 'grey' } : item))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        return true;
      } catch (err) {
        console.error('Failed to mark notification read:', err);
        return false;
      }
    },
    [getHeaders]
  );

  const markAllRead = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const res = await fetch(apiUrl('/api/notifications/read-all'), {
        method: 'PATCH',
        headers: getHeaders(),
      });
      const data = await parseJsonSafe(res);
      if (!res.ok || !data.success) return false;

      setItems((prev) => prev.map((item) => ({ ...item, unread: false, read: true, dot: 'grey' })));
      setUnreadCount(0);
      return true;
    } catch (err) {
      console.error('Failed to mark all read:', err);
      return false;
    }
  }, [getHeaders]);

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
    error,
    refresh: fetchNotifications,
    markRead,
    markAllRead,
  };
}
