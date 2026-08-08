import { useNavigate } from 'react-router-dom';
import { productImage } from '../../utils/format';
import {
  getNotificationCouponCode,
  getNotificationCta,
  getNotificationDetailText,
  getNotificationOrderId,
  getNotificationProductImage,
  getNotificationProductName,
  getNotificationTitle,
  getNotificationTypeTone,
} from '../../utils/notificationTypes';
import { showTopFloatNotification } from '../../utils/notifications';

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
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#ebe4da] bg-[#faf7f2] px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="mb-0.5 mt-0 text-[0.62rem] font-bold uppercase tracking-[0.06em] text-[#9a8d80]">
          {label}
        </p>
        <p className="mb-0 truncate font-mono text-[0.84rem] font-bold text-[#2b3a30]">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => copyText(value, successMessage)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-0 bg-white text-[#4a6454] shadow-sm ring-1 ring-[#eadfce] transition hover:bg-[#f3eee6]"
        aria-label={`Copy ${label}`}
      >
        <i className="fa-regular fa-copy text-[0.82rem]" />
      </button>
    </div>
  );
}

/**
 * Inline detail pane for Profile Notifications split view (no overlay).
 */
export function NotificationDetailPane({
  item,
  onBack,
  showBack = false,
  emptyLabel = 'Select a notification',
}) {
  const navigate = useNavigate();

  if (!item) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-8 text-center">
        <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3eee6] text-[#8b8178]">
          <i className="fa-regular fa-bell text-[1.35rem]" />
        </span>
        <p className="m-0 text-[0.95rem] font-bold text-[#2b3a30]">{emptyLabel}</p>
        <p className="mb-0 mt-1.5 max-w-[260px] text-[0.8rem] font-medium leading-relaxed text-[#8b8178]">
          Choose an item from the list to read the full update, copy IDs, or open the related page.
        </p>
      </div>
    );
  }

  const orderId = getNotificationOrderId(item);
  const couponCode = getNotificationCouponCode(item);
  const productName = getNotificationProductName(item);
  const thumbSrc = getNotificationProductImage(item);
  const thumb = thumbSrc ? productImage(thumbSrc) : '';
  const meta = getNotificationTypeTone(item.type);
  const action = getNotificationCta(item, 'web');
  const title = getNotificationTitle(item);
  const detailText = getNotificationDetailText(item);

  const goAction = () => {
    if (action.path) navigate(action.path);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-start gap-3 border-b border-[#efe8df] px-5 pb-4 pt-5">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-[#f3eee6] text-[#5c4a3a]"
            aria-label="Back to list"
          >
            <i className="fa-solid fa-chevron-left text-[0.8rem]" />
          </button>
        ) : null}
        <span
          className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${meta.tone}`}
        >
          <i className={`${meta.iconStyle} ${meta.icon} text-[1.05rem]`} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="mb-1 mt-0 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-[#9a8d80]">
            Notification
          </p>
          <h2 className="m-0 text-[1.15rem] font-black leading-snug text-[#1c140e]">{title}</h2>
          {item.time ? (
            <p className="mb-0 mt-1.5 text-[0.75rem] font-semibold text-[#8b8178]">{item.time}</p>
          ) : null}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        {thumb ? (
          <div className="mb-5 overflow-hidden rounded-2xl bg-[#efe6da] ring-1 ring-[#eadfce]">
            <img
              src={thumb}
              alt={productName || ''}
              className="aspect-[16/10] w-full object-cover"
            />
          </div>
        ) : null}

        <p className="mb-0 mt-0 text-[0.95rem] font-medium leading-relaxed text-[#4a4038]">
          {detailText}
        </p>

        {productName ? (
          <p className="mb-0 mt-3 text-[0.8rem] font-bold text-[#8b8178]">{productName}</p>
        ) : null}

        {(orderId || couponCode) ? (
          <div className="mt-5 space-y-2.5">
            <CopyRow label="Order ID" value={orderId} successMessage="Order ID copied." />
            <CopyRow label="Coupon code" value={couponCode} successMessage="Coupon code copied." />
          </div>
        ) : null}
      </div>

      <footer className="shrink-0 border-t border-[#efe8df] bg-[#fcfaf7] px-5 py-4">
        <button
          type="button"
          onClick={goAction}
          className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full border-0 bg-deepGreen text-[0.86rem] font-black text-white transition hover:brightness-110"
        >
          <span>{action.label}</span>
          <i className="fa-solid fa-arrow-right text-[0.72rem] opacity-90" />
        </button>
      </footer>
    </div>
  );
}

/** @deprecated Overlay drawer — Profile now uses split view with NotificationDetailPane. */
export default function WebNotificationDetailPanel() {
  return null;
}
