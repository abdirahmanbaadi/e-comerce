import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  extractDistrict,
  getDriverOrderPhase,
} from '../../../features/driver/driverShared';
import { formatMoney, productImage } from '../../../utils/format';
import DriverDeliveryDetailSheet from '../DriverDeliveryDetailSheet';
import { useDriverContext } from '../DriverShell';

function greetingForHour(h = new Date().getHours()) {
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function isToday(dateVal) {
  if (!dateVal) return false;
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function orderSortTime(order) {
  const raw = order.deliveryDate || order.deliveryTime || order.updatedAt || order.createdAt || order.date;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function deliveryFee(order) {
  const fee = Number(order.deliveryFee ?? order.deliveryCost ?? order.shippingFee ?? 0);
  return fee > 0 ? formatMoney(fee) : '—';
}

function listStatus(order) {
  const phase = getDriverOrderPhase(order);
  if (phase === 'delivered') {
    return {
      label: 'Delivered',
      chip: 'bg-[#e7f4ea] text-[#2f6b45]',
      iconBg: 'bg-[#e7f4ea] text-[#2f6b45]',
      icon: 'fa-bag-shopping',
    };
  }
  if (phase === 'pending') {
    return {
      label: 'New',
      chip: 'bg-[#fff1e8] text-[#c45c26]',
      iconBg: 'bg-[#fff1e8] text-[#c45c26]',
      icon: 'fa-bell',
    };
  }
  if (phase === 'transit' || phase === 'at_customer' || phase === 'accepted') {
    return {
      label: 'In Progress',
      chip: 'bg-[#f4ebe1] text-[#a67c52]',
      iconBg: 'bg-[#f4ebe1] text-[#a67c52]',
      icon: 'fa-box',
    };
  }
  return {
    label: 'Scheduled',
    chip: 'bg-[#f0f0f0] text-[#6b7f79]',
    iconBg: 'bg-[#f0f0f0] text-[#6b7f79]',
    icon: 'fa-clock',
  };
}

export default function DriverHome() {
  const {
    user,
    orders,
    loading,
    driverStatus,
    setAvailability,
    refreshAll,
    refreshing,
    notificationUnread,
  } = useDriverContext();

  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const displayOrders = orders;
  const notifUnread = notificationUnread || 0;
  const isOnline = driverStatus !== 'offline';
  const displayName = user?.fullName?.trim() || 'Driver';
  const profilePhoto = user?.avatar ? productImage(user.avatar) : '';

  useEffect(() => {
    if (!selectedOrder) return;
    const next = displayOrders.find((o) => String(o.id) === String(selectedOrder.id));
    if (!next) {
      setSelectedOrder(null);
      return;
    }
    if (next !== selectedOrder) setSelectedOrder(next);
  }, [displayOrders, selectedOrder]);

  const todayOrders = useMemo(
    () => displayOrders.filter((o) => isToday(o.deliveryDate || o.updatedAt || o.createdAt || o.date)),
    [displayOrders]
  );

  /** Live counts — same phases as Deliveries tabs (Assigned / In Progress / Completed). */
  const todayStats = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let newAssigned = 0;
    displayOrders.forEach((o) => {
      const phase = getDriverOrderPhase(o);
      if (phase === 'pending') newAssigned += 1;
      else if (phase === 'delivered') completed += 1;
      else if (phase === 'accepted' || phase === 'transit' || phase === 'at_customer') inProgress += 1;
    });
    const assigned = completed + inProgress + newAssigned;
    return { assigned, completed, inProgress, newAssigned };
  }, [displayOrders]);

  const currentDeliveries = useMemo(() => {
    const transit = displayOrders.filter((o) => {
      const phase = getDriverOrderPhase(o);
      return phase === 'transit' || phase === 'at_customer';
    });
    if (transit.length) return transit.slice(0, 1);
    const accepted = displayOrders.filter(
      (o) => getDriverOrderPhase(o) === 'accepted' && Number(o.currentStep) >= 3
    );
    if (accepted.length) return accepted.slice(0, 1);
    return [];
  }, [displayOrders]);

  const currentIds = useMemo(() => new Set(currentDeliveries.map((o) => o.id)), [currentDeliveries]);

  const todayList = useMemo(() => {
    const list = (todayOrders.length ? todayOrders : displayOrders)
      .slice()
      .sort((a, b) => orderSortTime(a) - orderSortTime(b));
    return list
      .filter((o) => !currentIds.has(o.id) && getDriverOrderPhase(o) !== 'pending')
      .slice(0, 6);
  }, [todayOrders, displayOrders, currentIds]);

  const toggleOnline = () => {
    setAvailability(isOnline ? 'offline' : 'available');
  };

  return (
    <div className="min-h-[100dvh] bg-[#f6f3ee] pb-[calc(4.25rem+env(safe-area-inset-bottom))]">
      <header className="px-4 pt-[max(0.55rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-0 bg-white text-[#2f6b45] shadow-sm transition active:scale-95"
            aria-label="Menu"
          >
            {profilePhoto ? (
              <img src={profilePhoto} alt="" className="h-full w-full object-cover" />
            ) : (
              <i className="fa-solid fa-truck text-[1rem]" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <p className="mb-0 text-[0.75rem] leading-none text-[#8a8a8a]">{greetingForHour()},</p>
            <h1 className="m-0 truncate text-[1.1rem] font-bold leading-tight text-[#1a1a1a]">
              {displayName} 👋
            </h1>
          </div>

          <Link
            to="/app/driver/notifications"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#1a1a1a] no-underline shadow-sm transition active:scale-95"
            aria-label="Notifications"
          >
            <i className="fa-regular fa-bell text-[1rem]" />
            {notifUnread > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#e53935] px-1 text-[0.6rem] font-bold text-white">
                {notifUnread > 9 ? '9+' : notifUnread}
              </span>
            ) : null}
          </Link>
        </div>

        {menuOpen ? (
          <div className="mt-2 rounded-2xl border border-[#ebe6df] bg-white p-2 text-[0.82rem] font-semibold text-[#3d3d3d] shadow-sm">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-xl border-0 bg-transparent p-2.5 text-left transition hover:bg-[#f7f4ef]"
              onClick={() => {
                refreshAll(true);
                setMenuOpen(false);
              }}
            >
              <i className={`fa-solid fa-rotate-right ${refreshing ? 'fa-spin' : ''}`} /> Refresh
            </button>
            <Link
              to="/app/driver/profile"
              className="flex items-center gap-2 rounded-xl p-2.5 text-inherit no-underline transition hover:bg-[#f7f4ef]"
              onClick={() => setMenuOpen(false)}
            >
              <i className="fa-solid fa-user" /> Profile
            </Link>
          </div>
        ) : null}
      </header>

      <div className="flex flex-col gap-3 px-4 pb-4 pt-3">
        <div
          className={`flex items-center justify-between gap-3 rounded-[16px] px-3 py-2.5 transition-colors duration-300 ${
            isOnline ? 'bg-[#e7f4ea]' : 'bg-[#ececeb]'
          }`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
                isOnline ? 'bg-[#2f6b45] text-white' : 'bg-[#8a8f8c] text-white'
              }`}
            >
              <i className={`fa-solid ${isOnline ? 'fa-wifi' : 'fa-wifi-slash'} text-[0.85rem]`} />
            </span>
            <div className="min-w-0">
              <p
                className={`m-0 text-[0.86rem] font-bold leading-tight transition-colors duration-300 ${
                  isOnline ? 'text-[#2f6b45]' : 'text-[#3d4441]'
                }`}
              >
                {isOnline ? 'You are Online' : 'You are Offline'}
              </p>
              <p className="mb-0 mt-0.5 text-[0.7rem] leading-snug text-[#6b7f79]">
                {isOnline ? 'Ready to receive deliveries' : 'Turn on to receive deliveries'}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isOnline}
            aria-label={isOnline ? 'Go offline' : 'Go online'}
            onClick={toggleOnline}
            className={`relative h-8 w-[54px] shrink-0 rounded-full border-0 p-0 transition-colors duration-300 ease-out ${
              isOnline ? 'bg-[#2f6b45]' : 'bg-[#c2c7c4]'
            }`}
          >
            <span
              className={`pointer-events-none absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-out ${
                isOnline ? 'translate-x-[22px]' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <section>
          <div className="mb-1 flex items-center justify-between">
            <h2 className="m-0 text-[0.88rem] font-bold text-[#1a1a1a]">Today&apos;s Overview</h2>
            <Link to="/app/driver/jobs" className="text-[0.7rem] font-semibold text-[#a67c52] no-underline">
              View all <i className="fa-solid fa-chevron-right text-[0.55rem]" />
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <OverviewCard
              label="Deliveries"
              value={loading ? '—' : todayStats.assigned}
              icon="fa-bag-shopping"
              iconColor="text-[#2f6b45]"
            />
            <OverviewCard
              label="Completed"
              value={loading ? '—' : todayStats.completed}
              icon="fa-clipboard-check"
              iconColor="text-[#2f6b45]"
            />
            <OverviewCard
              label="In Progress"
              value={loading ? '—' : todayStats.inProgress}
              icon="fa-box"
              iconColor="text-[#a67c52]"
            />
            <OverviewCard
              label="New Assigned"
              value={loading ? '—' : todayStats.newAssigned}
              icon="fa-bell"
              iconColor="text-[#c45c26]"
              to="/app/driver/jobs?tab=assigned"
            />
          </div>
        </section>

        <section>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <h2 className="m-0 text-[0.92rem] font-bold text-[#1a1a1a]">Current Delivery</h2>
            {currentDeliveries.length > 0 ? (
              <span className="rounded-full bg-[#f4ebe1] px-2.5 py-0.5 text-[0.65rem] font-bold text-[#a67c52]">
                In Progress
              </span>
            ) : null}
          </div>
          {loading ? (
            <div className="space-y-2">
              <div className="h-[96px] animate-pulse rounded-[16px] bg-white" />
            </div>
          ) : currentDeliveries.length > 0 ? (
            <div className="space-y-2.5">
              {currentDeliveries.map((order) => (
                <CurrentDeliveryCard
                  key={order.id}
                  order={order}
                  onOpen={() => setSelectedOrder(order)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[16px] border border-[#ebe6df] bg-white px-3 py-5 text-center">
              <p className="m-0 text-[0.78rem] font-medium text-[#8a8a8a]">No active delivery right now.</p>
            </div>
          )}
        </section>

        <section>
          <div className="mb-1.5 flex items-center justify-between">
            <h2 className="m-0 text-[0.92rem] font-bold text-[#1a1a1a]">Today&apos;s Deliveries</h2>
            <Link to="/app/driver/jobs" className="text-[0.72rem] font-semibold text-[#a67c52] no-underline">
              View all <i className="fa-solid fa-chevron-right text-[0.55rem]" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              <div className="h-[68px] animate-pulse rounded-[14px] bg-white" />
              <div className="h-[68px] animate-pulse rounded-[14px] bg-white" />
            </div>
          ) : todayList.length === 0 ? (
            <div className="rounded-[14px] border border-[#ebe6df] bg-white px-3 py-5 text-center">
              <p className="m-0 text-[0.78rem] font-medium text-[#8a8a8a]">No deliveries for today.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {todayList.map((order) => (
                <DeliveryRow
                  key={order.id}
                  order={order}
                  onOpen={() => setSelectedOrder(order)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <DriverDeliveryDetailSheet
        order={selectedOrder}
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}

function CurrentDeliveryCard({ order, onOpen }) {
  const phase = getDriverOrderPhase(order);
  const navTo = `/app/driver/jobs/${encodeURIComponent(order.id)}${
    phase === 'transit' || phase === 'at_customer' ? '/active' : ''
  }`;

  return (
    <article className="rounded-[16px] border border-[#ebe6df] bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full gap-2.5 border-0 bg-transparent p-0 text-left"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4ebe1] text-[#a67c52]">
          <i className="fa-solid fa-box text-[0.95rem]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="m-0 truncate text-[0.88rem] font-bold leading-tight text-[#1a1a1a]">{order.id}</p>
            <span className="shrink-0 rounded-full bg-[#f4ebe1] px-2 py-0.5 text-[0.6rem] font-bold text-[#a67c52]">
              In Progress
            </span>
          </div>
          <p className="mb-0 mt-0.5 text-[0.76rem] font-medium leading-tight text-[#5a5a5a]">{order.customer}</p>
          <p className="mb-0 mt-1 flex items-center gap-1 text-[0.7rem] leading-tight text-[#8a8a8a]">
            <i className="fa-solid fa-location-dot shrink-0 text-[#a67c52]" />
            <span className="truncate">{order.address || extractDistrict(order.address)}</span>
          </p>
        </div>
      </button>
      <div className="mt-2.5 flex justify-end">
        <Link
          to={navTo}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#a67c52] px-3.5 py-2 text-[0.75rem] font-bold text-white no-underline transition active:scale-[0.98]"
        >
          <i className="fa-solid fa-paper-plane text-[0.68rem]" />
          Navigate
        </Link>
      </div>
    </article>
  );
}

function OverviewCard({ label, value, icon, iconColor, highlight = false, to = null }) {
  const className = `block rounded-[12px] px-1 py-2 text-center text-inherit no-underline shadow-[0_1px_6px_rgba(0,0,0,0.03)] transition active:scale-[0.98] ${
    highlight ? 'border border-[#f0d9c8] bg-[#fff8f2]' : 'border border-[#ebe6df] bg-white'
  }`;
  const inner = (
    <>
      <p className="mb-1 mt-0 truncate text-[0.58rem] font-medium text-[#8a8a8a]">{label}</p>
      <p className="m-0 text-[1.05rem] font-bold leading-none text-[#1a1a1a]">{value}</p>
      <span className={`mt-1.5 inline-flex text-[0.75rem] ${iconColor}`}>
        <i className={`fa-solid ${icon}`} />
      </span>
    </>
  );
  if (to) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}

function DeliveryRow({ order, onOpen }) {
  const status = listStatus(order);
  const place = order.address || extractDistrict(order.address);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full shrink-0 items-center gap-2.5 rounded-[14px] border border-[#ebe6df] bg-white px-2.5 py-2.5 text-left text-inherit shadow-[0_1px_6px_rgba(0,0,0,0.03)] transition active:scale-[0.99]"
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${status.iconBg}`}>
        <i className={`fa-solid ${status.icon} text-[0.85rem]`} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="m-0 truncate text-[0.8rem] font-bold text-[#1a1a1a]">{order.id}</p>
          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[0.58rem] font-bold ${status.chip}`}>
            {status.label}
          </span>
        </div>
        <p className="mb-0 mt-0.5 truncate text-[0.72rem] font-medium text-[#5a5a5a]">{order.customer}</p>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="mb-0 flex min-w-0 items-center gap-1 truncate text-[0.66rem] text-[#8a8a8a]">
            <i className="fa-solid fa-location-dot shrink-0 text-[0.6rem] text-[#a67c52]" />
            <span className="truncate">{place}</span>
          </p>
          <p className="mb-0 flex shrink-0 items-center gap-1 text-[0.8rem] font-bold text-[#1a1a1a]">
            {deliveryFee(order)}
            <i className="fa-solid fa-chevron-right text-[0.58rem] text-[#c5c5c5]" />
          </p>
        </div>
      </div>
    </button>
  );
}
