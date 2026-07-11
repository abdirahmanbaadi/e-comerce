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

const itemBase =
  'group flex w-full cursor-pointer items-center gap-3.5 rounded-xl border-0 bg-transparent px-[18px] py-3 text-left text-[0.95rem] font-medium text-[#555555] no-underline transition-all duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)]';

function SidebarItem({ active, children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`${itemBase} ${
        active
          ? 'bg-[#e8e7e1] font-semibold text-[#334e3f]'
          : 'hover:bg-[rgba(98,123,108,0.06)] hover:pl-[22px] hover:text-[#627b6c]'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function SidebarLink({ active, children, className = '', ...props }) {
  return (
    <Link
      className={`${itemBase} ${
        active
          ? 'bg-[#e8e7e1] font-semibold text-[#334e3f]'
          : 'hover:bg-[rgba(98,123,108,0.06)] hover:pl-[22px] hover:text-[#627b6c]'
      } ${className}`}
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
      className={`${icon} w-5 text-center text-[1.15rem] transition-all duration-[250ms] ${
        active
          ? 'text-[#334e3f]'
          : isSolid
            ? 'text-transparent [-webkit-text-stroke:1.5px_#666666] group-hover:[-webkit-text-stroke:1.5px_#627b6c]'
            : 'text-[#666666] group-hover:scale-110 group-hover:text-[#627b6c]'
      } ${active && isSolid ? '[-webkit-text-stroke:1.5px_#334e3f]' : ''}`}
    />
  );
}

function MobileTabPill({ active, children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[0.82rem] font-semibold transition-all ${
        active
          ? 'border-deepGreen/20 bg-deepGreen text-white shadow-[0_4px_14px_rgba(7,61,53,0.18)]'
          : 'border-black/[0.08] bg-white text-[#555555] hover:border-deepGreen/15 hover:text-deepGreen'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function MobileTabLink({ active, children, className = '', ...props }) {
  return (
    <Link
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[0.82rem] font-semibold no-underline transition-all ${
        active
          ? 'border-deepGreen/20 bg-deepGreen text-white shadow-[0_4px_14px_rgba(7,61,53,0.18)]'
          : 'border-black/[0.08] bg-white text-[#555555] hover:border-deepGreen/15 hover:text-deepGreen'
      } ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

export default function ProfileSidebar({ activeTab, unreadCount, onTabChange }) {
  const { logout, user } = useAuth();

  return (
    <aside className="sticky top-0 z-20 flex h-screen flex-col gap-6 overflow-hidden border-r border-black/[0.04] bg-[#FAF9F6] px-6 py-8 max-lg:relative max-lg:h-auto max-lg:gap-4 max-lg:overflow-visible max-lg:border-b max-lg:border-r-0 max-lg:p-4">
      <Link to="/" className="mb-6 flex items-center gap-3 no-underline max-lg:mb-2">
        <div className="relative flex h-[38px] w-[38px] shrink-0 items-center justify-center">
          <span className="absolute inset-0 rotate-45 rounded-[10px] border-2 border-gold" aria-hidden="true" />
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
        {TABS.map((tab) => {
          if (tab.href) {
            return (
              <MobileTabLink key={tab.id} to={tab.href}>
                <i className={`${tab.icon} text-[0.85rem]`} />
                {tab.label}
              </MobileTabLink>
            );
          }

          return (
            <MobileTabPill
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
            >
              <i className={`${tab.icon} text-[0.85rem]`} />
              {tab.label}
              {tab.badge && unreadCount > 0 && (
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
              )}
            </MobileTabPill>
          );
        })}
      </div>

      <div className="hidden flex-col gap-1.5 lg:flex">
        {TABS.map((tab) => {
          if (tab.href) {
            return (
              <SidebarLink key={tab.id} to={tab.href}>
                <ItemIcon icon={tab.icon} />
                {tab.label}
              </SidebarLink>
            );
          }

          return (
            <SidebarItem key={tab.id} active={activeTab === tab.id} onClick={() => onTabChange(tab.id)}>
              <ItemIcon icon={tab.icon} active={activeTab === tab.id} />
              {tab.label}
              {tab.badge && unreadCount > 0 && (
                <span className="ml-auto inline-flex h-[7px] w-[7px] min-w-[7px] rounded-full bg-[#c39d63]" aria-label={`${unreadCount} unread`} />
              )}
            </SidebarItem>
          );
        })}

        <div className="my-1.5 h-px bg-black/[0.06]" />

        {user?.role === 'user' &&
          user?.driverApplicationStatus !== 'pending' &&
          user?.driverApplicationStatus !== 'rejected' && (
            <SidebarLink to="/apply-delivery">
              <ItemIcon icon="fa-solid fa-truck-fast" />
              Apply as Driver
            </SidebarLink>
          )}
        {user?.role === 'delivery' && (
          <SidebarLink to="/delivery">
            <ItemIcon icon="fa-solid fa-truck" />
            Delivery Dashboard
          </SidebarLink>
        )}

        <button
          type="button"
          className={`${itemBase} mt-2 text-red-600 hover:bg-red-600/[0.05] hover:text-[#911810]`}
          onClick={logout}
        >
          <i className="fa-solid fa-arrow-right-from-bracket w-5 text-center text-[1.15rem] text-red-600 [-webkit-text-stroke:1.5px_#b42318] group-hover:[-webkit-text-stroke:1.5px_#911810]" />
          Logout
        </button>

        <SidebarLink to="/" className="mt-2">
          <ItemIcon icon="fa-solid fa-house" />
          Back to Home
        </SidebarLink>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-black/[0.06] pt-3 lg:hidden">
        <SidebarLink to="/" className="!w-auto !px-3 !py-2 text-[0.85rem]">
          <ItemIcon icon="fa-solid fa-house" />
          Home
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
