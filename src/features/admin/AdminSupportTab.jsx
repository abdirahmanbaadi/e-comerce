/**
 * ADMIN SUPPORT TAB — WhatsApp-style inbox + live chat
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiUrl } from '../../utils/data';
import { showTopFloatNotification } from '../../utils/notifications';
import { productImage } from '../../utils/format';
import { getAvatarBgColor, formatRelativeTime, authHeaders, token } from './adminShared.js';

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
  return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function TicketAvatar({ name, avatar, size = 48 }) {
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
      className="flex shrink-0 items-center justify-center rounded-full text-[0.95rem] font-extrabold text-white"
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
      className={`flex w-full cursor-pointer items-center gap-3 border-b border-black/[0.04] px-4 py-3 text-left transition hover:bg-[#f5f6f6] [.admin-dark_&]:border-white/[0.04] [.admin-dark_&]:hover:bg-white/[0.03] ${
        active
          ? 'border-l-4 border-l-deepGreen bg-[#f0f2f1] [.admin-dark_&]:bg-teal-500/10'
          : 'border-l-4 border-l-transparent'
      }`}
    >
      <TicketAvatar name={ticket.name} avatar={ticket.avatar} size={48} />
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center justify-between gap-2">
          <span className="truncate text-[0.9rem] font-bold text-gray-900 [.admin-dark_&]:text-gray-100">
            {ticket.name}
          </span>
          <span className="shrink-0 text-[0.72rem] text-gray-400">
            {formatRelativeTime(ticket.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[0.78rem] text-gray-500 [.admin-dark_&]:text-gray-400">{snippet}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-extrabold ${status.cls}`}>
            {status.label}
          </span>
        </div>
      </div>
    </button>
  );
}

function ChatEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#f0f2f1] px-6 text-center [.admin-dark_&]:bg-[#101814]">
      <p className="mb-0 max-w-sm text-[0.9rem] font-medium text-gray-500 [.admin-dark_&]:text-gray-400">
        Dooro macmiil liiska bidix ka mid ah si aad u aragto fariimaha oo aad uga jawaabto.
      </p>
    </div>
  );
}

function ChatBubble({ message, ticket, isFirstUserMessage }) {
  const isUser = message.senderRole === 'user';
  const imageSrc = message.imageUrl ? productImage(message.imageUrl) : '';

  return (
    <div className={`flex w-full ${isUser ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[min(78%,420px)] rounded-2xl px-3 py-2 shadow-[0_1px_1px_rgba(0,0,0,0.06)] ${
          isUser
            ? 'rounded-bl-sm bg-white text-gray-900 [.admin-dark_&]:bg-[#1a2421] [.admin-dark_&]:text-gray-100'
            : 'rounded-br-sm bg-[#d9fdd3] text-gray-900 [.admin-dark_&]:bg-teal-500/20 [.admin-dark_&]:text-emerald-100'
        }`}
      >
        {isUser && isFirstUserMessage && (
          <div className="mb-1 text-[0.72rem] font-bold text-deepGreen [.admin-dark_&]:text-emerald-300">
            {ticket?.subject}
          </div>
        )}
        {imageSrc && (
          <a href={imageSrc} target="_blank" rel="noopener noreferrer" className="mb-1 block">
            <img src={imageSrc} alt="Attachment" className="max-h-52 w-full rounded-xl object-cover" />
          </a>
        )}
        {message.messageText ? (
          <div className="whitespace-pre-wrap break-words text-[0.86rem] leading-relaxed">{message.messageText}</div>
        ) : null}
        <span className={`mt-1 block text-[0.65rem] text-gray-500 ${isUser ? 'text-left' : 'text-right'}`}>
          {formatMessageTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

function ChatComposer({ value, onChange, onSend, onImagePick, sending, uploading, disabled }) {
  const fileRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend?.();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showTopFloatNotification('Only image files are allowed.', 'danger');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showTopFloatNotification('Image must be under 5MB.', 'danger');
      return;
    }
    onImagePick?.(file);
  };

  return (
    <div className="shrink-0 border-t border-black/[0.06] bg-[#f0f2f1] px-3 py-3 [.admin-dark_&]:border-white/[0.06] [.admin-dark_&]:bg-[#101814]">
      <div className="flex items-end gap-2 rounded-full border border-black/[0.06] bg-white px-2 py-1.5 shadow-sm [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#1a2421]">
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-deepGreen disabled:opacity-50 [.admin-dark_&]:hover:bg-white/10"
          onClick={() => fileRef.current?.click()}
          disabled={disabled || sending || uploading}
          title="Attach image"
          aria-label="Attach image"
        >
          <i className={`fa-regular fa-image text-[1.1rem] ${uploading ? 'fa-spinner fa-spin' : ''}`} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
        <textarea
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a reply…"
          disabled={disabled || sending || uploading}
          className="max-h-28 min-h-[40px] flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[0.88rem] outline-none placeholder:text-gray-400 [.admin-dark_&]:text-gray-100"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || sending || uploading || !value.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-deepGreen text-white transition hover:bg-[#0b5e52] disabled:opacity-40"
          title="Send"
          aria-label="Send"
        >
          <i className={`fa-solid fa-paper-plane text-[0.9rem] ${sending ? 'fa-spinner fa-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}

export default function AdminSupportTab({ headerSearch = '', onToggleSidebar }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState('');
  const [activeTicketId, setActiveTicketId] = useState(null);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const messagesRef = useRef(null);
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
        setTickets(sortTickets(data.tickets || []));
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
      setReplyText('');
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
            if (data.ticket.id === activeTicketIdRef.current) {
              setActiveTicket(data.ticket);
            }
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
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, messagesLoading, activeTicketId]);

  const uploadSupportImage = async (file) => {
    if (!token() || !file) return null;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(apiUrl('/api/support/upload'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.imageUrl) return data.imageUrl;
      showTopFloatNotification(data.message || 'Upload failed.', 'danger');
      return null;
    } catch (err) {
      console.error(err);
      showTopFloatNotification('Could not upload image.', 'danger');
      return null;
    }
  };

  const postReply = async (messageText, imageUrl = '') => {
    if (!activeTicketId || !token()) return false;
    const text = (messageText || '').trim();
    const image = (imageUrl || '').trim();
    if (!text && !image) return false;

    setSending(true);
    try {
      const res = await fetch(apiUrl(`/api/support/chats/${activeTicketId}/messages`), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ messageText: text, imageUrl: image }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        await loadMessages(activeTicketId, { quiet: true });
        await loadTickets({ quiet: true });
        window.dispatchEvent(new CustomEvent('admin-support-invalidate'));
        return true;
      }
      showTopFloatNotification(data.message || 'Request failed.', 'danger');
      return false;
    } catch (err) {
      console.error(err);
      showTopFloatNotification('Could not connect to the server. Try again.', 'danger');
      return false;
    } finally {
      setSending(false);
    }
  };

  const handleSendReply = async () => {
    const ok = await postReply(replyText);
    if (ok) showTopFloatNotification('Reply sent.');
  };

  const handleSendImage = async (file) => {
    setUploading(true);
    try {
      const imageUrl = await uploadSupportImage(file);
      if (!imageUrl) return;
      const ok = await postReply('', imageUrl);
      if (ok) showTopFloatNotification('Image sent.');
    } finally {
      setUploading(false);
    }
  };

  const displayTicket = activeTicketId
    ? activeTicket || tickets.find((t) => t.id === activeTicketId) || null
    : null;
  const firstUserMessageId = messages.find((m) => m.senderRole === 'user')?.id;
  const showMobileChat = Boolean(activeTicketId);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-[calc(100dvh-16px)] min-h-0 overflow-hidden rounded-xl border border-deepGreen/8 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] [.admin-dark_&]:border-white/[0.06] [.admin-dark_&]:bg-[#141f1b] max-md:h-[calc(100dvh-16px)]">
        {/* Sidebar */}
        <aside
          className={`flex w-full shrink-0 flex-col border-r border-black/[0.06] bg-white md:w-[min(360px,34%)] md:min-w-[300px] [.admin-dark_&]:border-white/[0.06] [.admin-dark_&]:bg-[#141f1b] ${
            showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="shrink-0 border-b border-black/[0.06] bg-[#f0f2f1] px-3 py-3 md:px-4 [.admin-dark_&]:border-white/[0.06] [.admin-dark_&]:bg-[#101814]">
            <div className="mb-2.5 flex items-center gap-2">
              {onToggleSidebar && (
                <button
                  type="button"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-black/5 md:hidden"
                  onClick={onToggleSidebar}
                  aria-label="Open menu"
                >
                  <i className="fa-solid fa-bars" />
                </button>
              )}
              <h3 className="mb-0 flex-1 text-[1rem] font-extrabold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
                Support / Help
              </h3>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[0.72rem] font-bold text-gray-500 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-gray-300">
                {filteredTickets.length}
              </span>
            </div>
            <label htmlFor="adminSupportCustomerSearch" className="sr-only">
              Search customers
            </label>
            <div className="relative">
              <input
                id="adminSupportCustomerSearch"
                type="search"
                value={localSearch || headerSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search customers…"
                className="w-full rounded-lg border border-black/[0.06] bg-white py-2.5 pl-3 pr-3 text-[0.84rem] outline-none focus:border-deepGreen [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#1a2421] [.admin-dark_&]:text-gray-100"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
            {loading && (
              <div className="px-4 py-10 text-center text-[0.85rem] text-gray-400">
                <i className="fa-solid fa-spinner fa-spin me-2" />
                Loading…
              </div>
            )}

            {!loading && filteredTickets.length === 0 && (
              <div className="px-4 py-10 text-center text-[0.85rem] text-gray-400">No messages found.</div>
            )}

            {!loading &&
              filteredTickets.map((tkt) => (
                <SupportTicketItem
                  key={tkt.id}
                  ticket={tkt}
                  active={tkt.id === activeTicketId}
                  onSelect={selectTicket}
                />
              ))}
          </div>
        </aside>

        {/* Chat */}
        <section className={`min-w-0 flex-1 flex-col ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>
          {!displayTicket ? (
            <ChatEmptyState />
          ) : (
            <>
              <header className="flex shrink-0 items-center gap-3 border-b border-black/[0.06] bg-[#f0f2f1] px-3 py-3 md:px-4 [.admin-dark_&]:border-white/[0.06] [.admin-dark_&]:bg-[#101814]">
                <button
                  type="button"
                  className="mr-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-black/5 md:hidden"
                  onClick={() => {
                    setActiveTicketId(null);
                    setActiveTicket(null);
                    setMessages([]);
                  }}
                  aria-label="Back to list"
                >
                  <i className="fa-solid fa-arrow-left" />
                </button>
                <TicketAvatar name={displayTicket.name} avatar={displayTicket.avatar} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[0.95rem] font-extrabold text-gray-900 [.admin-dark_&]:text-gray-100">
                    {displayTicket.name}
                  </div>
                </div>
              </header>

              <div
                ref={messagesRef}
                className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-[#efeae2] p-3 md:p-4 [scrollbar-width:thin] [.admin-dark_&]:bg-[#0f1613]"
                style={{
                  backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)',
                  backgroundSize: '18px 18px',
                }}
              >
                {messagesLoading && messages.length === 0 && (
                  <div className="py-10 text-center text-gray-400">
                    <i className="fa-solid fa-circle-notch fa-spin me-2" />
                    Loading messages…
                  </div>
                )}

                {!messagesLoading && messages.length === 0 && (
                  <div className="py-10 text-center text-[0.85rem] text-gray-500">No messages in this thread.</div>
                )}

                {messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    message={msg}
                    ticket={displayTicket}
                    isFirstUserMessage={msg.id === firstUserMessageId}
                  />
                ))}
              </div>

              {displayTicket.status === 'Closed' ? (
                <div className="shrink-0 border-t border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-[0.8rem] text-amber-800 [.admin-dark_&]:border-amber-500/20 [.admin-dark_&]:bg-amber-500/10 [.admin-dark_&]:text-amber-200">
                  Ticket closed. Customer can reopen by sending a new message.
                </div>
              ) : (
                <ChatComposer
                  value={replyText}
                  onChange={setReplyText}
                  onSend={handleSendReply}
                  onImagePick={handleSendImage}
                  sending={sending}
                  uploading={uploading}
                  disabled={false}
                />
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
