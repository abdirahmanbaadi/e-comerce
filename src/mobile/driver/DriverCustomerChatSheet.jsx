import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDeliveryChat } from '../../hooks/useDeliveryChat';
import { showTopFloatNotification } from '../../utils/notifications';

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

function ChatBubble({ message, selfRole = 'driver' }) {
  const isSelf = message.senderRole === selfRole;
  return (
    <div className={`flex w-full ${isSelf ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative w-fit max-w-[78%] px-3.5 py-2.5 ${
          isSelf
            ? 'rounded-[20px] rounded-tr-[3px] bg-[#2f6b45] text-white'
            : 'rounded-[20px] rounded-tl-[3px] bg-[#f0f0f0] text-black'
        }`}
      >
        {message.imageUrl ? (
          <img
            src={message.imageUrl}
            alt=""
            className="mb-1.5 max-h-44 w-full rounded-[14px] object-cover"
          />
        ) : null}
        {message.messageText ? (
          <p className="m-0 whitespace-pre-wrap break-words text-[0.92rem] font-normal leading-[1.35]">
            {message.messageText}
          </p>
        ) : null}
        <span
          className={`mt-1 block text-right text-[0.68rem] leading-none ${
            isSelf ? 'text-white/55' : 'text-[#9a9a9a]'
          }`}
        >
          {formatBubbleTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

/**
 * Driver ↔ customer chat sheet — backed by `/api/orders/:id/delivery-chat`.
 */
export default function DriverCustomerChatSheet({
  order,
  open,
  onClose,
  selfRole = 'driver',
  peerName = '',
}) {
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState('');
  const messagesRef = useRef(null);
  const inputRef = useRef(null);

  const orderId = order?.id;
  const { messages, sending, error, canSend, sendMessage } = useDeliveryChat({
    orderId,
    enabled: Boolean(open && orderId),
    pollMs: 4000,
  });

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    setDraft('');
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, open]);

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

  const title =
    peerName ||
    (selfRole === 'driver' ? order?.customer || 'Customer' : order?.driver || order?.driverInfo?.name || 'Driver');

  const canSendNow = Boolean(draft.trim()) && !sending && canSend;

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !orderId || sending) return;
    const msg = await sendMessage({ messageText: text });
    if (msg) {
      setDraft('');
      inputRef.current?.focus();
    } else {
      showTopFloatNotification(error || 'Could not send message.', 'danger');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open || !order) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1400] flex items-end justify-center">
      <button
        type="button"
        aria-label="Close chat"
        className={`absolute inset-0 border-0 bg-black/45 transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        className={`relative z-10 flex h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-12px_40px_rgba(0,0,0,0.22)] transition-transform duration-300 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={selfRole === 'driver' ? 'Message customer' : 'Message driver'}
      >
        <div className="flex shrink-0 flex-col items-center pt-2.5">
          <span className="h-1.5 w-11 rounded-full bg-[#d8d8d8]" />
        </div>

        <header className="flex shrink-0 items-center gap-2 border-b border-[#f0f0f0] px-3 pb-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-[#111]"
            aria-label="Back"
          >
            <i className="fa-solid fa-chevron-left text-[0.95rem]" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-center text-[1.05rem] font-semibold text-[#111]">{title}</p>
            <p className="mb-0 mt-0.5 truncate text-center text-[0.7rem] font-medium text-[#8a8a8a]">
              Order {order.id}
            </p>
          </div>
          <span className="h-10 w-10 shrink-0" aria-hidden />
        </header>

        <div
          ref={messagesRef}
          className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4 [scrollbar-width:thin]"
        >
          {grouped.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
              <p className="m-0 text-[0.95rem] font-semibold text-[#111]">
                {selfRole === 'driver' ? 'Message the customer' : 'Message your driver'}
              </p>
              <p className="mb-0 mt-2 text-[0.84rem] font-medium leading-relaxed text-[#8a8a8a]">
                {selfRole === 'driver'
                  ? 'Ask about the gate, landmark, or arrival time.'
                  : 'Share a landmark, gate code, or ask about ETA.'}
              </p>
            </div>
          ) : (
            grouped.map((row) =>
              row.type === 'day' ? (
                <div key={row.id} className="flex justify-center py-1">
                  <span className="text-[0.75rem] font-medium text-[#9a9a9a]">{row.label}</span>
                </div>
              ) : (
                <ChatBubble key={row.id} message={row.message} selfRole={selfRole} />
              )
            )
          )}
        </div>

        <div className="shrink-0 border-t border-[#f0f0f0] bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5">
          {!canSend ? (
            <p className="mb-2 mt-0 text-center text-[0.72rem] font-semibold text-[#8a8a8a]">
              Chat is read-only for this order.
            </p>
          ) : null}
          <div className="flex items-end gap-2.5">
            <div className="flex min-h-[48px] min-w-0 flex-1 items-center rounded-full bg-[#f2f2f2] px-4">
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message..."
                disabled={sending || !canSend}
                className="min-w-0 flex-1 border-0 bg-transparent py-3 text-[0.92rem] font-normal text-black outline-none placeholder:text-[#b0b0b0] disabled:opacity-60"
              />
            </div>
            <button
              type="button"
              onClick={handleSend}
              disabled={!canSendNow}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-0 bg-[#2f6b45] text-white disabled:opacity-35"
              aria-label="Send message"
            >
              <i className={`fa-solid fa-paper-plane text-[0.95rem] ${sending ? 'fa-spinner fa-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
