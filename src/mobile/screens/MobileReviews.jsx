import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../utils/data';
import { MOCK_REVIEW_INBOX } from '../mockReviewInbox';
import MobileOrderReviewSessionSheet from '../MobileOrderReviewSessionSheet';
import MobileReviewSheet from '../MobileReviewSheet';

function cloneMockInbox() {
  return JSON.parse(JSON.stringify(MOCK_REVIEW_INBOX));
}

function formatDate(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function applyLocalRating(toRate, target, rating, comment) {
  const next = JSON.parse(JSON.stringify({ toRate }));
  const session = (next.toRate || []).find((s) => s.orderId === target.orderId);
  if (!session) return next.toRate;

  if (target.type === 'delivery') {
    session.delivery = {
      ...session.delivery,
      status: 'done',
      rating,
      comment: comment || '',
      ratedAt: new Date().toISOString(),
    };
  } else {
    const product = (session.products || []).find((p) => Number(p.productId) === Number(target.productId));
    if (product) {
      product.status = 'done';
      product.rating = rating;
      product.comment = comment || '';
    }
  }

  const rated =
    (session.delivery?.status === 'done' ? 1 : 0) +
    (session.products || []).filter((p) => p.status !== 'missing').length;
  const total = 1 + (session.products || []).length;
  session.progress = { rated, total };
  session.isComplete = rated >= total;

  if (session.isComplete) {
    next.toRate = next.toRate.filter((s) => s.orderId !== session.orderId);
  }

  return next.toRate;
}

export default function MobileReviews() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusOrderId = searchParams.get('orderId') || '';
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(true);
  const [toRate, setToRate] = useState(() => cloneMockInbox().toRate);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [sheetTarget, setSheetTarget] = useState(null);

  useEffect(() => {
    if (!user?.isLoggedIn) {
      navigate('/app/login', { replace: true, state: { from: '/app/profile/reviews' } });
    }
  }, [user, navigate]);

  const loadInbox = useCallback(async () => {
    const token = localStorage.getItem('token');
    setLoading(true);

    const useMock = () => {
      const mock = cloneMockInbox().toRate;
      setUsingMock(true);
      setToRate(mock);
      setLoading(false);
      return mock;
    };

    if (!token) return useMock();

    try {
      const res = await fetch(apiUrl('/api/reviews/inbox'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        const list = Array.isArray(data.toRate) ? data.toRate : [];
        if (!list.length) return useMock();
        setUsingMock(false);
        setToRate(list);
        setLoading(false);
        return list;
      }
    } catch {
      /* fall through */
    }

    return useMock();
  }, []);

  useEffect(() => {
    if (user?.isLoggedIn) loadInbox();
  }, [user?.isLoggedIn, loadInbox]);

  const orderedSessions = useMemo(() => {
    const list = [...(toRate || [])];
    if (!focusOrderId) return list;
    list.sort((a, b) => {
      if (a.orderId === focusOrderId) return -1;
      if (b.orderId === focusOrderId) return 1;
      return 0;
    });
    return list;
  }, [toRate, focusOrderId]);

  const activeSession = useMemo(
    () => orderedSessions.find((s) => s.orderId === activeSessionId) || null,
    [orderedSessions, activeSessionId]
  );

  useEffect(() => {
    if (!focusOrderId || loading) return;
    const match = orderedSessions.find((s) => s.orderId === focusOrderId);
    if (match) setActiveSessionId(match.orderId);
  }, [focusOrderId, loading, orderedSessions]);

  useEffect(() => {
    if (activeSessionId && !activeSession) setActiveSessionId('');
  }, [activeSessionId, activeSession]);

  const openDelivery = (session) => {
    if (session.delivery?.status !== 'missing') return;
    setSheetTarget({
      type: 'delivery',
      orderId: session.orderId,
      driverName: session.delivery?.driverName,
      localOnly: usingMock,
    });
  };

  const openProduct = (session, product) => {
    if (product.status !== 'missing') return;
    setSheetTarget({
      type: 'product',
      orderId: session.orderId,
      productId: product.productId,
      title: product.title,
      image: product.image,
      localOnly: usingMock,
    });
  };

  const afterSubmit = async (target, rating, comment) => {
    if (usingMock || target?.localOnly) {
      const next = applyLocalRating(toRate, target, rating ?? 0, comment || '');
      setToRate(next || []);
      setSheetTarget(null);
      if (!(next || []).some((s) => s.orderId === target.orderId)) {
        setActiveSessionId('');
      }
      return;
    }

    await loadInbox();
    setSheetTarget(null);
  };

  return (
    <div className="mmf-pwa min-h-[100dvh] bg-[#fff7ed] font-sans text-[#111111]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-md">
      <header className="mmf-reviews-header sticky top-0 z-20 border-b border-[#f0e9df] bg-[#fff7ed] px-4 py-3 pt-[max(0.7rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/app/profile')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 bg-white text-[#2f241a] shadow-sm"
            aria-label="Back to profile"
          >
            <i className="fa-solid fa-chevron-left text-[0.85rem]" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="m-0 text-[1.1rem] font-black text-[#2f241a]">Reviews</h1>
            <p className="mb-0 mt-0.5 text-[0.78rem] font-semibold text-[#8b8178]">
              Rate delivery & products
            </p>
          </div>
          <span className="h-10 w-10 shrink-0" aria-hidden="true" />
        </div>
      </header>

      <main className="px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4">
        {usingMock ? (
          <p className="mb-3 mt-0 text-[0.74rem] font-bold text-[#9a5b12]">
            Preview data — sample orders for UI testing
          </p>
        ) : null}

        {loading ? (
          <p className="py-16 text-center text-[0.86rem] font-semibold text-[#8b8178]">Loading…</p>
        ) : orderedSessions.length === 0 ? (
          <section className="px-2 py-16 text-center">
            <i className="fa-regular fa-star mb-4 text-4xl text-[#d8c8b6]" />
            <h2 className="m-0 text-[1.2rem] font-black text-[#1c140e]">Nothing to rate</h2>
            <p className="mx-auto mb-0 mt-2 max-w-xs text-[0.85rem] font-semibold leading-relaxed text-[#8b8178]">
              When an order is delivered, it will show up here so you can rate it.
            </p>
            <Link
              to="/app/profile/orders"
              className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#6b4228] px-6 text-[0.86rem] font-black text-white no-underline"
            >
              My Orders
            </Link>
          </section>
        ) : (
          <section className="space-y-2.5">
            {orderedSessions.map((session) => (
              <button
                key={session.orderId}
                type="button"
                id={`review-order-${session.orderId}`}
                onClick={() => setActiveSessionId(session.orderId)}
                className={`flex w-full items-center gap-3 rounded-[18px] border-0 bg-white p-3 text-left text-[#111111] shadow-[0_8px_20px_rgba(67,45,28,0.06)] ring-1 ${
                  focusOrderId === session.orderId ? 'ring-[#6b4228]' : 'ring-[#f0e9df]'
                }`}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f4eee7] text-[#6b4228]">
                  <i className="fa-solid fa-box" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.88rem] font-black">#{session.orderId}</span>
                  <span className="mt-0.5 block text-[0.74rem] font-semibold text-[#8b8178]">
                    Delivered {formatDate(session.deliveredAt)}
                  </span>
                  <span className="mt-1 block text-[0.7rem] font-bold text-[#9a8d82]">
                    {session.progress?.rated || 0}/{session.progress?.total || 0} rated
                  </span>
                </span>
                <i className="fa-solid fa-chevron-right text-[0.72rem] text-[#c4b8ab]" />
              </button>
            ))}
          </section>
        )}
      </main>
      </div>

      <MobileOrderReviewSessionSheet
        open={Boolean(activeSession)}
        session={activeSession}
        onClose={() => setActiveSessionId('')}
        onRateDelivery={openDelivery}
        onRateProduct={openProduct}
      />

      <MobileReviewSheet
        open={Boolean(sheetTarget)}
        target={sheetTarget}
        onClose={() => setSheetTarget(null)}
        onSubmitted={afterSubmit}
      />
    </div>
  );
}
