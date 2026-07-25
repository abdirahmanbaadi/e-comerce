import { useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * Shown when a guest tries to checkout — prompts login or register.
 */
export default function CheckoutAuthModal({ isOpen, onClose, returnTo = '/checkout' }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1060] flex items-center justify-center bg-deepGreen/45 p-4 backdrop-blur-[4px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-cardRise w-full max-w-[360px] rounded-2xl border border-deepGreen/10 bg-base px-5 py-6 text-center shadow-[0_12px_40px_rgba(7,61,53,0.18)]"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="checkoutAuthTitle"
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-deepGreen/10 text-deepGreen">
          <i className="fa-solid fa-user-lock text-xl" aria-hidden="true" />
        </div>
        <h2 id="checkoutAuthTitle" className="mb-1.5 font-display text-[1.35rem] font-bold text-deepGreen">
          Account Required
        </h2>
        <p className="mx-auto mb-5 max-w-[300px] text-[0.84rem] leading-relaxed text-[#555]">
          To complete your order, please log in to your account or create a new one.
        </p>

        <div className="flex flex-col gap-2">
          <Link
            to="/login"
            state={{ from: returnTo }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border-0 bg-deepGreen px-4 py-2.5 text-[0.84rem] font-bold text-white no-underline transition hover:bg-[#052b25]"
            onClick={onClose}
          >
            <i className="fa-solid fa-right-to-bracket" aria-hidden="true" />
            Log In
          </Link>
          <Link
            to="/register"
            state={{ from: returnTo }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-deepGreen/20 bg-white px-4 py-2.5 text-[0.84rem] font-bold text-deepGreen no-underline transition hover:bg-deepGreen/[0.04]"
            onClick={onClose}
          >
            <i className="fa-solid fa-user-plus" aria-hidden="true" />
            Create Account
          </Link>
          <button
            type="button"
            className="inline-flex w-full items-center justify-center rounded-[10px] border border-gray-300 bg-white px-4 py-2.5 text-[0.84rem] font-bold text-gray-600 transition hover:bg-gray-50"
            onClick={onClose}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
