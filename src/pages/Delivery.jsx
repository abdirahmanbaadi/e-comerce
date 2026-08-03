import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { useIntervalWhenVisible } from '../hooks/useIntervalWhenVisible';
import { apiUrl } from '../utils/data';
import { formatMoney } from '../utils/format';
import { showTopFloatNotification } from '../utils/notifications';
import DriverOrderCard from '../features/driver/DriverOrderCard';
import DriverRejectModal from '../features/driver/DriverRejectModal';
import DeliveryCompleteModal from '../features/driver/DeliveryCompleteModal';
import DriverQrScanModal from '../features/driver/DriverQrScanModal';
import {
  countDriverOrdersByPhase,
  DRIVER_MAX_ACTIVE,
  DRIVER_TABS,
  driverStatusMeta,
  matchesDriverTab,
  pickNextDriverTab,
  sortDriverOrders,
} from '../features/driver/driverShared';

const FILTER_STAT_CARDS = DRIVER_TABS.map((tab) => ({
  ...tab,
  tone: {
    all: { icon: 'text-deepGreen bg-deepGreen/10', active: 'ring-deepGreen bg-deepGreen text-white' },
    pending: { icon: 'text-amber-700 bg-amber-100', active: 'ring-amber-500 bg-amber-500 text-white' },
    active: { icon: 'text-blue-700 bg-blue-100', active: 'ring-blue-500 bg-blue-600 text-white' },
    done: { icon: 'text-emerald-700 bg-emerald-100', active: 'ring-emerald-500 bg-emerald-600 text-white' },
  }[tab.id],
}));

