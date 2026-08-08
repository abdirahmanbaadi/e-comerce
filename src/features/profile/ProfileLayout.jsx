import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { id: 'profile', label: 'My Profile', icon: 'fa-regular fa-user' },
  { id: 'orders', label: 'My Orders', icon: 'fa-solid fa-bag-shopping' },
  { id: 'track', label: 'Track Order', icon: 'fa-solid fa-location-dot' },
  { id: 'notifications', label: 'Notifications', icon: 'fa-regular fa-bell', badge: true },
  { id: 'help', label: 'Help Center', icon: 'fa-regular fa-circle-question' },
  { id: 'settings', label: 'Settings', icon: 'fa-solid fa-gear' },
];

const itemBase =
  'group relative flex w-full cursor-pointer items-center gap-3.5 overflow-hidden rounded-xl border-0 bg-transparent px-[18px] py-3 text-left text-[0.95rem] font-medium text-[#555555] no-underline transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]';

function activeItemClass() {
  return 'bg-gradient-to-r from-[#e8e7e1] to-[#f0efe9] font-semibold text-[#334e3f] shadow-[inset_3px_0_0_#073D35,0_4px_14px_rgba(7,61,53,0.06)] translate-x-0.5';
}

function idleItemClass() {
  return 'hover:bg-[rgba(98,123,108,0.07)] hover:pl-[22px] hover:text-[#627b6c] hover:shadow-[0_2px_10px_rgba(7,61,53,0.04)] active:scale-[0.98]';
}

function SidebarItem({ active, children, className = '', style, ...props }) {
  return (
    <button
      type="button"
      className={`${itemBase} ${active ? activeItemClass() : idleItemClass()} ${className}`}
      style={style}
      {...props}
    >
      {active && (
        <span
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          aria-hidden="true"
        >
          <span className="absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-sidebarShimmer" />
        </span>
      )}
      {children}
    </button>
  );
}

function SidebarLink({ active, children, className = '', style, ...props }) {
  return (
    <Link
      className={`${itemBase} ${active ? activeItemClass() : idleItemClass()} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </Link>
  );
}

function ItemIcon({ icon, active }) {
  const isSolid = icon.includes('fa-solid');
  return (
    <i
      className={`${icon} relative z-[1] w-5 text-center text-[1.15rem] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        active
          ? 'scale-110 text-[#334e3f]'
          : isSolid
            ? 'text-transparent [-webkit-text-stroke:1.5px_#666666] group-hover:scale-110 group-hover:[-webkit-text-stroke:1.5px_#627b6c]'
            : 'text-[#666666] group-hover:scale-110 group-hover:text-[#627b6c]'
      } ${active && isSolid ? '[-webkit-text-stroke:1.5px_#334e3f]' : ''}`}
    />
  );
}

function MobileTabPill({ active, children, className = '', style, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[0.82rem] font-semibold transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        active
          ? 'scale-[1.02] border-deepGreen/20 bg-deepGreen text-white shadow-[0_4px_14px_rgba(7,61,53,0.22)]'
          : 'border-black/[0.08] bg-white text-[#555555] hover:scale-[1.02] hover:border-deepGreen/15 hover:text-deepGreen hover:shadow-[0_2px_8px_rgba(7,61,53,0.08)] active:scale-[0.98]'
      } ${className}`}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
}

