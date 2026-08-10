import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiUrl } from '../../../utils/data';
import { formatMoney } from '../../../utils/format';
import MobileProfileSubpage from '../../MobileProfileSubpage';

const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all', label: 'All' },
];

const EMPTY_PERIOD = {
  label: 'Today',
  total: 0,
  deliveries: 0,
  average: 0,
  breakdown: { deliveryEarnings: 0, tips: 0, bonus: 0 },
};

function formatHistoryDate(isoDay) {
  if (!isoDay) return '—';
  const d = new Date(`${isoDay}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDay;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function BreakdownRow({ icon, label, amount, last = false }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${last ? '' : 'border-b border-[#f0ebe4]'}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff1e8] text-[#e07a3a]">
        <i className={`fa-solid ${icon} text-[0.85rem]`} />
      </span>
      <span className="min-w-0 flex-1 text-[0.9rem] font-semibold text-[#1a1a1a]">{label}</span>
      <span className="text-[0.95rem] font-bold text-[#1a1a1a]">{formatMoney(amount)}</span>
    </div>
  );
}

export default function DriverEarnings() {
  const [periodId, setPeriodId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState(null);
  const [history, setHistory] = useState([]);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const load = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/drivers/my-earnings'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.earnings) {
        setPeriods(data.earnings.periods || null);
        setHistory(Array.isArray(data.earnings.history) ? data.earnings.history : []);
      }
    } catch {
      /* keep previous */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const period = useMemo(() => {
    if (!periods) return EMPTY_PERIOD;
    return periods[periodId] || EMPTY_PERIOD;
  }, [periods, periodId]);

  const periodTitle =
    periodId === 'week'
      ? "This week's earnings"
      : periodId === 'month'
        ? "This month's earnings"
        : periodId === 'all'
          ? 'All-time earnings'
          : "Today's Earnings";

  const visibleHistory = showAllHistory ? history : history.slice(0, 5);

  return (
    <MobileProfileSubpage title="Earnings" backTo="/app/driver/profile">
      <div className="space-y-4">
        <div className="flex rounded-full bg-white p-1 shadow-sm ring-1 ring-[#eadfce]">
          {PERIODS.map((p) => {
            const active = periodId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriodId(p.id)}
                className={`min-h-[40px] flex-1 rounded-full border-0 px-1 text-[0.72rem] font-bold transition ${
                  active ? 'bg-[#2f6b45] text-white' : 'bg-transparent text-[#1a1a1a]'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <section className="rounded-[22px] bg-white p-4 shadow-[0_8px_24px_rgba(47,107,69,0.06)] ring-1 ring-[#e7efe9]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-1 mt-0 text-[0.82rem] font-bold text-[#2f6b45]">{periodTitle}</p>
              <p className="m-0 text-[2rem] font-black leading-none tracking-tight text-[#1a1a1a]">
                {loading ? '—' : formatMoney(period.total)}
              </p>
            </div>
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#fff6e8] text-[#d4a017]">
              <i className="fa-solid fa-coins text-[1.45rem]" />
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#f0ebe4] pt-3">
            <div>
              <p className="mb-0.5 mt-0 text-[0.72rem] font-semibold text-[#8a8a8a]">Deliveries</p>
              <p className="m-0 text-[1.15rem] font-black text-[#1a1a1a]">
                {loading ? '—' : period.deliveries}
              </p>
            </div>
            <div className="border-l border-[#f0ebe4] pl-3">
              <p className="mb-0.5 mt-0 text-[0.72rem] font-semibold text-[#8a8a8a]">Average per delivery</p>
              <p className="m-0 text-[1.15rem] font-black text-[#1a1a1a]">
                {loading ? '—' : formatMoney(period.average)}
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-2 mt-0 text-[0.95rem] font-black text-[#1a1a1a]">Earnings Breakdown</h2>
          <div className="overflow-hidden rounded-[20px] bg-white shadow-sm ring-1 ring-[#eadfce]">
            <BreakdownRow
              icon="fa-box"
              label="Delivery Earnings"
              amount={period.breakdown?.deliveryEarnings || 0}
            />
            <BreakdownRow icon="fa-star" label="Tips" amount={period.breakdown?.tips || 0} />
            <BreakdownRow
              icon="fa-gift"
              label="Bonus"
              amount={period.breakdown?.bonus || 0}
              last
            />
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="m-0 text-[0.95rem] font-black text-[#1a1a1a]">Earnings History</h2>
            {history.length > 5 ? (
              <button
                type="button"
                onClick={() => setShowAllHistory((v) => !v)}
                className="border-0 bg-transparent text-[0.78rem] font-bold text-[#a67c52]"
              >
                {showAllHistory ? 'Show less' : 'View all'}{' '}
                <i className={`fa-solid fa-chevron-${showAllHistory ? 'up' : 'right'} text-[0.65rem]`} />
              </button>
            ) : null}
          </div>

          {visibleHistory.length === 0 ? (
            <div className="rounded-[20px] bg-white px-4 py-8 text-center shadow-sm ring-1 ring-[#eadfce]">
              <p className="m-0 text-[0.86rem] font-semibold text-[#8a8a8a]">
                {loading ? 'Loading…' : 'No completed deliveries in history yet.'}
              </p>
              <Link
                to="/app/driver/jobs"
                className="mt-3 inline-block text-[0.8rem] font-bold text-[#2f6b45] no-underline"
              >
                Open Deliveries
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[20px] bg-white shadow-sm ring-1 ring-[#eadfce]">
              {visibleHistory.map((row, idx) => (
                <div
                  key={row.date}
                  className={`flex items-center gap-3 px-4 py-3.5 ${
                    idx === visibleHistory.length - 1 ? '' : 'border-b border-[#f0ebe4]'
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f3f3f3] text-[#6b6b6b]">
                    <i className="fa-regular fa-calendar text-[0.85rem]" />
                  </span>
                  <span className="min-w-0 flex-1 text-[0.9rem] font-semibold text-[#1a1a1a]">
                    {formatHistoryDate(row.date)}
                  </span>
                  <span className="text-[0.95rem] font-bold text-[#1a1a1a]">
                    {formatMoney(row.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </MobileProfileSubpage>
  );
}
