import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * Driver scans customer QR or enters the 6-digit backup code.
 */
export default function DriverQrScanModal({ open, order, busy, onClose, onConfirm }) {
  const [manualCode, setManualCode] = useState('');
  const [pin, setPin] = useState('');
  const [mode, setMode] = useState('scan'); // 'scan' | 'pin'
  const [scanError, setScanError] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const handledRef = useRef(false);
  const onConfirmRef = useRef(onConfirm);
  const readerId = 'driver-qr-reader';

  useEffect(() => {
    onConfirmRef.current = onConfirm;
  }, [onConfirm]);

  useEffect(() => {
    if (!open) {
      handledRef.current = false;
      setManualCode('');
      setPin('');
      setMode('scan');
      setScanError('');
      return undefined;
    }

    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose?.();
    };
    const prev = document.body.style.overflow;
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, busy, onClose]);

  useEffect(() => {
    if (!open) return undefined;

    if (mode !== 'scan') {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner?.isScanning) {
        scanner.stop().catch(() => {});
      }
      return undefined;
    }

    let cancelled = false;
    let html5Qr;

    const start = async () => {
      setScanning(true);
      setScanError('');
      try {
        html5Qr = new Html5Qrcode(readerId);
        scannerRef.current = html5Qr;
        await html5Qr.start(
          { facingMode: 'environment' },
          { fps: 8, qrbox: { width: 240, height: 240 } },
          async (decoded) => {
            if (handledRef.current || cancelled) return;
            handledRef.current = true;
            try {
              await html5Qr.stop();
            } catch {
              /* ignore */
            }
            onConfirmRef.current?.({ payload: decoded });
          },
          () => {}
        );
      } catch (err) {
        if (!cancelled) {
          setScanError(
            err?.message?.includes('Permission')
              ? 'Camera permission denied. Use the 6-digit code instead.'
              : 'Camera unavailable. Use the 6-digit code instead.'
          );
          setMode('pin');
        }
      } finally {
        if (!cancelled) setScanning(false);
      }
    };

    start();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner?.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, [open, mode]);

  if (!open || !order || typeof document === 'undefined' || !document.body) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-deepGreen/55 p-0 backdrop-blur-[4px] sm:items-center sm:p-4"
      role="presentation"
      onClick={() => {
        if (!busy) onClose?.();
      }}
    >
      <div
        className="animate-sheetUp flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-24px_70px_rgba(0,0,0,0.28)] sm:rounded-[28px]"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden border-b border-black/[0.05] bg-gradient-to-br from-deepGreen via-[#0A5446] to-teal px-5 pb-5 pt-3 text-white">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/35 sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="m-0 text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-gold">Confirm handoff</p>
              <h3 className="m-0 mt-1 font-display text-[1.45rem] font-bold leading-tight">Scan delivery QR</h3>
              <p className="mb-0 mt-1.5 text-[0.78rem] font-semibold leading-relaxed text-white/75">
                Ask {order.customer} to show QR or 6-digit for{' '}
                <span className="font-mono text-white">{order.id}</span>
              </p>
            </div>
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 bg-white/15 text-white disabled:opacity-50"
              onClick={onClose}
              disabled={busy}
              aria-label="Close"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <div className="flex rounded-2xl border border-black/[0.06] bg-[#F7F4EE] p-1">
            <button
              type="button"
              className={`flex-1 rounded-xl border-0 py-2.5 text-[0.8rem] font-extrabold transition ${
                mode === 'scan' ? 'bg-white text-deepGreen shadow-sm' : 'bg-transparent text-[#8b8478]'
              }`}
              onClick={() => setMode('scan')}
              disabled={busy}
            >
              <i className="fa-solid fa-camera me-1.5" /> Scan QR
            </button>
            <button
              type="button"
              className={`flex-1 rounded-xl border-0 py-2.5 text-[0.8rem] font-extrabold transition ${
                mode === 'pin' ? 'bg-white text-deepGreen shadow-sm' : 'bg-transparent text-[#8b8478]'
              }`}
              onClick={() => setMode('pin')}
              disabled={busy}
            >
              <i className="fa-solid fa-hashtag me-1.5" /> 6-digit
            </button>
          </div>

          {mode === 'scan' && (
            <>
              <div id={readerId} className="overflow-hidden rounded-2xl bg-black/5 ring-1 ring-black/[0.04]" />
              {scanning && (
                <p className="text-center text-[0.78rem] font-semibold text-[#7a7468]">Starting camera…</p>
              )}
              {scanError && <p className="rounded-xl bg-red-50 px-3 py-2 text-[0.8rem] font-semibold text-[#7a2e28]">{scanError}</p>}
              <div>
                <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-wide text-[#8b8478]">
                  Or paste QR text
                </label>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-black/10 bg-white px-3.5 py-3 text-[0.84rem] font-semibold outline-none focus:border-deepGreen focus:shadow-[0_0_0_3px_rgba(7,61,53,0.08)]"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="MMF1.…"
                  disabled={busy}
                />
              </div>
            </>
          )}

          {mode === 'pin' && (
            <div>
              <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-wide text-[#8b8478]">
                Customer 6-digit code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="w-full rounded-2xl border border-black/10 bg-[#F7F4EE] px-3 py-4 text-center font-mono text-[1.85rem] font-extrabold tracking-[0.4em] text-deepGreen outline-none focus:border-deepGreen focus:bg-white focus:shadow-[0_0_0_3px_rgba(7,61,53,0.08)]"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                disabled={busy}
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-black/[0.05] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
            className="min-h-[48px] flex-1 rounded-2xl border-0 bg-gradient-to-br from-deepGreen to-teal text-[0.86rem] font-extrabold text-white shadow-md disabled:opacity-60"
            disabled={busy || (mode === 'pin' ? pin.length !== 6 : !manualCode.trim())}
            onClick={() => {
              if (mode === 'pin') onConfirm?.({ pin });
              else onConfirm?.({ payload: manualCode.trim() });
            }}
          >
            {busy ? 'Confirming…' : mode === 'pin' ? 'Confirm code' : 'Confirm QR'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