function ConfirmModal({ open, title, message, confirmLabel, busy, onClose, onConfirm }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && !busy && onClose?.();
    const prev = document.body.style.overflow;
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, busy, onClose]);

  if (!open || typeof document === 'undefined' || !document.body) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-end justify-center bg-deepGreen/55 p-0 backdrop-blur-[4px] sm:items-center sm:p-4"
      role="presentation"
      onClick={() => !busy && onClose?.()}
    >
      <div
        className="animate-sheetUp w-full max-w-sm overflow-hidden rounded-t-[28px] bg-white shadow-[0_-20px_50px_rgba(0,0,0,0.22)] sm:rounded-[28px]"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pb-2 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/12 sm:hidden" />
          <h3 className="mb-2 font-display text-[1.35rem] font-bold text-deepGreen">{title}</h3>
          <p className="mb-0 text-[0.86rem] leading-relaxed text-[#5c564c]">{message}</p>
        </div>
        <div className="flex gap-2 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            className="min-h-[48px] flex-1 rounded-2xl border border-deepGreen/15 bg-white text-[0.86rem] font-extrabold text-deepGreen disabled:opacity-60"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="min-h-[48px] flex-1 rounded-2xl border-0 bg-gradient-to-br from-deepGreen to-teal text-[0.86rem] font-extrabold text-white disabled:opacity-60"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Delivery() {
  const { user, logout } = useAuth();
  const initialTabSet = useRef(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [driverStatus, setDriverStatus] = useState('available');
  const [activeDeliveries, setActiveDeliveries] = useState(0);
  const [statusSaving, setStatusSaving] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState(null);
  const [rejectOrder, setRejectOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [scanOrder, setScanOrder] = useState(null);
  const [completedDelivery, setCompletedDelivery] = useState(null);
  const [postCompleteCounts, setPostCompleteCounts] = useState(null);
  const [earnings, setEarnings] = useState({
    totalRevenue: 0,
    weekRevenue: 0,
    completedDeliveries: 0,
    weekDeliveries: 0,
  });

  const loadDriverEarnings = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(apiUrl('/api/drivers/my-earnings'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.earnings) {
        setEarnings(data.earnings);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadDriverStatus = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(apiUrl('/api/drivers/my-status'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDriverStatus(data.driverStatus || 'available');
        setActiveDeliveries(data.activeDeliveries || 0);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadOrders = useCallback(async ({ quiet = false } = {}) => {
    const token = localStorage.getItem('token');
    if (!token) return [];
    if (quiet) setRefreshing(true);
    try {
      const res = await fetch(apiUrl('/api/orders'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const nextOrders = data.orders || [];
        setOrders(nextOrders);
        return nextOrders;
      }
      if (!quiet) showTopFloatNotification('Could not load deliveries.', 'danger');
      return [];
    } catch (err) {
      console.error(err);
      if (!quiet) showTopFloatNotification('Could not load deliveries.', 'danger');
      return [];
    } finally {
      if (!quiet) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refreshAll = useCallback(
    async (quiet = true) => {
      const [nextOrders] = await Promise.all([
        loadOrders({ quiet }),
        loadDriverStatus(),
        loadDriverEarnings(),
      ]);
      return nextOrders;
    },
    [loadOrders, loadDriverStatus, loadDriverEarnings]
  );

  const handleNewNotifications = useCallback(
    (freshItems) => {
      if (!freshItems.some((item) => item.type === 'delivery_assigned')) return;
      refreshAll(true);
      setActiveTab('pending');
      showTopFloatNotification('New delivery request — accept or decline.');
    },
    [refreshAll]
  );

  const { items: notifications } = useNotifications({
    enabled: Boolean(user?.isLoggedIn),
    pollMs: 30000,
    onNewItems: handleNewNotifications,
  });

  const newAssignments = useMemo(
    () => notifications.filter((n) => n.type === 'delivery_assigned' && n.unread).length,
    [notifications]
  );

  useEffect(() => {
    loadOrders();
    loadDriverStatus();
    loadDriverEarnings();
    const onAssign = () => {
      refreshAll(true);
      setActiveTab('pending');
    };
    window.addEventListener('driver-assignment-updated', onAssign);
    return () => {
      window.removeEventListener('driver-assignment-updated', onAssign);
    };
  }, [loadOrders, loadDriverStatus, loadDriverEarnings, refreshAll]);

  useIntervalWhenVisible(() => refreshAll(true), 30000, Boolean(user?.isLoggedIn));

  const sortedOrders = useMemo(() => sortDriverOrders(orders), [orders]);
  const tabCounts = useMemo(() => countDriverOrdersByPhase(orders), [orders]);
  const filteredOrders = useMemo(
    () => sortedOrders.filter((order) => matchesDriverTab(order, activeTab)),
    [sortedOrders, activeTab]
  );

  useEffect(() => {
    if (loading || initialTabSet.current) return;
    initialTabSet.current = true;
    if (tabCounts.pending > 0) setActiveTab('pending');
    else if (tabCounts.active > 0) setActiveTab('active');
    else setActiveTab('all');
  }, [loading, tabCounts.pending, tabCounts.active]);

  const statusMeta = driverStatusMeta(driverStatus, activeDeliveries);
  const isOffline = driverStatus === 'offline';
  const firstName = user?.fullName?.split(' ')[0] || 'Driver';
  const initials = (user?.fullName || 'D')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const toggleAvailability = async () => {
    const nextStatus = isOffline ? 'available' : 'offline';
    setStatusSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('/api/drivers/my-status'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setDriverStatus(data.driverStatus);
        setActiveDeliveries(data.activeDeliveries || 0);
        showTopFloatNotification(data.message);
      } else {
        showTopFloatNotification(data.message || 'Could not update status', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not update availability', 'danger');
    } finally {
      setStatusSaving(false);
    }
  };

  const acceptAssignment = async (order) => {
    setBusyOrderId(order.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/drivers/assignments/${encodeURIComponent(order.id)}/accept`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('Delivery accepted! Start when you are ready.');
        await refreshAll(true);
      } else {
        showTopFloatNotification(data.message || 'Could not accept delivery', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not accept delivery', 'danger');
    } finally {
      setBusyOrderId(null);
    }
  };

  const submitReject = async () => {
    if (!rejectOrder) return;
    const reason = rejectReason.trim();
    if (!reason) {
      showTopFloatNotification('Please enter a reason for declining.', 'danger');
      return;
    }

    setBusyOrderId(rejectOrder.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/drivers/assignments/${encodeURIComponent(rejectOrder.id)}/reject`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('Delivery declined. Admin notified.');
        setRejectOrder(null);
        setRejectReason('');
        await refreshAll(true);
      } else {
        showTopFloatNotification(data.message || 'Could not decline delivery', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not decline delivery', 'danger');
    } finally {
      setBusyOrderId(null);
    }
  };

  const markArrived = async (order) => {
    setBusyOrderId(order.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/orders/${encodeURIComponent(order.id)}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          driverArrived: true,
          estimate: 'Driver arrived — handing over order',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('Arrival confirmed. Ask customer to show Track Order QR, then scan it.');
        await refreshAll(true);
        setActiveTab('active');
      } else {
        showTopFloatNotification(data.message || 'Could not confirm arrival', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not confirm arrival', 'danger');
    } finally {
      setBusyOrderId(null);
    }
  };

  const updateOrderStep = async (order, nextStep, estimate) => {
    setBusyOrderId(order.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/orders/${encodeURIComponent(order.id)}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentStep: nextStep, estimate }),
      });
      const data = await res.json();
      if (data.success) {
        setConfirmAction(null);
        const freshOrders = await refreshAll(true);
        if (nextStep >= 4) {
          window.dispatchEvent(new CustomEvent('admin-dashboard-invalidate'));
        }

        if (nextStep >= 5) {
          const counts = countDriverOrdersByPhase(freshOrders);
          setPostCompleteCounts(counts);
          setCompletedDelivery(order);
          setActiveTab(pickNextDriverTab(counts));
        } else {
          showTopFloatNotification('You are now on the way!');
          setActiveTab('active');
        }
      } else {
        showTopFloatNotification(data.message || 'Update failed', 'danger');
      }
    } catch {
      showTopFloatNotification('Update failed', 'danger');
    } finally {
      setBusyOrderId(null);
    }
  };

  const confirmDeliveryByQr = async (credentials) => {
    if (!scanOrder?.id || (!credentials?.payload && !credentials?.pin)) return;
    setBusyOrderId(scanOrder.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        apiUrl(`/api/drivers/assignments/${encodeURIComponent(scanOrder.id)}/confirm-delivery`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(
            credentials.pin ? { pin: credentials.pin } : { payload: credentials.payload }
          ),
        }
      );
      const data = await res.json();
      if (data.success) {
        const completed = scanOrder;
        setScanOrder(null);
        const freshOrders = await refreshAll(true);
        window.dispatchEvent(new CustomEvent('admin-dashboard-invalidate'));
        const counts = countDriverOrdersByPhase(freshOrders);
        setPostCompleteCounts(counts);
        setCompletedDelivery(completed);
        setActiveTab(pickNextDriverTab(counts));
        showTopFloatNotification(data.message || 'Delivery confirmed.');
      } else {
        showTopFloatNotification(data.message || 'Confirmation failed', 'danger');
      }
    } catch {
      showTopFloatNotification('Confirmation failed', 'danger');
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleCompleteModalTab = (tabId) => {
    setActiveTab(tabId);
    setCompletedDelivery(null);
    setPostCompleteCounts(null);
  };

  const emptyCopy = {
    all: {
      icon: 'fa-truck',
      title: 'No deliveries yet',
      text: 'Admin will assign paid orders to you here.',
    },
    pending: {
      icon: 'fa-bell',
      title: 'No new requests',
      text: 'You have no pending delivery requests right now.',
    },
    active: {
      icon: 'fa-route',
      title: 'No active deliveries',
      text: 'Accept a new request or wait for admin to assign one.',
    },
    done: {
      icon: 'fa-circle-check',
      title: 'No completed deliveries',
      text: 'Finished deliveries will appear here.',
    },
  };

  const empty = emptyCopy[activeTab] || emptyCopy.all;

  return (
    <div className="min-h-screen bg-gradient-to-b from-softBg via-base to-[#EDE8DF] font-sans text-[#111]">
      <header className="sticky top-0 z-30 border-b border-deepGreen/[0.06] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-deepGreen font-display text-lg font-bold text-gold">
              MF
            </span>
            <div>
              <p className="mb-0 text-[0.95rem] font-extrabold leading-tight text-deepGreen">Driver Hub</p>
              <p className="mb-0 text-[0.68rem] font-semibold text-gray-500">Mogadishu Modern Furniture</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-deepGreen/10 bg-white text-deepGreen"
              onClick={() => refreshAll(false)}
              disabled={refreshing}
              aria-label="Refresh deliveries"
            >
              <i className={`fa-solid fa-rotate-right ${refreshing ? 'fa-spin' : ''}`} aria-hidden="true" />
              {newAssignments > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[0.58rem] font-extrabold text-white">
                  {newAssignments}
                </span>
              )}
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500"
              onClick={logout}
              aria-label="Log out"
            >
              <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-10 pt-4">
        <section className="mb-3 flex items-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-gold via-[#E4B23A] to-[#F0C85A] px-3 py-2.5 shadow-[0_6px_18px_rgba(216,161,40,0.28)]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-deepGreen/90 text-[0.7rem] font-extrabold text-gold">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="mb-0 text-[0.62rem] font-bold uppercase tracking-wide text-deepGreen/70">Welcome back</p>
            <h1 className="mb-0 truncate text-[1rem] font-extrabold leading-tight text-deepGreen">{firstName}</h1>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.62rem] font-extrabold ${statusMeta.cls}`}>
            {statusMeta.label}
          </span>
        </section>

        <section className="mb-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white px-3 py-3 shadow-sm">
            <p className="mb-1 text-[0.62rem] font-bold uppercase tracking-wide text-emerald-700/80">
              Delivery revenue
            </p>
            <p className="mb-0 text-[1.2rem] font-extrabold leading-none text-deepGreen">
              {formatMoney(earnings.totalRevenue)}
            </p>
            <p className="mb-0 mt-1 text-[0.65rem] font-semibold text-gray-500">
              {earnings.completedDeliveries} completed
            </p>
          </div>
          <div className="rounded-xl border border-gold/20 bg-gradient-to-br from-[#fff9ec] to-white px-3 py-3 shadow-sm">
            <p className="mb-1 text-[0.62rem] font-bold uppercase tracking-wide text-amber-800/80">
              This week
            </p>
            <p className="mb-0 text-[1.2rem] font-extrabold leading-none text-deepGreen">
              {formatMoney(earnings.weekRevenue)}
            </p>
            <p className="mb-0 mt-1 text-[0.65rem] font-semibold text-gray-500">
              {earnings.weekDeliveries} deliveries
            </p>
          </div>
        </section>

        <section className="mb-3 rounded-xl border border-deepGreen/[0.06] bg-white px-3 py-2.5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="mb-0 text-[0.72rem] font-bold text-deepGreen">
                {activeDeliveries}/{DRIVER_MAX_ACTIVE} slots
                {newAssignments > 0 && (
                  <span className="ms-1.5 text-red-600">· {newAssignments} new</span>
                )}
              </p>
              <p className="mb-0 text-[0.65rem] font-semibold text-gray-400">{statusMeta.hint}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!isOffline}
              aria-label={isOffline ? 'Go available' : 'Go offline'}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                isOffline ? 'bg-gray-300' : 'bg-gold'
              } ${statusSaving || (driverStatus === 'busy' && !isOffline) ? 'opacity-60' : ''}`}
              disabled={statusSaving || (driverStatus === 'busy' && !isOffline)}
              onClick={toggleAvailability}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  isOffline ? 'left-0.5' : 'left-[1.35rem]'
                }`}
              />
            </button>
          </div>
        </section>

        <section className="mb-3 grid grid-cols-4 gap-1.5">
          {FILTER_STAT_CARDS.map((card) => {
            const active = activeTab === card.id;
            const count = tabCounts[card.id] ?? 0;
            return (
              <button
                key={card.id}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveTab(card.id)}
                className={`rounded-xl border px-1.5 py-2 text-center transition-all ${
                  active
                    ? `${card.tone.active} border-transparent shadow-md ring-2`
                    : 'border-deepGreen/[0.06] bg-white shadow-sm hover:border-gold/40'
                }`}
              >
                <span
                  className={`mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-lg text-[0.62rem] ${
                    active ? 'bg-white/20 text-inherit' : card.tone.icon
                  }`}
                >
                  <i className={`fa-solid ${card.icon}`} aria-hidden="true" />
                </span>
                <p className={`mb-0 text-[0.95rem] font-extrabold leading-none ${active ? 'text-inherit' : 'text-deepGreen'}`}>
                  {count}
                </p>
                <p className={`mb-0 mt-0.5 text-[0.58rem] font-bold uppercase tracking-wide ${active ? 'text-inherit opacity-90' : 'text-gray-500'}`}>
                  {card.label}
                </p>
              </button>
            );
          })}
        </section>

        {!loading && tabCounts.pending > 0 && activeTab !== 'pending' && (
          <button
            type="button"
            className="mb-3 flex w-full items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-start shadow-sm"
            onClick={() => setActiveTab('pending')}
          >
            <span className="text-[0.8rem] font-extrabold text-amber-900">
              <i className="fa-solid fa-bell me-1.5" aria-hidden="true" />
              {tabCounts.pending} new request{tabCounts.pending === 1 ? '' : 's'} waiting
            </span>
            <span className="text-[0.72rem] font-bold text-amber-700">View →</span>
          </button>
        )}

        {loading ? (
          <div className="rounded-[18px] bg-white px-4 py-12 text-center shadow-sm">
            <i className="fa-solid fa-spinner fa-spin mb-3 text-2xl text-deepGreen" aria-hidden="true" />
            <p className="mb-0 text-[0.88rem] font-semibold text-gray-500">Loading your deliveries…</p>
          </div>
        ) : isOffline ? (
          <div className="rounded-[18px] border border-deepGreen/[0.06] bg-white px-5 py-10 text-center shadow-sm">
            <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl text-gray-400">
              <i className="fa-solid fa-moon" aria-hidden="true" />
            </span>
            <h2 className="mb-1 text-[1.05rem] font-extrabold text-deepGreen">You are offline</h2>
            <p className="mb-0 text-[0.86rem] text-gray-500">Turn availability on to receive new delivery requests.</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-[18px] border border-deepGreen/[0.06] bg-white px-5 py-10 text-center shadow-sm">
            <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-softBg text-2xl text-gray-400">
              <i className={`fa-solid ${empty.icon}`} aria-hidden="true" />
            </span>
            <h2 className="mb-1 text-[1.05rem] font-extrabold text-deepGreen">{empty.title}</h2>
            <p className="mb-0 text-[0.86rem] text-gray-500">{empty.text}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <DriverOrderCard
                key={order.id}
                order={order}
                busy={busyOrderId === order.id}
                onAccept={acceptAssignment}
                onDecline={(o) => {
                  setRejectOrder(o);
                  setRejectReason('');
                }}
                onStartDelivery={(o) =>
                  setConfirmAction({
                    order: o,
                    title: 'Start delivery?',
                    message: 'Confirm only when you are leaving to deliver this order. Customer will see "Out for delivery".',
                    confirmLabel: 'Yes, start delivery',
                    onConfirm: () => updateOrderStep(o, 4, 'Out for delivery — on the way'),
                  })
                }
                onMarkArrived={(o) =>
                  setConfirmAction({
                    order: o,
                    title: 'Arrived at customer?',
                    message: `Confirm you have reached ${o.customer}'s location. You cannot mark delivered until you arrive.`,
                    confirmLabel: 'Yes, I have arrived',
                    onConfirm: () => markArrived(o),
                  })
                }
                onMarkDelivered={(o) => setScanOrder(o)}
              />
            ))}
          </div>
        )}
      </main>

      <DriverRejectModal
        order={rejectOrder}
        reason={rejectReason}
        busy={Boolean(rejectOrder && busyOrderId === rejectOrder.id)}
        onReasonChange={setRejectReason}
        onClose={() => {
          if (busyOrderId === rejectOrder?.id) return;
          setRejectOrder(null);
          setRejectReason('');
        }}
        onSubmit={submitReject}
      />

      <DriverQrScanModal
        open={Boolean(scanOrder)}
        order={scanOrder}
        busy={Boolean(scanOrder && busyOrderId === scanOrder.id)}
        onClose={() => {
          if (busyOrderId) return;
          setScanOrder(null);
        }}
        onConfirm={confirmDeliveryByQr}
      />

      <ConfirmModal
        open={Boolean(confirmAction)}
        title={confirmAction?.title}
        message={confirmAction?.message}
        confirmLabel={confirmAction?.confirmLabel}
        busy={Boolean(confirmAction && busyOrderId === confirmAction.order?.id)}
        onClose={() => {
          if (busyOrderId) return;
          setConfirmAction(null);
        }}
        onConfirm={() => confirmAction?.onConfirm?.()}
      />

      <DeliveryCompleteModal
        order={completedDelivery}
        tabCounts={postCompleteCounts || tabCounts}
        onClose={() => handleCompleteModalTab(pickNextDriverTab(postCompleteCounts || tabCounts))}
        onGoToTab={handleCompleteModalTab}
      />
    </div>
  );
}
