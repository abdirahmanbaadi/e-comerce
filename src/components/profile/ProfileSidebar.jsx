import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { id: 'profile', label: 'My Profile', icon: 'fa-regular fa-user' },
  { id: 'orders', label: 'My Orders', icon: 'fa-solid fa-bag-shopping' },
  { id: 'track', label: 'Track Order', icon: 'fa-solid fa-location-dot', href: '/track-order' },
  { id: 'notifications', label: 'Notifications', icon: 'fa-regular fa-bell', badge: true },
  { id: 'help', label: 'Help / Support', icon: 'fa-regular fa-circle-question' },
  { id: 'settings', label: 'Settings', icon: 'fa-solid fa-gear' },
];

export default function ProfileSidebar({ activeTab, unreadCount, onTabChange }) {
  const { logout, user } = useAuth();

  return (
    <aside className="pf-sidebar">
      <Link className="pf-brand" to="/" style={{ marginBottom: '25px' }}>
        <div className="pf-brand-icon" style={{ width: '38px', height: '38px' }}>
          <span style={{ fontSize: '1.1rem' }}>MF</span>
        </div>
        <div className="pf-brand-divider" style={{ height: '34px' }} />
        <div className="pf-brand-text">
          <span className="title" style={{ fontSize: '1.45rem' }}>
            Mogadishu
          </span>
          <span className="subtitle" style={{ fontSize: '0.52rem', letterSpacing: '1.8px' }}>
            Modern Furniture
          </span>
        </div>
      </Link>

      <div className="pf-sidebar-menu">
        {TABS.map((tab) => {
          if (tab.href) {
            return (
              <Link key={tab.id} to={tab.href} className="pf-sidebar-item">
                <i className={tab.icon} /> {tab.label}
              </Link>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              className={`pf-sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <i className={tab.icon} /> {tab.label}
              {tab.badge && unreadCount > 0 && (
                <span className="pf-notif-badge">{unreadCount}</span>
              )}
            </button>
          );
        })}

        <div className="pf-sidebar-divider" />
        {user?.role === 'user' &&
          user?.driverApplicationStatus !== 'pending' &&
          user?.driverApplicationStatus !== 'rejected' && (
          <Link to="/apply-delivery" className="pf-sidebar-item pf-sidebar-apply">
            <i className="fa-solid fa-truck-fast" /> Apply as Driver
          </Link>
        )}
        {user?.role === 'delivery' && (
          <Link to="/delivery" className="pf-sidebar-item">
            <i className="fa-solid fa-truck" /> Delivery Dashboard
          </Link>
        )}
        <button type="button" className="pf-sidebar-item pf-sidebar-logout" onClick={logout}>
          <i className="fa-solid fa-arrow-right-from-bracket" /> Logout
        </button>
        <Link to="/" className="pf-sidebar-item" style={{ marginTop: '8px' }}>
          <i className="fa-solid fa-house" /> Back to Home
        </Link>
      </div>
    </aside>
  );
}