function MobileTabLink({ active, children, className = '', style, ...props }) {
  return (
    <Link
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[0.82rem] font-semibold no-underline transition-all duration-300 ${
        active
          ? 'border-deepGreen/20 bg-deepGreen text-white shadow-[0_4px_14px_rgba(7,61,53,0.18)]'
          : 'border-black/[0.08] bg-white text-[#555555] hover:border-deepGreen/15 hover:text-deepGreen'
      } ${className}`}
      style={style}
      {...props}
    >
      {children}
    </Link>
  );
}

function staggerStyle(index, baseMs = 70) {
  return { animationDelay: `${index * baseMs}ms` };
}

export default function ProfileSidebar({ activeTab, unreadCount, onTabChange }) {
  const { logout, user } = useAuth();

  return (
    <aside className="animate-sidebarLogoIn sticky top-0 z-20 flex h-screen flex-col gap-4 overflow-hidden border-r border-black/[0.04] bg-[#FAF9F6] px-6 py-8 max-lg:relative max-lg:h-auto max-lg:gap-4 max-lg:overflow-visible max-lg:border-b max-lg:border-r-0 max-lg:p-4">
      <Link
        to="/"
        className="group mb-6 flex items-center gap-3 no-underline transition-transform duration-300 hover:scale-[1.02] max-lg:mb-2"
      >
        <div className="relative flex h-[38px] w-[38px] shrink-0 items-center justify-center transition-transform duration-500 group-hover:rotate-3">
          <span className="absolute inset-0 rotate-45 rounded-[10px] border-2 border-gold transition-colors duration-300 group-hover:border-gold/80" aria-hidden="true" />
          <span className="relative z-[1] font-display text-[1.1rem] font-bold text-gold">MF</span>
        </div>
        <div className="h-[34px] w-px bg-gold/75" aria-hidden="true" />
        <div>
          <span className="block font-display text-[1.45rem] font-bold leading-tight text-deepGreen">
            Mogadishu
          </span>
          <span className="block text-[0.52rem] font-bold uppercase tracking-[1.8px] text-gold">
            Modern Furniture
          </span>
        </div>
      </Link>

      <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
        {TABS.map((tab, index) => (
          <MobileTabPill
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className="animate-sidebarItemIn"
            style={staggerStyle(index, 50)}
          >
            <i className={`${tab.icon} text-[0.85rem] transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : ''}`} />
            {tab.label}
            {tab.badge && unreadCount > 0 && (
              <span className="inline-flex h-1.5 w-1.5 animate-badgePulse rounded-full bg-gold" aria-hidden="true" />
            )}
          </MobileTabPill>
        ))}
      </div>

      <nav className="hidden min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto lg:flex" aria-label="Profile navigation">
        {TABS.map((tab, index) => (
          <SidebarItem
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className="animate-sidebarItemIn"
            style={staggerStyle(index)}
          >
            <ItemIcon icon={tab.icon} active={activeTab === tab.id} />
            <span className="relative z-[1]">{tab.label}</span>
            {tab.badge && unreadCount > 0 && (
              <span
                className="relative z-[1] ml-auto inline-flex h-[7px] w-[7px] min-w-[7px] animate-badgePulse rounded-full bg-[#c39d63]"
                aria-label={`${unreadCount} unread`}
              />
            )}
          </SidebarItem>
        ))}

        <div className="my-1.5 h-px bg-black/[0.06]" />

        {user?.role === 'user' && user?.driverApplicationStatus === 'pending' && (
          <SidebarLink
            to="/apply-delivery"
            className="animate-sidebarItemIn"
            style={staggerStyle(TABS.length + 1)}
          >
            <ItemIcon icon="fa-solid fa-hourglass-half" />
            <span className="relative z-[1]">Application status</span>
          </SidebarLink>
        )}
        {user?.role === 'user' &&
          user?.driverApplicationStatus !== 'pending' &&
          user?.driverApplicationStatus !== 'rejected' && (
            <SidebarLink
              to="/apply-delivery"
              className="animate-sidebarItemIn"
              style={staggerStyle(TABS.length + 1)}
            >
              <ItemIcon icon="fa-solid fa-truck-fast" />
              <span className="relative z-[1]">Apply as Driver</span>
            </SidebarLink>
          )}
        {user?.role === 'delivery' && (
          <SidebarLink
            to="/delivery"
            className="animate-sidebarItemIn"
            style={staggerStyle(TABS.length + 1)}
          >
            <ItemIcon icon="fa-solid fa-truck" />
            <span className="relative z-[1]">Delivery Dashboard</span>
          </SidebarLink>
        )}

        <button
          type="button"
          className={`${itemBase} animate-sidebarItemIn mt-2 text-red-600 hover:bg-red-600/[0.06] hover:pl-[22px] hover:text-[#911810] hover:shadow-[0_2px_10px_rgba(180,35,24,0.08)] active:scale-[0.98]`}
          style={staggerStyle(TABS.length + 2)}
          onClick={logout}
        >
          <i className="fa-solid fa-arrow-right-from-bracket w-5 text-center text-[1.15rem] text-red-600 transition-transform duration-300 group-hover:translate-x-0.5 [-webkit-text-stroke:1.5px_#b42318]" />
          Logout
        </button>
      </nav>

      <div className="mt-auto hidden border-t border-black/[0.06] pt-4 lg:block">
        <SidebarLink
          to="/"
          className="animate-sidebarItemIn w-full justify-center rounded-xl border border-deepGreen/12 bg-white py-3 font-semibold text-deepGreen shadow-[0_4px_14px_rgba(7,61,53,0.06)] transition hover:border-deepGreen/20 hover:bg-deepGreen/[0.03] hover:shadow-[0_6px_18px_rgba(7,61,53,0.1)]"
          style={staggerStyle(TABS.length + 3)}
        >
          <ItemIcon icon="fa-solid fa-house" />
          <span className="relative z-[1]">Back to Home</span>
        </SidebarLink>
      </div>

      <div className="flex animate-sidebarItemIn items-center justify-between gap-3 border-t border-black/[0.06] pt-3 lg:hidden" style={staggerStyle(TABS.length + 4, 50)}>
        <SidebarLink
          to="/"
          className="!w-auto flex-1 justify-center rounded-xl border border-deepGreen/12 bg-white !px-4 !py-2.5 text-[0.85rem] font-semibold text-deepGreen shadow-sm"
        >
          <ItemIcon icon="fa-solid fa-house" />
          Back to Home
        </SidebarLink>
        <button
          type="button"
          className={`${itemBase} !w-auto !px-3 !py-2 text-[0.85rem] text-red-600 hover:bg-red-600/[0.05] hover:text-[#911810]`}
          onClick={logout}
        >
          <i className="fa-solid fa-arrow-right-from-bracket text-[0.95rem] text-red-600" />
          Logout
        </button>
      </div>
    </aside>
  );
}
