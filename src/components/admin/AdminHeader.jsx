import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { TAB_LABELS } from './AdminSidebar';
import { useNotifications } from '../../hooks/useNotifications';

function useClickOutside(ref, onClose) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onClose]);
}

const TYPE_ICON = {
  new_order: { icon: 'fa-bag-shopping', color: '#10b981', tab: 'orders' },
  driver_application: { icon: 'fa-id-card', color: '#f59e0b', tab: 'driver-applications' },
  new_support_ticket: { icon: 'fa-headset', color: '#3b82f6', tab: 'support' },
};

function tabForNotification(n) {
  return TYPE_ICON[n.type]?.tab || 'dashboard';
}

function iconForNotification(n) {
  return TYPE_ICON[n.type] || { icon: 'fa-bell', color: '#10b981', tab: 'dashboard' };
}

export default function AdminHeader({
  activeTab,
  adminName,
  adminEmail,
  adminAvatar,
  onToggleSidebar,
  onTabChange,
  onLogout,
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef(null);
  const msgRef = useRef(null);
  const profileRef = useRef(null);

  const { items, markRead, refresh } = useNotifications({ enabled: true, pollMs: 15000 });

  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(msgRef, () => setMsgOpen(false));
  useClickOutside(profileRef, () => setProfileOpen(false));

  const tabLabel = TAB_LABELS[activeTab] || 'Dashboard';

  const generalNotifications = items.filter((n) => n.type !== 'new_support_ticket');
  const supportMessages = items.filter((n) => n.type === 'new_support_ticket');
  const generalUnread = generalNotifications.filter((n) => n.unread).length;
  const supportUnread = supportMessages.filter((n) => n.unread).length;

  const handleNotifClick = async (n) => {
    if (n.unread) await markRead(n.id);
    onTabChange(tabForNotification(n));
    setNotifOpen(false);
    setMsgOpen(false);
  };

  const closeAllDropdowns = () => {
    setNotifOpen(false);
    setMsgOpen(false);
    setProfileOpen(false);
  };

  useEffect(() => {
    if (notifOpen || msgOpen) refresh();
  }, [notifOpen, msgOpen, refresh]);

  return (
    <header className="admin-header">
      <div className="admin-header-title-wrap">
        <button
          type="button"
          className="admin-mobile-menu-btn d-md-none"
          onClick={onToggleSidebar}
          aria-label="Open menu"
        >
          <i className="fa-solid fa-bars" />
        </button>
        <h1 className="admin-header-page-title">{tabLabel}</h1>
      </div>

      <div className="admin-header-actions">
        <div className="admin-header-search">
          <input type="text" placeholder="Search dashboard..." aria-label="Search dashboard" />
          <i className="fa-solid fa-magnifying-glass" />
        </div>

        <div className="admin-dropdown-wrap" ref={notifRef}>
          <button
            type="button"
            className={`admin-icon-btn ${notifOpen ? 'active' : ''}`}
            onClick={() => {
              setNotifOpen((v) => !v);
              setMsgOpen(false);
              setProfileOpen(false);
            }}
            aria-label="Notifications"
          >
            <i className="fa-regular fa-bell" />
            {generalUnread > 0 && (
              <span className="admin-icon-badge admin-icon-badge--danger">{generalUnread}</span>
            )}
          </button>
          {notifOpen && (
            <div className="admin-dropdown admin-dropdown--notif">
              <div className="admin-dropdown-head">
                <strong>Notifications</strong>
                <span className="admin-dropdown-count">{generalUnread} unread</span>
              </div>
              <ul className="admin-dropdown-list">
                {generalNotifications.length === 0 ? (
                  <li>
                    <span className="admin-dropdown-item" style={{ cursor: 'default' }}>
                      <small>No notifications yet.</small>
                    </span>
                  </li>
                ) : (
                  generalNotifications.slice(0, 8).map((n) => {
                    const meta = iconForNotification(n);
                    return (
                      <li key={n.id}>
                        <button type="button" className="admin-dropdown-item" onClick={() => handleNotifClick(n)}>
                          <span className="admin-dropdown-icon" style={{ background: `${meta.color}18`, color: meta.color }}>
                            <i className={`fa-solid ${meta.icon}`} />
                          </span>
                          <span>
                            <strong>{n.title}</strong>
                            <small>{n.desc}</small>
                          </span>
                        </button>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="admin-dropdown-wrap" ref={msgRef}>
          <button
            type="button"
            className={`admin-icon-btn ${msgOpen ? 'active' : ''}`}
            onClick={() => {
              setMsgOpen((v) => !v);
              setNotifOpen(false);
              setProfileOpen(false);
            }}
            aria-label="Messages"
          >
            <i className="fa-regular fa-envelope" />
            {supportUnread > 0 && (
              <span className="admin-icon-badge admin-icon-badge--success">{supportUnread}</span>
            )}
          </button>
          {msgOpen && (
            <div className="admin-dropdown admin-dropdown--msg">
              <div className="admin-dropdown-head">
                <strong>Support Messages</strong>
                <span className="admin-dropdown-count">{supportUnread} unread</span>
              </div>
              <ul className="admin-dropdown-list">
                {supportMessages.length === 0 ? (
                  <li>
                    <span className="admin-dropdown-item" style={{ cursor: 'default' }}>
                      <small>No support messages.</small>
                    </span>
                  </li>
                ) : (
                  supportMessages.slice(0, 8).map((n) => (
                    <li key={n.id}>
                      <button type="button" className="admin-dropdown-item" onClick={() => handleNotifClick(n)}>
                        <span className="admin-dropdown-avatar">
                          <i className="fa-solid fa-envelope" />
                        </span>
                        <span>
                          <strong>{n.title}</strong>
                          <small>{n.desc}</small>
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="admin-dropdown-wrap" ref={profileRef}>
          <button
            type="button"
            className="admin-profile-btn"
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
              setMsgOpen(false);
            }}
          >
            <img src={adminAvatar} alt={adminName} className="admin-profile-avatar" />
            <span className="admin-profile-name d-none d-sm-inline">{adminName}</span>
            <i className={`fa-solid fa-chevron-down admin-profile-chevron ${profileOpen ? 'open' : ''}`} />
          </button>
          {profileOpen && (
            <div className="admin-dropdown admin-dropdown--profile">
              <div className="admin-profile-card">
                <img src={adminAvatar} alt={adminName} />
                <div>
                  <strong>{adminName}</strong>
                  <small>{adminEmail || '—'}</small>
                </div>
              </div>
              <button
                type="button"
                className="admin-dropdown-link"
                onClick={() => {
                  onTabChange('settings');
                  closeAllDropdowns();
                }}
              >
                <i className="fa-solid fa-gear" /> Settings
              </button>
              <Link to="/" className="admin-dropdown-link" onClick={closeAllDropdowns}>
                <i className="fa-solid fa-store" /> View Store
              </Link>
              <button type="button" className="admin-dropdown-link admin-dropdown-link--danger" onClick={onLogout}>
                <i className="fa-solid fa-right-from-bracket" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
