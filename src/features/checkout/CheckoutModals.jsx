import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatMoney } from '../../utils/format';
import { downloadInvoice } from '../../utils/invoiceActions';

// =============================================================================
// InvoiceLetter
// =============================================================================

export function InvoiceLetter({ order, variant = 'full' }) {
  if (!order) return null;

  const isFull = variant === 'full';
  const sectionPad = isFull ? 'px-5' : '';

  return (
    <div className="w-full" id="invoice-letter">
      <div className="overflow-hidden rounded-md bg-white shadow-[0_4px_20px_rgba(7,61,53,0.08)]">
        <div className="h-1 bg-gradient-to-r from-deepGreen via-gold to-deepGreen" />

        <header className={`text-center ${isFull ? 'pt-5' : 'pt-5'} ${sectionPad} mb-3.5`}>
          <div className="flex items-center justify-center gap-3">
            <div className="relative flex h-[46px] w-[46px] shrink-0 items-center justify-center">
              <span className="absolute inset-0 rotate-45 rounded-[10px] border-2 border-gold" />
              <span className="relative z-[2] font-display text-[1.4rem] font-bold text-gold">MF</span>
            </div>
            <div className="h-10 w-px bg-gold" />
            <div>
              <span className="block text-left font-display text-[1.75rem] font-bold leading-tight text-deepGreen">
                Mogadishu
              </span>
              <span className="mt-0.5 block text-left text-[0.68rem] font-extrabold uppercase tracking-[2px] text-deepGreen">
                Modern Furniture
              </span>
            </div>
          </div>
          <h3 className="mt-2.5 font-display text-[1.25rem] font-bold uppercase tracking-[2px] text-deepGreen">
            Invoice
          </h3>
        </header>

        <div className={`mb-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 ${sectionPad}`}>
          <div className="rounded-[10px] border border-deepGreen/8 bg-[#faf8f2] px-3 py-2.5">
            <span className="mb-1 block text-[0.62rem] font-extrabold uppercase tracking-wide text-[#7a8585]">
              Bill To
            </span>
            <p className="m-0 text-[0.78rem] font-bold leading-snug text-deepGreen">
              {order.customer}
              <br />
              {order.phone}
              <br />
              {order.address}
            </p>
          </div>
          <div className="rounded-[10px] border border-deepGreen/8 bg-[#faf8f2] px-3 py-2.5">
            <span className="mb-1 block text-[0.62rem] font-extrabold uppercase tracking-wide text-[#7a8585]">
              Invoice Details
            </span>
            <p className="m-0 text-[0.78rem] font-bold leading-snug text-deepGreen">
              {order.trackingCode}
              <br />
              {order.date}
            </p>
          </div>
        </div>

        <div className={`mb-3 overflow-x-auto ${sectionPad}`}>
          <table className="w-full border-collapse text-[0.78rem]">
            <thead>
              <tr>
                <th className="bg-deepGreen px-2.5 py-2 text-left text-[0.72rem] font-extrabold text-white">
                  Product
                </th>
                <th className="bg-deepGreen px-2.5 py-2 text-left text-[0.72rem] font-extrabold text-white">
                  Qty
                </th>
                <th className="bg-deepGreen px-2.5 py-2 text-left text-[0.72rem] font-extrabold text-white">
                  Price
                </th>
                <th className="bg-deepGreen px-2.5 py-2 text-left text-[0.72rem] font-extrabold text-white">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item) => (
                <tr key={item.id}>
                  <td className="border-b border-black/6 px-2.5 py-2 align-top">
                    <strong>{item.title}</strong>
                  </td>
                  <td className="border-b border-black/6 px-2.5 py-2 align-top">{item.quantity}</td>
                  <td className="border-b border-black/6 px-2.5 py-2 align-top">{formatMoney(item.price)}</td>
                  <td className="border-b border-black/6 px-2.5 py-2 align-top">
                    {formatMoney(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={`mb-3 ml-auto max-w-[220px] ${sectionPad}`}>
          <div className="flex justify-between gap-3 py-1 text-[0.78rem] font-bold text-[#555]">
            <span>Subtotal</span>
            <span>{formatMoney(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between gap-3 py-1 text-[0.78rem] font-bold text-[#555]">
              <span>Discount</span>
              <span>-{formatMoney(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between gap-3 py-1 text-[0.78rem] font-bold text-[#555]">
            <span>Delivery</span>
            <span>{formatMoney(order.deliveryFee)}</span>
          </div>
          <div className="mt-1.5 flex justify-between gap-3 border-t-2 border-deepGreen pt-2 text-[0.9rem] font-black text-deepGreen">
            <span>Total</span>
            <span>{order.total}</span>
          </div>
        </div>

        <footer
          className={`border-t border-dashed border-gold/40 px-5 py-3 text-center text-[0.72rem] font-semibold text-[#888] ${isFull ? 'pb-4' : ''}`}
        >
          Thank you for shopping with Mogadishu Modern Furniture
        </footer>
      </div>
    </div>
  );
}

function resolveModalVariant(_order) {
  return {
    icon: 'fa-check',
    iconBg: 'bg-deepGreen',
    title: 'Order Confirmed & Paid',
    description:
      'Payment was approved on your phone. Use the tracking code below to follow your delivery.',
  };
}

// =============================================================================
// PaymentFailedCompactModal — small alert, no products / invoice
// =============================================================================

export function PaymentFailedCompactModal({
  isOpen,
  order,
  onClose,
  onRetryPayment,
  onCancelOrder,
  retryingPayment = false,
  cancellingOrder = false,
}) {
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

  if (!isOpen || !order) return null;

  const message =
    order.paymentFailureMessage ||
    'EVC Plus payment did not complete. Approve the prompt on your phone and enter your PIN.';

  return (
    <div
      className="fixed inset-0 z-[1060] flex items-center justify-center bg-deepGreen/45 p-4 backdrop-blur-[4px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-cardRise w-full max-w-[340px] rounded-2xl border border-red-100 bg-base px-5 py-6 text-center shadow-[0_12px_40px_rgba(180,35,24,0.15)]"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="paymentFailedTitle"
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#fce8e6] text-[#b42318]">
          <i className="fa-solid fa-circle-xmark text-xl" aria-hidden="true" />
        </div>
        <h2 id="paymentFailedTitle" className="mb-1.5 font-display text-[1.35rem] font-bold text-[#b42318]">
          Payment Failed
        </h2>
        <p className="mx-auto mb-4 max-w-[280px] text-[0.84rem] leading-relaxed text-[#555]">{message}</p>
        {order.trackingCode && (
          <p className="mb-4 font-mono text-[0.78rem] font-bold text-deepGreen">{order.trackingCode}</p>
        )}
        <div className="flex flex-col gap-2">
          {typeof onRetryPayment === 'function' && (
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border-0 bg-deepGreen px-4 py-2.5 text-[0.84rem] font-bold text-white transition hover:bg-[#052b25] disabled:opacity-60"
              disabled={retryingPayment || cancellingOrder}
              onClick={onRetryPayment}
            >
              <i className={`fa-solid ${retryingPayment ? 'fa-spinner fa-spin' : 'fa-rotate-right'}`} />
              {retryingPayment ? 'Processing…' : 'Retry Payment'}
            </button>
          )}
          {typeof onCancelOrder === 'function' && (
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-red-200 bg-white px-4 py-2.5 text-[0.84rem] font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
              disabled={retryingPayment || cancellingOrder}
              onClick={onCancelOrder}
            >
              <i className={`fa-solid ${cancellingOrder ? 'fa-spinner fa-spin' : 'fa-xmark'}`} />
              {cancellingOrder ? 'Cancelling…' : 'Cancel Order'}
            </button>
          )}
          <button
            type="button"
            className="inline-flex w-full items-center justify-center rounded-[10px] border border-gray-300 bg-white px-4 py-2.5 text-[0.84rem] font-bold text-deepGreen transition hover:bg-gray-50"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// OrderConfirmModal — success / paid only
// =============================================================================

export default function OrderConfirmModal({ isOpen, order, onClose }) {
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowInvoice(false);
      return undefined;
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (showInvoice) setShowInvoice(false);
        else onClose?.();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, showInvoice]);

  if (!isOpen || !order) return null;

  const variant = resolveModalVariant(order);

  if (showInvoice) {
    return (
      <div
        className="fixed inset-0 z-[1055] flex items-center justify-center bg-deepGreen/50 p-4 backdrop-blur-[6px]"
        role="presentation"
      >
        <div
          className="animate-cardRise max-h-[92vh] w-full max-w-[540px] overflow-y-auto rounded-2xl bg-softBg p-[18px_18px_16px] shadow-[0_24px_48px_rgba(7,61,53,0.18)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invoiceViewTitle"
        >
          <button
            type="button"
            className="mb-3 inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 font-[inherit] text-[0.84rem] font-bold text-deepGreen transition hover:text-gold"
            onClick={() => setShowInvoice(false)}
          >
            <i className="fa-solid fa-arrow-left" />
            Back
          </button>

          <InvoiceLetter order={order} variant="full" />

          <button
            type="button"
            className="mt-3.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-3xl border-0 bg-deepGreen px-4 py-3 font-[inherit] text-[0.88rem] font-black text-white transition hover:bg-[#052b25]"
            onClick={() => downloadInvoice(order)}
          >
            <i className="fa-solid fa-download" />
            Download PDF Invoice
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[1055] flex items-center justify-center bg-deepGreen/50 p-4 backdrop-blur-[6px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-cardRise w-full max-w-[500px] rounded-2xl bg-white px-7 pb-6 pt-7 shadow-[0_4px_6px_rgba(0,0,0,0.04),0_24px_48px_rgba(7,61,53,0.18)] max-[480px]:px-[18px] max-[480px]:pb-5 max-[480px]:pt-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="orderConfirmTitle"
      >
        <header className="mb-[22px] text-center">
          <div
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-[1.35rem] text-white ${variant.iconBg}`}
            aria-hidden="true"
          >
            <i className={`fa-solid ${variant.icon}`} />
          </div>
          <h2 id="orderConfirmTitle" className="mb-2 font-display text-[1.75rem] font-bold leading-tight text-deepGreen">
            {variant.title}
          </h2>
          <p className="mx-auto mb-0 max-w-[360px] text-[0.875rem] leading-relaxed text-gray-500">
            {variant.description}
          </p>
        </header>

        <section className="mb-5 overflow-hidden rounded-xl border border-gray-200" aria-label="Order summary">
          <div className="bg-deepGreen px-5 py-4 text-center">
            <span className="mb-1 block text-[0.7rem] font-bold uppercase tracking-[1.2px] text-white/65">
              Tracking Code
            </span>
            <strong className="block font-mono text-[1.05rem] font-bold tracking-wide text-gold">
              {order.trackingCode}
            </strong>
          </div>

          <dl className="m-0 p-0">
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-[13px]">
              <dt className="m-0 bg-transparent text-[0.8125rem] font-semibold text-gray-400">Customer</dt>
              <dd className="m-0 text-right text-[0.875rem] font-bold text-gray-900">{order.customer}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-[13px]">
              <dt className="m-0 bg-transparent text-[0.8125rem] font-semibold text-gray-400">Payment</dt>
              <dd className="m-0 text-right text-[0.875rem] font-bold text-gray-900">{order.payment}</dd>
            </div>
            {order.transactionId && (
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-[13px]">
                <dt className="m-0 bg-transparent text-[0.8125rem] font-semibold text-gray-400">Transaction ID</dt>
                <dd className="m-0 text-right text-[0.875rem] font-bold text-gray-900">{order.transactionId}</dd>
              </div>
            )}
            {order.paymentReference && (
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-[13px]">
                <dt className="m-0 bg-transparent text-[0.8125rem] font-semibold text-gray-400">Payment Reference</dt>
                <dd className="m-0 text-right text-[0.875rem] font-bold text-gray-900">{order.paymentReference}</dd>
              </div>
            )}
            {(order.deliveryDate || order.deliveryTime) && (
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-[13px]">
                <dt className="m-0 bg-transparent text-[0.8125rem] font-semibold text-gray-400">Preferred Delivery</dt>
                <dd className="m-0 text-right text-[0.875rem] font-bold text-gray-900">
                  {order.deliveryDate}
                  {order.deliveryTime ? ` at ${order.deliveryTime}` : ''}
                </dd>
              </div>
            )}
          </dl>

          <div className="flex items-center justify-between bg-gray-50 px-5 py-3.5">
            <span className="text-[0.875rem] font-semibold text-gray-500">Total</span>
            <strong className="text-[1.125rem] font-extrabold text-deepGreen">{order.total}</strong>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Link
            to="/track-order"
            className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] border-0 bg-deepGreen px-1.5 py-[11px] text-center font-[inherit] text-[0.72rem] font-bold leading-tight text-white no-underline transition hover:bg-[#052b25] max-[480px]:px-4 max-[480px]:py-3 max-[480px]:text-[0.8125rem]"
            onClick={onClose}
          >
            <i className="fa-solid fa-truck-fast shrink-0 text-[0.85rem]" />
            Track Order
          </Link>

          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] border-[1.5px] border-gray-300 bg-white px-1.5 py-[11px] text-center font-[inherit] text-[0.72rem] font-bold leading-tight text-deepGreen no-underline transition hover:border-deepGreen hover:bg-gray-50 max-[480px]:px-4 max-[480px]:py-3 max-[480px]:text-[0.8125rem]"
            onClick={onClose}
          >
            <i className="fa-solid fa-bag-shopping shrink-0 text-[0.85rem]" />
            Continue Shopping
          </Link>

          <button
            type="button"
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-[10px] border-0 bg-gold px-1.5 py-[11px] text-center font-[inherit] text-[0.72rem] font-bold leading-tight text-deepGreen transition hover:bg-[#c8921f] max-[480px]:px-4 max-[480px]:py-3 max-[480px]:text-[0.8125rem]"
            onClick={() => setShowInvoice(true)}
          >
            <i className="fa-solid fa-file-invoice shrink-0 text-[0.85rem]" />
            View Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
