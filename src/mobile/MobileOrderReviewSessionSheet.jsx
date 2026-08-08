import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { productImage } from '../utils/format';
import { useSheetDrag } from './useSheetDrag';

const STATUS_CHIP = {
  missing: { label: 'Rate', className: 'bg-[#6b4228] text-white' },
  done: { label: 'Rated', className: 'bg-[#e8f7ee] text-[#087443]' },
};

function StarRow({ rating }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[0.72rem]">
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={`${star <= rating ? 'fa-solid text-[#d4a017]' : 'fa-regular text-[#d8cfc4]'} fa-star`}
        />
      ))}
    </span>
  );
}

function ProgressBar({ rated, total }) {
  const pct = total > 0 ? Math.round((rated / total) * 100) : 0;
  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center justify-between text-[0.72rem] font-bold text-[#8b8178]">
        <span>
          {rated} of {total} rated
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#efe7dc]">
        <div className="h-full rounded-full bg-[#6b4228] transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DriverAvatar({ name, avatar }) {
  const [broken, setBroken] = useState(false);
  const src = avatar && !broken ? productImage(avatar) : '';
  const initials =
    String(name || 'D')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join('') || 'D';

  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#efe7dc] text-[0.95rem] font-black text-[#6b4228] ring-2 ring-white">
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
      ) : (
        initials
      )}
    </span>
  );
}

/** Bottom sheet: driver contact + products to rate for one order session. */
export default function MobileOrderReviewSessionSheet({
  open,
  session,
  onClose,
  onRateDelivery,
  onRateProduct,
}) {
  const { sheetStyle, handleProps } = useSheetDrag({ open, onClose });

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !session) return null;

  const delivery = session.delivery || {};
  const driverName = delivery.driverName || 'Delivery driver';
  const driverPhone = delivery.driverPhone || '';
  const driverAvatar = delivery.driverAvatar || '';

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 border-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="mmf-sheet relative z-[1] flex w-full max-w-md flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl"
        style={sheetStyle}
      >
        <div
          className="flex shrink-0 cursor-grab flex-col items-center px-5 pb-1 pt-3 active:cursor-grabbing"
          {...handleProps}
          aria-label="Drag sheet"
          role="presentation"
        >
          <div className="mb-3 h-1.5 w-12 rounded-full bg-[#d8cfc4]" />
        </div>

        <div className="shrink-0 px-5 pb-2">
          <div className="min-w-0">
            <h2 className="m-0 truncate text-[1.05rem] font-black text-[#1c140e]">#{session.orderId}</h2>
            <p className="mb-0 mt-0.5 text-[0.78rem] font-semibold text-[#8b8178]">Rate delivery & products</p>
          </div>
          <ProgressBar rated={session.progress?.rated || 0} total={session.progress?.total || 1} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="mb-3 mt-3 flex items-center gap-3 rounded-2xl bg-[#f7f2eb] p-3">
            <DriverAvatar name={driverName} avatar={driverAvatar} />
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[0.72rem] font-black uppercase tracking-wide text-[#8b8178]">Driver</p>
              <p className="mb-0 mt-0.5 truncate text-[0.95rem] font-black text-[#1c140e]">{driverName}</p>
              {driverPhone ? (
                <a
                  href={`tel:${String(driverPhone).replace(/\s/g, '')}`}
                  className="mt-0.5 inline-flex items-center gap-1.5 text-[0.8rem] font-bold text-[#6b4228] no-underline"
                >
                  <i className="fa-solid fa-phone text-[0.7rem]" />
                  {driverPhone}
                </a>
              ) : (
                <p className="mb-0 mt-0.5 text-[0.78rem] font-semibold text-[#9a8d82]">No phone on file</p>
              )}
            </div>
            {delivery.status === 'missing' ? (
              <button
                type="button"
                onClick={() => onRateDelivery?.(session)}
                className={`shrink-0 rounded-full border-0 px-3 py-1.5 text-[0.72rem] font-black ${STATUS_CHIP.missing.className}`}
              >
                Rate
              </button>
            ) : (
              <div className="shrink-0 text-right">
                <span
                  className={`inline-block rounded-full px-2.5 py-1 text-[0.68rem] font-black ${STATUS_CHIP.done.className}`}
                >
                  Rated
                </span>
                {delivery.rating ? (
                  <p className="mb-0 mt-1">
                    <StarRow rating={delivery.rating} />
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <p className="mb-2 mt-0 text-[0.72rem] font-black uppercase tracking-wide text-[#8b8178]">Products</p>
          <ul className="m-0 list-none divide-y divide-[#f0ebe4] overflow-hidden rounded-2xl bg-white ring-1 ring-[#eee7df]">
            {(session.products || []).map((product) => {
              const isMissing = product.status === 'missing';
              const chip = isMissing ? STATUS_CHIP.missing : STATUS_CHIP.done;
              const img = product.image ? productImage(product.image) : '';
              return (
                <li key={product.productId} className="flex items-center gap-3 px-3 py-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#efe7dc]">
                    {img ? (
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#cbbba8]">
                        <i className="fa-solid fa-couch text-[0.85rem]" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-[0.86rem] font-black text-[#1c140e]">{product.title}</p>
                    {!isMissing && product.rating ? (
                      <p className="mb-0 mt-0.5">
                        <StarRow rating={product.rating} />
                      </p>
                    ) : (
                      <p className="mb-0 mt-0.5 text-[0.72rem] font-semibold text-[#8b8178]">Product</p>
                    )}
                  </div>
                  {isMissing ? (
                    <button
                      type="button"
                      onClick={() => onRateProduct?.(session, product)}
                      className={`rounded-full border-0 px-3 py-1.5 text-[0.72rem] font-black ${chip.className}`}
                    >
                      Rate
                    </button>
                  ) : (
                    <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-black ${chip.className}`}>
                      Rated
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>,
    document.body
  );
}
