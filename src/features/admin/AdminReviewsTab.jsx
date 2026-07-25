import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiUrl } from '../../utils/data';
import { showTopFloatNotification } from '../../utils/notifications';
import {
  ADM_TABLE_CARD,
  ADM_TABLE,
  authHeaders,
  token,
} from './adminShared.js';

const ADM_ERROR =
  'mb-4 rounded-xl border border-red-500/18 bg-red-500/8 px-4 py-3 text-[0.86rem] font-semibold text-red-700 [.admin-dark_&]:text-red-300';
const BTN_SM_SUCCESS =
  'inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[0.78rem] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60';
const BTN_SM_OUTLINE_DANGER =
  'inline-flex items-center justify-center gap-1 rounded-lg border border-red-500 px-3 py-1.5 text-[0.78rem] font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60 [.admin-dark_&]:border-red-500/40 [.admin-dark_&]:text-red-400';
const BTN_SM_OUTLINE_WARNING =
  'inline-flex items-center justify-center gap-1 rounded-lg border border-amber-500 px-3 py-1.5 text-[0.78rem] font-bold text-amber-700 transition hover:bg-amber-50 disabled:opacity-60 [.admin-dark_&]:border-amber-500/40 [.admin-dark_&]:text-amber-400';

const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
];

function StarRow({ rating, size = '0.8rem' }) {
  const value = Number(rating) || 0;
  return (
    <div className="inline-flex items-center gap-0.5" style={{ fontSize: size }} aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <i
          key={i}
          className={i < value ? 'fa-solid fa-star text-gold' : 'fa-regular fa-star text-gray-300 [.admin-dark_&]:text-gray-600'}
        />
      ))}
    </div>
  );
}

function statusStyle(status) {
  if (status === 'approved') {
    return 'bg-emerald-100 text-emerald-700 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300';
  }
  if (status === 'rejected') {
    return 'bg-red-100 text-red-700 [.admin-dark_&]:bg-red-500/15 [.admin-dark_&]:text-red-300';
  }
  return 'bg-amber-100 text-amber-800 [.admin-dark_&]:bg-amber-500/15 [.admin-dark_&]:text-amber-300';
}

function formatReviewDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ReviewModal({ review, acting, onClose, onApprove, onReject, onDelete }) {
  useEffect(() => {
    if (!review) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !acting) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [review, acting, onClose]);

  if (!review || typeof document === 'undefined') return null;

  const isAdminDark = Boolean(document.querySelector('[data-theme="dark"]'));

  return createPortal(
    <div className={isAdminDark ? 'admin-dark' : ''} data-theme={isAdminDark ? 'dark' : 'light'}>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-deepGreen/45 p-4 backdrop-blur-[4px]"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="animate-productModalIn relative w-full max-w-lg overflow-hidden rounded-[18px] bg-white shadow-[0_25px_60px_rgba(0,0,0,0.22)] [.admin-dark_&]:bg-[#1a2421]"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-gray-200"
            onClick={onClose}
            disabled={acting}
            aria-label="Close"
          >
            ×
          </button>

          <div className="border-b border-gray-100 px-5 py-4 pr-12 [.admin-dark_&]:border-white/10">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[0.72rem] font-extrabold capitalize ${statusStyle(review.status)}`}>
                {review.status}
              </span>
              <span className="text-[0.75rem] text-gray-400">{formatReviewDate(review.createdAt)}</span>
            </div>
            <h3 className="mb-1 text-[1.05rem] font-extrabold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
              {review.productTitle || 'Product'}
            </h3>
            <p className="mb-0 text-[0.82rem] text-gray-500">{review.userName || 'Customer'}</p>
          </div>

          <div className="p-5">
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#faf8f2] p-3 [.admin-dark_&]:bg-white/[0.04]">
              <StarRow rating={review.rating} size="1rem" />
              <span className="text-[0.88rem] font-bold text-gray-700 [.admin-dark_&]:text-gray-200">
                {review.rating}/5
              </span>
            </div>
            <p className="mb-0 whitespace-pre-wrap text-[0.88rem] leading-relaxed text-gray-700 [.admin-dark_&]:text-gray-200">
              {review.comment?.trim() || 'No written comment — star rating only.'}
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
            {review.status === 'pending' ? (
              <>
                <button
                  type="button"
                  className={BTN_SM_OUTLINE_WARNING}
                  onClick={() => onReject(review.id)}
                  disabled={acting}
                >
                  Reject
                </button>
                <button type="button" className={BTN_SM_SUCCESS} onClick={() => onApprove(review.id)} disabled={acting}>
                  {acting ? 'Saving…' : 'Approve'}
                </button>
              </>
            ) : (
              <>
                <button type="button" className={BTN_SM_OUTLINE_WARNING} onClick={onClose}>
                  Close
                </button>
                <button type="button" className={BTN_SM_OUTLINE_DANGER} onClick={() => onDelete(review.id)} disabled={acting}>
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function AdminReviewsTab() {
  const [filter, setFilter] = useState('pending');
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, avgRating: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actingId, setActingId] = useState('');
  const [selected, setSelected] = useState(null);

  const loadReviews = useCallback(async () => {
    if (!token()) return;
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch(apiUrl('/api/reviews'), { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        setStats(data.stats || { pending: 0, approved: 0, rejected: 0, avgRating: 0 });
      } else {
        setLoadError(data.message || 'Could not load reviews.');
      }
    } catch (err) {
      console.error(err);
      setLoadError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const filtered = useMemo(() => {
    if (filter === 'all') return reviews;
    return reviews.filter((rev) => rev.status === filter);
  }, [reviews, filter]);

  const moderate = async (reviewId, status) => {
    setActingId(reviewId);
    try {
      const res = await fetch(apiUrl(`/api/reviews/${reviewId}/status`), {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification(status === 'approved' ? '✅ Review approved!' : 'Review rejected.');
        setSelected(null);
        loadReviews();
      } else {
        showTopFloatNotification(data.message || 'Action failed', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not update review', 'danger');
    } finally {
      setActingId('');
    }
  };

  const remove = async (reviewId) => {
    if (!window.confirm('Delete this review permanently?')) return;
    setActingId(reviewId);
    try {
      const res = await fetch(apiUrl(`/api/reviews/${reviewId}`), {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('Review deleted.');
        setSelected(null);
        loadReviews();
      } else {
        showTopFloatNotification(data.message || 'Delete failed', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not delete review', 'danger');
    } finally {
      setActingId('');
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="mb-1 text-[1.45rem] font-bold text-gray-900 [.admin-dark_&]:text-[#e8f0ed]">
            Customer Reviews
          </h2>
          <p className="mb-0 text-[0.86rem] text-gray-500 [.admin-dark_&]:text-gray-400">
            Pending {stats.pending} · Approved {stats.approved} · Rejected {stats.rejected}
            {stats.avgRating > 0 ? ` · Avg ${stats.avgRating}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`cursor-pointer rounded-full border px-3.5 py-2 text-[0.78rem] font-extrabold transition ${
                filter === item.id
                  ? 'border-deepGreen bg-deepGreen text-white [.admin-dark_&]:border-emerald-500 [.admin-dark_&]:bg-emerald-500'
                  : 'border-deepGreen/12 bg-white text-gray-600 hover:border-deepGreen/25 [.admin-dark_&]:border-white/8 [.admin-dark_&]:bg-white/[0.04] [.admin-dark_&]:text-[#d7e2de]'
              }`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <div className={ADM_ERROR} role="alert">
          <i className="fa-solid fa-circle-exclamation me-2" />
          {loadError}
        </div>
      )}

      <div className={`${ADM_TABLE_CARD} !mb-0 !p-4`}>
        <div className="overflow-x-auto">
          <table className={`${ADM_TABLE} [&_tbody_tr]:cursor-pointer [&_tbody_tr]:transition-colors`}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Customer</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    <i className="fa-solid fa-spinner fa-spin me-2" />
                    Loading reviews…
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No reviews in this filter.
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((rev) => (
                  <tr
                    key={rev.id}
                    tabIndex={0}
                    role="button"
                    onClick={() => setSelected(rev)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelected(rev);
                      }
                    }}
                    className="hover:bg-deepGreen/[0.03] focus-visible:bg-deepGreen/[0.04] focus-visible:outline-none"
                  >
                    <td className="max-w-[180px] truncate font-bold text-deepGreen [.admin-dark_&]:text-emerald-300">
                      {rev.productTitle || '—'}
                    </td>
                    <td className="whitespace-nowrap">{rev.userName || 'Customer'}</td>
                    <td>
                      <StarRow rating={rev.rating} />
                    </td>
                    <td className="max-w-[240px] truncate text-gray-500 [.admin-dark_&]:text-gray-400">
                      {rev.comment?.trim() || '—'}
                    </td>
                    <td className="whitespace-nowrap text-[0.82rem] text-gray-500">
                      {formatReviewDate(rev.createdAt)}
                    </td>
                    <td>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-extrabold capitalize ${statusStyle(rev.status)}`}>
                        {rev.status}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <ReviewModal
        review={selected}
        acting={Boolean(actingId)}
        onClose={() => !actingId && setSelected(null)}
        onApprove={(id) => moderate(id, 'approved')}
        onReject={(id) => moderate(id, 'rejected')}
        onDelete={remove}
      />
    </div>
  );
}
