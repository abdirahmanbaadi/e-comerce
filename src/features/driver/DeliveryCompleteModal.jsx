import { createPortal } from 'react-dom';
import { pickNextDriverTab } from './driverShared';

export default function DeliveryCompleteModal({ order, tabCounts, onClose, onGoToTab }) {
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
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-deepGreen/45 p-4 backdrop-blur-[3px] sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="animate-productModalIn w-full max-w-md rounded-[20px] bg-white p-5 shadow-[0_25px_60px_rgba(0,0,0,0.22)] sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delivery-complete-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 text-center">
          <span className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
            <i className="fa-solid fa-circle-check" aria-hidden="true" />
          </span>
          <h3 id="delivery-complete-title" className="mb-1 text-[1.15rem] font-extrabold text-deepGreen">
            Delivery completed!
          </h3>
          <p className="mb-0 font-mono text-[0.72rem] font-bold text-teal">{order.id}</p>
        </div>

        <div className="mb-4 rounded-xl bg-softBg/90 p-3.5 text-[0.84rem]">
          <p className="mb-1 font-extrabold text-deepGreen">{order.customer}</p>
          <p className="mb-0 text-gray-600">{order.product}</p>
          <p className="mb-0 mt-2 text-[0.78rem] font-semibold text-gray-500">{nextHint}</p>
        </div>

        <div className="flex flex-col gap-2">
          {hasPending && (
            <button
              type="button"
              className="min-h-[46px] rounded-xl border-0 bg-gradient-to-br from-amber-500 to-amber-600 text-[0.88rem] font-extrabold text-white"
              onClick={() => onGoToTab('pending')}
            >
              View new requests ({tabCounts.pending})
            </button>
          )}
          {hasActive && (
            <button
              type="button"
              className="min-h-[46px] rounded-xl border-0 bg-gradient-to-br from-deepGreen to-teal text-[0.88rem] font-extrabold text-white"
              onClick={() => onGoToTab('active')}
            >
              Continue active ({tabCounts.active})
            </button>
          )}
          <button
            type="button"
            className={`min-h-[46px] rounded-xl text-[0.88rem] font-extrabold ${
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
    </div>,
    document.body
  );
}
