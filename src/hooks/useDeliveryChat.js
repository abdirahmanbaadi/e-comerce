import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUrl } from '../utils/data';
import { useIntervalWhenVisible } from './useIntervalWhenVisible';

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return { success: false };
  }
}

export function useDeliveryChat({ orderId, enabled = true, pollMs = 4000 } = {}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [canSend, setCanSend] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchMessages = useCallback(
    async ({ quiet = false } = {}) => {
      const id = String(orderId || '').trim();
      const token = localStorage.getItem('token');
      if (!enabled || !id || !token) {
        if (!quiet) {
          setMessages([]);
          setError(null);
        }
        return;
      }

      if (!quiet) setLoading(true);
      try {
        const res = await fetch(apiUrl(`/api/orders/${encodeURIComponent(id)}/delivery-chat`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await parseJsonSafe(res);
        if (!mountedRef.current) return;
        if (!res.ok || !data.success) {
          setError(data.message || 'Could not load chat.');
          return;
        }
        setMessages(Array.isArray(data.messages) ? data.messages : []);
        setCanSend(data.canSend !== false);
        setError(null);
      } catch {
        if (mountedRef.current) setError('Failed to load chat.');
      } finally {
        if (mountedRef.current && !quiet) setLoading(false);
      }
    },
    [orderId, enabled]
  );

  const sendMessage = useCallback(
    async ({ messageText = '', imageUrl = '' } = {}) => {
      const id = String(orderId || '').trim();
      const token = localStorage.getItem('token');
      const text = String(messageText || '').trim();
      if (!id || !token || (!text && !imageUrl) || sending) return null;

      setSending(true);
      try {
        const res = await fetch(apiUrl(`/api/orders/${encodeURIComponent(id)}/delivery-chat`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ messageText: text, imageUrl }),
        });
        const data = await parseJsonSafe(res);
        if (!res.ok || !data.success) {
          setError(data.message || 'Could not send message.');
          return null;
        }
        const msg = data.chatMessage;
        if (msg) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        } else {
          await fetchMessages({ quiet: true });
        }
        setError(null);
        return msg;
      } catch {
        setError('Failed to send message.');
        return null;
      } finally {
        setSending(false);
      }
    },
    [orderId, sending, fetchMessages]
  );

  useEffect(() => {
    if (!enabled || !orderId) return undefined;
    fetchMessages();
    return undefined;
  }, [enabled, orderId, fetchMessages]);

  useIntervalWhenVisible(() => fetchMessages({ quiet: true }), pollMs, Boolean(enabled && orderId));

  return {
    messages,
    loading,
    sending,
    error,
    canSend,
    refresh: fetchMessages,
    sendMessage,
  };
}
