import { createPortal } from 'react-dom';
import { useEffect } from 'react';

export default function DriverRejectModal({ order, reason, busy, onReasonChange, onClose, onSubmit }) {
  useEffect(() => {
    if (!order) return undefined;
    const onKey = (e) => e.key === 'Escape' && !busy && onClose?.();
    const prev = document.body.style.overflow;
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [order, busy, onClose]);

  if (!order || typeof document === 'undefined' || !document.body) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-deepGreen/55 p-0 backdrop-blur-[4px] sm:items-center sm:p-4"
      role="presentation"
      onClick={() => !busy && onClose?.()}
    >
      <div
        className="animate-sheetUp w-full max-w-md overflow-hidden rounded-t-[28px] bg-white shadow-[0_-24px_70px_rgba(0,0,0,0.28)] sm:rounded-[28px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="driver-reject-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-black/[0.05] px-5 pb-4 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/12 sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="mb-1 font-mono text-[0.72rem] font-extrabold uppercase tracking-wide text-teal">{order.id}</p>
              <h3 id="driver-reject-title" className="mb-0 font-display text-[1.4rem] font-bold text-deepGreen">
                Decline this delivery?
              </h3>
            </div>
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 bg-[#F4EFE6] text-[#555]"
              onClick={onClose}
              disabled={busy}
              aria-label="Close"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="mb-3 text-[0.86rem] leading-relaxed text-[#5c564c]">
            Tell admin why you cannot take <strong className="text-deepGreen">{order.customer}</strong>&apos;s
            order. They will assign another driver.
          </p>

          <textarea
            className="mb-1 w-full resize-none rounded-2xl border-[1.5px] border-black/10 bg-[#F7F4EE] px-3.5 py-3 text-[0.88rem] font-medium outline-none focus:border-deepGreen focus:bg-white focus:shadow-[0_0_0_3px_rgba(7,61,53,0.08)]"
            rows={4}
            placeholder="Example: Too far from my area / vehicle issue / already at capacity"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            disabled={busy}
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-black/[0.05] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
          <button
            type="button"
            className="min-h-[48px] rounded-2xl border border-deepGreen/15 bg-white px-4 text-[0.88rem] font-extrabold text-deepGreen disabled:opacity-60"
            onClick={onClose}
            disabled={busy}
          >
            Keep order
          </button>
          <button
            type="button"
            className="min-h-[48px] rounded-2xl border-0 bg-gradient-to-br from-deepGreen to-teal px-4 text-[0.88rem] font-extrabold text-white disabled:opacity-60"
            disabled={busy}
            onClick={onSubmit}
          >
            {busy ? 'Sending…' : 'Send decline reason'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
