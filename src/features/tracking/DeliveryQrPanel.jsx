import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { apiUrl } from '../../utils/data';

function looksMasked(value) {
  return /[*•xX]{2,}/.test(String(value || '')) || String(value || '').includes('…');
}

/**
 * Customer delivery QR + optional 6-digit backup code.
 */
export default function DeliveryQrPanel({
  orderId,
  phone = '',
  deliveryQrPending = false,
  initialPayload = '',
  initialPin = '',
  className = '',
  compact = false,
}) {
  const [payload, setPayload] = useState(initialPayload || '');
  const [pin, setPin] = useState(initialPin || '');
  const [dataUrl, setDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifyPhone, setVerifyPhone] = useState('');
  const [needsPhone, setNeedsPhone] = useState(false);
  const [mode, setMode] = useState('qr'); // 'qr' | 'pin'

  useEffect(() => {
    if (phone && !looksMasked(phone)) setVerifyPhone(phone);
  }, [phone]);

  useEffect(() => {
    if (initialPayload) setPayload(initialPayload);
  }, [initialPayload]);

  useEffect(() => {
    if (initialPin) setPin(initialPin);
  }, [initialPin]);

  useEffect(() => {
    if (!payload) {
      setDataUrl('');
      return undefined;
    }
    let cancelled = false;
    QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      color: { dark: '#073D35', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  useEffect(() => {
    if (!orderId || !deliveryQrPending) {
      if (!initialPayload) {
        setPayload('');
        setPin('');
        setError('');
      }
      return undefined;
    }

    if (initialPayload && initialPin) return undefined;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        if (verifyPhone && !looksMasked(verifyPhone)) params.set('phone', verifyPhone);
        const qs = params.toString() ? `?${params}` : '';
        const res = await fetch(apiUrl(`/api/orders/${encodeURIComponent(orderId)}/delivery-qr${qs}`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (cancelled) return;
        if (!data.success || !data.payload) {
          const mustVerify = res.status === 403 || /phone/i.test(data.message || '');
          setNeedsPhone(mustVerify || !verifyPhone || looksMasked(verifyPhone));
          setError(data.message || 'QR not available yet.');
          setPayload('');
          setPin('');
          return;
        }
        setNeedsPhone(false);
        setPayload(data.payload);
        setPin(data.pin || '');
      } catch {
        if (!cancelled) {
          setNeedsPhone(true);
          setError('Could not load delivery QR. Check your connection.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [orderId, deliveryQrPending, verifyPhone, initialPayload, initialPin]);

  if (!deliveryQrPending && !loading && !payload) {
    return null;
  }

  return (
    <div className={className}>
      {!compact && (
        <div className="mb-3 text-center">
          <p className="m-0 text-[0.7rem] font-extrabold uppercase tracking-[1.4px] text-emerald-700">
            Muuji driver-ka
          </p>
          <h3 className="m-0 mt-1 text-[1.05rem] font-extrabold text-deepGreen">Delivery confirmation</h3>
          <p className="mb-0 mt-1 text-[0.8rem] font-semibold text-[#5d6868]">
            Tus QR-ka ama 6-digit code-ka driver-ka.
          </p>
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        {(needsPhone || (Boolean(error) && !payload) || (!payload && !loading)) && (
          <div className="w-full">
            <label className="mb-1 block text-[0.72rem] font-bold uppercase tracking-wide text-gray-500">
              Geli telefoonka checkout-ka
            </label>
            <input
              type="tel"
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[0.88rem] font-semibold outline-none focus:border-deepGreen"
              value={verifyPhone}
              onChange={(e) => setVerifyPhone(e.target.value)}
              placeholder="tusaale: 0612345678"
            />
          </div>
        )}

        {loading && (
          <p className="text-[0.84rem] font-semibold text-gray-500">
            <i className="fa-solid fa-spinner fa-spin me-2" /> Loading…
          </p>
        )}

        {error && !loading && !payload && (
          <p className="text-center text-[0.84rem] font-semibold text-[#7a2e28]">{error}</p>
        )}

        {payload && !loading && (
          <>
            <div className="flex w-full rounded-2xl border border-black/[0.06] bg-[#F7F4EE] p-1">
              <button
                type="button"
                className={`flex-1 rounded-xl border-0 py-2.5 text-[0.8rem] font-extrabold transition ${
                  mode === 'qr' ? 'bg-white text-deepGreen shadow-sm' : 'bg-transparent text-[#8b8478]'
                }`}
                onClick={() => setMode('qr')}
              >
                <i className="fa-solid fa-qrcode me-1.5" />
                QR code
              </button>
              <button
                type="button"
                className={`flex-1 rounded-xl border-0 py-2.5 text-[0.8rem] font-extrabold transition ${
                  mode === 'pin' ? 'bg-white text-deepGreen shadow-sm' : 'bg-transparent text-[#8b8478]'
                }`}
                onClick={() => setMode('pin')}
              >
                <i className="fa-solid fa-hashtag me-1.5" />
                6-digit code
              </button>
            </div>

            {mode === 'qr' && dataUrl && (
              <img
                src={dataUrl}
                alt="Delivery confirmation QR"
                className="h-[280px] w-[280px] max-w-full rounded-2xl bg-white p-3 shadow-[0_12px_32px_rgba(7,61,53,0.12)] ring-1 ring-black/[0.04]"
              />
            )}

            {mode === 'pin' && (
              <div className="w-full rounded-[22px] border border-deepGreen/10 bg-gradient-to-br from-[#F7F4EE] to-white px-4 py-7 text-center shadow-sm">
                <p className="m-0 text-[0.72rem] font-bold uppercase tracking-wide text-teal">
                  Delivery code
                </p>
                <p className="m-0 mt-2 font-mono text-[2.4rem] font-extrabold tracking-[0.35em] text-deepGreen">
                  {pin || '——————'}
                </p>
                <p className="mb-0 mt-2 text-[0.78rem] font-semibold text-[#8b8478]">
                  Akhri code-kan driver-ka haddii camera-ku fashilmo.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function DeliveryQrModal({ open, onClose, orderId, phone, initialPayload = '', initialPin = '' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    const prev = document.body.style.overflow;
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined' || !document.body) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1080] flex items-end justify-center bg-deepGreen/55 p-0 backdrop-blur-[4px] sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="animate-sheetUp my-0 flex max-h-[94dvh] w-full max-w-[420px] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-24px_70px_rgba(0,0,0,0.28)] sm:my-auto sm:rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deliveryQrModalTitle"
      >
        <div className="relative overflow-hidden border-b border-black/[0.05] bg-gradient-to-br from-deepGreen via-[#0A5446] to-teal px-5 pb-5 pt-3 text-white">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/35 sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="m-0 text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-gold">Muuji driver-ka</p>
              <h3 id="deliveryQrModalTitle" className="m-0 mt-1 font-display text-[1.55rem] font-bold leading-tight">
                Delivery QR
              </h3>
              <p className="mb-0 mt-1 text-[0.78rem] font-semibold text-white/75">QR code ama 6-digit PIN</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white/15 text-white backdrop-blur-sm"
              aria-label="Close"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <DeliveryQrPanel
            orderId={orderId}
            phone={phone}
            deliveryQrPending
            initialPayload={initialPayload}
            initialPin={initialPin}
            compact
          />
        </div>

        <div className="border-t border-black/[0.05] px-5 py-3.5 pb-[max(0.9rem,env(safe-area-inset-bottom))] text-center">
          <p className="m-0 text-[0.78rem] font-semibold text-[#7a7468]">
            Tus QR-ka ama akhri 6-digit code-ka driver-ka marka uu yimaado.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
