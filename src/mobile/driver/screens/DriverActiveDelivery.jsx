import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  buildTelHref,
  extractDistrict,
  getDriverOrderPhase,
} from '../../../features/driver/driverShared';
import { formatMoney } from '../../../utils/format';
import { apiUrl } from '../../../utils/data';
import { showTopFloatNotification } from '../../../utils/notifications';
import { resolveOrderCoords } from '../../../utils/banadirCoords';
import DriverMap from '../DriverMap';
import DriverCustomerChatSheet from '../DriverCustomerChatSheet';
import { DRIVER_PICKUP } from '../driverMockData';
import { useDriverContext } from '../DriverShell';

function formatDay(raw) {
  const d = new Date(raw || Date.now());
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatClock(raw) {
  const d = new Date(raw || Date.now());
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function deliveryFee(order) {
  const fee = Number(order?.deliveryFee ?? order?.deliveryCost ?? order?.shippingFee ?? 0);
  if (fee > 0) return formatMoney(fee);
  return '—';
}

function itemStats(order) {
  const items = order?.items || order?.products || [];
  const qty = items.reduce((n, it) => n + (Number(it.qty ?? it.quantity) || 1), 0) || 1;
  return { qty, label: qty === 1 ? '1 Item' : `${qty} Items` };
}

function progressSteps(phase) {
  let idx = 1;
  if (phase === 'pending') idx = 0;
  else if (phase === 'accepted') idx = 1;
  else if (phase === 'transit' || phase === 'at_customer') idx = 2;
  else if (phase === 'delivered') idx = 3;

  const labels = ['Assigned', 'Picked', 'Transit', 'Done'];
  return labels.map((label, i) => ({
    label,
    done: i <= idx,
  }));
}

const SHEET_EXPANDED = '72dvh';
const SHEET_PEEK = 'calc(5.35rem + env(safe-area-inset-bottom))';
const SNAP_DOWN_PX = 72;
const SNAP_UP_PX = 48;

function customerAvatar(order) {
  return order?.customerAvatar || order?.avatar || order?.customerImage || null;
}

/** Location Tracking — map + header + closable sheet (above Leaflet z-index). */
export default function DriverActiveDelivery() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, loading, refreshAll } = useDriverContext();
  const [driverPos, setDriverPos] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [recenterTick, setRecenterTick] = useState(0);
  const [sheetMode, setSheetMode] = useState('expanded'); // expanded | peek
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const dragStartY = useRef(0);
  const dragLiveY = useRef(0);
  const dragStartMode = useRef('expanded');

  const order = useMemo(
    () => orders.find((o) => String(o.id) === String(orderId)),
    [orders, orderId]
  );

  const customerCoords = useMemo(() => (order ? resolveOrderCoords(order) : null), [order]);
  const phase = order ? getDriverOrderPhase(order) : null;
  const tel = buildTelHref(order?.phone);
  const steps = progressSteps(phase);
  const stats = itemStats(order);
  const avatar = order ? customerAvatar(order) : null;
  const isDelivered = phase === 'delivered';
  const isTransit = phase === 'transit';
  const isAtCustomer = phase === 'at_customer';
  const pickupName = order?.pickupName || DRIVER_PICKUP.name;
  const dropLabel = order?.address || extractDistrict(order?.address) || 'Mogadishu';

  const markArrived = useCallback(async () => {
    if (!order || busy) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setBusy(true);
    try {
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
        showTopFloatNotification('Arrival confirmed. Ask customer for Track Order QR, then scan it.');
        await refreshAll(true);
      } else {
        showTopFloatNotification(data.message || 'Could not confirm arrival.', 'danger');
      }
    } catch {
      showTopFloatNotification('Connection failed.', 'danger');
    } finally {
      setBusy(false);
    }
  }, [order, busy, refreshAll]);

  const etaLabel = useMemo(() => {
    if (routeInfo?.durationMin != null) {
      const at = formatClock(new Date(Date.now() + routeInfo.durationMin * 60_000));
      return `${routeInfo.durationMin} min (${at})`;
    }
    if (order?.etaMinutes) {
      return `${order.etaMinutes} min (${formatClock(order.etaAt || order.deliveryDate)})`;
    }
    return formatClock(order?.scheduledTime || order?.deliveryDate);
  }, [routeInfo, order]);

  const distanceLabel =
    routeInfo?.distanceKm != null
      ? `${routeInfo.distanceKm} km`
      : order?.distanceKm
        ? `${order.distanceKm} km`
        : '—';

  const onSheetPointerDown = useCallback(
    (event) => {
      if (event.button != null && event.button !== 0) return;
      dragStartY.current = event.clientY;
      dragLiveY.current = 0;
      dragStartMode.current = sheetMode;
      setDragging(true);
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    },
    [sheetMode]
  );

  const onSheetPointerMove = useCallback(
    (event) => {
      if (!dragging) return;
      const dy = event.clientY - dragStartY.current;
      dragLiveY.current = dy;
      if (dragStartMode.current === 'expanded') {
        setDragY(Math.max(0, Math.min(dy, 280)));
      } else {
        setDragY(Math.max(-200, Math.min(dy, 40)));
      }
    },
    [dragging]
  );

  const finishSheetDrag = useCallback(() => {
    if (!dragging) return;
    const dy = dragLiveY.current;
    setDragging(false);
    setDragY(0);
    dragLiveY.current = 0;

    if (dragStartMode.current === 'expanded' && dy >= SNAP_DOWN_PX) {
      setSheetMode('peek');
      return;
    }
    if (dragStartMode.current === 'peek' && dy <= -SNAP_UP_PX) {
      setSheetMode('expanded');
    }
  }, [dragging]);

  const onSheetPointerUp = useCallback(
    (event) => {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
      finishSheetDrag();
    },
    [finishSheetDrag]
  );

  useEffect(() => {
    if (!customerCoords) return undefined;
    if (!navigator.geolocation) {
      setDriverPos({ lat: customerCoords.lat + 0.018, lng: customerCoords.lng - 0.014 });
      return undefined;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setDriverPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () =>
        setDriverPos(
          (prev) => prev || { lat: customerCoords.lat + 0.018, lng: customerCoords.lng - 0.014 }
        ),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [customerCoords]);

  // Push live GPS to backend so customer track can follow the driver.
  useEffect(() => {
    if (!order?.id || !driverPos?.lat || !driverPos?.lng) return undefined;
    if (!(phase === 'transit' || phase === 'at_customer')) return undefined;

    const token = localStorage.getItem('token');
    if (!token) return undefined;

    let cancelled = false;
    const push = async () => {
      try {
        await fetch(apiUrl(`/api/drivers/assignments/${encodeURIComponent(order.id)}/location`), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ lat: driverPos.lat, lng: driverPos.lng }),
        });
      } catch {
        /* ignore transient GPS sync errors */
      }
    };

    push();
    const timer = window.setInterval(() => {
      if (!cancelled) push();
    }, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [order?.id, order?.assignedDriverId, driverPos?.lat, driverPos?.lng, phase]);

  if (!order) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center bg-[#1c1c1c] px-4">
        <p className="m-0 text-center text-[0.9rem] font-semibold text-[#aaa]">
          {loading ? 'Loading…' : 'Delivery not found.'}
        </p>
        <button
          type="button"
          className="mt-4 rounded-full bg-[#e07a3a] px-5 py-2.5 text-[0.85rem] font-bold text-white"
          onClick={() => navigate('/app/driver/jobs')}
        >
          Back
        </button>
      </div>
    );
  }

  const ui = (
    <>
      {/* Header — portal, above Leaflet */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-[1200] flex justify-center">
        <div className="pointer-events-auto flex w-full max-w-md items-center justify-between px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white text-[#1a1a1a] shadow-[0_4px_16px_rgba(0,0,0,0.18)]"
            aria-label="Back"
          >
            <i className="fa-solid fa-chevron-left text-[0.85rem]" />
          </button>
          <h1 className="m-0 rounded-full bg-white px-4 py-2 text-[0.95rem] font-bold text-[#1a1a1a] shadow-[0_4px_16px_rgba(0,0,0,0.14)]">
            Location Tracking
          </h1>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white text-[#1a1a1a] shadow-[0_4px_16px_rgba(0,0,0,0.18)]"
            aria-label="Menu"
          >
            <i className="fa-solid fa-ellipsis-vertical" />
          </button>
        </div>
      </header>

      {menuOpen
        ? createPortal(
            <div className="fixed inset-0 z-[1210]" onClick={() => setMenuOpen(false)}>
              <div
                className="absolute right-[max(0.75rem,calc(50%-11rem))] top-[3.6rem] w-44 overflow-hidden rounded-2xl bg-white shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-2 border-0 bg-transparent px-3 py-2.5 text-left text-[0.8rem] font-semibold"
                  onClick={() => {
                    setRecenterTick((n) => n + 1);
                    setMenuOpen(false);
                  }}
                >
                  <i className="fa-solid fa-location-crosshairs text-[#2f6b45]" /> Center map
                </button>
                {isAtCustomer ? (
                  <Link
                    to={`/app/driver/jobs/${encodeURIComponent(order.id)}/scan`}
                    className="flex items-center gap-2 px-3 py-2.5 text-[0.8rem] font-semibold text-[#1a1a1a] no-underline"
                    onClick={() => setMenuOpen(false)}
                  >
                    <i className="fa-solid fa-qrcode text-[#2f6b45]" /> Scan QR
                  </Link>
                ) : isTransit ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 border-0 bg-transparent px-3 py-2.5 text-left text-[0.8rem] font-semibold disabled:opacity-60"
                    disabled={busy}
                    onClick={() => {
                      setMenuOpen(false);
                      markArrived();
                    }}
                  >
                    <i className="fa-solid fa-house-chimney text-[#2f6b45]" /> I&apos;ve Arrived
                  </button>
                ) : null}
              </div>
            </div>,
            document.body
          )
        : null}

      {routeInfo?.road ? (
        <div className="pointer-events-none fixed inset-x-0 top-[4.4rem] z-[1200] flex justify-center">
          <div className="rounded-full bg-white px-3 py-1 text-[0.7rem] font-bold text-[#1a1a1a] shadow-md">
            {routeInfo.distanceKm} km · {routeInfo.durationMin} min
          </div>
        </div>
      ) : null}

      {/* Sheet — drag between expanded and customer peek */}
      {createPortal(
        <div className="pointer-events-none fixed inset-0 z-[1300] flex items-end justify-center">
          {sheetMode === 'expanded' ? (
            <button
              type="button"
              aria-label="Collapse sheet"
              className="pointer-events-auto absolute inset-0 border-0 bg-black/35"
              onClick={() => setSheetMode('peek')}
            />
          ) : null}
          <div
            className="pointer-events-auto relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-[#1c1c1c] text-white shadow-[0_-12px_40px_rgba(0,0,0,0.45)]"
            style={{
              height: sheetMode === 'expanded' ? SHEET_EXPANDED : SHEET_PEEK,
              maxHeight: SHEET_EXPANDED,
              transform: `translateY(${dragY}px)`,
              transition: dragging
                ? 'none'
                : 'height 0.3s ease-out, transform 0.28s ease-out',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Delivery details"
          >
            {sheetMode === 'expanded' ? (
              <div
                className="flex shrink-0 cursor-grab flex-col items-center pb-1 pt-3 active:cursor-grabbing"
                onPointerDown={onSheetPointerDown}
                onPointerMove={onSheetPointerMove}
                onPointerUp={onSheetPointerUp}
                onPointerCancel={onSheetPointerUp}
                style={{ touchAction: 'none' }}
                aria-label="Drag sheet"
                role="presentation"
              >
                <span className="h-1.5 w-11 rounded-full bg-[#4a4a4a]" />
              </div>
            ) : null}

            <div
              className={`shrink-0 px-4 ${
                sheetMode === 'peek'
                  ? 'pb-[max(0.55rem,env(safe-area-inset-bottom))] pt-2.5'
                  : 'pb-3 pt-1'
              }`}
              onPointerDown={onSheetPointerDown}
              onPointerMove={onSheetPointerMove}
              onPointerUp={onSheetPointerUp}
              onPointerCancel={onSheetPointerUp}
              style={{ touchAction: 'none' }}
            >
              <section
                className={`flex items-center ${sheetMode === 'peek' ? 'gap-2.5' : 'gap-3'}`}
                onClick={() => {
                  if (sheetMode === 'peek') setSheetMode('expanded');
                }}
              >
                <span
                  className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#333] text-[#aaa] ${
                    sheetMode === 'peek' ? 'h-11 w-11' : 'h-14 w-14'
                  }`}
                >
                  {avatar ? (
                    <img src={avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <i className={`fa-solid fa-user ${sheetMode === 'peek' ? 'text-base' : 'text-xl'}`} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={`m-0 truncate font-bold ${
                      sheetMode === 'peek' ? 'text-[0.95rem]' : 'text-[1.05rem]'
                    }`}
                  >
                    {order.customer}
                  </p>
                  <p className="mb-0 mt-0.5 text-[0.72rem] text-[#9a9a9a]">Customer</p>
                </div>
                <div className="flex shrink-0 gap-2" onClick={(e) => e.stopPropagation()}>
                  {tel ? (
                    <a
                      href={tel}
                      className={`flex items-center justify-center rounded-full border-0 bg-[#e07a3a] text-white no-underline ${
                        sheetMode === 'peek' ? 'h-10 w-10' : 'h-11 w-11'
                      }`}
                      aria-label="Call"
                    >
                      <i className="fa-solid fa-phone" />
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setChatOpen(true)}
                    className={`flex items-center justify-center rounded-full border-0 bg-[#333] text-white ${
                      sheetMode === 'peek' ? 'h-10 w-10' : 'h-11 w-11'
                    }`}
                    aria-label="Message"
                  >
                    <i className="fa-solid fa-comment" />
                  </button>
                </div>
              </section>
            </div>

            {sheetMode === 'expanded' || dragging ? (
              <div
                className={`min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 pb-[max(0.9rem,env(safe-area-inset-bottom))] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                  sheetMode === 'peek' ? 'pointer-events-none opacity-0' : ''
                }`}
              >
                <section>
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <p className="m-0 text-[0.78rem] font-bold text-[#cfcfcf]">Progress status</p>
                    {isDelivered ? (
                      <span className="rounded-full bg-[#2f6b45] px-2.5 py-0.5 text-[0.68rem] font-bold text-white">
                        Done
                      </span>
                    ) : isAtCustomer ? (
                      <Link
                        to={`/app/driver/jobs/${encodeURIComponent(order.id)}/scan`}
                        className="flex h-9 w-9 items-center justify-center rounded-full border-0 bg-[#e07a3a] text-white no-underline shadow-[0_4px_12px_rgba(224,122,58,0.35)]"
                        aria-label="Scan customer QR to complete delivery"
                        title="Scan customer QR"
                      >
                        <i className="fa-solid fa-qrcode text-[0.95rem]" />
                      </Link>
                    ) : isTransit ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={markArrived}
                        className="flex h-9 items-center justify-center rounded-full border-0 bg-[#e07a3a] px-3 text-[0.68rem] font-bold text-white shadow-[0_4px_12px_rgba(224,122,58,0.35)] disabled:opacity-60"
                      >
                        {busy ? '…' : "I've Arrived"}
                      </button>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between px-0.5">
                    {steps.map((s, i) => (
                      <div key={s.label} className="flex flex-1 items-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full ${
                              s.done ? 'bg-[#e07a3a] text-white' : 'bg-[#333] text-[#777]'
                            }`}
                          >
                            <i className={`fa-solid ${s.done ? 'fa-check' : 'fa-circle'} text-[0.5rem]`} />
                          </span>
                          <span className="mt-1 text-[0.55rem] font-semibold text-[#8a8a8a]">
                            {s.label}
                          </span>
                        </div>
                        {i < steps.length - 1 ? (
                          <div
                            className={`mx-1 mb-4 h-px flex-1 border-t border-dashed ${
                              steps[i + 1].done ? 'border-[#e07a3a]' : 'border-[#3a3a3a]'
                            }`}
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl bg-[#252525] p-3.5">
                  <p className="mb-2.5 mt-0 text-[0.72rem] font-bold uppercase tracking-wide text-[#8a8a8a]">
                    Trip information
                  </p>
                  <div className="mb-3">
                    <p className="mb-1 mt-0 text-[0.65rem] font-semibold text-[#8a8a8a]">Route</p>
                    <p className="m-0 text-[0.88rem] font-bold leading-snug text-white">
                      From <span className="text-[#e07a3a]">{pickupName}</span> to{' '}
                      <span className="text-[#e07a3a]">{order.customer}</span>
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                    <InfoRow icon="fa-location-dot" label="Location" value={dropLabel} />
                    <InfoRow icon="fa-clock" label="Estimated" value={etaLabel} />
                    <InfoRow icon="fa-box" label="Items" value={stats.label} />
                    <InfoRow icon="fa-money-bill" label="Delivery fee" value={deliveryFee(order)} />
                    <InfoRow icon="fa-route" label="Distance" value={distanceLabel} />
                    <InfoRow
                      icon="fa-calendar"
                      label="Date"
                      value={formatDay(order.deliveryDate || order.scheduledTime)}
                    />
                  </div>
                </section>
              </div>
            ) : null}
          </div>
        </div>,
        document.body
      )}
    </>
  );

  return (
    <div className="relative h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#f3f3f3]">
      <div className="absolute inset-0 z-0">
        <DriverMap
          customer={customerCoords}
          driver={driverPos}
          followDriver={false}
          recenterTick={recenterTick}
          onRouteInfo={setRouteInfo}
          className="h-full w-full"
        />
      </div>
      {createPortal(ui, document.body)}
      <DriverCustomerChatSheet
        order={order}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="min-w-0">
      <p className="mb-0.5 mt-0 flex items-center gap-1 text-[0.62rem] font-semibold text-[#8a8a8a]">
        <i className={`fa-solid ${icon} text-[0.58rem] text-[#e07a3a]`} />
        {label}
      </p>
      <p className="m-0 truncate text-[0.82rem] font-semibold text-white">{value}</p>
    </div>
  );
}
