/**
 * ADMIN SUPPORT TAB — inbox list + live chat (Tailwind)
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiUrl } from '../../utils/data';
import { showTopFloatNotification } from '../../utils/notifications';
import { AppSearchField } from '../nav/StoreNavbar';
import { getAvatarBgColor, formatRelativeTime, authHeaders, token } from './adminShared.js';

const LAYOUT =
  'flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-deepGreen/8 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] [.admin-dark_&]:border-white/[0.06] [.admin-dark_&]:bg-[#141f1b] min-h-[480px] h-full';
const SIDEBAR =
  'flex w-[35%] min-w-[260px] flex-col border-r border-gray-100 bg-white [.admin-dark_&]:border-white/[0.06] [.admin-dark_&]:bg-[#141f1b]';
const SIDEBAR_HEADER =
  'border-b border-gray-100 bg-[#faf8f2] p-4 [.admin-dark_&]:border-white/[0.06] [.admin-dark_&]:bg-[#101814]';
const TICKET_LIST = 'flex-1 overflow-y-auto [scrollbar-width:thin]';
const CHAT_WINDOW = 'flex min-w-0 flex-1 flex-col bg-white [.admin-dark_&]:bg-[#141f1b]';
const CHAT_MESSAGES =
  'flex flex-1 flex-col gap-3 overflow-y-auto bg-[#faf8f2] p-5 [scrollbar-width:thin] [.admin-dark_&]:bg-[#101814]';

function sortTickets(rows) {
  return [...rows].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
}

function getStatusMeta(status) {
  if (status === 'Open' || status === 'New') {
    return {
      label: status === 'Open' ? 'New' : status,
      cls: 'bg-emerald-100 text-emerald-700 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300',
    };
  }
  if (status === 'Pending') {
    return {
      label: 'Pending',
      cls: 'bg-amber-100 text-amber-700 [.admin-dark_&]:bg-amber-500/15 [.admin-dark_&]:text-amber-300',
    };
  }
  if (status === 'Replied') {
    return {
      label: 'Resolved',
      cls: 'bg-teal-100 text-teal-700 [.admin-dark_&]:bg-teal-500/15 [.admin-dark_&]:text-teal-300',
    };
  }
  if (status === 'Closed') {
    return {
      label: 'Closed',
      cls: 'bg-gray-100 text-gray-600 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-gray-300',
    };
  }
  return {
    label: status || 'Closed',
    cls: 'bg-gray-100 text-gray-600 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-gray-300',
  };
}

function formatMessageTime(iso) {
  if (!iso) return '';
  const dateObj = new Date(iso);
  return (
    dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
    ' ' +
    dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })
  );
}

function TicketAvatar({ name, avatar, size = 44 }) {
  const style = { width: size, height: size };
  if (avatar) {
    return (
      <div
        className="shrink-0 rounded-full bg-cover bg-center"
        style={{ ...style, backgroundImage: `url('${avatar}')` }}
        aria-hidden="true"
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white"
      style={{ ...style, backgroundColor: getAvatarBgColor(name || '?') }}
      aria-hidden="true"
    >
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

function SupportTicketItem({ ticket, active, onSelect }) {
  const status = getStatusMeta(ticket.status);
  const snippet = ticket.lastMessageText || ticket.subject || 'No messages';

  return (
    <button
      type="button"
      onClick={() => onSelect(ticket.id)}
      className={`flex w-full cursor-pointer items-center gap-3 border-b border-gray-50 px-4 py-4 text-left transition hover:bg-[#faf8f2] [.admin-dark_&]:border-white/[0.04] [.admin-dark_&]:hover:bg-white/[0.03] ${
        active
          ? 'border-l-4 border-l-teal bg-[#eef7f5] [.admin-dark_&]:bg-teal-500/10'
          : 'border-l-4 border-l-transparent'
      }`}
    >
      <TicketAvatar name={ticket.name} avatar={ticket.avatar} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="truncate text-[0.9rem] font-bold text-gray-900 [.admin-dark_&]:text-gray-100">
            {ticket.name}
          </span>
          <span className="shrink-0 text-[0.75rem] text-gray-400">
            {formatRelativeTime(ticket.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[0.8rem] text-gray-500 [.admin-dark_&]:text-gray-400">{snippet}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.68rem] font-extrabold ${status.cls}`}>
            {status.label}
          </span>
        </div>
      </div>
    </button>
  );
}

function ChatEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-gray-500 [.admin-dark_&]:text-gray-400">
      <i className="fa-solid fa-comments mb-4 text-5xl text-deepGreen/25 [.admin-dark_&]:text-white/15" />
      <h5 className="mb-2 text-lg font-bold text-gray-800 [.admin-dark_&]:text-gray-200">No Conversation Selected</h5>
      <p className="max-w-xs text-[0.85rem]">
        Select a ticket from the left inbox list to view details and send replies.
      </p>
    </div>
  );
}

function ChatBubble({ message, ticket, isFirstUserMessage }) {
  const isUser = message.senderRole === 'user';
  const wrapCls = isUser ? 'self-start' : 'self-end flex-row-reverse';

  return (
    <div className={`flex max-w-[75%] items-start ${wrapCls}`}>
      <div
        className={`relative rounded-2xl px-4 py-3 text-[0.88rem] leading-snug ${
          isUser
            ? 'rounded-tl-none bg-white text-gray-800 shadow-[0_2px_6px_rgba(0,0,0,0.03)] [.admin-dark_&]:bg-[#1a2421] [.admin-dark_&]:text-gray-200'
            : 'rounded-tr-none bg-[#e6f3f0] text-deepGreen shadow-[0_2px_6px_rgba(7,61,53,0.05)] [.admin-dark_&]:bg-teal-500/15 [.admin-dark_&]:text-emerald-200'
        }`}
      >
        {isUser && isFirstUserMessage && (
          <div className="mb-1 text-[0.75rem] font-bold text-deepGreen [.admin-dark_&]:text-emerald-300">
            Subject: {ticket?.subject}
          </div>
        )}
        <div className="whitespace-pre-wrap break-words">{message.messageText}</div>
        <span
          className={`mt-1 block text-[0.7rem] opacity-70 ${isUser ? 'text-left' : 'text-right'}`}
        >
          {formatMessageTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

export default function AdminSupportTab({ headerSearch = '' }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState('');
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);

  const messagesEndRef = useRef(null);
  const sseRetryRef = useRef(null);
  const activeTicketIdRef = useRef(activeTicketId);

  useEffect(() => {
    activeTicketIdRef.current = activeTicketId;
  }, [activeTicketId]);

  const searchQuery = (headerSearch || localSearch).toLowerCase().trim();

  const loadTickets = useCallback(async ({ quiet = false } = {}) => {
    if (!token()) return;
    if (!quiet) setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/support/admin/chats'), { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        const sorted = sortTickets(data.tickets || []);
        setTickets(sorted);
      }
    } catch (err) {
      console.error('Error loading admin support data:', err);
      if (!quiet) showTopFloatNotification('Failed to load support tickets.', 'danger');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (ticketId, { quiet = false } = {}) => {
    if (!ticketId || !token()) return;
    if (!quiet) setMessagesLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/support/chats/${ticketId}/messages`), {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setActiveTicket(data.ticket || null);
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error(`Error fetching messages for ticket ${ticketId}`, err);
      if (!quiet) showTopFloatNotification('Failed to load messages.', 'danger');
    } finally {
      if (!quiet) setMessagesLoading(false);
    }
  }, []);

  const selectTicket = useCallback(
    (ticketId) => {
      setActiveTicketId(ticketId);
      setMessages([]);
      loadMessages(ticketId);
    },
    [loadMessages]
  );

  const filteredTickets = useMemo(() => {
    return sortTickets(
      tickets.filter((tkt) => {
        if (!searchQuery) return true;
        return (
          tkt.name?.toLowerCase().includes(searchQuery) ||
          tkt.subject?.toLowerCase().includes(searchQuery) ||
          tkt.lastMessageText?.toLowerCase().includes(searchQuery) ||
          String(tkt.id).toLowerCase().includes(searchQuery)
        );
      })
    );
  }, [tickets, searchQuery]);

  const resolvedActiveId = useMemo(() => {
    if (filteredTickets.length === 0) return null;
    if (activeTicketId && filteredTickets.some((t) => t.id === activeTicketId)) {
      return activeTicketId;
    }
    return filteredTickets[0].id;
  }, [filteredTickets, activeTicketId]);

  useEffect(() => {
    if (resolvedActiveId && resolvedActiveId !== activeTicketId) {
      setActiveTicketId(resolvedActiveId);
      loadMessages(resolvedActiveId);
    }
  }, [resolvedActiveId, activeTicketId, loadMessages]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    const onInvalidate = () => loadTickets({ quiet: true });
    window.addEventListener('admin-support-invalidate', onInvalidate);
    return () => window.removeEventListener('admin-support-invalidate', onInvalidate);
  }, [loadTickets]);

  useEffect(() => {
    window.selectSupportTicket = (ticketId) => {
      selectTicket(ticketId);
    };
    return () => {
      if (window.selectSupportTicket) delete window.selectSupportTicket;
    };
  }, [selectTicket]);

  useEffect(() => {
    if (!token()) return undefined;

    let source = null;
    let closed = false;

    const connect = () => {
      if (closed || !token()) return;
      source = new EventSource(`${apiUrl('/api/support/stream')}?token=${encodeURIComponent(token())}`);

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type !== 'message' && data.type !== 'ticket') return;

          if (data.ticket) {
            setTickets((prev) => {
              const idx = prev.findIndex((t) => t.id === data.ticket.id);
              const next = idx >= 0 ? prev.map((t, i) => (i === idx ? data.ticket : t)) : [...prev, data.ticket];
              return sortTickets(next);
            });
            window.dispatchEvent(new CustomEvent('admin-dashboard-invalidate'));
          } else {
            loadTickets({ quiet: true });
            return;
          }

          if (data.type === 'message' && data.message?.ticketId === activeTicketIdRef.current) {
            loadMessages(activeTicketIdRef.current, { quiet: true });
          }
        } catch (e) {
          console.error('Failed to parse SSE event:', e);
        }
      };

      source.onerror = (err) => {
        console.error('Admin support SSE connection error, retrying in 5 seconds...', err);
        source?.close();
        source = null;
        if (!closed) {
          sseRetryRef.current = window.setTimeout(connect, 5000);
        }
      };
    };

    connect();

    return () => {
      closed = true;
      source?.close();
      if (sseRetryRef.current) {
        clearTimeout(sseRetryRef.current);
        sseRetryRef.current = null;
      }
    };
  }, [loadTickets, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, messagesLoading]);

  const handleSendReply = async (e) => {
    e?.preventDefault?.();
    if (!activeTicketId) return;

    const reply = replyText.trim();
    if (!reply) {
      showTopFloatNotification('Please write your reply first.', 'warning');
      return;
    }
    if (!token()) return;

    setSending(true);
    try {
      const res = await fetch(apiUrl(`/api/support/chats/${activeTicketId}/messages`), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ messageText: reply }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        showTopFloatNotification('Reply sent successfully.');
        await loadMessages(activeTicketId, { quiet: true });
        await loadTickets({ quiet: true });
        window.dispatchEvent(new CustomEvent('admin-support-invalidate'));
      } else {
        showTopFloatNotification(data.message || 'Request failed.', 'danger');
      }
    } catch (err) {
      console.error(err);
      showTopFloatNotification('Could not connect to the server. Try again.', 'danger');
    } finally {
      setSending(false);
    }
  };

  const handleReplyKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  const handleCloseTicket = async () => {
    if (!activeTicketId || !token()) return;
    if (activeTicket?.status === 'Closed') return;

    setClosing(true);
    try {
      const res = await fetch(apiUrl(`/api/support/admin/chats/${activeTicketId}/close`), {
        method: 'PATCH',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('Ticket closed.');
        if (data.ticket) {
          setActiveTicket(data.ticket);
          setTickets((prev) =>
            sortTickets(prev.map((t) => (t.id === data.ticket.id ? { ...t, ...data.ticket } : t)))
          );
        } else {
          await loadTickets({ quiet: true });
          await loadMessages(activeTicketId, { quiet: true });
        }
        window.dispatchEvent(new CustomEvent('admin-support-invalidate'));
      } else {
        showTopFloatNotification(data.message || 'Could not close ticket.', 'danger');
      }
    } catch (err) {
      console.error(err);
      showTopFloatNotification('Could not connect to the server. Try again.', 'danger');
    } finally {
      setClosing(false);
    }
  };

  const displayTicket =
    filteredTickets.length === 0
      ? null
      : activeTicket || tickets.find((t) => t.id === resolvedActiveId) || null;
  const firstUserMessageId = messages.find((m) => m.senderRole === 'user')?.id;

  return (
    <div className="flex min-h-0 flex-1 flex-col animate-cardRise">
      <div className={LAYOUT}>
      {/* Left sidebar — inbox list */}
      <aside className={SIDEBAR}>
        <div className={SIDEBAR_HEADER}>
          <AppSearchField
            id="supportSearchInput"
            variant="full"
            className="w-full"
            placeholder="Search messages..."
            value={localSearch || headerSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>

        <div className={TICKET_LIST}>
          {loading && (
            <div className="px-4 py-8 text-center text-[0.85rem] text-gray-400">
              <i className="fa-solid fa-spinner fa-spin me-2" />
              Loading tickets…
            </div>
          )}

          {!loading && filteredTickets.length === 0 && (
            <div className="px-4 py-8 text-center text-[0.85rem] text-gray-400">No messages found.</div>
          )}

          {!loading &&
            filteredTickets.map((tkt) => (
              <SupportTicketItem
                key={tkt.id}
                ticket={tkt}
                active={tkt.id === resolvedActiveId}
                onSelect={selectTicket}
              />
            ))}
        </div>
      </aside>

      {/* Right chat window */}
      <section className={CHAT_WINDOW}>
        {!displayTicket ? (
          <ChatEmptyState />
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/[0.06]">
              <TicketAvatar name={displayTicket.name} avatar={displayTicket.avatar} size={40} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-extrabold text-gray-900 [.admin-dark_&]:text-gray-100">
                  {displayTicket.name}
                </div>
                <div className="truncate text-[0.8rem] text-gray-500 [.admin-dark_&]:text-gray-400">
                  {displayTicket.email} • Ticket ID: {displayTicket.id}
                </div>
              </div>
              {displayTicket.status !== 'Closed' ? (
                <button
                  type="button"
                  onClick={handleCloseTicket}
                  disabled={closing}
                  className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[0.78rem] font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60 [.admin-dark_&]:border-red-500/30 [.admin-dark_&]:bg-red-500/10 [.admin-dark_&]:text-red-300"
                >
                  {closing ? 'Closing…' : 'Close ticket'}
                </button>
              ) : (
                <span className="shrink-0 rounded-xl bg-gray-100 px-3 py-2 text-[0.78rem] font-bold text-gray-600 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-gray-300">
                  Closed
                </span>
              )}
            </header>

            <div className={CHAT_MESSAGES}>
              {messagesLoading && messages.length === 0 && (
                <div className="py-8 text-center text-gray-400">
                  <i className="fa-solid fa-circle-notch fa-spin me-2" />
                  Loading messages…
                </div>
              )}

              {!messagesLoading && messages.length === 0 && (
                <div className="py-8 text-center text-gray-400">No messages in this thread.</div>
              )}

              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  ticket={displayTicket}
                  isFirstUserMessage={msg.id === firstUserMessageId}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-100 bg-white p-4 [.admin-dark_&]:border-white/[0.06] [.admin-dark_&]:bg-[#141f1b]">
              {displayTicket.status === 'Closed' ? (
                <p className="m-0 text-center text-[0.85rem] text-gray-500 [.admin-dark_&]:text-gray-400">
                  This ticket is closed. Reopen by having the customer send a new message.
                </p>
              ) : (
              <form className="flex items-end gap-3" onSubmit={handleSendReply}>
                <textarea
                  id="supportReplyMessage"
                  className="min-h-[44px] max-h-32 flex-1 resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-[0.88rem] font-medium text-gray-900 outline-none transition focus:border-deepGreen focus:shadow-[0_0_0_3px_rgba(7,61,53,0.08)] [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#101814] [.admin-dark_&]:text-gray-100"
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={handleReplyKeyDown}
                  disabled={sending}
                  rows={2}
                />
                <button
                  type="submit"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-deepGreen to-teal text-white transition hover:-translate-y-0.5 disabled:opacity-60"
                  title="Send Message"
                  disabled={sending || !replyText.trim()}
                >
                  <i className="fa-regular fa-paper-plane" />
                </button>
              </form>
              )}
            </div>
          </>
        )}
      </section>
      </div>
    </div>
  );
}
