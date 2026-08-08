import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSupportChat } from '../../hooks/useSupportChat';
import { productImage } from '../../utils/format';
import { showTopFloatNotification } from '../../utils/notifications';

const DEFAULT_SUBJECT = 'Customer Service';

function formatBubbleTime(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayLabel(dateVal) {
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  if (isSameDay(d, now)) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ChatBubble({ message }) {
  const isUser = message.senderRole === 'user';
  const imageSrc = message.imageUrl ? productImage(message.imageUrl) : '';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative w-fit max-w-[78%] px-3.5 py-2.5 ${
          isUser
            ? 'rounded-[20px] rounded-tr-[3px] bg-black text-white'
            : 'rounded-[20px] rounded-tl-[3px] bg-[#f0f0f0] text-black'
        }`}
      >
        {imageSrc ? (
          <a href={imageSrc} target="_blank" rel="noopener noreferrer" className="mb-1.5 block">
            <img
              src={imageSrc}
              alt="Attachment"
              className="max-h-52 w-full rounded-[14px] object-cover"
            />
          </a>
        ) : null}
        {message.messageText ? (
          <p className="m-0 whitespace-pre-wrap break-words text-[0.95rem] font-normal leading-[1.35]">
            {message.messageText}
          </p>
        ) : null}
        <span
          className={`mt-1 block text-right text-[0.7rem] leading-none ${
            isUser ? 'text-white/50' : 'text-[#9a9a9a]'
          }`}
        >
          {formatBubbleTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

export default function MobileCustomerService() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const chat = useSupportChat(Boolean(user?.isLoggedIn));
  const {
    tickets,
    activeTicket,
    activeTicketId,
    messages,
    sending,
    createConversation,
    sendMessage,
    openTicket,
    uploadSupportImage,
  } = chat;

  const [draft, setDraft] = useState('');
  const [uploading, setUploading] = useState(false);
  const [booted, setBooted] = useState(false);
  const messagesRef = useRef(null);
  const fileRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!user?.isLoggedIn) {
      navigate('/app/login', { replace: true, state: { from: '/app/profile/support/chat' } });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user?.isLoggedIn || booted || activeTicketId) return;
    const prefer = tickets.find((t) => t.status === 'Open' || t.status === 'Replied');
    if (prefer?.id) {
      openTicket(prefer.id);
      setBooted(true);
    }
  }, [user, tickets, booted, activeTicketId, openTicket]);

  useEffect(() => {
    if (!user?.isLoggedIn) return undefined;
    const timer = setTimeout(() => setBooted(true), 900);
    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, activeTicketId]);

  const grouped = useMemo(() => {
    const rows = [];
    let lastDay = '';
    for (const msg of messages) {
      const label = dayLabel(msg.createdAt);
      if (label && label !== lastDay) {
        rows.push({ type: 'day', id: `day-${label}-${msg.createdAt}`, label });
        lastDay = label;
      }
      rows.push({ type: 'msg', id: msg.id || `${msg.createdAt}-${msg.messageText}`, message: msg });
    }
    return rows;
  }, [messages]);

  const busy = sending || uploading;
  const canSend = Boolean(draft.trim()) && !busy;

  const deliver = async (text, imageUrl = '') => {
    if (activeTicketId) {
      return sendMessage(text, imageUrl);
    }
    return createConversation(DEFAULT_SUBJECT, text, imageUrl);
  };

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    const ok = await deliver(text, '');
    if (ok) {
      setDraft('');
      inputRef.current?.focus();
    }
  };

  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showTopFloatNotification('Only images are allowed.', 'danger');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showTopFloatNotification('Image must be under 5MB.', 'danger');
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadSupportImage(file);
      if (!imageUrl) return;
      await deliver(draft.trim(), imageUrl);
      setDraft('');
    } finally {
      setUploading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user?.isLoggedIn) return null;

  return (
    <div className="mmf-pwa flex min-h-[100dvh] flex-col bg-white font-sans text-[#111111]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[#f0f0f0] bg-white px-4 py-3.5 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => navigate('/app/profile/support')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-[#111111]"
            aria-label="Back"
          >
            <i className="fa-solid fa-chevron-left text-[0.95rem]" />
          </button>
          <h1 className="m-0 flex-1 text-center text-[1.12rem] font-semibold tracking-tight">
            Customer Service
          </h1>
          <span className="h-10 w-10 shrink-0" aria-hidden="true" />
        </header>

        <div
          ref={messagesRef}
          className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4 [scrollbar-width:thin]"
        >
          {!booted ? (
            <p className="m-0 py-10 text-center text-[0.88rem] font-medium text-[#9a9a9a]">Loading…</p>
          ) : grouped.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
              <p className="m-0 text-[0.95rem] font-semibold text-[#111111]">How can we help?</p>
              <p className="mb-0 mt-2 text-[0.84rem] font-medium leading-relaxed text-[#8a8a8a]">
                Send a message or a photo. Our team will reply here.
              </p>
            </div>
          ) : (
            grouped.map((row) =>
              row.type === 'day' ? (
                <div key={row.id} className="flex justify-center py-1">
                  <span className="text-[0.75rem] font-medium text-[#9a9a9a]">{row.label}</span>
                </div>
              ) : (
                <ChatBubble key={row.id} message={row.message} />
              )
            )
          )}
        </div>

        {activeTicket?.status === 'Closed' ? (
          <div className="border-t border-[#f0f0f0] bg-[#fafafa] px-4 py-2 text-center text-[0.78rem] font-medium text-[#8a8a8a]">
            This chat was closed. Send a message to continue.
          </div>
        ) : null}

        <div className="border-t border-[#f0f0f0] bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5">
          <div className="flex items-end gap-2.5">
            <div className="flex min-h-[48px] min-w-0 flex-1 items-center rounded-full bg-[#f2f2f2] pl-4 pr-1.5">
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message..."
                disabled={busy}
                className="min-w-0 flex-1 border-0 bg-transparent py-3 text-[0.92rem] font-normal text-black outline-none placeholder:text-[#b0b0b0] disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-[#6b6b6b] disabled:opacity-40"
                aria-label="Send photo"
                title="Send photo"
              >
                <i
                  className={`fa-regular fa-image text-[1.15rem] ${uploading ? 'fa-spinner fa-spin' : ''}`}
                />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleImagePick}
              />
            </div>

            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-0 bg-black text-white disabled:opacity-35"
              aria-label="Send message"
              title="Send"
            >
              <i
                className={`fa-solid fa-paper-plane text-[0.95rem] ${sending ? 'fa-spinner fa-spin' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
