import { useEffect, useMemo, useState } from 'react';
import NotificationDetailModal from './notifications/NotificationModals';
import { useAuth } from '../../context/AuthContext';

function NotificationIcon({ type }) {
  switch (type) {
    case 'order-confirmed':
      return (
        <div className="pf-notif-stacked-icon">
          <i className="fa-solid fa-bag-shopping" />
          <i className="fa-solid fa-check pf-icon-badge" />
        </div>
      );
    case 'payment-success':
      return <i className="fa-regular fa-credit-card" />;
    case 'order-processing':
      return <i className="fa-solid fa-gear" />;
    case 'payment-failed':
      return <i className="fa-solid fa-circle-exclamation" />;
    case 'support-replied':
      return <i className="fa-solid fa-comment-dots" />;
    case 'wishlist':
      return <i className="fa-regular fa-heart" />;
    case 'weekend-offer':
      return <i className="fa-solid fa-tag" />;
    case 'delivery-assigned':
      return <i className="fa-solid fa-truck" />;
    case 'review-moderated':
      return <i className="fa-solid fa-star" />;
    default:
      return <i className="fa-regular fa-bell" />;
  }
}

export default function ProfileNotificationsTab({
  onUnreadChange,
  supportChat,
  notifications,
}) {
  const { user } = useAuth();
  const { items, loading, markRead, markAllRead } = notifications;
  const [filter, setFilter] = useState('all');
  const [activeModal, setActiveModal] = useState(null);

  const visibleItems = useMemo(() => {
    const merged = items.map((item) => {
      if (item.type === 'support_replied' && supportChat?.repliedTicket) {
        return {
          ...item,
          desc: `Waxaan ka soo jawaabnay fariintaada: "${supportChat.repliedTicket.subject}"`,
          unread: !item.read,
        };
      }
      return item;
    });
    return filter === 'unread' ? merged.filter((item) => item.unread) : merged;
  }, [items, filter, supportChat?.repliedTicket]);

  useEffect(() => {
    onUnreadChange?.(notifications.unreadCount);
  }, [notifications.unreadCount, onUnreadChange]);

  const handleCardClick = (item) => {
    if (item.unread) markRead(item.id);
    setActiveModal(item);
  };

  return (
    <div className="pf-tab active">
      <div className="pf-tab-header">
        <div>
          <h1 className="pf-main-title">Notifications</h1>
          <p className="pf-main-sub">Stay updated with your account activity.</p>
        </div>
        <div className="pf-notif-controls">
          <div className="pf-notif-filter-pill">
            <button
              type="button"
              className={`pf-pill-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`pf-pill-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread
            </button>
          </div>
          <button type="button" className="pf-btn-mark-read" onClick={markAllRead}>
            <i className="fa-regular fa-circle-check" /> Mark all as read
          </button>
        </div>
      </div>

      <div className="pf-notifications-scrollable">
        {loading && items.length === 0 ? (
          <p style={{ padding: '16px', color: '#666' }}>Loading notifications...</p>
        ) : null}

        {!loading && visibleItems.length === 0 ? (
          <p style={{ padding: '16px', color: '#666' }}>No notifications yet.</p>
        ) : null}

        <div className="pf-notif-list" id="notificationsList">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`pf-notif-card ${item.unread ? 'unread' : 'read'} ${item.highlight && item.unread ? 'unread-highlight' : ''}`}
              data-status={item.unread ? 'unread' : 'read'}
              onClick={() => handleCardClick(item)}
            >
              <div className={`pf-notif-icon-wrap ${item.iconWrap}`}>
                <NotificationIcon type={item.iconType} />
              </div>
              <div className="pf-notif-content">
                <h4 className="pf-notif-card-title">{item.title}</h4>
                <p className="pf-notif-card-desc">{item.desc}</p>
              </div>
              <div className="pf-notif-meta">
                <div className="pf-notif-meta-col">
                  <span className="pf-notif-time-text">{item.time}</span>
                  <span className={`pf-notif-time-dot ${item.dot}`} />
                </div>
                <i className="fa-solid fa-chevron-right pf-notif-chevron" />
              </div>
            </button>
          ))}
        </div>

        <div className="pf-notif-footer-msg">
          New notifications from your orders and support will appear here.{' '}
          <i className="fa-regular fa-bell" />
        </div>
      </div>

      <NotificationDetailModal
        item={activeModal}
        onClose={() => setActiveModal(null)}
        user={user}
        repliedTicket={supportChat?.repliedTicket}
        onSendFollowUp={supportChat?.sendTicketMessage}
        sendingFollowUp={supportChat?.sending}
      />
    </div>
  );
}
