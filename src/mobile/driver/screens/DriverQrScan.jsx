import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDriverOrderPhase } from '../../../features/driver/driverShared';
import { apiUrl } from '../../../utils/data';
import { showTopFloatNotification } from '../../../utils/notifications';
import { useDriverContext } from '../DriverShell';

/** Camera needs a secure context: HTTPS or localhost. LAN http://IP is blocked. */
function cameraLikelyBlocked() {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname;
  const secure = window.location.protocol === 'https:';
  const local = host === 'localhost' || host === '127.0.0.1';
  return !secure && !local;
}

export default function DriverQrScan() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders = [], refreshAll } = useDriverContext() || {};

  const [busy, setBusy] = useState(false);
  const [manualPin, setManualPin] = useState('');
  const [cameraOff, setCameraOff] = useState(() => cameraLikelyBlocked());
  const readerRef = useRef(null);
  const scannerRef = useRef(null);
  const runningRef = useRef(false);
  const confirmRef = useRef(null);

  const order = useMemo(
    () => (orders || []).find((o) => String(o.id) === String(orderId)),
    [orders, orderId]
  );

  const phase = order ? getDriverOrderPhase(order) : null;
  const needsArrival = phase === 'transit';

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
        showTopFloatNotification('Arrival confirmed. Scan customer QR or enter PIN.');
        await refreshAll?.(true);
      } else {
        showTopFloatNotification(data.message || 'Could not confirm arrival.', 'danger');
      }
    } catch {
      showTopFloatNotification('Connection failed.', 'danger');
    } finally {
      setBusy(false);
    }
  }, [order, busy, refreshAll]);

  const confirmDelivery = useCallback(
    async (credentials) => {
      if (busy) return;
      if (!order) {
        showTopFloatNotification('Delivery not found.', 'danger');
        return;
      }
      setBusy(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(
          apiUrl(`/api/drivers/assignments/${encodeURIComponent(order.id)}/confirm-delivery`),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(credentials),
          }
        );
        const data = await res.json();
        if (data.success) {
          showTopFloatNotification('Delivery confirmed.');
          await refreshAll?.(true);
          navigate('/app/driver/jobs?tab=completed');
        } else {
          showTopFloatNotification(data.message || 'QR / PIN not accepted.', 'danger');
        }
      } catch {
        showTopFloatNotification('Connection failed.', 'danger');
      } finally {
        setBusy(false);
      }
    },
    [busy, order, navigate, refreshAll]
  );

  confirmRef.current = confirmDelivery;

  useEffect(() => {
    if (cameraOff || needsArrival) return undefined;
    let cancelled = false;

    const stopScanner = async () => {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (!scanner) return;
      try {
        const state = scanner.getState?.();
        // 2 = SCANNING in html5-qrcode
        if (state == null || state === 2) {
          await scanner.stop();
        }
      } catch {
        /* ignore */
      }
      try {
        scanner.clear?.();
      } catch {
        /* ignore */
      }
    };

    const start = async () => {
      if (!readerRef.current || cancelled) return;
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;
        const scanner = new Html5Qrcode(readerRef.current.id);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 8, qrbox: { width: 220, height: 220 } },
          async (decoded) => {
            if (runningRef.current) return;
            runningRef.current = true;
            try {
              let payload = decoded;
              try {
                const parsed = JSON.parse(decoded);
                if (parsed?.payload) payload = parsed.payload;
                if (parsed?.pin) {
                  await confirmRef.current?.({ pin: String(parsed.pin) });
                  return;
                }
              } catch {
                /* plain string */
              }
              await confirmRef.current?.({ payload: String(payload) });
            } finally {
              runningRef.current = false;
            }
          },
          () => {}
        );
      } catch {
        if (!cancelled) {
          setCameraOff(true);
          showTopFloatNotification('Camera unavailable — use PIN below.', 'warning');
        }
        await stopScanner();
      }
    };

    const t = window.setTimeout(start, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      stopScanner();
    };
  }, [cameraOff, orderId, needsArrival]);

  if (needsArrival) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-[#0b1f1b] text-white">
        <header className="flex items-center gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white/10 text-white"
            aria-label="Back"
          >
            <i className="fa-solid fa-chevron-left" />
          </button>
          <div>
            <h1 className="m-0 text-[1.05rem] font-extrabold">Confirm arrival</h1>
            <p className="m-0 text-[0.75rem] font-medium text-white/70">{order?.id || orderId}</p>
          </div>
        </header>

        <div className="mx-4 mt-6 rounded-[24px] bg-white/5 px-5 py-8 text-center ring-1 ring-white/10">
          <i className="fa-solid fa-house-chimney mb-3 text-3xl text-[#e07a3a]" />
          <p className="m-0 text-[0.95rem] font-bold text-white">Confirm you arrived at the customer</p>
          <p className="mb-0 mt-2 text-[0.78rem] leading-snug text-white/65">
            Tap Arrived first, then scan their Track Order QR or enter the PIN.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={markArrived}
            className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border-0 bg-[#2f6b45] text-[0.92rem] font-bold text-white disabled:opacity-60"
          >
            <i className="fa-solid fa-house-chimney" />
            {busy ? '…' : "I've Arrived"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#0b1f1b] text-white">
      <header className="flex items-center gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white/10 text-white"
          aria-label="Back"
        >
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div>
          <h1 className="m-0 text-[1.05rem] font-extrabold">Confirm delivery</h1>
          <p className="m-0 text-[0.75rem] font-medium text-white/70">{order?.id || orderId}</p>
        </div>
      </header>

      <div className="mx-4 overflow-hidden rounded-[24px] bg-black shadow-lg ring-1 ring-white/10">
        {cameraOff ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 px-6 py-10 text-center">
            <i className="fa-solid fa-qrcode text-3xl text-white/40" />
            <p className="m-0 text-[0.88rem] font-semibold text-white/80">Camera not available</p>
            <p className="m-0 text-[0.72rem] leading-snug text-white/55">
              Browser blocks camera on http://IP. Open via HTTPS (npm run dev:https) or localhost,
              then allow camera. PIN still works as backup.
            </p>
          </div>
        ) : (
          <div
            id="driver-qr-reader"
            ref={readerRef}
            className="min-h-[280px] w-full overflow-hidden"
          />
        )}
      </div>

      <div className="mt-auto rounded-t-[28px] bg-white px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 text-[#10241f]">
        <p className="mb-1 mt-0 text-[0.84rem] font-semibold text-[#5f7a73]">
          Enter the customer delivery PIN to confirm goods were received
        </p>
        <div className="flex gap-2">
          <input
            value={manualPin}
            onChange={(e) => setManualPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="PIN"
            inputMode="numeric"
            className="h-12 min-w-0 flex-1 rounded-2xl border border-[#d5e2dd] px-4 text-[1rem] font-bold tracking-widest outline-none focus:border-[#073D35]"
          />
          <button
            type="button"
            disabled={busy || manualPin.length < 4}
            onClick={() => confirmDelivery({ pin: manualPin })}
            className="h-12 shrink-0 rounded-2xl border-0 bg-[#073D35] px-5 text-[0.86rem] font-black text-white disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
