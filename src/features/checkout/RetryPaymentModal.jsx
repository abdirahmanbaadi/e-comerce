import { useEffect, useState } from 'react';
import { formatMoney } from '../../utils/format';
import { showTopFloatNotification } from '../../utils/notifications';
import { parseOrderAmount, submitWaafiPayment } from '../../utils/waafiPayment';

export default function RetryPaymentModal({ order, userPhone, onClose, onSuccess }) {
  const [phone, setPhone] = useState(userPhone || '');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!order) return null;

  const orderId = order.orderId || order.id;
  const amountNum = parseOrderAmount(order.amount || order.total);

  const handlePay = async () => {
    if (!orderId) {
      showTopFloatNotification('Order details not found.', 'danger');
      return;
    }

    setPaying(true);
    try {
      const { data } = await submitWaafiPayment({
        orderId,
        accountNo: phone,
        amount: amountNum,
        paymentReference: order.paymentReference || '',
        description: `Retry payment for ${orderId}`,
      });

      if (data.success) {
        showTopFloatNotification('Payment completed successfully via Waafi!');
        onSuccess?.(data);
        onClose?.();
      } else {
        showTopFloatNotification(data.message || 'Waafi payment failed. Please try again.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not connect to payment server. Ensure backend is running.', 'danger');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1060] flex items-center justify-center bg-deepGreen/50 p-4 backdrop-blur-[6px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-cardRise w-full max-w-[480px] rounded-2xl bg-white px-7 pb-6 pt-7 shadow-[0_24px_48px_rgba(7,61,53,0.18)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="retryPaymentTitle"
      >
        <h2 id="retryPaymentTitle" className="mb-2 font-display text-[1.75rem] font-bold text-deepGreen">
          Retry Payment
        </h2>
        <p className="mb-5 text-[0.875rem] leading-relaxed text-gray-500">
          Your EVC Plus payment did not complete. Confirm your number — Waafi will send a prompt to approve and enter
          your PIN.
        </p>

        <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-[#faf8f2] p-4 text-sm">
          <div>
            <span className="block text-[0.72rem] font-bold uppercase tracking-wide text-gray-400">Order</span>
            <strong className="text-deepGreen">{orderId}</strong>
          </div>
          <div>
            <span className="block text-[0.72rem] font-bold uppercase tracking-wide text-gray-400">Amount</span>
            <strong className="text-deepGreen">
              {order.amount?.startsWith?.('$') ? order.amount : formatMoney(amountNum)}
            </strong>
          </div>
        </div>

        <label htmlFor="retryEvcPhone" className="mb-1.5 block text-[0.82rem] font-bold text-gray-700">
          EVC Plus Phone Number
        </label>
        <div className="mb-5 flex items-center rounded-lg border border-gray-200 bg-white px-3">
          <i className="fa-solid fa-phone pr-3 text-deepGreen" />
          <input
            id="retryEvcPhone"
            type="tel"
            className="flex-1 border-0 bg-transparent py-2.5 text-[0.9rem] outline-none"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="cursor-pointer rounded-[10px] border border-gray-300 bg-white px-5 py-2.5 text-[0.875rem] font-bold text-deepGreen transition hover:bg-gray-50"
            onClick={onClose}
            disabled={paying}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-[10px] border-0 bg-deepGreen px-5 py-2.5 text-[0.875rem] font-bold text-white transition hover:bg-[#052b25] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handlePay}
            disabled={paying}
          >
            {paying ? 'Processing…' : 'Pay Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
