import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiUrl } from '../../utils/data';
import { formatChatTime } from '../../utils/format';

const FALLBACK_FAQS = [
  {
    icon: 'fa-solid fa-box',
    title: 'How can I track my order?',
    body: 'You can track your order from the Track Order page. Enter your Order ID to view your order status and latest updates.',
  },
  {
    icon: 'fa-regular fa-credit-card',
    title: 'How do I retry failed payment?',
    body: 'You can retry a failed payment by clicking on the order in your Order History and selecting "Retry Payment", or contact our customer support for assistance.',
  },
  {
    icon: 'fa-solid fa-truck',
    title: 'How long does delivery take?',
    body: 'Deliveries within Mogadishu typically take 24 to 48 hours depending on your district and courier availability.',
  },
  {
    icon: 'fa-solid fa-location-dot',
    title: 'How can I change my address?',
    body: 'To change your shipping address, please contact our support team immediately before the order status updates to "Out for Delivery".',
  },
  {
    icon: 'fa-solid fa-rotate-left',
    title: 'How can I return a product?',
    body: 'We accept returns within 7 days of delivery for unused products in their original packaging. Please submit a support ticket to initiate the process.',
  },
];

function FaqAccordion({ items }) {
  const [openIndex, setOpenIndex] = useState(0);
  const faqItems = items?.length ? items : FALLBACK_FAQS;

  return (
    <div className="faq-list">
      {faqItems.map((item, index) => {
        const isOpen = openIndex === index;
        const title = item.question || item.title;
        const body = item.answer || item.body;
        return (
          <div key={title} className={`faq-item ${isOpen ? 'active' : ''}`}>
            <button
              type="button"
              className="faq-header"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
            >
              <div className="faq-header-left">
                <span className="faq-icon-wrap">
                  <i className={item.icon || 'fa-solid fa-circle-question'} />
                </span>
                <span className="faq-title">{title}</span>
              </div>
              <i className={`fa-solid ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'} faq-chevron`} />
            </button>
            {isOpen && (
              <div className="faq-body" style={{ display: 'block' }}>
                {body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ProfileHelpTab({ supportChat }) {
  const [faqItems, setFaqItems] = useState(FALLBACK_FAQS);

  useEffect(() => {
    fetch(apiUrl('/api/cms'))
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.cms?.faqs?.length) {
          setFaqItems(data.cms.faqs.sort((a, b) => (a.order || 0) - (b.order || 0)));
        }
      })
      .catch(() => {});
  }, []);
  const {
    tickets,
    activeTicket,
    messages,
    view,
    sending,
    createConversation,
    sendMessage,
    openTicket,
    backToForm,
    formatPastChatTime,
  } = supportChat;

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [chatInput, setChatInput] = useState('');
  const messagesRef = useRef(null);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, view]);

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !message.trim()) return;
    const ok = await createConversation(subject, message.trim());
    if (ok) {
      setSubject('');
      setMessage('');
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const ok = await sendMessage(chatInput);
    if (ok) setChatInput('');
  };

  const statusClass =
    activeTicket?.status === 'Open'
      ? 'bg-warning text-dark'
      : activeTicket?.status === 'Replied'
        ? 'bg-success text-white'
        : 'bg-secondary text-white';

  return (
    <div className="pf-tab active">
      <h1
        className="pf-main-title"
        style={{
          fontWeight: 800,
          color: '#073D35',
          marginBottom: '6px',
          fontSize: '2.2rem',
          fontFamily: "'Cormorant Garamond', serif",
        }}
      >
        Help & Support
      </h1>
      <p
        className="pf-main-sub"
        style={{ fontSize: '0.88rem', color: '#6b7280', marginBottom: '24px', fontWeight: 500 }}
      >
        <Link to="/" style={{ textDecoration: 'none', color: '#073D35', fontWeight: 600 }}>
          Home
        </Link>
        <span style={{ margin: '0 8px', color: '#9ca3af' }}>&gt;</span>
        <span style={{ color: '#6b7280' }}>Help & Support</span>
      </p>

      <div className="row g-3 mb-3">
        <div className="col-lg-6">
          <div className="support-card" id="customerSupportCard">
            {view === 'form' ? (
              <div id="customerSupportFormView" className="d-flex flex-column h-100" style={{ overflow: 'hidden' }}>
                <h3 className="support-card-title">Submit a Support Request</h3>
                <form id="customerSupportForm" style={{ flexShrink: 0 }} onSubmit={handleSupportSubmit}>
                  <div className="mb-3">
                    <label className="support-label">Subject</label>
                    <div className="support-select-wrapper">
                      <select
                        id="customerSupportSubject"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      >
                        <option value="" disabled>
                          Select a subject
                        </option>
                        <option value="Payment Issue">Payment Issue</option>
                        <option value="Delivery Delay">Delivery Delay</option>
                        <option value="Product Damage">Product Damage</option>
                        <option value="Account Issue">Account Issue</option>
                      </select>
                      <i className="fa-solid fa-chevron-down" />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="support-label">Message</label>
                    <div className="support-textarea-wrapper">
                      <textarea
                        id="customerSupportMessage"
                        placeholder="Write your problem here..."
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                      <button type="submit" className="support-submit-icon-btn" title="Submit Request" disabled={sending}>
                        <i className="fa-regular fa-paper-plane" />
                      </button>
                    </div>
                  </div>
                </form>

                {tickets.length > 0 && (
                  <div className="mt-3">
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px' }}>Past Conversations</h4>
                    <div id="customerPastChatsList">
                      {tickets.map((ticket) => (
                        <button
                          key={ticket.id}
                          type="button"
                          className="past-chat-item"
                          onClick={() => openTicket(ticket.id)}
                          style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
                        >
                          <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                            <div className="past-chat-subject">{ticket.subject}</div>
                            <div className="past-chat-preview">
                              {ticket.lastMessageText || ticket.subject || 'No messages'}
                            </div>
                          </div>
                          <div className="past-chat-time">{formatPastChatTime(ticket.lastMessageAt)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div id="customerActiveChatView" className="d-flex flex-column h-100">
                <div
                  className="d-flex align-items-center justify-content-between pb-2 mb-2"
                  style={{ borderBottom: '1px solid #eee', flexShrink: 0 }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <div
                      id="activeChatAvatar"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#073D35',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                      }}
                    >
                      {(activeTicket?.subject || 'S').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <span
                        className="fw-bold d-block"
                        id="activeChatSubject"
                        style={{
                          fontSize: '0.85rem',
                          color: '#111',
                          maxWidth: '140px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {activeTicket?.subject || 'Subject'}
                      </span>
                      <span className={`badge ${statusClass}`} id="activeChatStatus" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                        {activeTicket?.status || 'Open'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    id="btnBackToForm"
                    style={{ fontSize: '0.75rem', borderRadius: '6px', padding: '4px 8px' }}
                    onClick={backToForm}
                  >
                    <i className="fa-solid fa-arrow-left me-1" /> Back
                  </button>
                </div>

                <div
                  ref={messagesRef}
                  className="chat-messages-container overflow-y-auto flex-grow-1 p-2 rounded-3 mb-2"
                  id="customerChatMessagesList"
                  style={{
                    background: '#f9f9f9',
                    border: '1px solid rgba(0,0,0,0.03)',
                    maxHeight: '320px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {messages.map((msg) => {
                    const isSent = msg.senderRole === 'user';
                    return (
                      <div key={msg.id || `${msg.createdAt}-${msg.messageText}`} className={`chat-bubble-wrap ${isSent ? 'sent' : 'received'} mb-2`}>
                        <div className="chat-bubble">
                          <div style={{ fontWeight: 700, fontSize: '0.65rem', marginBottom: '2px', opacity: 0.85 }}>
                            {isSent ? 'Aniga' : 'Support Team'}
                          </div>
                          {msg.messageText}
                          <span className="chat-bubble-time">{formatChatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form id="customerChatInputForm" style={{ display: 'flex', gap: '8px', flexShrink: 0 }} onSubmit={handleChatSubmit}>
                  <input
                    type="text"
                    className="form-control"
                    id="customerChatMessageInput"
                    placeholder="Write your message here..."
                    style={{ fontSize: '0.85rem', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '8px 12px', flexGrow: 1 }}
                    required
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    className="btn"
                    style={{ backgroundColor: '#073D35', color: 'white', borderRadius: '8px', padding: '8px 15px', border: 'none' }}
                    disabled={sending}
                  >
                    <i className="fa-regular fa-paper-plane" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="faq-card">
            <h3 className="support-card-title">Quick Help / FAQ</h3>
            <FaqAccordion items={faqItems} />
          </div>
        </div>
      </div>
    </div>
  );
}
