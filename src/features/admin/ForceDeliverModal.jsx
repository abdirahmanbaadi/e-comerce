import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ADM_LABEL,
  ADM_INPUT,
  BTN_PRIMARY,
  BTN_GHOST,
  ADMIN_MODAL_OVERLAY,
  ADMIN_MODAL_PANEL,
  ADMIN_MODAL_CLOSE_BTN,
} from './adminShared.js';

/**
 * Admin confirms force-mark delivered without customer QR / 6-digit code.
 */
export default function ForceDeliverModal({ open, order, busy, onClose, onConfirm }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  if (!open || !order || typeof document === 'undefined' || !document.body) return null;

  const canSubmit = reason.trim().length >= 5 && !busy;

  return createPortal(
    <div
      className={`${ADMIN_MODAL_OVERLAY} z-[1100]`}
      role="presentation"
      onClick={() => {
        if (!busy) onClose?.();
      }}
    >
      <div
        className={`${ADMIN_MODAL_PANEL} max-w-md`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="forceDeliverTitle"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={ADMIN_MODAL_CLOSE_BTN}
          onClick={onClose}
          disabled={busy}
          aria-label="Close"
        >
          ×
        </button>

        <div className="border-b border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
          <p className="mb-1 text-[0.7rem] font-extrabold uppercase tracking-wide text-amber-700 [.admin-dark_&]:text-amber-300">
            Admin override
          </p>
          <h3 id="forceDeliverTitle" className="m-0 text-[1.05rem] font-extrabold text-deepGreen [.admin-dark_&]:text-emerald-300">
            Force mark as delivered?
          </h3>
          <p className="mb-0 mt-2 text-[0.84rem] leading-relaxed text-gray-600 [.admin-dark_&]:text-gray-300">
            This skips the customer QR / 6-digit code for{' '}
            <strong className="font-mono text-deepGreen [.admin-dark_&]:text-emerald-300">{order.id}</strong>
            . Use only if the customer cannot show the code.
          </p>
        </div>

        <div className="px-5 py-4">
          <label className={ADM_LABEL} htmlFor="forceDeliverReason">
            Reason (required)
          </label>
          <textarea
            id="forceDeliverReason"
            className={`${ADM_INPUT} min-h-[96px] resize-y`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Customer phone off; handed over with ID check"
            disabled={busy}
            maxLength={300}
          />
          <p className="mb-0 mt-1.5 text-[0.72rem] font-semibold text-gray-500">
            Min 5 characters. Saved in order activity log.
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
          <button type="button" className={BTN_GHOST} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className={`${BTN_PRIMARY} !bg-gradient-to-br !from-amber-600 !to-amber-700`}
            disabled={!canSubmit}
            onClick={() => onConfirm?.(reason.trim())}
          >
            {busy ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> Saving…
              </>
            ) : (
              <>
                <i className="fa-solid fa-lock-open" aria-hidden="true" /> Confirm override
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
