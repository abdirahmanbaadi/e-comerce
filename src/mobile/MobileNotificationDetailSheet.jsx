import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { productImage } from '../utils/format';
import { showTopFloatNotification } from '../utils/notifications';
import {
  getNotificationCouponCode,
  getNotificationCta,
  getNotificationDetailText,
  getNotificationOrderId,
  getNotificationProductImage,
  getNotificationProductName,
  getNotificationTitle,
  getNotificationTypeTone,
} from '../utils/notificationTypes';
import { useSheetDrag } from './useSheetDrag';

async function copyText(value, successMessage) {
  const text = String(value || '').trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showTopFloatNotification(successMessage);
  } catch {
    showTopFloatNotification('Could not copy.', 'danger');
  }
}

function CopyRow({ label, value, successMessage }) {
  if (!value) return null;
  return (
    <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-[#f7f2eb] px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="mb-0.5 mt-0 text-[0.65rem] font-bold uppercase tracking-wide text-[#9a8d80]">
          {label}
        </p>
        <p className="mb-0 truncate text-[0.82rem] font-black text-[#6b4228]">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => copyText(value, successMessage)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-white text-[#6b4228] shadow-sm ring-1 ring-[#eadfce]"
        aria-label={`Copy ${label}`}
      >
        <i className="fa-regular fa-copy text-[0.85rem]" />
      </button>
    </div>
  );
}

export default function MobileNotificationDetailSheet({ open, item, onClose }) {
  const navigate = useNavigate();
  const { sheetStyle, handleProps } = useSheetDrag({ open, onClose });

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !item) return null;

  const orderId = getNotificationOrderId(item);
  const couponCode = getNotificationCouponCode(item);
  const productName = getNotificationProductName(item);
  const thumbSrc = getNotificationProductImage(item);
  const thumb = thumbSrc ? productImage(thumbSrc) : '';
  const meta = getNotificationTypeTone(item.type);
  const action = getNotificationCta(item, 'app');
  const title = getNotificationTitle(item);
  const detailText = getNotificationDetailText(item);

  const goAction = () => {
    onClose?.();
    navigate(action.path);
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 border-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="mmf-sheet relative z-[1] w-full max-w-md overflow-hidden rounded-t-[28px] bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl"
        style={sheetStyle}
      >
        <div
          className="flex cursor-grab flex-col items-center pb-1 pt-3 active:cursor-grabbing"
          {...handleProps}
          aria-label="Drag sheet"
          role="presentation"
        >
          <div className="mb-3 h-1.5 w-12 rounded-full bg-[#d8cfc4]" />
        </div>

        {thumb ? (
          <div className="mb-4 overflow-hidden rounded-[20px] bg-[#efe6da] ring-1 ring-[#eadfce]">
            <img
              src={thumb}
              alt={productName || ''}
              className="aspect-[16/10] w-full object-cover"
            />
          </div>
        ) : null}

        <div className="mb-4 flex items-start gap-3">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${meta.tone}`}
          >
            <i className={`${meta.iconStyle} ${meta.icon} text-[1.15rem]`} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-[1.05rem] font-black text-[#1c140e]">{title}</h2>
            <p className="mb-0 mt-1 text-[0.75rem] font-semibold text-[#8b8178]">{item.time}</p>
          </div>
        </div>

        <p className="mb-4 mt-0 text-[0.9rem] font-medium leading-relaxed text-[#4a4038]">
          {detailText}
        </p>

        {productName ? (
          <p className="mb-3 mt-0 text-[0.78rem] font-bold text-[#8b8178]">
            {productName}
          </p>
        ) : null}

        <CopyRow
          label="Order ID"
          value={orderId}
          successMessage="Order ID copied."
        />
        <CopyRow
          label="Coupon code"
          value={couponCode}
          successMessage="Coupon code copied."
        />

        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[48px] flex-1 items-center justify-center rounded-full border border-[#eadfce] bg-white text-[0.86rem] font-black text-[#6b4228]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={goAction}
            className="flex min-h-[48px] flex-[1.35] items-center justify-center rounded-full border-0 bg-[#6b4228] text-[0.86rem] font-black text-white"
          >
            {action.label}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
