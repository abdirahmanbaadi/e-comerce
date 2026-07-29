import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiUrl, defaultProducts } from '../../utils/data';
import { productImage } from '../../utils/format';
import { showTopFloatNotification } from '../../utils/notifications';

function resolveProductImageSrc(product) {
  if (!product) return '';
  if (product.image) return productImage(product.image);
  const catalog = defaultProducts.find((p) => Number(p.id) === Number(product.productId));
  if (catalog?.images?.[0]) return productImage(catalog.images[0]);
  return '';
}

function RatingStars({ rating, interactive = false, onSelect, className = '', size = 'md' }) {
  const starSize =
    size === 'lg' ? 'text-[1.5rem]' : size === 'sm' ? 'text-[1.2rem]' : 'text-[1.35rem]';
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onSelect?.(star)}
          className={`border-0 bg-transparent p-0 ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          aria-label={`${star} star`}
        >
          <i
            className={`${starSize} ${
              star <= rating ? 'fa-solid fa-star text-starGold' : 'fa-regular fa-star text-[#d4d4d4]'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ProgressDots({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i + 1 === current
              ? 'w-5 bg-deepGreen'
              : i + 1 < current
                ? 'w-1.5 bg-deepGreen/40'
                : 'w-1.5 bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

export default function PostDeliveryReviewModal({ open, prompt, onClose, onPromptUpdate }) {
  const [step, setStep] = useState('delivery');
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [deliveryComment, setDeliveryComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [productRating, setProductRating] = useState(0);
  const [productComment, setProductComment] = useState('');
  const [localPrompt, setLocalPrompt] = useState(prompt);
  const [imgError, setImgError] = useState(false);
  const seenMarkedRef = useRef(false);

  useEffect(() => {
    setLocalPrompt(prompt);
  }, [prompt]);

  useEffect(() => {
    if (!open) {
      seenMarkedRef.current = false;
      return undefined;
    }
    if (!prompt?.orderId) return undefined;

    const token = localStorage.getItem('token');
    if (!token) return undefined;

    fetch(apiUrl(`/api/reviews/prompt/${encodeURIComponent(prompt.orderId)}/seen`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.prompt) {
          setLocalPrompt(data.prompt);
          onPromptUpdate?.(data.prompt);
        }
      })
      .catch(() => {});

    return undefined;
  }, [open, prompt?.orderId]);

  useEffect(() => {
    if (!open || !localPrompt) return;
    setStep(localPrompt.deliveryRated ? 'products' : 'delivery');
    setDeliveryRating(0);
    setDeliveryComment('');
    setProductRating(0);
    setProductComment('');
    setImgError(false);
  }, [open, localPrompt?.orderId, localPrompt?.deliveryRated]);

  useEffect(() => {
    setImgError(false);
  }, [localPrompt?.pendingProducts?.[0]?.productId]);

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

  const pendingProducts = localPrompt?.pendingProducts || [];
  const totalProducts = pendingProducts.length + (localPrompt?.reviewedProducts?.length || 0);
  const reviewedCount = localPrompt?.reviewedProducts?.length || 0;
  const currentProduct = pendingProducts[0] || null;
  const currentProductIndex = reviewedCount + 1;
  const attempt = localPrompt?.promptAttempt || 1;
  const maxAttempts = 3;
  const productImageSrc = useMemo(() => resolveProductImageSrc(currentProduct), [currentProduct]);
  const isProductStep = step === 'products' && pendingProducts.length > 0 && currentProduct;

  if (!open || !localPrompt || typeof document === 'undefined') return null;

  const refreshPrompt = (nextPrompt) => {
    if (!nextPrompt) return;
    setLocalPrompt(nextPrompt);
    onPromptUpdate?.(nextPrompt);
    if (nextPrompt.isComplete) {
      showTopFloatNotification('Thank you! Your feedback has been saved.', 'success');
      onClose?.();
      return;
    }
    if (nextPrompt.deliveryRated && step === 'delivery') {
      setStep('products');
    }
    const nextPending = nextPrompt.pendingProducts || [];
    if (nextPending.length === 0) {
      onClose?.();
      return;
    }
    setProductRating(0);
    setProductComment('');
    setImgError(false);
  };

  const handleDeliveryNext = async () => {
    if (deliveryRating === 0) {
      showTopFloatNotification('Please select a star rating (1–5).', 'warning');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;

    setSubmitting(true);
    try {
      const res = await fetch(apiUrl(`/api/reviews/delivery/${encodeURIComponent(localPrompt.orderId)}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating: deliveryRating,
          comment: deliveryComment.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        refreshPrompt(data.prompt);
        setStep('products');
      } else {
        showTopFloatNotification(data.message || 'Failed to save delivery rating.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not save delivery rating.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProductNext = async () => {
    if (!currentProduct?.productId) {
      onClose?.();
      return;
    }

    if (productRating === 0) {
      const nextPending = pendingProducts.slice(1);
      if (nextPending.length === 0) {
        onClose?.();
        return;
      }
      setLocalPrompt((prev) => ({
        ...prev,
        pendingProducts: nextPending,
      }));
      setProductRating(0);
      setProductComment('');
      setImgError(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    setSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/reviews'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: currentProduct.productId,
          productTitle: currentProduct.title,
          rating: productRating,
          comment: productComment.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('Review submitted! It will appear after admin approval.');
        const updated = {
          ...localPrompt,
          pendingProducts: pendingProducts.filter((p) => p.productId !== currentProduct.productId),
          reviewedProducts: [
            ...(localPrompt.reviewedProducts || []),
            { ...currentProduct, reviewed: true },
          ],
        };
        updated.isComplete = updated.deliveryRated && updated.pendingProducts.length === 0;
        refreshPrompt(updated);
      } else {
        showTopFloatNotification(data.message || 'Failed to submit review.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not submit review.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-deepGreen/40 p-4 backdrop-blur-[6px]"
      onClick={() => !submitting && onClose?.()}
      role="presentation"
    >
      <div
        className={`animate-productModalIn flex max-h-[min(92vh,720px)] w-full flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_30px_70px_rgba(10,54,34,0.18)] ${
          isProductStep ? 'max-w-[480px]' : 'max-w-[440px]'
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div
          className={`shrink-0 flex items-center justify-between gap-2 border-b border-black/[0.05] bg-gradient-to-r from-softBg/90 to-white ${
            isProductStep ? 'px-5 py-3' : 'px-5 py-3'
          }`}
        >
          <div className="min-w-0 flex-1">
            {!isProductStep && (
              <p className="mb-0.5 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-deepGreen/60">
                Delivery feedback
              </p>
            )}
            <h3 className="mb-0 text-[0.95rem] font-bold leading-tight text-deepGreen">
              {step === 'delivery' ? 'How was your delivery?' : 'Rate your new furniture'}
            </h3>
          </div>
          <span className="shrink-0 rounded-full border border-deepGreen/15 bg-white px-2.5 py-0.5 text-[0.65rem] font-bold text-deepGreen shadow-sm">
            {Math.min(attempt, maxAttempts)}/{maxAttempts}
          </span>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto">
        {step === 'delivery' && (
          <div className="px-4 py-3">
            <p className="mb-2.5 text-center text-[0.76rem] text-gray-500">
              Tell us about <span className="font-semibold text-gray-700">{localPrompt.driverName}</span>
            </p>
            <div className="mb-2.5 flex justify-center">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-deepGreen/8 text-deepGreen">
                <i className="fa-solid fa-truck text-lg" />
              </span>
            </div>
            <RatingStars
              rating={deliveryRating}
              interactive
              onSelect={setDeliveryRating}
              className="mb-2.5 justify-center"
              size="md"
            />
            <textarea
              className="mb-0 h-12 w-full resize-none rounded-xl border border-black/10 bg-[#faf9f7] px-3 py-2 text-[0.82rem] outline-none transition focus:border-deepGreen focus:bg-white"
              placeholder="Optional — share more about the delivery..."
              value={deliveryComment}
              onChange={(e) => setDeliveryComment(e.target.value)}
              disabled={submitting}
            />
          </div>
        )}

        {step === 'products' && (
          <>
            {pendingProducts.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">All items reviewed. Thank you!</p>
            ) : currentProduct ? (
              <div className="flex flex-col">
                <div className="relative w-full shrink-0 overflow-hidden bg-[#f0ede8]">
                  {productImageSrc && !imgError ? (
                    <img
                      src={productImageSrc}
                      alt={currentProduct.title}
                      onError={() => setImgError(true)}
                      className="aspect-[4/3] w-full object-cover object-center"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] w-full items-center justify-center text-gray-300">
                      <i className="fa-solid fa-couch text-5xl" />
                    </div>
                  )}
                </div>

                <div className="px-5 pb-3 pt-3">
                  <h4 className="mb-2 text-center text-[0.92rem] font-bold leading-tight text-gray-900">
                    {currentProduct.title}
                  </h4>

                  <div className="mb-2.5">
                    <ProgressDots
                      current={currentProductIndex}
                      total={totalProducts || pendingProducts.length}
                    />
                  </div>

                  <p className="mb-1.5 text-center text-[0.78rem] font-semibold text-gray-600">
                    Your rating
                  </p>
                  <RatingStars
                    rating={productRating}
                    interactive
                    onSelect={setProductRating}
                    className="mb-3 justify-center"
                    size="lg"
                  />

                  <label className="mb-1 block text-[0.78rem] font-semibold text-gray-600">
                    Comment <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    className="mb-0 h-14 w-full resize-none rounded-xl border border-black/10 bg-[#faf9f7] px-3 py-2 text-[0.84rem] outline-none transition focus:border-deepGreen focus:bg-white"
                    placeholder="Share your thoughts about this item..."
                    value={productComment}
                    onChange={(e) => setProductComment(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
            ) : null}
          </>
        )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-black/[0.05] bg-[#fafaf9] px-5 py-3">
          <button
            type="button"
            className="rounded-xl px-3 py-2 text-[0.82rem] font-semibold text-gray-500 transition hover:bg-white hover:text-gray-700"
            onClick={onClose}
            disabled={submitting}
          >
            Maybe later
          </button>
          {step === 'delivery' && (
            <button
              type="button"
              className="rounded-xl bg-deepGreen px-6 py-2 text-[0.82rem] font-bold text-white shadow-[0_4px_14px_rgba(10,54,34,0.25)] transition hover:bg-[#0e4c30] disabled:opacity-60"
              onClick={handleDeliveryNext}
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Next'}
            </button>
          )}
          {step === 'products' && pendingProducts.length > 0 && currentProduct && (
            <button
              type="button"
              className="rounded-xl bg-deepGreen px-6 py-2 text-[0.82rem] font-bold text-white shadow-[0_4px_14px_rgba(10,54,34,0.25)] transition hover:bg-[#0e4c30] disabled:opacity-60"
              onClick={handleProductNext}
              disabled={submitting}
            >
              {submitting
                ? 'Saving…'
                : currentProductIndex < (totalProducts || pendingProducts.length)
                  ? 'Next'
                  : 'Finish'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
