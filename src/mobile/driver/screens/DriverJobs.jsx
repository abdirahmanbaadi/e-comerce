import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { extractDistrict, getDriverOrderPhase } from '../../../features/driver/driverShared';
import { formatMoney } from '../../../utils/format';
import { useDriverContext } from '../DriverShell';
import DriverDeliveryDetailSheet from '../DriverDeliveryDetailSheet';

const DELIVERY_TABS = [
  { id: 'all', label: 'All' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
];

function normalizeTab(raw) {
  if (!raw) return 'all';
  if (raw === 'pending' || raw === 'new') return 'assigned';
  if (raw === 'active') return 'progress';
  if (raw === 'done') return 'completed';
  if (DELIVERY_TABS.some((t) => t.id === raw)) return raw;
  return 'all';
}

function matchesDeliveryTab(order, tabId) {
  const phase = getDriverOrderPhase(order);
  if (tabId === 'all') return phase !== 'unassigned';
  if (tabId === 'assigned') return phase === 'pending';
  if (tabId === 'progress') {
    return phase === 'accepted' || phase === 'transit' || phase === 'at_customer';
  }
  if (tabId === 'completed') return phase === 'delivered';
  return true;
}

function deliveryFee(order) {
  const fee = Number(order.deliveryFee ?? order.deliveryCost ?? order.shippingFee ?? 0);
  return fee > 0 ? formatMoney(fee) : '—';
}

function orderDayKey(order) {
  const raw = order.deliveryDate || order.deliveryTime || order.updatedAt || order.createdAt || order.date;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return 'other';
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(key) {
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterdayKey = `${y.getFullYear()}-${y.getMonth()}-${y.getDate()}`;
  if (key === todayKey) return 'Today';
  if (key === yesterdayKey) return 'Yesterday';
  if (key === 'other') return 'Earlier';
  const [yy, mm, dd] = key.split('-').map(Number);
  const d = new Date(yy, mm, dd);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daySortValue(key) {
  if (key === 'other') return 0;
  const [yy, mm, dd] = key.split('-').map(Number);
  return new Date(yy, mm, dd).getTime();
}

function cardStatus(order) {
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
      label: 'Assigned',
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
    label: 'Assigned',
    chip: 'bg-[#f0f0f0] text-[#6b7f79]',
    iconBg: 'bg-[#f0f0f0] text-[#6b7f79]',
    icon: 'fa-clock',
  };
}

function sortOrders(list) {
  return list.slice().sort((a, b) => {
    const ta = new Date(a.deliveryDate || a.deliveryTime || a.updatedAt || 0).getTime();
    const tb = new Date(b.deliveryDate || b.deliveryTime || b.updatedAt || 0).getTime();
    return tb - ta;
  });
}

function orderIdDigits(order) {
  return String(order?.id || '').replace(/\D/g, '');
}

function matchesDeliverySearch(order, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;

  const id = String(order?.id || '').toLowerCase();
  const customer = String(order?.customer || order?.customerName || '').toLowerCase();
  const digits = orderIdDigits(order);
  const last4 = digits.slice(-4);

  if (id.includes(q)) return true;
  if (customer.includes(q)) return true;

  const qDigits = q.replace(/\D/g, '');
  if (qDigits) {
    if (digits.includes(qDigits)) return true;
    if (qDigits.length <= 4 && last4.endsWith(qDigits)) return true;
    if (last4 === qDigits) return true;
  }

  return false;
}

export default function DriverJobs() {
  const { orders, loading, notificationUnread } = useDriverContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [search, setSearch] = useState('');
  const displayOrders = orders;
  const notifUnread = notificationUnread || 0;

  // Keep open detail sheet in sync after Accept / Decline.
  useEffect(() => {
    if (!selectedOrder) return;
    const next = displayOrders.find((o) => String(o.id) === String(selectedOrder.id));
    if (!next) {
      setSelectedOrder(null);
      return;
    }
    if (next !== selectedOrder) setSelectedOrder(next);
  }, [displayOrders, selectedOrder]);

  const tab = normalizeTab(searchParams.get('tab'));

  useEffect(() => {
    const raw = searchParams.get('tab');
    if (!raw) return;
    const normalized = normalizeTab(raw);
    if (raw !== normalized) {
      setSearchParams(normalized === 'all' ? {} : { tab: normalized }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const selectTab = (id) => {
    setSearchParams(id === 'all' ? {} : { tab: id }, { replace: true });
  };

  const filtered = useMemo(
    () =>
      sortOrders(
        displayOrders.filter(
          (order) => matchesDeliveryTab(order, tab) && matchesDeliverySearch(order, search)
        )
      ),
    [displayOrders, tab, search]
  );

  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((order) => {
      const key = orderDayKey(order);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(order);
    });
    return Array.from(map.entries()).sort((a, b) => daySortValue(b[0]) - daySortValue(a[0]));
  }, [filtered]);

  const hasSearch = Boolean(search.trim());

  return (
    <div className="min-h-[100dvh] bg-[#f6f3ee] pb-[calc(4.25rem+env(safe-area-inset-bottom))]">
      <header className="bg-[#f6f3ee] px-4 pt-[max(0.35rem,env(safe-area-inset-top))]">
        <div className="relative flex items-center justify-center pb-3 pt-0.5">
          <h1 className="m-0 text-center text-[1.15rem] font-bold text-[#1a1a1a]">Deliveries</h1>
          <Link
            to="/app/driver/notifications"
            className="absolute right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1a1a1a] no-underline shadow-sm transition active:scale-95"
            aria-label="Notifications"
          >
            <i className="fa-regular fa-bell text-[0.95rem]" />
            {notifUnread > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#e53935] px-1 text-[0.6rem] font-bold text-white">
                {notifUnread > 9 ? '9+' : notifUnread}
              </span>
            ) : null}
          </Link>
        </div>

        <div className="relative mb-3 mt-1">
          <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[0.85rem] text-[#9b8876]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID, last 4, or customer"
            className="h-11 w-full rounded-2xl border-0 bg-white py-0 pl-10 pr-10 text-[0.82rem] font-semibold text-[#3c2c1f] shadow-sm outline-none ring-1 ring-[#eadfce] placeholder:text-[#9b8876]"
            aria-label="Search deliveries"
          />
          {hasSearch ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-transparent text-[#9b8876]"
              aria-label="Clear search"
            >
              <i className="fa-solid fa-xmark text-[0.85rem]" />
            </button>
          ) : null}
        </div>

        <div className="-mx-1 mb-2.5 flex gap-2 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {DELIVERY_TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTab(t.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-[0.8rem] font-semibold transition ${
                  active
                    ? 'border-[#2f6b45] bg-[#2f6b45] text-white'
                    : 'border-[#e0e0e0] bg-white text-[#3d3d3d]'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="px-4 pb-4">
        {loading ? (
          <p className="m-0 py-16 text-center text-[0.88rem] font-semibold text-[#8a8a8a]">
            Loading deliveries…
          </p>
        ) : grouped.length === 0 ? (
          <div className="rounded-[20px] border border-[#ebe6df] bg-white px-5 py-12 text-center">
            <i
              className={`fa-solid mb-3 text-3xl text-[#d0d0d0] ${
                hasSearch ? 'fa-magnifying-glass' : 'fa-clipboard-list'
              }`}
            />
            <p className="m-0 text-[0.9rem] font-bold text-[#3d3d3d]">
              {hasSearch ? 'No matches' : 'No deliveries here'}
            </p>
            <p className="mb-0 mt-1 text-[0.8rem] font-medium text-[#8a8a8a]">
              {hasSearch
                ? 'Try another order ID, last 4 digits, or customer name.'
                : 'New assigned jobs will show under Assigned.'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(([key, items]) => (
              <section key={key}>
                <h2 className="mb-2.5 mt-0 text-[0.82rem] font-bold text-[#5a5a5a]">{dayLabel(key)}</h2>
                <div className="space-y-2.5">
                  {items.map((order) => (
                    <DeliveryCard
                      key={order.id}
                      order={order}
                      onOpen={() => setSelectedOrder(order)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <DriverDeliveryDetailSheet
        order={selectedOrder}
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}

function DeliveryCard({ order, onOpen }) {
  const status = cardStatus(order);
  const place = order.address || extractDistrict(order.address);
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const label =
    status.label === 'Delivered' && orderDayKey(order) !== todayKey ? 'Completed' : status.label;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-[16px] border border-[#ebe6df] bg-white p-3.5 text-left text-inherit shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition active:scale-[0.99]"
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${status.iconBg}`}>
        <i className={`fa-solid ${status.icon} text-[1rem]`} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="m-0 truncate text-[0.92rem] font-bold text-[#1a1a1a]">{order.id}</p>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold ${status.chip}`}>
            {label}
          </span>
        </div>
        <p className="mb-0 mt-0.5 truncate text-[0.82rem] font-medium text-[#5a5a5a]">{order.customer}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="mb-0 flex min-w-0 items-center gap-1 truncate text-[0.74rem] text-[#8a8a8a]">
            <i className="fa-solid fa-location-dot shrink-0 text-[0.65rem] text-[#a67c52]" />
            <span className="truncate">{place}</span>
          </p>
          <p className="mb-0 flex shrink-0 items-center gap-1.5 text-[0.9rem] font-bold text-[#1a1a1a]">
            {deliveryFee(order)}
            <i className="fa-solid fa-chevron-right text-[0.65rem] text-[#c5c5c5]" />
          </p>
        </div>
      </div>
    </button>
  );
}
