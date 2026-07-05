import { Link } from 'react-router-dom';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-house' },
  { id: 'orders', label: 'Orders', icon: 'fa-clipboard-list' },
  { id: 'users', label: 'Users', icon: 'fa-user-group' },
  { id: 'products', label: 'Products', icon: 'fa-couch' },
  { id: 'stock', label: 'Stock Management', icon: 'fa-cubes' },
  { id: 'payments', label: 'Payments', icon: 'fa-credit-card' },
  { id: 'delivery', label: 'Delivery', icon: 'fa-truck' },
  { id: 'driver-applications', label: 'Driver Applications', icon: 'fa-id-card', badgeKey: 'drivers' },
  { id: 'support', label: 'Support / Help', icon: 'fa-headset', badgeKey: 'support' },
  { id: 'reviews', label: 'Reviews', icon: 'fa-star' },
  { id: 'categories', label: 'Categories', icon: 'fa-layer-group' },
  { id: 'cms', label: 'CMS / Content', icon: 'fa-image' },
  { id: 'settings', label: 'Settings', icon: 'fa-gear' },
];

const TAB_LABELS = {
  dashboard: 'Dashboard',
  orders: 'Orders',
  users: 'Users',
  products: 'Products',
  stock: 'Stock Management',
  payments: 'Payments',
  delivery: 'Delivery',
  'driver-applications': 'Driver Applications',
  support: 'Support / Help',
  reviews: 'Reviews',
  categories: 'Categories',
  cms: 'CMS / Content',
  settings: 'Settings',
};

export { TAB_LABELS };

export default function AdminSidebar({
  activeTab,
  onTabChange,
  collapsed,
  mobileOpen,
  onCloseMobile,
  badgeCounts = {},
}) {
  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          aria-label="Close menu"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`admin-sidebar ${collapsed ? 'admin-sidebar--collapsed' : ''} ${mobileOpen ? 'show-mobile' : ''}`}
      >
        <Link to="/" className="sidebar-brand" title="Back to store">
          <div className="brand-logo-mark">
            <span className="brand-logo-frame" />
            <span className="brand-logo-inner">MF</span>
          </div>
          {!collapsed && (
            <>
              <div className="brand-divider" />
              <div className="brand-text">
                <span className="brand-title">Mogadishu</span>
                <span className="brand-subtitle">Modern Furniture</span>
              </div>
            </>
          )}
        </Link>

        <nav className="sidebar-nav" aria-label="Admin navigation">
          <ul className="sidebar-menu">
            {MENU_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`menu-link ${activeTab === item.id ? 'active' : ''}`}
                  data-tab={item.id}
                  onClick={() => onTabChange(item.id)}
                  title={item.label}
                >
                  <i className={`fa-solid ${item.icon}`} />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.badgeKey && badgeCounts[item.badgeKey] > 0 && (
                    <span className="menu-badge">{badgeCounts[item.badgeKey]}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
