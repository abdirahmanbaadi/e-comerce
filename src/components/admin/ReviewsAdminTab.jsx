import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../../utils/data';
import { showTopFloatNotification } from '../../utils/notifications';

const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
];

function renderStars(rating) {
  return Array.from({ length: 5 }, (_, index) => (
    <i
      key={index}
      className={index < rating ? 'fa-solid fa-star text-warning' : 'fa-regular fa-star text-secondary'}
    />
  ));
}

function statusBadge(status) {
  if (status === 'approved') return 'bg-success-subtle text-success';
  if (status === 'rejected') return 'bg-danger-subtle text-danger';
  return 'bg-warning-subtle text-warning';
}

export default function ReviewsAdminTab() {
  const [filter, setFilter] = useState('pending');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actingId, setActingId] = useState('');

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('/api/reviews'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setReviews(data.reviews || []);
      else {
        setReviews([]);
        setLoadError(data.message || 'Could not load reviews.');
      }
    } catch (err) {
      console.error(err);
      setReviews([]);
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

  const stats = useMemo(
    () => ({
      pending: reviews.filter((r) => r.status === 'pending').length,
      approved: reviews.filter((r) => r.status === 'approved').length,
      rejected: reviews.filter((r) => r.status === 'rejected').length,
    }),
    [reviews]
  );

  const moderate = async (reviewId, status) => {
    setActingId(reviewId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/reviews/${reviewId}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification(status === 'approved' ? '✅ Review approved!' : 'Review rejected.');
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
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/reviews/${reviewId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('Review deleted.');
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
    <div className="table-card">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h3 className="card-title mb-1">
            <i className="fa-solid fa-star me-2" />
            Customer Ratings & Reviews
          </h3>
          <p className="text-muted mb-0 small">
            Pending {stats.pending} · Approved {stats.approved} · Rejected {stats.rejected}
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`btn btn-sm ${filter === item.id ? 'btn-success' : 'btn-outline-secondary'}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <div className="admin-tab-error" role="alert">
          <i className="fa-solid fa-circle-exclamation me-2" />
          {loadError}
        </div>
      )}

      <div className="table-responsive">
        <table className="table admin-table align-middle">
          <thead>
            <tr>
              <th>Product</th>
              <th>Customer</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted">
                  <i className="fa-solid fa-spinner fa-spin me-2" />
                  Loading reviews…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted">
                  No reviews in this filter.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((rev) => {
                const busy = actingId === rev.id;
                const date = rev.createdAt
                  ? new Date(rev.createdAt).toLocaleDateString()
                  : '—';

                return (
                  <tr key={rev.id}>
                    <td className="fw-bold text-success">{rev.productTitle || '—'}</td>
                    <td className="fw-semibold">{rev.userName || 'Customer'}</td>
                    <td>{renderStars(rev.rating || 0)}</td>
                    <td className="text-secondary" style={{ maxWidth: 280 }}>
                      {rev.comment || '—'}
                    </td>
                    <td>{date}</td>
                    <td>
                      <span className={`badge border-0 px-2 py-1 fw-bold ${statusBadge(rev.status)}`}>
                        {rev.status}
                      </span>
                    </td>
                    <td>
                      {rev.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm btn-success me-1"
                            disabled={busy}
                            onClick={() => moderate(rev.id, 'approved')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-warning"
                            disabled={busy}
                            onClick={() => moderate(rev.id, 'rejected')}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          disabled={busy}
                          onClick={() => remove(rev.id)}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
