import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppSearchField } from '../nav/StoreNavbar';

// =============================================================================
// AdminSidebar
// =============================================================================

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-house' },
  { id: 'orders', label: 'Orders', icon: 'fa-clipboard-list' },
  { id: 'users', label: 'Users', icon: 'fa-user-group' },
  { id: 'products', label: 'Products', icon: 'fa-couch' },
  { id: 'stock', label: 'Stock', icon: 'fa-cubes' },
  { id: 'payments', label: 'Payments', icon: 'fa-credit-card' },
  { id: 'delivery', label: 'Delivery', icon: 'fa-truck', badgeKey: 'delivery' },
  { id: 'driver-applications', label: 'Driver Applications', icon: 'fa-id-card', badgeKey: 'drivers' },
  { id: 'support', label: 'Support / Help', icon: 'fa-headset', badgeKey: 'support' },
  { id: 'reviews', label: 'Reviews', icon: 'fa-star' },
  { id: 'cms', label: 'CMS / Content', icon: 'fa-image' },
  { id: 'settings', label: 'Settings', icon: 'fa-gear' },
];

const TAB_LABELS = {
  dashboard: 'Dashboard',
  orders: 'Orders',
  users: 'Users',
  products: 'Products',
  stock: 'Stock',
  payments: 'Payments',
  delivery: 'Delivery',
  'driver-applications': 'Driver Applications',
  support: 'Support / Help',
  reviews: 'Reviews',
  cms: 'CMS / Content',
  settings: 'Settings',
};

export { TAB_LABELS };

const menuLinkBase =
  'relative flex w-full cursor-pointer items-center gap-[15px] overflow-hidden rounded-xl border-0 bg-transparent px-[18px] py-3 text-left text-[0.92rem] font-semibold text-gray-600 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-deepGreen/[0.04] hover:pl-[22px] hover:text-deepGreen hover:shadow-[0_2px_10px_rgba(7,61,53,0.04)] active:scale-[0.98] [.admin-dark_&]:text-[#b8c5c0] [.admin-dark_&]:hover:bg-white/[0.06] [.admin-dark_&]:hover:text-white';

const menuLinkActive =
  'translate-x-0.5 bg-gradient-to-r from-gold/18 to-transparent border-l-[3px] border-gold font-bold text-deepGreen shadow-[inset_3px_0_0_rgba(216,161,40,0.35),0_4px_14px_rgba(7,61,53,0.06)] [.admin-dark_&]:text-white [.admin-dark_&]:bg-white/[0.06]';

const menuIconBase =
  'relative z-[1] w-5 text-center text-[1.15rem] text-gray-600 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:text-deepGreen [.admin-dark_&]:text-inherit';

function staggerStyle(index, baseMs = 55) {
  return { animationDelay: `${index * baseMs}ms` };
}

function SidebarMenuButton({ active, collapsed, item, badgeCount, onClick }) {
  return (
    <button
      type="button"
      className={[
        'group animate-sidebarItemIn',
        menuLinkBase,
        collapsed ? 'justify-center p-2.5 hover:pl-2.5' : '',
        active ? menuLinkActive : '',
      ].join(' ')}
      data-tab={item.id}
      onClick={onClick}
      title={item.label}
    >
      {active && (
        <span className="pointer-events-none absolute inset-0 opacity-[0.3]" aria-hidden="true">
          <span className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-sidebarShimmer [.admin-dark_&]:via-white/20" />
        </span>
      )}
      <i
        className={`fa-solid ${item.icon} ${menuIconBase} ${active ? 'scale-110 text-deepGreen [.admin-dark_&]:text-gold' : ''}`}
      />
      {!collapsed && <span className="relative z-[1] flex-1">{item.label}</span>}
      {!collapsed && badgeCount > 0 && (
        <span className="relative z-[1] inline-flex h-5 min-w-5 animate-badgePulse items-center justify-center rounded-full bg-gold px-1.5 text-[0.65rem] font-extrabold text-white">
          {badgeCount}
        </span>
      )}
    </button>
  );
}

