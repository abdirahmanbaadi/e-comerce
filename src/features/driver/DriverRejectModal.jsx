import { createPortal } from 'react-dom';

export default function DriverRejectModal({ order, reason, busy, onReasonChange, onClose, onSubmit }) {
  if (!order || typeof document === 'undefined' || !document.body) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-deepGreen/45 p-4 backdrop-blur-[3px] sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="animate-productModalIn w-full max-w-md rounded-[20px] bg-white p-5 shadow-[0_25px_60px_rgba(0,0,0,0.22)] sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="driver-reject-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="mb-1 font-mono text-[0.72rem] font-extrabold uppercase tracking-wide text-teal">
              {order.id}
            </p>
            <h3 id="driver-reject-title" className="mb-0 text-[1.05rem] font-extrabold text-deepGreen">
              Decline this delivery?
            </h3>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-gray-100 text-lg text-gray-600"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <p className="mb-3 text-[0.86rem] leading-relaxed text-gray-600">
          Tell admin why you cannot take <strong>{order.customer}</strong>&apos;s order. They will assign another
          driver.
        </p>

        <textarea
          className="mb-4 w-full resize-none rounded-xl border-[1.5px] border-black/10 bg-[#FAFBFB] px-3.5 py-3 text-[0.88rem] font-medium outline-none focus:border-deepGreen focus:shadow-[0_0_0_3px_rgba(7,61,53,0.08)]"
          rows={4}
          placeholder="Example: Too far from my area / vehicle issue / already at capacity"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
        />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="min-h-[46px] rounded-xl border border-deepGreen/15 bg-white px-4 text-[0.88rem] font-extrabold text-deepGreen"
            onClick={onClose}
            disabled={busy}
          >
            Keep order
          </button>
          <button
            type="button"
            className="min-h-[46px] rounded-xl border-0 bg-gradient-to-br from-deepGreen to-teal px-4 text-[0.88rem] font-extrabold text-white disabled:opacity-60"
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
