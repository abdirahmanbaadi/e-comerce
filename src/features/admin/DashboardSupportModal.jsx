import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiUrl } from '../../utils/data';
import { productImage } from '../../utils/format';
import { showTopFloatNotification } from '../../utils/notifications';
import {
  authHeaders,
  getAvatarBgColor,
  token,
  ADMIN_MODAL_OVERLAY,
  ADMIN_MODAL_PANEL,
  ADMIN_MODAL_CLOSE_BTN,
} from './adminShared.js';

function formatMessageTime(iso) {
  if (!iso) return '';
  const dateObj = new Date(iso);
  return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function TicketAvatar({ name, avatar, size = 40 }) {
  const style = { width: size, height: size };
  const src = avatar ? productImage(avatar) : '';
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm [.admin-dark_&]:ring-[#1a2421]"
        style={style}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full text-[0.95rem] font-extrabold text-white ring-2 ring-white shadow-sm [.admin-dark_&]:ring-[#1a2421]"
      style={{ ...style, backgroundColor: getAvatarBgColor(name || '?') }}
      aria-hidden="true"
    >
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

function ChatBubble({ message, ticket, isFirstUserMessage }) {
  const isUser = message.senderRole === 'user';
  const imageSrc = message.imageUrl ? productImage(message.imageUrl) : '';

  return (
    <div className={`flex w-full ${isUser ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[min(82%,440px)] rounded-2xl px-3.5 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] ${
          isUser
            ? 'rounded-bl-sm bg-white text-gray-900 [.admin-dark_&]:bg-[#1a2421] [.admin-dark_&]:text-gray-100'
            : 'rounded-br-sm bg-[#d9fdd3] text-gray-900 [.admin-dark_&]:bg-teal-500/20 [.admin-dark_&]:text-emerald-100'
        }`}
      >
        {isUser && isFirstUserMessage && ticket?.subject ? (
          <div className="mb-1.5 text-[0.74rem] font-bold text-deepGreen [.admin-dark_&]:text-emerald-300">
            {ticket.subject}
          </div>
        ) : null}
        {imageSrc ? (
          <a href={imageSrc} target="_blank" rel="noopener noreferrer" className="mb-1.5 block">
            <img src={imageSrc} alt="Attachment" className="max-h-52 w-full rounded-xl object-cover" />
          </a>
        ) : null}
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
    <div className="shrink-0 border-t border-gray-100 px-4 py-3 [.admin-dark_&]:border-white/10">
      <div className="flex items-end gap-2 rounded-full border border-black/[0.08] bg-white px-2 py-1.5 shadow-sm [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#1a2421]">
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

export default function DashboardSupportModal({ open, ticketId, ticketPreview, onClose, onUpdated }) {
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesRef = useRef(null);

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
    if (!open || !ticketId) return undefined;
    setReplyText('');
    setTicket(null);
    setMessages([]);
    loadMessages();
  }, [open, ticketId, loadMessages]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !sending && !uploading) onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, sending, uploading]);

  useEffect(() => {
    if (!open) return;
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open, loading]);

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
    } catch {
      showTopFloatNotification('Could not upload image.', 'danger');
      return null;
    }
  };

  const postReply = async (messageText, imageUrl = '') => {
    if (!ticketId || !token()) return false;
    const text = (messageText || '').trim();
    const image = (imageUrl || '').trim();
    if (!text && !image) return false;

    setSending(true);
    try {
      const res = await fetch(apiUrl(`/api/support/chats/${ticketId}/messages`), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ messageText: text, imageUrl: image }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        await loadMessages();
        onUpdated?.();
        window.dispatchEvent(new CustomEvent('admin-support-invalidate'));
        window.dispatchEvent(new CustomEvent('admin-dashboard-invalidate'));
        return true;
      }
      showTopFloatNotification(data.message || 'Request failed.', 'danger');
      return false;
    } catch {
      showTopFloatNotification('Could not connect to the server. Try again.', 'danger');
      return false;
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    const ok = await postReply(replyText);
    if (ok) showTopFloatNotification('Reply sent successfully.');
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

  if (!open || !ticketId || typeof document === 'undefined' || !document.body) return null;

  const isClosed = ticket?.status === 'Closed';
  const firstUserMessageId = messages.find((m) => m.senderRole === 'user')?.id;
  const displayName = ticket?.name || ticketPreview?.name || 'Support chat';
  const displayAvatar = ticket?.avatar || ticketPreview?.avatar || '';
  const isAdminDark = Boolean(document.querySelector('[data-theme="dark"]'));

  return createPortal(
    <div className={isAdminDark ? 'admin-dark' : ''} data-theme={isAdminDark ? 'dark' : 'light'}>
      <div className={ADMIN_MODAL_OVERLAY} onClick={onClose} role="presentation">
        <div
          className={ADMIN_MODAL_PANEL}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dashboardSupportModalTitle"
        >
          <button
            type="button"
            className={ADMIN_MODAL_CLOSE_BTN}
            onClick={onClose}
            disabled={sending || uploading}
            aria-label="Close"
          >
            ×
          </button>

          <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 pr-14 [.admin-dark_&]:border-white/10">
            <TicketAvatar name={displayName} avatar={displayAvatar} size={40} />
            <h3
              id="dashboardSupportModalTitle"
              className="min-w-0 truncate text-[0.95rem] font-bold text-gray-900 [.admin-dark_&]:text-gray-100"
            >
              {displayName}
            </h3>
          </div>

          <div
            ref={messagesRef}
            className="min-h-0 flex-1 overflow-y-auto bg-[#efeae2] p-4 [scrollbar-width:thin] [.admin-dark_&]:bg-[#0d1411]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)',
              backgroundSize: '18px 18px',
            }}
          >
            {loading && messages.length === 0 ? (
              <div className="flex h-full min-h-[280px] items-center justify-center text-[0.84rem] text-gray-500">
                <i className="fa-solid fa-spinner fa-spin me-2" aria-hidden="true" />
                Loading messages…
              </div>
            ) : null}
            {!loading && messages.length === 0 ? (
              <div className="flex h-full min-h-[280px] items-center justify-center text-[0.84rem] text-gray-500">
                No messages yet.
              </div>
            ) : null}
            <div className="flex flex-col gap-3">
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  ticket={ticket}
                  isFirstUserMessage={msg.id === firstUserMessageId}
                />
              ))}
            </div>
          </div>

          {isClosed ? (
            <div className="border-t border-gray-100 bg-white px-5 py-4 text-center [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#141f1b]">
              <p className="mb-0 text-[0.84rem] font-medium text-gray-500 [.admin-dark_&]:text-gray-400">
                This ticket is closed. Customer can reopen by sending a new message.
              </p>
            </div>
          ) : (
            <ChatComposer
              value={replyText}
              onChange={setReplyText}
              onSend={handleSend}
              onImagePick={handleSendImage}
              sending={sending}
              uploading={uploading}
              disabled={isClosed}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