export function AdminSidebar({
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
          className="fixed inset-0 z-[99] cursor-pointer border-0 bg-black/45"
          aria-label="Close menu"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={[
          'animate-sidebarLogoIn fixed left-0 top-0 z-[100] flex h-screen flex-col overflow-hidden border-r border-deepGreen/[0.08] bg-white py-[18px] shadow-[8px_0_32px_rgba(7,61,53,0.06)] transition-all duration-300',
          collapsed ? 'w-[72px] px-3.5' : 'w-[220px] px-3',
          mobileOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
          'dark:border-white/[0.06] dark:bg-gradient-to-b dark:from-[#0f1c18] dark:to-[#0a1411] dark:text-[#d1ddd8]',
          '[.admin-dark_&]:border-white/[0.06] [.admin-dark_&]:bg-gradient-to-b [.admin-dark_&]:from-[#0f1c18] [.admin-dark_&]:to-[#0a1411] [.admin-dark_&]:text-[#d1ddd8]',
        ].join(' ')}
      >
        <Link
          to="/"
          className={[
            'group mb-4 flex shrink-0 items-center gap-2.5 px-1 no-underline transition-transform duration-300 hover:scale-[1.02]',
            collapsed ? 'justify-center px-0' : '',
          ].join(' ')}
          title="Back to store"
        >
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center transition-transform duration-500 group-hover:rotate-3">
            <span className="absolute inset-0 rotate-45 rounded-[9px] border-2 border-gold transition-colors duration-300 group-hover:border-gold/80" />
            <span className="relative z-[2] font-display text-[1.3rem] font-bold tracking-[-0.5px] text-gold">
              MF
            </span>
          </div>
          {!collapsed && (
            <>
              <div className="h-[38px] w-[1.5px] bg-gold opacity-85 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="leading-[1.05]">
                <span className="block font-display text-[1.6rem] font-bold tracking-[0.1px] text-deepGreen transition-colors duration-300 group-hover:text-deepGreen/90 [.admin-dark_&]:text-[#f3f7f5]">
                  Mogadishu
                </span>
                <span className="mt-0.5 block font-sans text-[0.62rem] font-extrabold uppercase tracking-[1.5px] text-deepGreen opacity-90 [.admin-dark_&]:text-[#f3f7f5]">
                  Modern Furniture
                </span>
              </div>
            </>
          )}
        </Link>

        <nav
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto pr-0.5 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-deepGreen/15 [&::-webkit-scrollbar]:w-1"
          aria-label="Admin navigation"
        >
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {MENU_ITEMS.map((item, index) => (
              <li key={item.id} style={staggerStyle(index)}>
                <SidebarMenuButton
                  active={activeTab === item.id}
                  collapsed={collapsed}
                  item={item}
                  badgeCount={item.badgeKey ? badgeCounts[item.badgeKey] || 0 : 0}
                  onClick={() => onTabChange(item.id)}
                />
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}

// =============================================================================
// AdminHeader
// =============================================================================

const SEARCH_PLACEHOLDERS = {
  dashboard: 'Search orders & support...',
  products: 'Search products...',
  orders: 'Search orders...',
  users: 'Search customers...',
  stock: 'Search stock...',
  delivery: 'Search deliveries...',
  support: 'Search messages...',
};

const SEARCH_TABS = new Set(['dashboard', 'products', 'orders', 'users', 'stock', 'delivery', 'support']);

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
  support_message: { icon: 'fa-headset', color: '#3b82f6', tab: 'support' },
  driver_rejected: { icon: 'fa-truck', color: '#ef4444', tab: 'delivery' },
  delivery_accepted: { icon: 'fa-circle-check', color: '#10b981', tab: 'delivery' },
  order_status_changed: { icon: 'fa-arrows-rotate', color: '#3b82f6', tab: 'orders' },
  delivery_unassigned: { icon: 'fa-truck', color: '#f59e0b', tab: 'delivery' },
};

function tabForNotification(n) {
  return TYPE_ICON[n.type]?.tab || 'dashboard';
}

function iconForNotification(n) {
  return TYPE_ICON[n.type] || { icon: 'fa-bell', color: '#10b981', tab: 'dashboard' };
}

export function AdminHeader({
  activeTab,
  adminName,
  adminEmail,
  adminAvatar,
  onToggleSidebar,
  onTabChange,
  onLogout,
  headerSearch,
  onHeaderSearchChange,
  notifications = [],
  onMarkNotificationRead,
  onRefreshNotifications,
  compact = false,
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef(null);
  const msgRef = useRef(null);
  const profileRef = useRef(null);

  const items = notifications;
  const markRead = onMarkNotificationRead || (async () => false);
  const refresh = onRefreshNotifications || (() => {});

  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(msgRef, () => setMsgOpen(false));
  useClickOutside(profileRef, () => setProfileOpen(false));

  const tabLabel = TAB_LABELS[activeTab] || 'Dashboard';
  const searchEnabled = SEARCH_TABS.has(activeTab);
  const searchPlaceholder = SEARCH_PLACEHOLDERS[activeTab] || 'Search...';

  const generalNotifications = items.filter(
    (n) => n.type !== 'new_support_ticket' && n.type !== 'support_message'
  );
  const supportMessages = items.filter(
    (n) => n.type === 'new_support_ticket' || n.type === 'support_message'
  );
  const generalUnread = generalNotifications.filter((n) => n.unread).length;
  const supportUnread = supportMessages.filter((n) => n.unread).length;

  const handleNotifClick = async (n) => {
    if (n.unread) await markRead(n.id);
    const tab = tabForNotification(n);
    onTabChange(tab);
    setNotifOpen(false);
    setMsgOpen(false);

    const supportTypes = new Set(['new_support_ticket', 'support_message']);
    const ticketId =
      n.metadata?.ticketId || (supportTypes.has(n.type) ? n.relatedId : null);
    if (ticketId && (tab === 'support' || supportTypes.has(n.type))) {
      window.setTimeout(() => {
        if (typeof window.selectSupportTicket === 'function') {
          window.selectSupportTicket(ticketId);
        }
      }, 150);
    }
  };

  const closeAllDropdowns = () => {
    setNotifOpen(false);
    setMsgOpen(false);
    setProfileOpen(false);
  };

  useEffect(() => {
    if (notifOpen || msgOpen) refresh();
  }, [notifOpen, msgOpen, refresh]);

  const iconBtnClass = (open) =>
    [
      'relative inline-flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-full border border-deepGreen/[0.08] bg-white text-base text-gray-600 transition-all duration-300',
      open
        ? '-translate-y-px border-deepGreen/[0.18] bg-deepGreen/[0.04] text-deepGreen'
        : 'hover:-translate-y-px hover:border-deepGreen/[0.18] hover:bg-deepGreen/[0.04] hover:text-deepGreen',
      'dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-[#d7e2de]',
      '[.admin-dark_&]:border-white/[0.08] [.admin-dark_&]:bg-white/[0.04] [.admin-dark_&]:text-[#d7e2de]',
    ].join(' ');

  return (
    <header
      className={[
        'relative z-[1] flex flex-col items-stretch justify-between md:flex-row md:items-center',
        compact ? 'mb-1 gap-2.5 pb-2' : 'mb-3 gap-4 pb-[18px] max-md:pb-3.5',
      ].join(' ')}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-deepGreen/10 bg-white text-deepGreen md:hidden"
          onClick={onToggleSidebar}
          aria-label="Open menu"
        >
          <i className="fa-solid fa-bars" />
        </button>
        <h1 className="m-0 font-display text-[1.65rem] font-bold leading-[1.1] tracking-[-0.3px] text-deepGreen max-md:text-[1.65rem] md:text-[2rem] dark:text-[#e8f0ed] [.admin-dark_&]:text-[#e8f0ed]">
          {tabLabel}
        </h1>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <div className="flex min-w-[200px] flex-1 items-center transition-[min-width] duration-300 focus-within:min-w-[240px] max-md:min-w-0 md:flex-none">
          <AppSearchField
            variant="header"
            value={headerSearch}
            onChange={onHeaderSearchChange}
            placeholder={searchPlaceholder}
            ariaLabel={searchPlaceholder}
            disabled={!searchEnabled}
          />
        </div>

        <div className="relative" ref={notifRef}>
          <button
            type="button"
            className={iconBtnClass(notifOpen)}
            onClick={() => {
              setNotifOpen((v) => !v);
              setMsgOpen(false);
              setProfileOpen(false);
            }}
            aria-label="Notifications"
          >
            <i className="fa-regular fa-bell" />
            {generalUnread > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-[5px] text-[0.62rem] font-extrabold text-white">
                {generalUnread}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] z-[100] w-80 animate-adminDropIn overflow-hidden rounded-2xl border border-deepGreen/[0.08] bg-white shadow-[0_20px_40px_rgba(7,61,53,0.14)] [.admin-dark_&]:border-white/[0.08] [.admin-dark_&]:bg-[#141f1b]">
              <div className="flex items-center justify-between border-b border-deepGreen/[0.06] bg-deepGreen/[0.02] px-4 py-3.5 [.admin-dark_&]:border-white/[0.06] [.admin-dark_&]:bg-white/[0.03]">
                <strong>Notifications</strong>
                <span className="text-[0.72rem] font-bold text-emerald-500">{generalUnread} unread</span>
              </div>
              <ul className="m-0 max-h-[280px] list-none overflow-y-auto p-2">
                {generalNotifications.length === 0 ? (
                  <li>
                    <span className="flex cursor-default items-start gap-3 rounded-xl p-2.5">
                      <small>No notifications yet.</small>
                    </span>
                  </li>
                ) : (
                  generalNotifications.slice(0, 8).map((n) => {
                    const meta = iconForNotification(n);
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          className="flex w-full cursor-pointer items-start gap-3 rounded-xl border-0 bg-transparent p-2.5 text-left transition-all duration-300 hover:bg-deepGreen/[0.04] [.admin-dark_&]:hover:bg-white/[0.04]"
                          onClick={() => handleNotifClick(n)}
                        >
                          <span
                            className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl"
                            style={{ background: `${meta.color}18`, color: meta.color }}
                          >
                            <i className={`fa-solid ${meta.icon}`} />
                          </span>
                          <span>
                            <strong className="block text-[0.84rem] text-gray-800 [.admin-dark_&]:text-[#f3f7f5]">
                              {n.title}
                            </strong>
                            <small className="mt-0.5 block text-[0.74rem] leading-snug text-gray-500">
                              {n.desc}
                            </small>
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

        <div className="relative" ref={msgRef}>
          <button
            type="button"
            className={iconBtnClass(msgOpen)}
            onClick={() => {
              setMsgOpen((v) => !v);
              setNotifOpen(false);
              setProfileOpen(false);
            }}
            aria-label="Messages"
          >
            <i className="fa-regular fa-envelope" />
            {supportUnread > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-emerald-500 px-[5px] text-[0.62rem] font-extrabold text-white">
                {supportUnread}
              </span>
            )}
          </button>
          {msgOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] z-[100] w-80 animate-adminDropIn overflow-hidden rounded-2xl border border-deepGreen/[0.08] bg-white shadow-[0_20px_40px_rgba(7,61,53,0.14)] [.admin-dark_&]:border-white/[0.08] [.admin-dark_&]:bg-[#141f1b]">
              <div className="flex items-center justify-between border-b border-deepGreen/[0.06] bg-deepGreen/[0.02] px-4 py-3.5 [.admin-dark_&]:border-white/[0.06] [.admin-dark_&]:bg-white/[0.03]">
                <strong>Support Messages</strong>
                <span className="text-[0.72rem] font-bold text-emerald-500">{supportUnread} unread</span>
              </div>
              <ul className="m-0 max-h-[280px] list-none overflow-y-auto p-2">
                {supportMessages.length === 0 ? (
                  <li>
                    <span className="flex cursor-default items-start gap-3 rounded-xl p-2.5">
                      <small>No support messages.</small>
                    </span>
                  </li>
                ) : (
                  supportMessages.slice(0, 8).map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        className="flex w-full cursor-pointer items-start gap-3 rounded-xl border-0 bg-transparent p-2.5 text-left transition-all duration-300 hover:bg-deepGreen/[0.04] [.admin-dark_&]:hover:bg-white/[0.04]"
                        onClick={() => handleNotifClick(n)}
                      >
                        <span className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-500">
                          <i className="fa-solid fa-envelope" />
                        </span>
                        <span>
                          <strong className="block text-[0.84rem] text-gray-800 [.admin-dark_&]:text-[#f3f7f5]">
                            {n.title}
                          </strong>
                          <small className="mt-0.5 block text-[0.74rem] leading-snug text-gray-500">
                            {n.desc}
                          </small>
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-2.5 rounded-full border border-deepGreen/[0.08] bg-white py-1 pl-1 pr-3 transition-all duration-300 hover:border-emerald-500/35 hover:shadow-[0_6px_16px_rgba(7,61,53,0.08)] [.admin-dark_&]:border-white/[0.08] [.admin-dark_&]:bg-white/[0.04]"
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
              setMsgOpen(false);
            }}
          >
            <img
              src={adminAvatar}
              alt={adminName}
              className="h-[34px] w-[34px] rounded-full border-2 border-emerald-500 object-cover"
            />
            <span className="hidden text-[0.84rem] font-extrabold text-gray-800 sm:inline [.admin-dark_&]:text-[#f3f7f5]">
              {adminName}
            </span>
            <i
              className={`fa-solid fa-chevron-down text-[0.68rem] text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] z-[100] w-[260px] animate-adminDropIn overflow-hidden rounded-2xl border border-deepGreen/[0.08] bg-white pb-2 shadow-[0_20px_40px_rgba(7,61,53,0.14)] [.admin-dark_&]:border-white/[0.08] [.admin-dark_&]:bg-[#141f1b]">
              <div className="flex items-center gap-3 border-b border-deepGreen/[0.06] px-4 py-4 [.admin-dark_&]:border-white/[0.06]">
                <img
                  src={adminAvatar}
                  alt={adminName}
                  className="h-11 w-11 rounded-full border-2 border-gold object-cover"
                />
                <div>
                  <strong className="block text-[0.9rem] [.admin-dark_&]:text-[#f3f7f5]">{adminName}</strong>
                  <small className="text-[0.74rem] text-gray-500">{adminEmail || '—'}</small>
                </div>
              </div>
              <button
                type="button"
                className="mx-2 mb-1 mt-1 flex w-[calc(100%-16px)] cursor-pointer items-center gap-2.5 rounded-[10px] border-0 bg-transparent px-3 py-2.5 text-left text-[0.84rem] font-bold text-gray-700 no-underline transition-all duration-300 hover:bg-deepGreen/[0.05] hover:text-deepGreen [.admin-dark_&]:text-[#d7e2de] [.admin-dark_&]:hover:bg-white/[0.05]"
                onClick={() => {
                  onTabChange('settings');
                  closeAllDropdowns();
                }}
              >
                <i className="fa-solid fa-gear" /> Settings
              </button>
              <Link
                to="/"
                className="mx-2 flex w-[calc(100%-16px)] items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[0.84rem] font-bold text-gray-700 no-underline transition-all duration-300 hover:bg-deepGreen/[0.05] hover:text-deepGreen [.admin-dark_&]:text-[#d7e2de] [.admin-dark_&]:hover:bg-white/[0.05]"
                onClick={closeAllDropdowns}
              >
                <i className="fa-solid fa-store" /> View Store
              </Link>
              <button
                type="button"
                className="mx-2 flex w-[calc(100%-16px)] cursor-pointer items-center gap-2.5 rounded-[10px] border-0 bg-transparent px-3 py-2.5 text-left text-[0.84rem] font-bold text-red-500 transition-all duration-300 hover:bg-red-500/[0.08] hover:text-red-600"
                onClick={onLogout}
              >
                <i className="fa-solid fa-right-from-bracket" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// =============================================================================
// AdminAccessDenied
// =============================================================================

export function AdminAccessDenied() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-deepGreen to-[#031c18] p-5 text-center text-white">
      <div className="w-full max-w-[500px] animate-[cardRise_0.5s_ease_both] rounded-3xl border border-white/20 bg-white/10 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <i className="fa-solid fa-shield-halved mb-5 text-[4.5rem] text-gold" />
        <h2 className="mb-3 font-display text-[2.5rem] font-bold">Access Denied!</h2>
        <p className="mb-6 text-[0.95rem] leading-relaxed text-white/80">
          Waan ka xunnahay, boggan waxaa geli kara oo kaliya maamulaha (Admin-ka). Fadlan gal
          koontada admin-ka si aad u gasho dashboard-ka.
        </p>
        <Link
          to="/"
          className="inline-flex items-center rounded-xl bg-gradient-to-br from-gold to-[#F0C040] px-8 py-3 text-sm font-extrabold text-white no-underline transition hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(216,161,40,0.3)]"
        >
          <i className="fa-solid fa-arrow-left me-2" /> Ku laabo Bogga Hore
        </Link>
      </div>
    </div>
  );
}
