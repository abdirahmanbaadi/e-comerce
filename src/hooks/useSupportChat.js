import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUrl } from '../utils/data';
import { formatPastChatTime } from '../utils/format';
import { showTopFloatNotification } from '../utils/notifications';

function sortTicketsByLatest(tickets) {
  return [...tickets].sort((a, b) => {
    const aTime = new Date(a.lastMessageAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.lastMessageAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  });
}

export function useSupportChat(enabled, { onAdminReply } = {}) {
  const [tickets, setTickets] = useState([]);
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [view, setView] = useState('form');
  const [sending, setSending] = useState(false);
  const sseRef = useRef(null);
  const activeTicketIdRef = useRef(null);
  const onAdminReplyRef = useRef(onAdminReply);

  useEffect(() => {
    activeTicketIdRef.current = activeTicketId;
  }, [activeTicketId]);

  useEffect(() => {
    onAdminReplyRef.current = onAdminReply;
  }, [onAdminReply]);

  const loadChats = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(apiUrl('/api/support/chats'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTickets(sortTicketsByLatest(data.tickets || []));
      }
    } catch (error) {
      console.error('Failed to load customer chats:', error);
    }
  }, []);

  const openTicket = useCallback(async (ticketId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setActiveTicketId(ticketId);
    setView('chat');

    try {
      const response = await fetch(apiUrl(`/api/support/chats/${ticketId}/messages`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setActiveTicket(data.ticket);
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to open customer chat:', error);
    }
  }, []);

  const reloadMessages = useCallback(async () => {
    if (!activeTicketId) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(apiUrl(`/api/support/chats/${activeTicketId}/messages`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to reload chat messages:', error);
    }
  }, [activeTicketId]);

  const createConversation = useCallback(
    async (subject, messageText, imageUrl = '') => {
      const token = localStorage.getItem('token');
      if (!token) {
        showTopFloatNotification('❌ Fadlan marka hore soo gal!', 'danger');
        return false;
      }

      const text = (messageText || '').trim();
      const image = (imageUrl || '').trim();
      if (!text && !image) {
        showTopFloatNotification('❌ Fariintu ma noqon karto madhan.', 'danger');
        return false;
      }

      setSending(true);
      try {
        const response = await fetch(apiUrl('/api/support/chats'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ subject, messageText: text, imageUrl: image }),
        });
        const data = await response.json();
        if (response.status === 401) {
          showTopFloatNotification('❌ Session expired. Fadlan dib u soo gal.', 'danger');
          return false;
        }
        if (data.success) {
          showTopFloatNotification('✅ Fariintaada kowaad waa la diray!');
          loadChats();
          if (data.ticket?.id) {
            await openTicket(data.ticket.id);
          }
          return true;
        }
        showTopFloatNotification(`❌ Khalad ayaa dhacay: ${data.message}`, 'danger');
        return false;
      } catch (error) {
        console.error(error);
        showTopFloatNotification('❌ Khalad xariirka server-ka ah!', 'danger');
        return false;
      } finally {
        setSending(false);
      }
    },
    [loadChats, openTicket]
  );

  const sendTicketMessage = useCallback(
    async (ticketId, messageText, imageUrl = '') => {
      const token = localStorage.getItem('token');
      if (!token) {
        showTopFloatNotification('❌ Fadlan marka hore soo gal!', 'danger');
        return false;
      }
      if (!ticketId) {
        showTopFloatNotification('❌ Fadlan dooro wadahadal marka hore.', 'danger');
        return false;
      }
      const text = (messageText || '').trim();
      const image = (imageUrl || '').trim();
      if (!text && !image) {
        showTopFloatNotification('❌ Fariintu ma noqon karto madhan.', 'danger');
        return false;
      }

      setSending(true);
      try {
        const response = await fetch(apiUrl(`/api/support/chats/${ticketId}/messages`), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ messageText: text, imageUrl: image }),
        });
        const data = await response.json();
        if (response.status === 401) {
          showTopFloatNotification('❌ Session expired. Fadlan dib u soo gal.', 'danger');
          return false;
        }
        if (data.success) {
          if (ticketId === activeTicketId) {
            await reloadMessages();
          }
          loadChats();
          return true;
        }
        showTopFloatNotification(`❌ ${data.message || 'Failed to send message'}`, 'danger');
        return false;
      } catch (error) {
        console.error(error);
        showTopFloatNotification('❌ Failed to send message. Hubi in server-ku shaqeynayo.', 'danger');
        return false;
      } finally {
        setSending(false);
      }
    },
    [activeTicketId, loadChats, reloadMessages]
  );

  const sendMessage = useCallback(
    async (messageText, imageUrl = '') => sendTicketMessage(activeTicketId, messageText, imageUrl),
    [activeTicketId, sendTicketMessage]
  );

  const uploadSupportImage = useCallback(async (file) => {
    const token = localStorage.getItem('token');
    if (!token) {
      showTopFloatNotification('❌ Fadlan marka hore soo gal!', 'danger');
      return null;
    }
    if (!file) return null;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(apiUrl('/api/support/upload'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (data.success && data.imageUrl) {
        return data.imageUrl;
      }
      showTopFloatNotification(`❌ ${data.message || 'Failed to upload image'}`, 'danger');
      return null;
    } catch (error) {
      console.error(error);
      showTopFloatNotification('❌ Failed to upload image.', 'danger');
      return null;
    }
  }, []);

  const openRepliedTicket = useCallback(() => {
    const replied = tickets.find((t) => t.status === 'Replied');
    if (replied) {
      openTicket(replied.id);
    } else {
      setView('form');
    }
  }, [openTicket, tickets]);

  const backToForm = useCallback(() => {
    setView('form');
    setActiveTicketId(null);
    setActiveTicket(null);
    setMessages([]);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    loadChats();

    const token = localStorage.getItem('token');
    if (!token) return undefined;

    let cancelled = false;
    let retryTimer = null;
    let retryDelay = 2000;

    const connectStream = () => {
      if (cancelled) return;

      if (sseRef.current) {
        sseRef.current.close();
      }

      const source = new EventSource(
        apiUrl(`/api/support/stream?token=${encodeURIComponent(token)}`)
      );
      sseRef.current = source;

      source.onopen = () => {
        retryDelay = 2000;
      };

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'message' || data.type === 'ticket') {
            if (data.ticket) {
              setTickets((prev) => {
                const idx = prev.findIndex((t) => t.id === data.ticket.id);
                if (idx >= 0) {
                  const next = [...prev];
                  next[idx] = data.ticket;
                  return sortTicketsByLatest(next);
                }
                return sortTicketsByLatest([...prev, data.ticket]);
              });

              if (data.ticket.id === activeTicketIdRef.current) {
                setActiveTicket(data.ticket);
              }
            } else {
              loadChats();
            }

            if (data.type === 'message' && data.message) {
              if (data.message.ticketId === activeTicketIdRef.current) {
                reloadMessages();
              }

              const isAdminReply = data.message.senderRole === 'admin';

              if (isAdminReply) {
                onAdminReplyRef.current?.(data.ticket, data.message);
              }
            }
          }
        } catch (e) {
          console.error('Failed to parse SSE event data:', e);
        }
      };

      source.onerror = () => {
        source.close();
        sseRef.current = null;
        if (cancelled) return;
        retryTimer = setTimeout(() => {
          retryDelay = Math.min(retryDelay * 1.5, 15000);
          connectStream();
        }, retryDelay);
      };
    };

    const startDelay = setTimeout(connectStream, 1500);

    return () => {
      cancelled = true;
      clearTimeout(startDelay);
      if (retryTimer) clearTimeout(retryTimer);
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [enabled, loadChats, reloadMessages]);

  useEffect(() => {
    if (enabled && activeTicketId && view === 'chat') {
      reloadMessages();
    }
  }, [enabled, activeTicketId, view, reloadMessages]);

  const repliedTicket = tickets.find((t) => t.status === 'Replied');

  return {
    tickets,
    activeTicket,
    activeTicketId,
    messages,
    view,
    sending,
    repliedTicket,
    formatPastChatTime,
    loadChats,
    openTicket,
    createConversation,
    sendMessage,
    sendTicketMessage,
    uploadSupportImage,
    openRepliedTicket,
    backToForm,
  };
}
