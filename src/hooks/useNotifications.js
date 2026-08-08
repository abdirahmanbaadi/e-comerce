import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUrl } from '../utils/data';
import { getWebMockNotifications, getWebMockUnreadCount } from '../utils/mockWebNotifications';
import { useIntervalWhenVisible } from './useIntervalWhenVisible';

const DEFAULT_POLL_MS = 30000;

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return { success: false };
  }
}

export function useNotifications({
  enabled = true,
  pollMs = DEFAULT_POLL_MS,
  onNewItems,
  previewMocks = false,
} = {}) {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const initializedRef = useRef(false);
  const knownIdsRef = useRef(new Set());
  const onNewItemsRef = useRef(onNewItems);
  const previewMocksRef = useRef(previewMocks);

  useEffect(() => {
    onNewItemsRef.current = onNewItems;
  }, [onNewItems]);

  useEffect(() => {
    previewMocksRef.current = previewMocks;
  }, [previewMocks]);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const applyPreviewMocks = useCallback(() => {
    const mocks = getWebMockNotifications();
    setItems(mocks);
    setUnreadCount(getWebMockUnreadCount(mocks));
    setError(null);
    setLoading(false);
    initializedRef.current = true;
  }, []);

  const fetchNotifications = useCallback(async ({ quiet = false } = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setItems([]);
      setUnreadCount(0);
      setError(null);
      initializedRef.current = false;
      knownIdsRef.current = new Set();
      return;
    }

    // Customer preview: same rich mock set as the mobile app (navbar + profile).
    if (previewMocksRef.current) {
      applyPreviewMocks();
      return;
    }

    if (!quiet || !initializedRef.current) setLoading(true);
    try {
      const listRes = await fetch(apiUrl('/api/notifications'), { headers: getHeaders() });
      const listData = await parseJsonSafe(listRes);

      if (!mountedRef.current) return;

      if (listRes.status === 401) {
        setItems([]);
        setUnreadCount(0);
        setError('Session expired. Please sign in again.');
        initializedRef.current = false;
        knownIdsRef.current = new Set();
        return;
      }

      if (!listRes.ok) {
        setError('Could not reach notification server.');
        return;
      }

      if (listData.success) {
        const notifications = listData.notifications || [];
        const freshUnread = notifications.filter(
          (item) => item?.id && !knownIdsRef.current.has(item.id) && item.unread
        );

        notifications.forEach((item) => {
          if (item?.id) knownIdsRef.current.add(item.id);
        });

        if (initializedRef.current && onNewItemsRef.current && freshUnread.length > 0) {
          onNewItemsRef.current(freshUnread);
        }

        initializedRef.current = true;
        setItems(notifications);
        setUnreadCount(
          typeof listData.unreadCount === 'number'
            ? listData.unreadCount
            : notifications.filter((item) => item.unread).length
        );
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError('Failed to load notifications.');
      }
      console.error('Failed to load notifications:', err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [applyPreviewMocks, getHeaders]);

  const markRead = useCallback(
    async (id) => {
      if (!id) return false;

      if (previewMocksRef.current || String(id).startsWith('web-mock-')) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, unread: false, read: true, dot: 'grey' } : item))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        return true;
      }

      const token = localStorage.getItem('token');
      if (!token) return false;

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
    if (previewMocksRef.current) {
      setItems((prev) => prev.map((item) => ({ ...item, unread: false, read: true, dot: 'grey' })));
      setUnreadCount(0);
      return true;
    }

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
    return undefined;
  }, [enabled, fetchNotifications, previewMocks]);

  useIntervalWhenVisible(
    () => fetchNotifications({ quiet: true }),
    pollMs,
    enabled && !previewMocks
  );

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
