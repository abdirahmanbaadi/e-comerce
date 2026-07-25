import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUrl } from '../../utils/data';
import { showTopFloatNotification } from '../../utils/notifications';
import { authHeaders, getAvatarBgColor, token } from './adminShared.js';

function formatMessageTime(iso) {
  if (!iso) return '';
  const dateObj = new Date(iso);
  return `${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
}

function TicketAvatar({ name, avatar, size = 40 }) {
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

export default function DashboardSupportModal({ open, ticketId, onClose, onUpdated }) {
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const loadMessages = useCallback(async () => {
    if (!ticketId || !token()) return;
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/support/chats/${ticketId}/messages`), {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setTicket(data.ticket || null);
        setMessages(data.messages || []);
      }
    } catch {
      showTopFloatNotification('Failed to load messages.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (!open || !ticketId) return;
    setReplyText('');
    setTicket(null);
    setMessages([]);
    loadMessages();
  }, [open, ticketId, loadMessages]);

  useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    const reply = replyText.trim();
    if (!reply || !ticketId || !token()) return;

    setSending(true);
    try {
      const res = await fetch(apiUrl(`/api/support/chats/${ticketId}/messages`), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ messageText: reply }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        showTopFloatNotification('Reply sent successfully.');
        await loadMessages();
        onUpdated?.();
        window.dispatchEvent(new CustomEvent('admin-support-invalidate'));
        window.dispatchEvent(new CustomEvent('admin-dashboard-invalidate'));
      } else {
        showTopFloatNotification(data.message || 'Request failed.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not connect to the server. Try again.', 'danger');
    } finally {
      setSending(false);
    }
  };

  const handleReplyKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  if (!open || !ticketId) return null;

  const isClosed = ticket?.status === 'Closed';

  return (
    <div
      className="fixed inset-0 z-[1060] flex items-center justify-center bg-deepGreen/45 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-[0_25px_60px_rgba(0,0,0,0.22)] [.admin-dark_&]:bg-[#1a2421]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboardSupportModalTitle"
      >
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 [.admin-dark_&]:border-white/10">
          <TicketAvatar name={ticket?.name} avatar={ticket?.avatar} />
          <div className="min-w-0 flex-1">
            <h3
              id="dashboardSupportModalTitle"
              className="truncate text-[0.95rem] font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]"
            >
              {ticket?.name || 'Support chat'}
            </h3>
            <p className="truncate text-[0.72rem] text-gray-500 [.admin-dark_&]:text-gray-400">
              {ticket?.subject || `Ticket #${ticketId}`}
            </p>
          </div>
          <button
            type="button"
            className="text-2xl leading-none text-gray-500 hover:text-gray-800 [.admin-dark_&]:text-gray-400"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#faf8f2] p-4 [scrollbar-width:thin] [.admin-dark_&]:bg-[#101814]">
          {loading && messages.length === 0 && (
            <div className="py-8 text-center text-[0.8rem] text-gray-400">
              <i className="fa-solid fa-spinner fa-spin me-2" aria-hidden="true" />
              Loading messages…
            </div>
          )}
          {!loading && messages.length === 0 && (
            <p className="py-8 text-center text-[0.8rem] text-gray-400">No messages yet.</p>
          )}
          <div className="flex flex-col gap-3">
            {messages.map((msg) => {
              const isUser = msg.senderRole === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex max-w-[85%] ${isUser ? 'self-start' : 'self-end'}`}
                >
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-[0.84rem] leading-snug ${
                      isUser
                        ? 'rounded-tl-none bg-white text-gray-800 shadow-sm [.admin-dark_&]:bg-[#1a2421] [.admin-dark_&]:text-gray-200'
                        : 'rounded-tr-none bg-[#e6f3f0] text-deepGreen [.admin-dark_&]:bg-teal-500/15 [.admin-dark_&]:text-emerald-200'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{msg.messageText}</div>
                    <span className="mt-1 block text-[0.65rem] opacity-70">
                      {formatMessageTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-gray-100 bg-white p-3 [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#141f1b]">
          {isClosed ? (
            <p className="m-0 text-center text-[0.8rem] text-gray-500 [.admin-dark_&]:text-gray-400">
              This ticket is closed.
            </p>
          ) : (
            <form className="flex items-end gap-2" onSubmit={handleSend}>
              <textarea
                className="min-h-[42px] max-h-28 flex-1 resize-y rounded-xl border border-gray-200 bg-white px-3 py-2 text-[0.84rem] outline-none transition focus:border-deepGreen [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#101814] [.admin-dark_&]:text-gray-100"
                placeholder="Type your reply…"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleReplyKeyDown}
                disabled={sending}
                rows={2}
              />
              <button
                type="submit"
                disabled={sending || !replyText.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-deepGreen text-white transition hover:opacity-90 disabled:opacity-50"
                title="Send reply"
              >
                <i className="fa-regular fa-paper-plane" aria-hidden="true" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
