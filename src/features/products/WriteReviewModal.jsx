import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiUrl } from '../../utils/data';
import { showTopFloatNotification } from '../../utils/notifications';

function RatingStars({ rating, interactive = false, onSelect, className = '' }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onSelect?.(star)}
          className={`border-0 bg-transparent p-0 ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          aria-label={`${star} star`}
        >
          <i
            className={`text-[1.25rem] ${
              star <= rating ? 'fa-solid fa-star text-starGold' : 'fa-regular fa-star text-[#cccccc]'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

const ELIGIBILITY_MESSAGES = {
  not_purchased: 'Kaliya macaamiisha soo iibsaday alaabtan ayaa review bixin kara.',
  not_paid: 'Review-ga wuxuu furmayaa marka lacagta la xaqiijiyo.',
  not_delivered: 'Waxaad review bixin kartaa marka alaabta lagu keeno (delivered).',
  already_reviewed: 'Waxaad horey u review gareysay alaabtan.',
  pending_review: 'Review-gaaga wuxuu sugayaa ansixinta admin.',
  rejected_review: 'Review-gaagii hore lama ansixin.',
};

export default function WriteReviewModal({ open, productId, productTitle, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eligibility, setEligibility] = useState('not_purchased');
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    if (!open || !productId) return undefined;

    setRating(0);
    setComment('');
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setEligibility('not_purchased');
      setCanReview(false);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    fetch(apiUrl(`/api/reviews/status/${productId}`), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.success) return;
        setEligibility(data.eligibility || (data.canReview ? 'can_review' : 'not_purchased'));
        setCanReview(Boolean(data.canReview));
        if (data.userReview?.status === 'pending') setEligibility('pending_review');
        if (data.userReview?.status === 'rejected') setEligibility('rejected_review');
        if (data.userReview?.status === 'approved') setEligibility('already_reviewed');
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, productId]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !submitting) onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, submitting, onClose]);

  if (!open || !productId || typeof document === 'undefined') return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      showTopFloatNotification('Fadlan dooro xiddigaha (1–5).', 'warning');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      showTopFloatNotification('Fadlan marka hore soo gal.', 'danger');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/reviews'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          productTitle,
          rating,
          comment: comment.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('✅ Review waa la diray! Admin ayaa ansixin doona.');
        onSubmitted?.();
        onClose?.();
      } else {
        showTopFloatNotification(data.message || 'Failed to submit review', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not submit review.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-deepGreen/45 p-4 backdrop-blur-[4px]"
      onClick={() => !submitting && onClose?.()}
      role="presentation"
    >
      <div
        className="animate-productModalIn w-full max-w-md overflow-hidden rounded-[18px] bg-white shadow-[0_25px_60px_rgba(0,0,0,0.22)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="border-b border-black/[0.06] px-5 py-4">
          <h3 className="mb-1 text-[1.1rem] font-extrabold text-deepGreen">Review product</h3>
          <p className="mb-0 truncate text-[0.84rem] text-gray-500">{productTitle}</p>
        </div>

        <div className="p-5">
          {loading ? (
            <p className="mb-0 text-center text-sm text-gray-500">
              <i className="fa-solid fa-spinner fa-spin me-2" />
              Checking eligibility…
            </p>
          ) : canReview ? (
            <>
              <p className="mb-3 text-[0.84rem] text-gray-600">
                Sidee u aragtay alaabtan kadib markii lagu keeno?
              </p>
              <RatingStars rating={rating} interactive onSelect={setRating} className="mb-4" />
              <label className="mb-1.5 block text-[0.82rem] font-bold text-gray-700">
                Comment (optional)
              </label>
              <textarea
                className="mb-0 h-20 w-full resize-none rounded-lg border border-black/15 p-2.5 text-[0.88rem] outline-none focus:border-deepGreen"
                placeholder="Share your experience…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={submitting}
              />
            </>
          ) : (
            <p className="mb-0 text-[0.88rem] leading-relaxed text-gray-600">
              {ELIGIBILITY_MESSAGES[eligibility] || ELIGIBILITY_MESSAGES.not_purchased}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-black/[0.06] px-5 py-4">
          <button
            type="button"
            className="rounded-lg bg-gray-100 px-4 py-2 text-[0.84rem] font-bold text-gray-700"
            onClick={onClose}
            disabled={submitting}
          >
            Close
          </button>
          {canReview && (
            <button
              type="button"
              className="rounded-lg bg-deepGreen px-4 py-2 text-[0.84rem] font-bold text-white disabled:opacity-60"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Sending…' : 'Submit review'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export { ELIGIBILITY_MESSAGES };
