import {
  buildTelHref,
  extractDistrict,
  getDriverOrderMeta,
  getDriverOrderPhase,
  getDriverTimelineSteps,
} from './driverShared';

function Timeline({ phase }) {
  const steps = getDriverTimelineSteps(phase);
  if (phase === 'pending') return null;

  return (
    <div className="mb-4 flex items-center gap-1">
      {steps.map((step, idx) => (
        <div key={step.key} className="flex flex-1 items-center gap-1">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[0.65rem] ${
                step.state === 'done'
                  ? 'bg-emerald-500 text-white'
                  : step.state === 'current'
                    ? 'bg-deepGreen text-white ring-4 ring-deepGreen/15'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              <i className={`fa-solid ${step.icon}`} aria-hidden="true" />
            </span>
            <span
              className={`max-w-full truncate text-center text-[0.58rem] font-bold leading-tight ${
                step.state === 'idle' ? 'text-gray-400' : 'text-deepGreen'
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`mb-4 h-0.5 flex-1 rounded-full ${step.state === 'done' ? 'bg-emerald-400' : 'bg-gray-200'}`}
              aria-hidden="true"
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function DriverOrderCard({
  order,
  busy,
  onAccept,
  onDecline,
  onStartDelivery,
  onMarkArrived,
  onMarkDelivered,
}) {
  const phase = getDriverOrderPhase(order);
  const meta = getDriverOrderMeta(order);
  const telHref = buildTelHref(order.phone);
  const mapsQuery = encodeURIComponent(order.address || '');
  const district = extractDistrict(order.address);
  const deliverySlot = [order.deliveryDate, order.deliveryTime].filter(Boolean).join(' · ');

  return (
    <article
      className={`animate-cardRise overflow-hidden rounded-[18px] border border-deepGreen/[0.06] bg-white shadow-[0_10px_28px_rgba(7,61,53,0.07)] ${meta.border} border-l-4`}
    >
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1 font-mono text-[0.72rem] font-extrabold text-teal">{order.id}</p>
            <h3 className="mb-0 truncate text-[1.02rem] font-extrabold text-deepGreen">{order.customer}</h3>
            <p className="mb-0 mt-0.5 text-[0.78rem] font-semibold text-gray-500">{district}</p>
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-extrabold ${meta.cls}`}>
            <i className={`fa-solid ${meta.icon}`} aria-hidden="true" />
            {meta.shortLabel}
          </span>
        </div>

        <div className="mb-3 space-y-2 rounded-xl bg-softBg/80 p-3">
          <p className="mb-0 flex items-start gap-2 text-[0.84rem] font-semibold leading-snug text-gray-700">
            <i className="fa-solid fa-location-dot mt-0.5 shrink-0 text-gold" aria-hidden="true" />
            <span>{order.address || '—'}</span>
          </p>
          <p className="mb-0 flex items-start gap-2 text-[0.82rem] text-gray-600">
            <i className="fa-solid fa-couch mt-0.5 shrink-0 text-deepGreen/70" aria-hidden="true" />
            <span className="line-clamp-2">{order.product || '—'}</span>
          </p>
          {deliverySlot && (
            <p className="mb-0 flex items-center gap-2 text-[0.78rem] font-semibold text-gray-500">
              <i className="fa-solid fa-calendar-day shrink-0" aria-hidden="true" />
              Preferred: {deliverySlot}
            </p>
          )}
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="mb-0 text-[1.05rem] font-extrabold text-deepGreen">{order.amount || '—'}</p>
          {order.estimate && (
            <p className="mb-0 max-w-[55%] truncate text-end text-[0.74rem] font-semibold text-gray-500">
              {order.estimate}
            </p>
          )}
        </div>

        <Timeline phase={phase} />

        <div className="mb-3 grid grid-cols-2 gap-2">
          {telHref ? (
            <a
              href={telHref}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-50 text-[0.84rem] font-extrabold text-emerald-700 no-underline"
            >
              <i className="fa-solid fa-phone" aria-hidden="true" />
              Call
            </a>
          ) : (
            <span className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gray-100 text-[0.84rem] font-bold text-gray-400">
              No phone
            </span>
          )}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-50 text-[0.84rem] font-extrabold text-blue-700 no-underline"
          >
            <i className="fa-solid fa-map-location-dot" aria-hidden="true" />
            Open map
          </a>
        </div>

        {phase === 'pending' && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="min-h-[48px] rounded-xl border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-[0.9rem] font-extrabold text-white disabled:opacity-60"
              disabled={busy}
              onClick={() => onAccept(order)}
            >
              {busy ? 'Accepting…' : 'Accept delivery'}
            </button>
            <button
              type="button"
              className="min-h-[48px] rounded-xl border border-deepGreen/15 bg-white text-[0.9rem] font-extrabold text-deepGreen disabled:opacity-60"
              disabled={busy}
              onClick={() => onDecline(order)}
            >
              Decline
            </button>
          </div>
        )}

        {phase === 'accepted' && (
          <button
            type="button"
            className="min-h-[48px] w-full rounded-xl border-0 bg-gradient-to-br from-deepGreen via-[#0A5446] to-teal text-[0.9rem] font-extrabold text-white disabled:opacity-60"
            disabled={busy}
            onClick={() => onStartDelivery(order)}
          >
            {busy ? 'Updating…' : 'Start delivery — go on the way'}
          </button>
        )}

        {phase === 'transit' && (
          <>
            <p className="mb-2 text-center text-[0.76rem] font-semibold text-blue-700">
              You are on the way. Mark arrival only when you reach the customer.
            </p>
            <button
              type="button"
              className="min-h-[48px] w-full rounded-xl border-0 bg-gradient-to-br from-blue-600 to-blue-700 text-[0.9rem] font-extrabold text-white disabled:opacity-60"
              disabled={busy}
              onClick={() => onMarkArrived(order)}
            >
              {busy ? 'Updating…' : "I've arrived at customer"}
            </button>
          </>
        )}

        {phase === 'at_customer' && (
          <>
            <p className="mb-2 text-center text-[0.76rem] font-semibold text-violet-700">
              You are at the customer. Mark delivered only after handing over the order.
            </p>
            <button
              type="button"
              className="min-h-[48px] w-full rounded-xl border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-[0.9rem] font-extrabold text-white disabled:opacity-60"
              disabled={busy}
              onClick={() => onMarkDelivered(order)}
            >
              {busy ? 'Updating…' : 'Mark as delivered'}
            </button>
          </>
        )}

        {phase === 'delivered' && (
          <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-center text-[0.82rem] font-extrabold text-emerald-800">
            <i className="fa-solid fa-circle-check me-1.5" aria-hidden="true" />
            Delivery completed
          </div>
        )}
      </div>
    </article>
  );
}
