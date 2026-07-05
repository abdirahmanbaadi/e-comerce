import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const TYPE_ICON = {
  order_confirmed: { icon: 'fa-bag-shopping', color: '#10b981' },
  payment_success: { icon: 'fa-circle-check', color: '#10b981' },
  payment_failed: { icon: 'fa-circle-xmark', color: '#ef4444' },
  order_processing: { icon: 'fa-box', color: '#f59e0b' },
  order_shipped: { icon: 'fa-truck', color: '#f59e0b' },
  order_delivered: { icon: 'fa-check-double', color: '#10b981' },
  order_cancelled: { icon: 'fa-ban', color: '#ef4444' },
  driver_assigned: { icon: 'fa-user-check', color: '#10b981' },
  support_replied: { icon: 'fa-headset', color: '#3b82f6' },
  wishlist_stock: { icon: 'fa-heart', color: '#d8a128' },
  weekend_offer: { icon: 'fa-tag', color: '#f59e0b' },
};

function iconForNotification(n) {
  return TYPE_ICON[n.type] || { icon: 'fa-bell', color: '#10b981' };
}

function sortNewestFirst(items) {
  return [...items].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
}

export default function NotificationDropdown({ items, unreadCount, onItemClick, onClose }) {
  const navigate = useNavigate();

  const sorted = useMemo(() => sortNewestFirst(items), [items]);
  const unread = unreadCount ?? sorted.filter((n) => n.unread).length;

  const handleClick = async (n) => {
    if (onItemClick) await onItemClick(n);
    onClose?.();

    if (n.orderId || String(n.type || '').includes('order') || String(n.type || '').includes('payment')) {
      navigate('/track-order');
    } else {
      navigate('/profile?tab=notifications');
    }
  };

  return (
    <div className="nav-dropdown nav-dropdown--notif" role="dialog" aria-label="Notifications">
      <div className="nav-dropdown-head">
        <strong>Notifications</strong>
        <span className="nav-dropdown-count">{unread} unread</span>
      </div>

      <ul className="nav-dropdown-list">
        {sorted.length === 0 ? (
          <li>
            <span className="nav-dropdown-empty" style={{ display: 'block', padding: '20px 8px' }}>
              No notifications yet.
            </span>
          </li>
        ) : (
          sorted.slice(0, 10).map((n) => {
            const meta = iconForNotification(n);
            return (
              <li key={n.id}>
                <button type="button" className="nav-dropdown-item" onClick={() => handleClick(n)}>
                  <span
                    className="nav-dropdown-icon"
                    style={{ background: `${meta.color}18`, color: meta.color }}
                  >
                    <i className={`fa-solid ${meta.icon}`} />
                  </span>
                  <span>
                    <strong>{n.title}</strong>
                    <small>{n.desc}</small>
                    {n.time && <small style={{ marginTop: 4, opacity: 0.75 }}>{n.time}</small>}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>

      {sorted.length > 0 && (
        <div className="nav-dropdown-footer">
          <Link
            to="/profile?tab=notifications"
            className="nav-dropdown-footer-link"
            onClick={onClose}
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
