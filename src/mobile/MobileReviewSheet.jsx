import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiUrl } from '../utils/data';
import { productImage } from '../utils/format';
import { showTopFloatNotification } from '../utils/notifications';
import { useSheetDrag } from './useSheetDrag';

function Stars({ value, onChange }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="border-0 bg-transparent p-0.5"
          aria-label={`${star} star`}
        >
          <i
            className={`text-[1.65rem] ${
              star <= value ? 'fa-solid fa-star text-[#d4a017]' : 'fa-regular fa-star text-[#d8cfc4]'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

/**
 * Bottom sheet to rate delivery or a single product for an order session.
 * target: { type: 'delivery'|'product', orderId, productId?, title?, image?, driverName? }
 */
export default function MobileReviewSheet({ open, target, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const { sheetStyle, handleProps } = useSheetDrag({ open, onClose });

  useEffect(() => {
    if (!open) return undefined;
    setRating(0);
    setComment('');
    setSaving(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, target?.type, target?.orderId, target?.productId]);

  if (!open || !target) return null;

  const isDelivery = target.type === 'delivery';
  const title = isDelivery ? 'Rate delivery' : 'Rate product';
  const subtitle = isDelivery
    ? `Order #${target.orderId}${target.driverName ? ` · ${target.driverName}` : ''}`
    : target.title || 'Product';
  const thumb = !isDelivery && target.image ? productImage(target.image) : '';

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (rating < 1) {
      showTopFloatNotification('Please select a star rating.', 'danger');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      showTopFloatNotification('Please sign in to leave a rating.', 'danger');
      return;
    }

    setSaving(true);
    try {
      if (target.localOnly) {
        showTopFloatNotification(isDelivery ? 'Delivery rated.' : 'Product rated.');
        await onSubmitted?.(target, rating, comment.trim());
        return;
      }

      const url = isDelivery
        ? apiUrl(`/api/reviews/delivery/${encodeURIComponent(target.orderId)}`)
        : apiUrl('/api/reviews');
      const body = isDelivery
        ? { rating, comment: comment.trim() }
        : {
            productId: target.productId,
            productTitle: target.title || '',
            rating,
            comment: comment.trim(),
          };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        showTopFloatNotification(data.message || 'Could not save rating.', 'danger');
        return;
      }
      showTopFloatNotification(isDelivery ? 'Delivery rated.' : 'Product rated.');
      await onSubmitted?.(target, rating, comment.trim());
    } catch {
      showTopFloatNotification('Connection failed.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center">
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

        <div className="mb-4 min-w-0">
          <h2 className="m-0 text-[1.05rem] font-black text-[#1c140e]">{title}</h2>
          <p className="mb-0 mt-1 truncate text-[0.8rem] font-semibold text-[#8b8178]">{subtitle}</p>
        </div>

        {!isDelivery ? (
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-[#f7f2eb] p-2.5">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#efe7dc]">
              {thumb ? (
                <img src={thumb} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#cbbba8]">
                  <i className="fa-solid fa-couch" />
                </div>
              )}
            </div>
            <p className="m-0 min-w-0 flex-1 text-[0.88rem] font-black text-[#1c140e]">{target.title}</p>
          </div>
        ) : (
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-[#f7f2eb] px-3.5 py-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#6b4228]">
              <i className="fa-solid fa-truck" />
            </span>
            <div className="min-w-0">
              <p className="m-0 text-[0.88rem] font-black text-[#1c140e]">How was delivery?</p>
              <p className="mb-0 mt-0.5 text-[0.75rem] font-semibold text-[#8b8178]">
                Timing, handling, and driver
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Stars value={rating} onChange={setRating} />
          <label className="block">
            <span className="mb-1.5 block text-[0.72rem] font-black uppercase tracking-wide text-[#8b8178]">
              Comment (optional)
            </span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={isDelivery ? 'Anything about the delivery…' : 'How’s the piece in your space?'}
              className="w-full resize-none rounded-2xl border border-[#e8e0d6] bg-white px-4 py-3 text-[0.88rem] font-semibold text-[#1c140e] outline-none placeholder:text-[#b0a498] focus:border-[#6b4228]"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="flex min-h-[50px] w-full items-center justify-center rounded-full border-0 bg-[#6b4228] text-[0.92rem] font-black text-white disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Submit rating'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
