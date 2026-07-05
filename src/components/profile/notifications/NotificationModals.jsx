import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLastOrderDetails, getOrderTotalFormatted } from '../../../utils/notificationOrderContext';
import { apiUrl } from '../../../utils/data';
import { formatMoney } from '../../../utils/format';
import { showTopFloatNotification } from '../../../utils/notifications';

const FALLBACK_ADMIN_REPLY =
  'We reviewed your issue and found that your EVC Plus payment was not completed successfully. Please try the payment again using the same phone number you used before. If the problem continues, our support team will be happy to help you further.';

function ModalBackdrop({ children, onClose, dialogClass = 'oc-modal-dialog', style }) {
  useEffect(() => {
    if (!onClose) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="pf-react-modal-backdrop" onClick={onClose} role="presentation">
      <div
        className={`modal-dialog modal-dialog-centered ${dialogClass}`}
        style={style}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

function LeafLeft() {
  return (
    <span className="ps-deco-leaf left">
      <svg width="32" height="26" viewBox="0 0 32 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M26 21C18 19 9 12 13.5 5C19 5 23 10 26 21Z" fill="#A7C1AE" />
        <path d="M28 23C19.5 24 12 19 13 13C18 13.5 23.5 17.5 28 23Z" fill="#A7C1AE" opacity="0.85" />
      </svg>
    </span>
  );
}

function LeafRight() {
  return (
    <span className="ps-deco-leaf right">
      <svg width="32" height="26" viewBox="0 0 32 26" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'scaleX(-1)' }}>
        <path d="M26 21C18 19 9 12 13.5 5C19 5 23 10 26 21Z" fill="#A7C1AE" />
        <path d="M28 23C19.5 24 12 19 13 13C18 13.5 23.5 17.5 28 23Z" fill="#A7C1AE" opacity="0.85" />
      </svg>
    </span>
  );
}

function Sparkle({ className }) {
  return (
    <span className={className}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 0L10.2 5.8L16 8L10.2 10.2L8 16L5.8 10.2L0 8L5.8 5.8L8 0Z" fill="#D8A128" />
      </svg>
    </span>
  );
}

function GoldStarSeparator({ className = 'ps-separator' }) {
  return (
    <div className={className}>
      <span className="ps-star">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 0L10.2 5.8L16 8L10.2 10.2L8 16L5.8 10.2L0 8L5.8 5.8L8 0Z" fill="#D8A128" />
        </svg>
      </span>
    </div>
  );
}

function PremiumDeco({ children, containerClass = 'ps-illustration-container' }) {
  return (
    <div className={containerClass}>
      {children}
      <LeafLeft />
      <LeafRight />
      <Sparkle className="ps-deco-sparkle top-left" />
      <Sparkle className="ps-deco-sparkle top-right" />
    </div>
  );
}

function CloseAbsolute({ onClose }) {
  return (
    <button type="button" className="oc-btn-close-absolute" onClick={onClose} aria-label="Close">
      <i className="fa-solid fa-xmark" />
    </button>
  );
}

function OrderConfirmedModal({ onClose, onViewDetails }) {
  const order = getLastOrderDetails();

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="modal-content oc-modal-content">
        <CloseAbsolute onClose={onClose} />
        <div className="oc-modal-body">
          <PremiumDeco containerClass="oc-illustration-container">
            <div className="oc-success-circle">
              <i className="fa-solid fa-check" />
            </div>
            <span className="oc-deco-leaf left"><i className="fa-solid fa-seedling" /></span>
            <span className="oc-deco-leaf right"><i className="fa-solid fa-seedling" /></span>
            <span className="oc-deco-sparkle top-left">✦</span>
            <span className="oc-deco-sparkle top-right">✦</span>
          </PremiumDeco>
          <h2 className="oc-modal-title">Order Confirmed</h2>
          <div className="oc-separator">
            <span className="oc-star">✦</span>
          </div>
          <p className="oc-desc">
            Thank you for your order! We&apos;ve received it and are preparing it for a smooth delivery.
          </p>
          <div className="oc-info-box">
            <div className="oc-info-row">
              <div className="oc-info-left">
                <span className="oc-info-icon"><i className="fa-regular fa-file-lines" /></span>
                <span className="oc-info-label">Order ID</span>
              </div>
              <span className="oc-info-value">{order.orderId}</span>
            </div>
            <div className="oc-info-row">
              <div className="oc-info-left">
                <span className="oc-info-icon"><i className="fa-regular fa-calendar" /></span>
                <span className="oc-info-label">Order Date</span>
              </div>
              <span className="oc-info-value">{order.orderDate || 'May 15, 2025'}</span>
            </div>
            <div className="oc-info-row">
              <div className="oc-info-left">
                <span className="oc-info-icon"><i className="fa-regular fa-circle-check" /></span>
                <span className="oc-info-label">Current Status</span>
              </div>
              <span className="oc-status-badge text-success bg-success-subtle">Confirmed</span>
            </div>
          </div>
        </div>
        <div className="oc-modal-footer">
          <button type="button" className="oc-btn-view-details" onClick={onViewDetails}>
            View Order Details
          </button>
          <button type="button" className="oc-btn-close-footer" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

function OrderDetailsModal({ onClose }) {
  const order = getLastOrderDetails();
  const items = order.items?.length ? order.items : [];

  return (
    <ModalBackdrop onClose={onClose} dialogClass="od-modal-dialog">
      <div className="modal-content od-modal-content">
        <div className="od-modal-header">
          <div className="od-header-title-area">
            <div className="od-header-icon-wrap">
              <i className="fa-solid fa-bag-shopping" />
            </div>
            <h2 className="od-modal-title">Order Details</h2>
          </div>
          <button type="button" className="od-btn-close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="od-grid-three-col">
          <div className="od-info-group">
            <span className="od-info-label">Order ID</span>
            <span className="od-info-value order-id-green">{order.orderId}</span>
          </div>
          <div className="od-info-group">
            <span className="od-info-label">Customer</span>
            <span className="od-info-value">{order.customerName}</span>
          </div>
          <div className="od-info-group">
            <span className="od-info-label">Phone</span>
            <span className="od-info-value">{order.customerPhone}</span>
          </div>
        </div>

        <hr className="od-divider" />

        <div id="odProductsList">
          {items.map((item) => (
            <div key={item.title} className="od-product-section">
              <img src={item.image} alt={item.title} className="od-product-img" />
              <span className="od-product-name">{item.title}</span>
              <div className="od-product-qty-col">
                <span className="od-info-label">Qty</span>
                <span className="od-info-value">{item.quantity}</span>
              </div>
              <div className="od-product-price-col">
                <span className="od-info-label">Price</span>
                <span className="od-info-value">{formatMoney(item.price * item.quantity)}</span>
              </div>
            </div>
          ))}
        </div>

        <hr className="od-divider" />

        <div className="od-grid-two-col">
          <div className="od-info-group">
            <span className="od-info-label">Payment Method</span>
            <span className="od-info-value">{order.paymentMethod}</span>
          </div>
          <div className="od-info-group">
            <span className="od-info-label">Payment Status</span>
            <span className={`od-status-badge ${order.paymentStatus?.toLowerCase() === 'paid' ? 'paid' : 'pending'}`}>
              {order.paymentStatus}
            </span>
          </div>
          <div className="od-info-group">
            <span className="od-info-label">Delivery Address</span>
            <span className="od-info-value">{order.deliveryAddress}</span>
          </div>
        </div>

        <hr className="od-divider" />

        <div className="od-info-group">
          <span className="od-info-label">Order Status</span>
          <span className="od-status-badge confirmed">{order.orderStatus} ✓</span>
        </div>

        <div className="od-modal-footer">
          <Link to="/track-order" className="od-btn-track" onClick={onClose}>
            <i className="fa-solid fa-location-dot" /> Track Order
          </Link>
          <button type="button" className="od-btn-close-footer" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

function PaymentSuccessModal({ onClose, order }) {
  const total = getOrderTotalFormatted(order);
  const orderId = order?.orderId || 'MF-250515-001';

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="modal-content ps-modal-content">
        <CloseAbsolute onClose={onClose} />
        <div className="oc-modal-body">
          <PremiumDeco>
            <div className="ps-success-circle">
              <svg width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9.5L10.5 17L25 3.5" stroke="#073D35" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </PremiumDeco>
          <h2 className="ps-modal-title">Payment Successfully</h2>
          <GoldStarSeparator />
          <p className="ps-desc" style={{ maxWidth: 380 }}>
            Thank you for your payment of <strong>{total}</strong> for Order <strong>#{orderId}</strong>. Your order
            has been confirmed successfully. We truly appreciate your trust and shopping with us.
          </p>
        </div>
        <div className="oc-modal-footer d-flex justify-content-center" style={{ marginTop: 20 }}>
          <button type="button" className="ps-btn-close-footer" onClick={onClose} style={{ maxWidth: 160, flex: 'none', width: '100%' }}>
            Close
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

function PaymentFailedModal({ onClose, onRetry, order }) {
  const orderId = order?.orderId || 'MF-250515-001';

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="modal-content pf-modal-content">
        <CloseAbsolute onClose={onClose} />
        <div className="oc-modal-body">
          <PremiumDeco containerClass="pf-illustration-container">
            <div className="pf-failed-circle">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="#ae4e46" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </PremiumDeco>
          <h2 className="pf-modal-title" style={{ color: '#073d35' }}>Payment Failed</h2>
          <GoldStarSeparator className="pf-separator" />
          <p className="pf-desc" style={{ maxWidth: 380 }}>
            Your payment for Order <strong>#{orderId}</strong> was not successful. Please try again or choose a
            different payment method to complete your order.
          </p>
        </div>
        <div className="oc-modal-footer d-flex justify-content-center gap-3" style={{ marginTop: 20 }}>
          <button type="button" className="pf-btn-retry" onClick={onRetry}>
            Retry Payment
          </button>
          <button type="button" className="pf-btn-close-footer" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

function OrderProcessingModal({ onClose }) {
  return (
    <ModalBackdrop onClose={onClose}>
      <div className="modal-content ps-modal-content">
        <CloseAbsolute onClose={onClose} />
        <div className="oc-modal-body">
          <PremiumDeco>
            <div className="ps-success-circle" style={{ backgroundColor: '#e2ece9', position: 'relative' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#073D35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                  <polygon points="12 22.08 12 12 3 6.92 3 17.08 12 22.08" />
                  <polygon points="12 12 21 6.92 21 17.08 12 22.08" />
                  <polygon points="12 2 3 6.92 12 12 21 6.92 12 2" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                <span style={{ position: 'absolute', bottom: -6, right: -6, width: 18, height: 18, backgroundColor: '#073D35', borderRadius: '50%', border: '1.5px solid #e2ece9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '0.65rem' }}>
                  <i className="fa-solid fa-gear fa-spin" />
                </span>
              </div>
            </div>
          </PremiumDeco>
          <h2 className="ps-modal-title">Order Processing</h2>
          <GoldStarSeparator />
          <p className="ps-desc" style={{ maxWidth: 380 }}>
            Good news! We&apos;ve received your order and are currently processing it. We&apos;ll update you once it&apos;s on the way.
          </p>
          <div className="op-progress-container">
            <div className="op-progress-line-bg">
              <div className="op-progress-line-fill" />
            </div>
            <div className="op-progress-steps">
              <div className="op-progress-step completed">
                <div className="op-step-circle"><i className="fa-solid fa-check" /></div>
                <span className="op-step-label">Order<br />Confirmed</span>
              </div>
              <div className="op-progress-step active">
                <div className="op-step-circle"><i className="fa-solid fa-box-open" /></div>
                <span className="op-step-label">Processing</span>
              </div>
              <div className="op-progress-step">
                <div className="op-step-circle"><i className="fa-solid fa-truck" /></div>
                <span className="op-step-label">Out for<br />Delivery</span>
              </div>
              <div className="op-progress-step">
                <div className="op-step-circle"><i className="fa-solid fa-thumbs-up" /></div>
                <span className="op-step-label">Delivered</span>
              </div>
            </div>
          </div>
          <div className="op-est-box">
            <div className="op-est-icon-wrap">
              <i className="fa-regular fa-clock" />
            </div>
            <div className="op-est-text-wrap">
              <span className="op-est-title">Estimated Time</span>
              <span className="op-est-desc">Your order will be on the way within <strong>24 hours</strong>.</span>
            </div>
          </div>
        </div>
        <div className="oc-modal-footer d-flex justify-content-center" style={{ marginTop: 20 }}>
          <button type="button" className="ps-btn-close-footer" onClick={onClose} style={{ maxWidth: 160, flex: 'none', width: '100%' }}>
            Close
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

function SupportRepliedModal({ onClose, userName, repliedTicket, onSendFollowUp, sending }) {
  const firstName = userName?.trim().split(' ')[0] || 'Customer';
  const [adminReply, setAdminReply] = useState('');
  const [loadingReply, setLoadingReply] = useState(Boolean(repliedTicket?.id));
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (!repliedTicket?.id) {
      setAdminReply(FALLBACK_ADMIN_REPLY);
      setLoadingReply(false);
      return undefined;
    }

    let cancelled = false;
    setLoadingReply(true);

    (async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        if (!cancelled) {
          setAdminReply(repliedTicket.lastMessageText || FALLBACK_ADMIN_REPLY);
          setLoadingReply(false);
        }
        return;
      }

      try {
        const response = await fetch(apiUrl(`/api/support/chats/${repliedTicket.id}/messages`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (cancelled) return;

        if (data.success) {
          const adminMessages = (data.messages || []).filter((m) => m.senderRole === 'admin');
          const lastAdmin = adminMessages[adminMessages.length - 1];
          setAdminReply(lastAdmin?.messageText || repliedTicket.lastMessageText || FALLBACK_ADMIN_REPLY);
        } else {
          setAdminReply(repliedTicket.lastMessageText || FALLBACK_ADMIN_REPLY);
        }
      } catch {
        if (!cancelled) {
          setAdminReply(repliedTicket.lastMessageText || FALLBACK_ADMIN_REPLY);
        }
      } finally {
        if (!cancelled) setLoadingReply(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [repliedTicket]);

  const handleReply = async (e) => {
    e.preventDefault();
    const text = replyText.trim();
    if (!text) return;

    if (repliedTicket?.id && onSendFollowUp) {
      const ok = await onSendFollowUp(repliedTicket.id, text);
      if (ok) {
        showTopFloatNotification('✅ Fariintaada waa la diray!');
        setReplyText('');
      }
      return;
    }

    showTopFloatNotification('✅ Your reply has been sent successfully!');
    setReplyText('');
  };

  return (
    <ModalBackdrop onClose={onClose} style={{ maxWidth: 580 }}>
      <div className="modal-content ps-modal-content" style={{ padding: '35px 30px' }}>
        <CloseAbsolute onClose={onClose} />
        <div className="oc-modal-body">
          <PremiumDeco containerClass="ps-illustration-container">
            <div className="ps-success-circle" style={{ backgroundColor: '#e2ece9' }}>
              <i className="fa-solid fa-comment-dots" style={{ fontSize: '2.1rem', color: '#073d35' }} />
            </div>
          </PremiumDeco>
          <h2 className="ps-modal-title" style={{ marginTop: 5, marginBottom: 8, fontSize: '2.1rem' }}>
            Support Replied
          </h2>
          <p className="ps-desc" style={{ maxWidth: 420, fontSize: '0.9rem', marginBottom: 20 }}>
            {repliedTicket?.subject
              ? `Waxaan ka soo jawaabnay cabashadaada: "${repliedTicket.subject}"`
              : 'Our support team has replied to your message.'}
          </p>
          <div className="sr-message-box">
            <p style={{ fontWeight: 700, color: '#333333', marginBottom: 12, fontSize: '0.92rem' }}>
              Hello {firstName},
            </p>
            <p style={{ color: '#444444', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 0 }}>
              {loadingReply ? 'Loading reply...' : adminReply}
            </p>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#777777', textAlign: 'left', margin: '20px 0 8px' }}>
            If you are still facing this issue, please leave a message below.
          </p>
          <form onSubmit={handleReply} style={{ marginBottom: 20 }}>
            <div className="sr-input-wrap">
              <input
                type="text"
                className="sr-reply-input"
                placeholder="Write your message here..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={sending}
              />
              <button type="submit" className="sr-btn-send" disabled={sending || !replyText.trim()}>
                <i className="fa-regular fa-paper-plane" />
              </button>
            </div>
          </form>
        </div>
        <div className="oc-modal-footer d-flex justify-content-end" style={{ marginTop: 10 }}>
          <button type="button" className="ps-btn-close-footer" onClick={onClose} style={{ maxWidth: 140, borderRadius: 8, fontSize: '0.9rem', padding: '10px 20px' }}>
            Close
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

function WishlistAvailableModal({ onClose, navigate }) {
  return (
    <ModalBackdrop onClose={onClose} style={{ maxWidth: 580 }}>
      <div className="modal-content ps-modal-content" style={{ padding: '35px 30px' }}>
        <CloseAbsolute onClose={onClose} />
        <div className="oc-modal-body">
          <PremiumDeco containerClass="ps-illustration-container">
            <div className="ps-success-circle" style={{ backgroundColor: '#e2ece9' }}>
              <svg width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9.5L10.5 17L25 3.5" stroke="#073D35" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </PremiumDeco>
          <h2 className="ps-modal-title" style={{ marginTop: 5, marginBottom: 8, fontSize: '2.1rem', color: '#073D35' }}>
            Wishlist Product Available
          </h2>
          <p className="ps-desc" style={{ maxWidth: 420, fontSize: '0.9rem', marginBottom: 20 }}>
            Good news! A product from your wishlist is now available.
          </p>
          <div className="wpa-product-card">
            <img src="/bedroom/sage-wood-platform-bed-main.jpeg.jpeg" alt="Sage Wood Platform Bed" className="wpa-product-img" />
            <div className="wpa-product-info">
              <h4 className="wpa-product-title">Sage Wood Platform Bed</h4>
              <p className="wpa-product-subtitle">Solid Walnut • Timber Finish</p>
              <div className="wpa-price-badge-row">
                <span className="wpa-product-price">Now Available</span>
              </div>
            </div>
          </div>
          <p style={{ fontSize: '0.88rem', color: '#555555', textAlign: 'center', margin: '20px 0 25px', lineHeight: 1.5, fontWeight: 500 }}>
            Don&apos;t miss out! The product you saved is now in stock
            <br />
            and ready for you.
          </p>
        </div>
        <div className="oc-modal-footer d-flex justify-content-center gap-3" style={{ marginTop: 10 }}>
          <button
            type="button"
            className="wpa-btn-view-product"
            onClick={() => {
              localStorage.setItem('openProductModalOnLoad', 'Sage Wood Platform Bed');
              navigate('/products');
              onClose();
            }}
          >
            View Product
          </button>
          <button type="button" className="wpa-btn-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

const WEEKEND_OFFER = {
  productTitle: 'Ivory Cloud Sofa Set',
  image: '/living-room/ivory-cloud-sofa-set-main.jpeg.jpeg',
};

function WeekendOfferModal({ onClose, navigate }) {
  return (
    <ModalBackdrop onClose={onClose} dialogClass="wo-modal-dialog">
      <div className="modal-content wo-modal-content">
        <button type="button" className="btn-close wo-close-btn" onClick={onClose} aria-label="Close" />
        <div className="wo-modal-layout">
          <div className="wo-image-side">
            <img
              src={WEEKEND_OFFER.image}
              alt={WEEKEND_OFFER.productTitle}
              className="wo-offer-image"
            />
          </div>
          <div className="wo-content-side">
            <span className="wo-badge">15% OFF</span>
            <h2 className="wo-title">Weekend Sofa Offer</h2>
            <hr className="wo-title-divider" />
            <p className="wo-lead">
              Make your weekends more comfortable with timeless sofas at a special price.
            </p>
            <div className="wo-promo-box">
              <div className="wo-promo-label">Use Code</div>
              <div className="wo-promo-code">WEEKEND15</div>
            </div>
            <div className="wo-valid-until">
              <i className="fa-regular fa-clock" /> Valid until Sunday, 11:59 PM
            </div>
            <div className="wo-includes-label">Includes:</div>
            <ul className="wo-includes-list">
              <li>
                <i className="fa-regular fa-circle-check" /> 15% off on selected sofas
              </li>
              <li>
                <i className="fa-regular fa-circle-check" /> Free delivery within Mogadishu
              </li>
              <li>
                <i className="fa-regular fa-circle-check" /> Easy returns &amp; 2-year warranty
              </li>
            </ul>
            <div className="wo-actions">
              <button
                type="button"
                className="wo-btn-primary"
                onClick={() => {
                  localStorage.setItem('openProductModalOnLoad', WEEKEND_OFFER.productTitle);
                  navigate('/products');
                  onClose();
                }}
              >
                View Product
              </button>
              <button type="button" className="wo-btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
}

function RetryPaymentModal({ onClose, onSuccess, order, userPhone }) {
  const [phone, setPhone] = useState(userPhone || '+252 61 2345678');
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (!order?.orderId) {
      showTopFloatNotification('Order details not found. Please try again from your orders.', 'danger');
      return;
    }

    setPaying(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const amountText = getOrderTotalFormatted(order).replace(/[^0-9.]/g, '');
      const amount = Number(amountText) || Number(order.total) || 0;

      const response = await fetch(apiUrl('/api/payments/waafi'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          orderId: order.orderId,
          accountNo: phone.trim(),
          amount,
          paymentReference: order.paymentReference || '',
          description: `Retry payment for ${order.orderId}`,
        }),
      });
      const data = await response.json();

      if (data.success) {
        onSuccess();
        showTopFloatNotification('✅ Payment completed successfully via Waafi!');
      } else {
        showTopFloatNotification(data.message || 'Waafi payment failed. Please try again.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not connect to payment server. Ensure backend is running.', 'danger');
    } finally {
      setPaying(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="modal-content rp-modal-content">
        <CloseAbsolute onClose={onClose} />
        <div className="oc-modal-body">
          <PremiumDeco>
            <div className="ps-success-circle" style={{ backgroundColor: '#e5ebe4', position: 'relative' }}>
              <i className="fa-regular fa-credit-card" style={{ fontSize: '2.1rem', color: '#4a6454' }} />
              <span className="rp-check-badge">
                <i className="fa-solid fa-circle-check" />
              </span>
            </div>
          </PremiumDeco>
          <h2 className="ps-modal-title" style={{ color: '#073D35' }}>Retry Payment</h2>
          <GoldStarSeparator />
          <p className="ps-desc" style={{ maxWidth: 390, color: '#555555', fontSize: '0.92rem', lineHeight: 1.5 }}>
            Your previous EVC Plus payment was not completed. Please confirm your number and try again to complete your order securely.
          </p>
          <div className="rp-info-box">
            <div className="rp-info-col">
              <div className="rp-icon-circle"><i className="fa-regular fa-file-lines" /></div>
              <div className="rp-info-text">
                <span className="rp-info-label">Order ID:</span>
                <span className="rp-info-val">{order.orderId}</span>
              </div>
            </div>
            <div className="rp-info-divider" />
            <div className="rp-info-col">
              <div className="rp-icon-circle"><i className="fa-solid fa-dollar-sign" /></div>
              <div className="rp-info-text">
                <span className="rp-info-label">Total Amount:</span>
                <span className="rp-info-val">{getOrderTotalFormatted(order)}</span>
              </div>
            </div>
          </div>
          <div className="rp-section-label">Payment Method</div>
          <div className="rp-method-box">
            <span className="rp-radio-circle" />
            <span className="rp-method-name">EVC Plus</span>
          </div>
          <div className="rp-section-label">EVC Phone Number</div>
          <div className="rp-phone-input-wrap">
            <span className="rp-phone-icon-wrap"><i className="fa-solid fa-phone" /></span>
            <div className="rp-phone-divider" />
            <input type="tel" className="rp-phone-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="rp-input-hint">Use the same EVC number for this payment.</div>
        </div>
        <div className="oc-modal-footer d-flex justify-content-center gap-3" style={{ marginTop: 25 }}>
          <button type="button" className="rp-btn-pay" onClick={handlePay} disabled={paying}>
            {paying ? 'Processing...' : 'Pay Now'}
          </button>
          <button type="button" className="rp-btn-close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}

function SimpleAlertModal({ item, onClose }) {
  return (
    <ModalBackdrop onClose={onClose} dialogClass="oc-modal-dialog">
      <div className="modal-content border-0 shadow-lg rounded-4 p-4 text-center">
        <h2 className="h5 fw-bold text-success mb-2">{item?.title || 'Notification'}</h2>
        <p className="text-secondary mb-4">{item?.desc || ''}</p>
        <button type="button" className="btn btn-success px-4" onClick={onClose}>
          Close
        </button>
      </div>
    </ModalBackdrop>
  );
}

export default function NotificationDetailModal({
  item,
  onClose,
  user,
  repliedTicket,
  onSendFollowUp,
  sendingFollowUp,
}) {
  const navigate = useNavigate();
  const order = getLastOrderDetails();
  const [subModal, setSubModal] = useState(null);

  useEffect(() => {
    setSubModal(null);
  }, [item?.modalType, item?.index]);

  if (!item && !subModal) return null;

  const closeAll = () => {
    setSubModal(null);
    onClose();
  };

  if (subModal === 'orderDetails') {
    return <OrderDetailsModal onClose={() => { setSubModal(null); onClose(); }} />;
  }

  if (subModal === 'retryPayment') {
    return (
      <RetryPaymentModal
        order={order}
        userPhone={user?.phone}
        onClose={() => { setSubModal(null); onClose(); }}
        onSuccess={() => setSubModal('paymentSuccess')}
      />
    );
  }

  if (subModal === 'paymentSuccess') {
    return <PaymentSuccessModal order={order} onClose={() => { setSubModal(null); onClose(); }} />;
  }

  if (!item) return null;

  switch (item.modalType) {
    case 'order-confirmed':
      return (
        <OrderConfirmedModal
          onClose={onClose}
          onViewDetails={() => setSubModal('orderDetails')}
        />
      );
    case 'payment-success':
      return <PaymentSuccessModal order={order} onClose={onClose} />;
    case 'payment-failed':
      return (
        <PaymentFailedModal
          order={order}
          onClose={onClose}
          onRetry={() => setSubModal('retryPayment')}
        />
      );
    case 'order-processing':
      return <OrderProcessingModal onClose={onClose} />;
    case 'support-replied':
      return (
        <SupportRepliedModal
          userName={user?.fullName}
          repliedTicket={repliedTicket}
          onSendFollowUp={onSendFollowUp}
          sending={sendingFollowUp}
          onClose={onClose}
        />
      );
    case 'wishlist-available':
      return <WishlistAvailableModal navigate={navigate} onClose={onClose} />;
    case 'weekend-offer':
      return <WeekendOfferModal navigate={navigate} onClose={onClose} />;
    case 'delivery-assigned':
    case 'review-moderated':
      return <SimpleAlertModal item={item} onClose={onClose} />;
    default:
      return null;
  }
}
