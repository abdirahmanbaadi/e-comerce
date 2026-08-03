import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { pickNextDriverTab } from './driverShared';

export default function DeliveryCompleteModal({ order, tabCounts, onClose, onGoToTab }) {
  useEffect(() => {
    if (!order) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    const prev = document.body.style.overflow;
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [order, onClose]);

  if (!order || typeof document === 'undefined' || !document.body) return null;

  const nextTab = pickNextDriverTab(tabCounts);
  const hasPending = tabCounts.pending > 0;
  const hasActive = tabCounts.active > 0;

  let nextHint = 'View your completed deliveries in Done.';
  if (hasPending) nextHint = 'You have new delivery requests waiting for your response.';
  else if (hasActive) nextHint = 'You still have active deliveries to finish.';
  else nextHint = 'No more active work right now. Admin may assign new orders soon.';

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-deepGreen/55 p-0 backdrop-blur-[4px] sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="animate-sheetUp w-full max-w-md overflow-hidden rounded-t-[28px] bg-white shadow-[0_-24px_70px_rgba(0,0,0,0.28)] sm:rounded-[28px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delivery-complete-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal to-deepGreen px-5 pb-8 pt-4 text-center text-white">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/35 sm:hidden" />
          <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-3xl text-white backdrop-blur-sm">
            <i className="fa-solid fa-circle-check" aria-hidden="true" />
          </span>
          <h3 id="delivery-complete-title" className="mb-1 font-display text-[1.55rem] font-bold">
            Delivery completed!
          </h3>
          <p className="mb-0 font-mono text-[0.72rem] font-bold text-gold">{order.id}</p>
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
        </div>

        <div className="px-5 py-4">
          <div className="mb-4 rounded-2xl bg-[#F7F4EE] p-3.5 text-[0.84rem]">
            <p className="mb-1 font-extrabold text-deepGreen">{order.customer}</p>
            <p className="mb-0 text-[#5c564c]">{order.product}</p>
            <p className="mb-0 mt-2 text-[0.78rem] font-semibold text-[#8b8478]">{nextHint}</p>
          </div>

          <div className="flex flex-col gap-2 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
            {hasPending && (
              <button
                type="button"
                className="min-h-[48px] rounded-2xl border-0 bg-gradient-to-br from-amber-500 to-amber-600 text-[0.88rem] font-extrabold text-white"
                onClick={() => onGoToTab('pending')}
              >
                View new requests ({tabCounts.pending})
              </button>
            )}
            {hasActive && (
              <button
                type="button"
                className="min-h-[48px] rounded-2xl border-0 bg-gradient-to-br from-deepGreen to-teal text-[0.88rem] font-extrabold text-white"
                onClick={() => onGoToTab('active')}
              >
                Continue active ({tabCounts.active})
              </button>
            )}
            <button
              type="button"
              className={`min-h-[48px] rounded-2xl text-[0.88rem] font-extrabold ${
                hasPending || hasActive
                  ? 'border border-deepGreen/15 bg-white text-deepGreen'
                  : 'border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
              }`}
              onClick={() => onGoToTab(hasPending || hasActive ? 'done' : nextTab)}
            >
              {hasPending || hasActive ? `View in Done (${tabCounts.done})` : 'View completed deliveries'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
