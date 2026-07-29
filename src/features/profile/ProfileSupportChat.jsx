import { useEffect, useMemo, useRef, useState } from 'react';
import { productImage } from '../../utils/format';
import { showTopFloatNotification } from '../../utils/notifications';

const SUBJECT_OPTIONS = [
  'Payment Issue',
  'Delivery Delay',
  'Product Damage',
  'Account Issue',
];

function statusMeta(status) {
  if (status === 'Replied') {
    return { label: 'Replied', cls: 'bg-emerald-100 text-emerald-700' };
  }
  if (status === 'Closed') {
    return { label: 'Closed', cls: 'bg-gray-100 text-gray-600' };
  }
  return { label: 'Open', cls: 'bg-amber-100 text-amber-800' };
}

function SupportAvatar({ size = 44 }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-deepGreen text-white shadow-sm"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <i className="fa-solid fa-headset text-[0.95rem]" />
    </div>
  );
}

function ConversationItem({ ticket, active, onSelect, formatPastChatTime }) {
  const status = statusMeta(ticket.status);
  const snippet = ticket.lastMessageText || ticket.subject || 'No messages yet';

  return (
    <button
      type="button"
      onClick={() => onSelect(ticket.id)}
      className={`flex w-full cursor-pointer items-center gap-3 border-b border-black/[0.04] px-4 py-3.5 text-left transition hover:bg-[#f5f6f6] ${
        active ? 'bg-[#f0f2f1] border-l-4 border-l-deepGreen' : 'border-l-4 border-l-transparent'
      }`}
    >
      <SupportAvatar size={48} />
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center justify-between gap-2">
          <span className="truncate text-[0.92rem] font-bold text-gray-900">{ticket.subject}</span>
          <span className="shrink-0 text-[0.72rem] text-gray-400">{formatPastChatTime(ticket.lastMessageAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[0.8rem] text-gray-500">{snippet}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${status.cls}`}>
            {status.label}
          </span>
        </div>
      </div>
    </button>
  );
}

function ChatBubble({ message, formatChatTime }) {
  const isUser = message.senderRole === 'user';
  const imageSrc = message.imageUrl ? productImage(message.imageUrl) : '';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-3 py-2 shadow-[0_1px_1px_rgba(0,0,0,0.06)] ${
          isUser
            ? 'rounded-br-sm bg-[#d9fdd3] text-gray-900'
            : 'rounded-bl-sm bg-white text-gray-900'
        }`}
      >
        {!isUser && (
          <div className="mb-1 text-[0.68rem] font-bold text-deepGreen">Support Team</div>
        )}
        {imageSrc && (
          <a href={imageSrc} target="_blank" rel="noopener noreferrer" className="mb-1 block">
            <img
              src={imageSrc}
              alt="Shared attachment"
              className="max-h-56 w-full rounded-xl object-cover"
            />
          </a>
        )}
        {message.messageText ? (
          <div className="whitespace-pre-wrap break-words text-[0.86rem] leading-relaxed">{message.messageText}</div>
        ) : null}
        <span className={`mt-1 block text-[0.65rem] text-gray-500 ${isUser ? 'text-right' : 'text-left'}`}>
          {formatChatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

function ChatComposer({
  value,
  onChange,
  onSend,
  onImagePick,
  sending,
  uploading,
  disabled,
  placeholder = 'Type a message…',
  canSend,
}) {
  const fileRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend?.();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showTopFloatNotification('❌ Kaliya sawir ayaa la ogol yahay.', 'danger');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showTopFloatNotification('❌ Sawirku waa inuu ka yar yahay 5MB.', 'danger');
      return;
    }
    onImagePick?.(file);
  };

  const sendEnabled = canSend ?? Boolean(value.trim());

  return (
    <div className="border-t border-black/[0.06] bg-[#f0f2f1] px-3 py-3">
      <div className="flex items-end gap-2 rounded-full border border-black/[0.06] bg-white px-2 py-1.5 shadow-sm">
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-deepGreen disabled:opacity-50"
          onClick={() => fileRef.current?.click()}
          disabled={disabled || sending || uploading}
          title="Send image"
          aria-label="Send image"
        >
          <i className={`fa-regular fa-image text-[1.15rem] ${uploading ? 'fa-spinner fa-spin' : ''}`} />
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
          placeholder={placeholder}
          disabled={disabled || sending || uploading}
          className="max-h-28 min-h-[40px] flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[0.88rem] outline-none placeholder:text-gray-400"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || sending || uploading || !sendEnabled}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-deepGreen text-white transition hover:bg-[#0b5e52] disabled:opacity-40"
          title="Send message"
          aria-label="Send message"
        >
          <i className={`fa-solid fa-paper-plane text-[0.95rem] ${sending ? 'fa-spinner fa-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}

function NewConversationPanel({ onCreate, sending, onUploadImage }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [pendingImage, setPendingImage] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleImagePick = async (file) => {
    setUploading(true);
    try {
      const url = await onUploadImage(file);
      if (url) setPendingImage(url);
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if (!subject) {
      showTopFloatNotification('❌ Fadlan dooro mawduuca.', 'warning');
      return;
    }
    if (!message.trim() && !pendingImage) {
      showTopFloatNotification('❌ Qor fariin ama soo dir sawir.', 'warning');
      return;
    }
    const ok = await onCreate(subject, message, pendingImage);
    if (ok) {
      setSubject('');
      setMessage('');
      setPendingImage('');
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#efeae2]">
      <header className="flex items-center gap-3 border-b border-black/[0.06] bg-[#f0f2f1] px-4 py-3">
        <SupportAvatar size={40} />
        <div>
          <div className="text-[0.95rem] font-bold text-gray-900">New support chat</div>
          <div className="text-[0.75rem] text-gray-500">Choose a subject and send your first message</div>
        </div>
      </header>

      <div className="flex flex-1 flex-col justify-end p-4">
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
          <label htmlFor="newSupportSubject" className="mb-2 block text-[0.78rem] font-bold text-gray-600">
            Subject
          </label>
          <select
            id="newSupportSubject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mb-4 w-full cursor-pointer rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 text-[0.86rem] outline-none focus:border-deepGreen"
          >
            <option value="">Select a subject…</option>
            {SUBJECT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {pendingImage && (
            <div className="relative mb-3 inline-block">
              <img src={productImage(pendingImage)} alt="Pending upload" className="max-h-40 rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => setPendingImage('')}
                className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-white"
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      <ChatComposer
        value={message}
        onChange={setMessage}
        onSend={handleSend}
        onImagePick={handleImagePick}
        sending={sending}
        uploading={uploading}
        disabled={!subject}
        canSend={Boolean(message.trim() || pendingImage)}
        placeholder={subject ? 'Write your first message…' : 'Select a subject first…'}
      />
    </div>
  );
}

export default function ProfileSupportChat({ supportChat, className = '' }) {
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
    formatPastChatTime,
    backToForm,
  } = supportChat;

  const [composeNew, setComposeNew] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const messagesRef = useRef(null);

  const formatChatTime = (dateVal) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, activeTicketId, composeNew]);

  const filteredTickets = useMemo(() => {
    const q = sidebarSearch.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(
      (t) =>
        t.subject?.toLowerCase().includes(q) ||
        t.lastMessageText?.toLowerCase().includes(q) ||
        String(t.id).toLowerCase().includes(q)
    );
  }, [tickets, sidebarSearch]);

  const handleSelectTicket = (ticketId) => {
    setComposeNew(false);
    openTicket(ticketId);
  };

  const handleStartNew = () => {
    setComposeNew(true);
    backToForm?.();
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    const ok = await sendMessage(chatInput);
    if (ok) setChatInput('');
  };

  const handleSendImage = async (file) => {
    setUploading(true);
    try {
      const imageUrl = await uploadSupportImage(file);
      if (!imageUrl) return;
      await sendMessage('', imageUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (subject, messageText, imageUrl) => {
    const ok = await createConversation(subject, messageText, imageUrl);
    if (ok) setComposeNew(false);
    return ok;
  };

  const showMobileChat = Boolean(activeTicketId || composeNew);

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] ${className}`}
    >
      <div className="flex h-full min-h-0">
        <aside
          className={`flex w-full flex-col border-r border-black/[0.06] bg-white md:w-[34%] md:min-w-[260px] md:max-w-[320px] ${
            showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="shrink-0 border-b border-black/[0.06] bg-[#f7f8f7] px-4 py-3">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <h3 className="text-[0.95rem] font-extrabold text-deepGreen">Chats</h3>
              <button
                type="button"
                onClick={handleStartNew}
                className="inline-flex items-center gap-1.5 rounded-full bg-deepGreen px-3 py-1.5 text-[0.75rem] font-bold text-white transition hover:bg-[#0b5e52]"
              >
                <i className="fa-solid fa-plus text-[0.7rem]" />
                New
              </button>
            </div>
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[0.8rem] text-gray-400" />
              <input
                type="search"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Search chats…"
                className="w-full rounded-full border border-black/[0.06] bg-white py-2 pl-9 pr-3 text-[0.84rem] outline-none focus:border-deepGreen"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
            {filteredTickets.length === 0 ? (
              <div className="px-4 py-10 text-center text-[0.85rem] text-gray-400">
                <i className="fa-regular fa-comments mb-3 block text-3xl opacity-40" />
                No conversations yet.
                <br />
                Tap <strong>New</strong> to start.
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <ConversationItem
                  key={ticket.id}
                  ticket={ticket}
                  active={!composeNew && ticket.id === activeTicketId}
                  onSelect={handleSelectTicket}
                  formatPastChatTime={formatPastChatTime}
                />
              ))
            )}
          </div>
        </aside>

        <section
          className={`min-w-0 flex-1 flex-col bg-[#efeae2] ${showMobileChat ? 'flex' : 'hidden md:flex'}`}
        >
          {composeNew ? (
            <NewConversationPanel
              onCreate={handleCreate}
              sending={sending}
              onUploadImage={uploadSupportImage}
            />
          ) : !activeTicket ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center text-gray-500">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-deepGreen/10 text-deepGreen">
                <i className="fa-solid fa-headset text-3xl" />
              </div>
              <h4 className="mb-2 text-base font-bold text-gray-800">Help & Support</h4>
              <p className="mb-5 max-w-[280px] text-[0.84rem] leading-relaxed">
                Dooro wadahadal bidix ka mid ah ama samee mid cusub si aad ula hadasho kooxda taageerada.
              </p>
              <button
                type="button"
                onClick={handleStartNew}
                className="rounded-full bg-deepGreen px-5 py-2.5 text-[0.84rem] font-bold text-white transition hover:bg-[#0b5e52]"
              >
                Start new chat
              </button>
            </div>
          ) : (
            <>
              <header className="flex items-center gap-3 border-b border-black/[0.06] bg-[#f0f2f1] px-3 py-3 md:px-4">
                <button
                  type="button"
                  className="mr-1 flex h-9 w-9 items-center justify-center rounded-full text-gray-600 hover:bg-black/5 md:hidden"
                  onClick={() => {
                    setComposeNew(false);
                    backToForm?.();
                  }}
                  aria-label="Back to chats"
                >
                  <i className="fa-solid fa-arrow-left" />
                </button>
                <SupportAvatar size={40} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[0.95rem] font-bold text-gray-900">{activeTicket.subject}</div>
                  <div className="truncate text-[0.75rem] text-gray-500">
                    Ticket {activeTicket.id} • {statusMeta(activeTicket.status).label}
                  </div>
                </div>
              </header>

              <div
                ref={messagesRef}
                className="flex flex-1 flex-col gap-2 overflow-y-auto bg-[#efeae2] p-3 md:p-4 [scrollbar-width:thin]"
                style={{
                  backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)',
                  backgroundSize: '18px 18px',
                }}
              >
                {messages.length === 0 ? (
                  <div className="py-8 text-center text-[0.85rem] text-gray-500">No messages yet.</div>
                ) : (
                  messages.map((msg) => (
                    <ChatBubble
                      key={msg.id || `${msg.createdAt}-${msg.messageText}`}
                      message={msg}
                      formatChatTime={formatChatTime}
                    />
                  ))
                )}
              </div>

              {activeTicket.status === 'Closed' && (
                <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-center text-[0.8rem] text-amber-800">
                  Ticket-kan waa la xiray. Fariin dir si aad dib u furto.
                </div>
              )}

              <ChatComposer
                value={chatInput}
                onChange={setChatInput}
                onSend={handleSendChat}
                onImagePick={handleSendImage}
                sending={sending}
                uploading={uploading}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
