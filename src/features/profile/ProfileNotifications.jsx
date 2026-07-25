import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getLastOrderDetails,
  getOrderTotalFormatted,
  fetchOrderForNotification,
  showTopFloatNotification,
} from '../../utils/notifications';
import { apiUrl } from '../../utils/data';
import { formatMoney, productImage } from '../../utils/format';

/* ═══ SECTION: MODAL SHELL ═══ */
export function ModalBackdrop({ children, onClose, maxWidth = 'max-w-lg', className = '' }) {
  useEffect(() => {
    if (!onClose) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    const prevOverflow = document.body.style.overflow;
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (typeof document === 'undefined' || !document.body) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1050] overflow-y-auto bg-black/45" role="presentation">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-5" onClick={onClose}>
        <div
          className={`my-auto w-full ${maxWidth} ${className}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function CloseAbsoluteBtn({ onClose }) {
  return (
    <button
      type="button"
      className="absolute right-4 top-4 z-10 flex items-center justify-center border-0 bg-transparent p-1 text-[1.2rem] text-[#888888] transition-colors hover:text-[#333333]"
      onClick={onClose}
      aria-label="Close"
    >
      <i className="fa-solid fa-xmark" />
    </button>
  );
}

function LeafLeft() {
  return (
    <span className="pointer-events-none absolute bottom-0 -left-7 inline-flex">
      <svg width="32" height="26" viewBox="0 0 32 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M26 21C18 19 9 12 13.5 5C19 5 23 10 26 21Z" fill="#A7C1AE" />
        <path d="M28 23C19.5 24 12 19 13 13C18 13.5 23.5 17.5 28 23Z" fill="#A7C1AE" opacity="0.85" />
      </svg>
    </span>
  );
}

function LeafRight() {
  return (
    <span className="pointer-events-none absolute bottom-0 -right-7 inline-flex">
      <svg width="32" height="26" viewBox="0 0 32 26" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'scaleX(-1)' }}>
        <path d="M26 21C18 19 9 12 13.5 5C19 5 23 10 26 21Z" fill="#A7C1AE" />
        <path d="M28 23C19.5 24 12 19 13 13C18 13.5 23.5 17.5 28 23Z" fill="#A7C1AE" opacity="0.85" />
      </svg>
    </span>
  );
}

function Sparkle({ className }) {
  return (
    <span className={`pointer-events-none absolute inline-flex ${className}`}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 0L10.2 5.8L16 8L10.2 10.2L8 16L5.8 10.2L0 8L5.8 5.8L8 0Z" fill="#D8A128" />
      </svg>
    </span>
  );
}

export function GoldStarSeparator({ lineClass = 'bg-[#e5dfd3]' }) {
  return (
    <div className="my-2 flex items-center justify-center gap-4">
      <span className={`h-px w-11 ${lineClass}`} />
      <span className="text-[0.85rem] text-[#c4b9a3]">✦</span>
      <span className={`h-px w-11 ${lineClass}`} />
    </div>
  );
}

export function PremiumDeco({ children, className = 'mb-6' }) {
  return (
    <div className={`relative inline-block ${className}`}>
      {children}
      <LeafLeft />
      <LeafRight />
      <Sparkle className="-left-3 -top-3" />
      <Sparkle className="-right-3 -top-3" />
    </div>
  );
}

export const premiumCardClass =
  'relative max-h-[min(90dvh,620px)] overflow-y-auto overscroll-contain rounded-3xl border-0 bg-base px-6 py-7 text-center font-sans shadow-[0_15px_45px_rgba(0,0,0,0.08)] sm:px-8 sm:py-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-deepGreen/20';

export const formCardClass =
  'relative max-h-[min(90dvh,620px)] overflow-y-auto overscroll-contain rounded-[20px] border-0 bg-softBg p-5 font-sans shadow-[0_15px_45px_rgba(0,0,0,0.12)] sm:p-7 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-deepGreen/20';

export const compactPremiumCardClass = `${premiumCardClass} px-5 py-6 sm:px-7 sm:py-7`;

export function BtnPrimary({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`flex-1 rounded-lg border-0 bg-[#4a5d4e] px-[18px] py-3 text-[0.9rem] font-bold text-white transition hover:-translate-y-px hover:bg-[#39483c] disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function BtnDeepGreen({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`rounded-[10px] border-0 bg-deepGreen px-6 py-3 text-[0.95rem] font-bold text-white transition hover:bg-[#052a24] disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function BtnSecondary({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`flex-1 rounded-lg border border-[#d4cebc] bg-white px-[18px] py-3 text-[0.9rem] font-bold text-[#4a3e35] transition hover:border-[#c0b9a6] hover:bg-[#FAF8F5] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function BtnOutlineGreen({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`rounded-[10px] border-[1.5px] border-deepGreen bg-white px-6 py-3 text-[0.95rem] font-bold text-deepGreen transition hover:bg-[#f7f9f7] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function BtnCloseFooter({ children = 'Close', className = '', ...props }) {
  return (
    <button
      type="button"
      className={`max-w-[160px] flex-1 rounded-[10px] border border-[#d4cebc] bg-[#fcfbf9] px-6 py-3 text-[0.95rem] font-bold text-[#4a3e35] transition hover:border-gold hover:bg-[#faf6f0] hover:text-deepGreen ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function InfoBox({ children }) {
  return (
    <div className="mb-6 rounded-[14px] border border-[#f0eee8] bg-[#FAF8F5] px-5 py-4 text-left">{children}</div>
  );
}

export function InfoRow({ icon, label, value, badge }) {
  return (
    <div className="flex items-center justify-between border-b border-[#f2ece1] py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#f2ece1] text-[0.88rem] text-[#8c7a6b]">
          <i className={icon} />
        </span>
        <span className="text-[0.88rem] font-semibold text-[#666666]">{label}</span>
      </div>
      {badge || <span className="text-[0.88rem] font-bold text-[#333333]">{value}</span>}
    </div>
  );
}

export const fieldClass =
  'w-full rounded-lg border border-black/[0.12] bg-white px-3 py-2.5 text-[0.88rem] font-semibold text-[#333333] outline-none transition focus:border-deepGreen focus:shadow-[0_0_0_3px_rgba(7,61,53,0.1)]';

export const fieldLabelClass = 'mb-1.5 block text-[0.8rem] font-bold text-[#111111]';


/* ═══ SECTION: NOTIFICATION MODALS ═══ */

const WEEKEND_OFFER = {
  productTitle: 'Ivory Cloud Sofa Set',
  image: '/product-images/ivory-cloud-sofa-set-main.jpeg.jpeg',
};

function SuccessCircle({ children, className = 'bg-[#e2ece9]', compact = false }) {
  const sizeClass = compact ? 'h-16 w-16' : 'h-20 w-20';
  return (
    <div className={`mx-auto flex ${sizeClass} items-center justify-center rounded-full ${className}`}>{children}</div>
  );
}

function OrderPlacedModal({ onClose, onViewDetails, order: orderProp }) {
  const order = orderProp || getLastOrderDetails();

  return (
    <ModalBackdrop onClose={onClose} maxWidth="max-w-[500px]">
      <div className={premiumCardClass}>
        <CloseAbsoluteBtn onClose={onClose} />
        <PremiumDeco>
          <SuccessCircle className="bg-[#fef3c7]">
            <i className="fa-solid fa-bag-shopping text-[2rem] text-[#b45309]" />
          </SuccessCircle>
        </PremiumDeco>
        <h2 className="mb-2 font-display text-[2.3rem] font-bold text-[#2b3a30]">Order Placed</h2>
        <GoldStarSeparator />
        <p className="mx-auto mb-6 max-w-[320px] text-[0.92rem] leading-relaxed text-[#666666]">
          Your order is saved. Approve EVC Plus payment on your phone to complete checkout.
        </p>
        <InfoBox>
          <InfoRow icon="fa-regular fa-file-lines" label="Order ID" value={order.orderId} />
          <InfoRow icon="fa-regular fa-calendar" label="Order Date" value={order.orderDate || 'May 15, 2025'} />
          <InfoRow
            icon="fa-regular fa-clock"
            label="Current Status"
            badge={<span className="rounded-md bg-amber-100 px-2 py-0.5 text-[0.8rem] font-bold text-amber-800">Payment Pending</span>}
          />
        </InfoBox>
        <div className="mt-6 flex gap-3">
          <BtnPrimary onClick={onViewDetails}>View Order Details</BtnPrimary>
          <BtnSecondary onClick={onClose}>Close</BtnSecondary>
        </div>
      </div>
    </ModalBackdrop>
  );
}

function OrderConfirmedModal({ onClose, onViewDetails, order: orderProp }) {
  const order = orderProp || getLastOrderDetails();

  return (
    <ModalBackdrop onClose={onClose} maxWidth="max-w-[500px]">
      <div className={premiumCardClass}>
        <CloseAbsoluteBtn onClose={onClose} />
        <PremiumDeco>
          <SuccessCircle className="bg-[#e5ebe4]">
            <i className="fa-solid fa-check text-[2rem] text-[#4a6454]" />
          </SuccessCircle>
        </PremiumDeco>
        <h2 className="mb-2 font-display text-[2.3rem] font-bold text-[#2b3a30]">Order Confirmed</h2>
        <GoldStarSeparator />
        <p className="mx-auto mb-6 max-w-[320px] text-[0.92rem] leading-relaxed text-[#666666]">
          Thank you for your order! We&apos;ve received it and are preparing it for a smooth delivery.
        </p>
        <InfoBox>
          <InfoRow icon="fa-regular fa-file-lines" label="Order ID" value={order.orderId} />
          <InfoRow icon="fa-regular fa-calendar" label="Order Date" value={order.orderDate || 'May 15, 2025'} />
          <InfoRow
            icon="fa-regular fa-circle-check"
            label="Current Status"
            badge={<span className="rounded-md bg-green-100 px-2 py-0.5 text-[0.8rem] font-bold text-green-700">Confirmed</span>}
          />
        </InfoBox>
        <div className="mt-6 flex gap-3">
          <BtnPrimary onClick={onViewDetails}>View Order Details</BtnPrimary>
          <BtnSecondary onClick={onClose}>Close</BtnSecondary>
        </div>
      </div>
    </ModalBackdrop>
  );
}

function OrderDetailsModal({ onClose, order: orderProp }) {
  const order = orderProp || getLastOrderDetails();
  const items = order.items?.length ? order.items : [];

  return (
    <ModalBackdrop onClose={onClose} maxWidth="max-w-[620px]">
      <div className={formCardClass}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#e5ebe4] text-[1.25rem] text-[#4a6454]">
              <i className="fa-solid fa-bag-shopping" />
            </div>
            <h2 className="m-0 font-display text-[1.9rem] font-bold text-[#2b3a30]">Order Details</h2>
          </div>
          <button type="button" className="border-0 bg-transparent p-1 text-[#888888] hover:text-[#333333]" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-4">
          <div>
            <span className="mb-1 block text-[0.8rem] font-semibold text-[#888888]">Order ID</span>
            <span className="text-[0.95rem] font-extrabold text-[#4a6454]">{order.orderId}</span>
          </div>
          <div>
            <span className="mb-1 block text-[0.8rem] font-semibold text-[#888888]">Customer</span>
            <span className="text-[0.95rem] font-bold text-[#333333]">{order.customerName}</span>
          </div>
          <div>
            <span className="mb-1 block text-[0.8rem] font-semibold text-[#888888]">Phone</span>
            <span className="text-[0.95rem] font-bold text-[#333333]">{order.customerPhone}</span>
          </div>
        </div>

        <hr className="my-5 border-0 border-t border-[#f0eee8]" />

        {items.map((item) => (
          <div key={item.title} className="mb-2.5 flex items-center gap-4">
            <img src={item.image} alt={item.title} className="h-16 w-[100px] rounded-lg border border-black/[0.05] bg-[#FAF8F5] object-cover" />
            <span className="flex-1 text-[0.95rem] font-bold text-[#333333]">{item.title}</span>
            <div>
              <span className="block text-[0.8rem] text-[#888888]">Qty</span>
              <span className="font-bold">{item.quantity}</span>
            </div>
            <div>
              <span className="block text-[0.8rem] text-[#888888]">Price</span>
              <span className="font-bold">{formatMoney(item.price * item.quantity)}</span>
            </div>
          </div>
        ))}

        <hr className="my-5 border-0 border-t border-[#f0eee8]" />

        <div className="mb-5 grid grid-cols-2 gap-4">
          <div>
            <span className="mb-1 block text-[0.8rem] font-semibold text-[#888888]">Payment Method</span>
            <span className="font-bold">{order.paymentMethod}</span>
          </div>
          <div>
            <span className="mb-1 block text-[0.8rem] font-semibold text-[#888888]">Payment Status</span>
            <span className={`inline-block rounded-md px-2 py-1 text-[0.82rem] font-bold ${order.paymentStatus?.toLowerCase() === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {order.paymentStatus}
            </span>
          </div>
          <div className="col-span-2">
            <span className="mb-1 block text-[0.8rem] font-semibold text-[#888888]">Delivery Address</span>
            <span className="font-bold">{order.deliveryAddress}</span>
          </div>
        </div>

        <hr className="my-5 border-0 border-t border-[#f0eee8]" />

        <div className="mb-6">
          <span className="mb-1 block text-[0.8rem] font-semibold text-[#888888]">Order Status</span>
          <span className="inline-block rounded-md bg-green-100 px-2 py-1 text-[0.82rem] font-bold text-green-700">
            {order.orderStatus} ✓
          </span>
        </div>

        <div className="flex gap-3">
          <Link
            to="/track-order"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-deepGreen px-4 py-3 text-center text-[0.9rem] font-bold text-white no-underline transition hover:bg-[#0A5246]"
            onClick={onClose}
          >
            <i className="fa-solid fa-location-dot" /> Track Order
          </Link>
          <BtnSecondary onClick={onClose}>Close</BtnSecondary>
        </div>
      </div>
    </ModalBackdrop>
  );
}

function PaymentSuccessModal({ onClose, order }) {
  const total = getOrderTotalFormatted(order);
  const orderId = order?.orderId || 'MF-250515-001';

  return (
    <ModalBackdrop onClose={onClose} maxWidth="max-w-[500px]">
      <div className={premiumCardClass}>
        <CloseAbsoluteBtn onClose={onClose} />
        <PremiumDeco>
          <SuccessCircle>
            <svg width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9.5L10.5 17L25 3.5" stroke="#073D35" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </SuccessCircle>
        </PremiumDeco>
        <h2 className="mb-2 font-display text-[2.3rem] font-bold text-[#2b3a30]">Payment Successfully</h2>
        <GoldStarSeparator />
        <p className="mx-auto mb-5 max-w-[380px] text-[0.92rem] leading-relaxed text-[#666666]">
          Thank you for your payment of <strong>{total}</strong> for Order <strong>#{orderId}</strong>. Your order has been confirmed successfully.
        </p>
        <BtnCloseFooter onClick={onClose} className="mx-auto w-full max-w-[160px]" />
      </div>
    </ModalBackdrop>
  );
}

function PaymentFailedModal({ onClose, onRetry, order }) {
  const orderId = order?.orderId || 'MF-250515-001';

  return (
    <ModalBackdrop onClose={onClose} maxWidth="max-w-[500px]">
      <div className={premiumCardClass}>
        <CloseAbsoluteBtn onClose={onClose} />
        <PremiumDeco>
          <SuccessCircle className="bg-[#fce8e6]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="#ae4e46" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </SuccessCircle>
        </PremiumDeco>
        <h2 className="mb-2 font-display text-[2.5rem] font-bold text-[#b42318]">Payment Failed</h2>
        <GoldStarSeparator lineClass="bg-[#e2b0aa]" />
        <p className="mx-auto mb-6 max-w-[380px] text-[0.95rem] leading-relaxed text-[#555555]">
          Your payment for Order <strong>#{orderId}</strong> was not successful. Please try again or choose a different payment method.
        </p>
        <div className="flex justify-center gap-3">
          <BtnDeepGreen onClick={onRetry} className="max-w-[160px] flex-none">
            Retry Payment
          </BtnDeepGreen>
          <BtnCloseFooter onClick={onClose} />
        </div>
      </div>
    </ModalBackdrop>
  );
}

function OrderProcessingModal({ onClose, item, activeStep = 1 }) {
  const title = item?.title || 'Order Processing';
  const message =
    item?.desc ||
    "Good news! We've received your order and are currently processing it.";

  const steps = [
    { icon: 'fa-solid fa-box-open', label: 'Processing', state: activeStep >= 1 ? (activeStep > 1 ? 'completed' : 'active') : '' },
    { icon: 'fa-solid fa-credit-card', label: 'Payment\nVerified', state: activeStep >= 2 ? (activeStep > 2 ? 'completed' : 'active') : '' },
    { icon: 'fa-solid fa-box', label: 'Preparing\nOrder', state: activeStep >= 3 ? (activeStep > 3 ? 'completed' : 'active') : '' },
    { icon: 'fa-solid fa-truck', label: 'Out for\nDelivery', state: activeStep >= 4 ? (activeStep > 4 ? 'completed' : 'active') : '' },
    { icon: 'fa-solid fa-thumbs-up', label: 'Delivered', state: activeStep >= 5 ? 'completed' : '' },
  ];

  const progressWidth =
    activeStep <= 1 ? '8%' : activeStep === 2 ? '25%' : activeStep === 3 ? '50%' : activeStep === 4 ? '75%' : '100%';

  return (
    <ModalBackdrop onClose={onClose} maxWidth="max-w-[500px]">
      <div className={premiumCardClass}>
        <CloseAbsoluteBtn onClose={onClose} />
        <PremiumDeco>
          <SuccessCircle className="relative bg-[#e2ece9]">
            <div className="relative inline-block">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#073D35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
                <polygon points="12 22.08 12 12 3 6.92 3 17.08 12 22.08" />
                <polygon points="12 12 21 6.92 21 17.08 12 22.08" />
                <polygon points="12 2 3 6.92 12 12 21 6.92 12 2" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              <span className="absolute -bottom-1.5 -right-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px] border-[#e2ece9] bg-deepGreen text-[0.65rem] text-white">
                <i className="fa-solid fa-gear fa-spin" />
              </span>
            </div>
          </SuccessCircle>
        </PremiumDeco>
        <h2 className="mb-2 font-display text-[2.3rem] font-bold text-[#2b3a30]">{title}</h2>
        <GoldStarSeparator />
        <p className="mx-auto mb-6 max-w-[380px] text-[0.92rem] text-[#666666]">{message}</p>

        <div className="relative mb-6 px-1">
          <div className="absolute left-[8%] right-[8%] top-5 h-0.5 bg-gray-200">
            <div className="h-full bg-deepGreen transition-all duration-500" style={{ width: progressWidth }} />
          </div>
          <div className="relative flex justify-between gap-1">
            {steps.map((step) => (
              <div key={step.label} className="flex w-14 flex-col items-center gap-1.5">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm ${
                    step.state === 'completed'
                      ? 'bg-deepGreen text-white'
                      : step.state === 'active'
                        ? 'border-2 border-deepGreen bg-white text-deepGreen'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <i className={step.icon} />
                </div>
                <span className={`whitespace-pre-line text-center text-[0.58rem] font-semibold leading-tight ${step.state ? 'text-deepGreen' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <BtnCloseFooter onClick={onClose} className="mx-auto w-full max-w-[160px]" />
      </div>
    </ModalBackdrop>
  );
}

function OrderShippedModal({ onClose, item, order }) {
  const orderId = order?.orderId || item?.orderId || item?.metadata?.orderId || '—';
  return (
    <ModalBackdrop onClose={onClose} maxWidth="max-w-[500px]">
      <div className={premiumCardClass}>
        <CloseAbsoluteBtn onClose={onClose} />
        <PremiumDeco>
          <SuccessCircle className="bg-[#e5ebe4]">
            <i className="fa-solid fa-truck-fast text-[2rem] text-[#4a6454]" />
          </SuccessCircle>
        </PremiumDeco>
        <h2 className="mb-2 font-display text-[2.3rem] font-bold text-[#2b3a30]">{item?.title || 'Out for Delivery'}</h2>
        <GoldStarSeparator />
        <p className="mx-auto mb-6 max-w-[360px] text-[0.92rem] leading-relaxed text-[#666666]">
          {item?.desc || `Your order ${orderId} is on the way to your address.`}
        </p>
        <InfoBox>
          <InfoRow icon="fa-regular fa-file-lines" label="Order ID" value={orderId} />
        </InfoBox>
        <div className="mt-6">
          <BtnCloseFooter onClick={onClose} className="mx-auto w-full max-w-[160px]" />
        </div>
      </div>
    </ModalBackdrop>
  );
}

function OrderDeliveredModal({ onClose, item, order }) {
  const orderId = order?.orderId || item?.orderId || item?.metadata?.orderId || '—';
  return (
    <ModalBackdrop onClose={onClose} maxWidth="max-w-[500px]">
      <div className={premiumCardClass}>
        <CloseAbsoluteBtn onClose={onClose} />
        <PremiumDeco>
          <SuccessCircle className="bg-[#e2ece9]">
            <i className="fa-solid fa-circle-check text-[2rem] text-[#4a6454]" />
          </SuccessCircle>
        </PremiumDeco>
        <h2 className="mb-2 font-display text-[2.3rem] font-bold text-[#2b3a30]">{item?.title || 'Order Delivered'}</h2>
        <GoldStarSeparator />
        <p className="mx-auto mb-6 max-w-[360px] text-[0.92rem] leading-relaxed text-[#666666]">
          {item?.desc || `Order ${orderId} has been delivered. Thank you for shopping with us!`}
        </p>
        <InfoBox>
          <InfoRow icon="fa-regular fa-file-lines" label="Order ID" value={orderId} />
        </InfoBox>
        <div className="mt-6">
          <BtnCloseFooter onClick={onClose} className="mx-auto w-full max-w-[160px]" />
        </div>
      </div>
    </ModalBackdrop>
  );
}

function DeliveryAssignedModal({ onClose, item }) {
  return (
    <ModalBackdrop onClose={onClose} maxWidth="max-w-[500px]">
      <div className={premiumCardClass}>
        <CloseAbsoluteBtn onClose={onClose} />
        <PremiumDeco>
          <SuccessCircle className="bg-[#e5ebe4]">
            <i className="fa-solid fa-truck text-[2rem] text-[#4a6454]" />
          </SuccessCircle>
        </PremiumDeco>
        <h2 className="mb-2 font-display text-[2.3rem] font-bold text-[#2b3a30]">{item?.title || 'Driver Assigned'}</h2>
        <GoldStarSeparator />
        <p className="mx-auto mb-6 max-w-[360px] text-[0.92rem] leading-relaxed text-[#666666]">
          {item?.desc || 'A driver has been assigned to your order.'}
        </p>
        <BtnCloseFooter onClick={onClose} className="mx-auto w-full max-w-[160px]" />
      </div>
    </ModalBackdrop>
  );
}

function GenericNotificationModal({ item, onClose }) {
  return (
    <ModalBackdrop onClose={onClose} maxWidth="max-w-[500px]">
      <div className={premiumCardClass}>
        <CloseAbsoluteBtn onClose={onClose} />
        <PremiumDeco>
          <SuccessCircle className="bg-[#e5ebe4]">
            <i className="fa-regular fa-bell text-[2rem] text-[#4a6454]" />
          </SuccessCircle>
        </PremiumDeco>
        <h2 className="mb-2 font-display text-[2.1rem] font-bold text-[#2b3a30]">{item?.title || 'Notification'}</h2>
        <GoldStarSeparator />
        <p className="mx-auto mb-6 max-w-[360px] text-[0.92rem] leading-relaxed text-[#666666]">{item?.desc || ''}</p>
        <BtnCloseFooter onClick={onClose} className="mx-auto w-full max-w-[160px]" />
      </div>
    </ModalBackdrop>
  );
}

function SupportRepliedModal({ onClose, userName, notificationItem, onSendFollowUp, sending }) {
  const firstName = (userName || '').trim().split(' ')[0] || 'Customer';
  const meta = notificationItem?.metadata || {};
  const ticketId = String(meta.ticketId || notificationItem?.relatedId || '').trim();
  const subject = String(meta.subject || notificationItem?.title || '').trim();
  const seededReply = String(meta.replyText || '').trim();

  const [adminReply, setAdminReply] = useState(seededReply);
  const [loadingReply, setLoadingReply] = useState(!seededReply);
  const [replyText, setReplyText] = useState('');

  const hasAdminReply = Boolean(adminReply);

  useEffect(() => {
    if (!ticketId) {
      setLoadingReply(false);
      return undefined;
    }
    if (seededReply) {
      setAdminReply(seededReply);
      setLoadingReply(false);
      return undefined;
    }

    let cancelled = false;
    setLoadingReply(true);

    (async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        if (!cancelled) setLoadingReply(false);
        return;
      }

      try {
        const response = await fetch(apiUrl(`/api/support/chats/${encodeURIComponent(ticketId)}/messages`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (cancelled || !data?.success) return;

        const adminMessages = (data.messages || []).filter((m) => m?.senderRole === 'admin');
        const lastAdmin = adminMessages[adminMessages.length - 1];
        const text = String(lastAdmin?.messageText ?? '').trim();
        if (text) setAdminReply(text);
      } catch {
        /* show empty state below */
      } finally {
        if (!cancelled) setLoadingReply(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ticketId, seededReply]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!hasAdminReply) return;

    const text = replyText.trim();
    if (!text || !ticketId || !onSendFollowUp) return;

    const ok = await onSendFollowUp(ticketId, text);
    if (ok) {
      showTopFloatNotification('✅ Fariintaada waa la diray!');
      setReplyText('');
    }
  };

  return (
    <ModalBackdrop onClose={onClose} maxWidth="max-w-[500px]">
      <div className={premiumCardClass}>
        <CloseAbsoluteBtn onClose={onClose} />
        <PremiumDeco>
          <SuccessCircle>
            <i className="fa-solid fa-comment-dots text-[2.1rem] text-deepGreen" />
          </SuccessCircle>
        </PremiumDeco>
        <h2 className="mb-2 font-display text-[2.3rem] font-bold text-[#2b3a30]">Support Replied</h2>
        <GoldStarSeparator />
        <p className="mx-auto mb-5 max-w-[380px] text-[0.92rem] leading-relaxed text-[#666666]">
          {subject
            ? `We replied to your message about "${subject}".`
            : 'Our support team has replied to your message.'}
        </p>

        <InfoBox>
          <p className="mb-2 text-[0.88rem] font-bold text-[#333333]">Hello {firstName},</p>
          {loadingReply ? (
            <p className="m-0 flex items-center justify-center gap-2 text-[0.88rem] text-[#666666]">
              <i className="fa-solid fa-spinner fa-spin text-deepGreen" />
              Loading reply...
            </p>
          ) : hasAdminReply ? (
            <p className="m-0 text-left text-[0.88rem] leading-relaxed text-[#444444]">{adminReply}</p>
          ) : (
            <p className="m-0 text-left text-[0.88rem] text-[#888888]">Reply not available yet. Please check again shortly.</p>
          )}
        </InfoBox>

        {hasAdminReply ? (
          <form onSubmit={handleReply} className="mb-5">
            <p className="mb-2 text-left text-[0.82rem] text-[#777777]">Need more help? Send a follow-up message.</p>
            <div className="flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3 py-2">
              <input
                type="text"
                className="min-w-0 flex-1 border-0 bg-transparent text-[0.88rem] outline-none"
                placeholder="Write your message here..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={sending}
              />
              <button
                type="submit"
                className="border-0 bg-transparent text-[1.1rem] text-deepGreen disabled:opacity-50"
                disabled={sending || !replyText.trim()}
                aria-label="Send message"
              >
                <i className="fa-regular fa-paper-plane" />
              </button>
            </div>
          </form>
        ) : null}

        <BtnCloseFooter onClick={onClose} className="mx-auto w-full max-w-[160px]" />
      </div>
    </ModalBackdrop>
  );
}

function WishlistAvailableModal({ onClose, navigate, item }) {
  const meta = item?.metadata || {};
  const productTitle = meta.productTitle || 'Wishlist Item';
  const image = meta.image || '/product-images/sage-wood-platform-bed-main.jpeg.jpeg';

  return (
    <ModalBackdrop onClose={onClose} maxWidth="max-w-[580px]">
      <div className={`${premiumCardClass} px-8 py-9`}>
        <CloseAbsoluteBtn onClose={onClose} />
        <PremiumDeco className="mb-5">
          <SuccessCircle>
            <svg width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9.5L10.5 17L25 3.5" stroke="#073D35" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </SuccessCircle>
        </PremiumDeco>
        <h2 className="mb-2 font-display text-[2.1rem] font-bold text-deepGreen">Wishlist Product Available</h2>
        <p className="mx-auto mb-5 max-w-[420px] text-[0.9rem] text-[#666666]">Good news! A product from your wishlist is now available.</p>
        <div className="mx-auto mb-5 flex max-w-[400px] items-center gap-4 rounded-xl border border-black/[0.05] bg-[#FAF8F5] p-4 text-left">
          <img src={image} alt={productTitle} className="h-[85px] w-[110px] rounded-lg border border-black/[0.05] object-cover" />
          <div>
            <h4 className="mb-1 text-[0.95rem] font-bold text-[#2b3a30]">{productTitle}</h4>
            {meta.price ? (
              <p className="mb-2 text-[0.95rem] font-extrabold text-deepGreen">{formatMoney(meta.price)}</p>
            ) : null}
            <span className="text-[1.05rem] font-extrabold text-deepGreen">Now Available</span>
          </div>
        </div>
        <p className="mb-6 text-center text-[0.88rem] font-medium leading-relaxed text-[#555555]">
          Don&apos;t miss out! The product you saved is now in stock and ready for you.
        </p>
        <div className="flex justify-center gap-3">
          <BtnDeepGreen
            className="max-w-[160px] flex-none"
            onClick={() => {
              localStorage.setItem('openProductModalOnLoad', productTitle);
              navigate('/products');
              onClose();
            }}
          >
            View Product
          </BtnDeepGreen>
          <BtnOutlineGreen onClick={onClose} className="max-w-[160px] flex-none">
            Close
          </BtnOutlineGreen>
        </div>
      </div>
    </ModalBackdrop>
  );
}

function WeekendOfferModal({ onClose, navigate, item }) {
  const meta = item?.metadata || {};
  const promoCode = meta.promoCode || 'WEEKEND15';
  const description = meta.description || 'Make your weekends more comfortable with timeless sofas at a special price.';
  const discountLabel = meta.discountPercent
    ? `${meta.discountPercent}% OFF`
    : meta.discountAmount
      ? `${formatMoney(meta.discountAmount)} OFF`
      : '15% OFF';

  const productTitle = meta.productTitle || WEEKEND_OFFER.productTitle;
  const image = meta.image ? productImage(meta.image) : WEEKEND_OFFER.image;

  return (
    <ModalBackdrop onClose={onClose} maxWidth="max-w-[720px]">
      <div className="relative max-h-[min(90dvh,560px)] overflow-hidden overflow-y-auto overscroll-contain rounded-3xl bg-base shadow-[0_15px_45px_rgba(0,0,0,0.08)]">
        <button
          type="button"
          className="absolute right-[18px] top-[18px] z-[12] rounded-full bg-white/85 p-2 shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
          onClick={onClose}
          aria-label="Close"
        >
          <i className="fa-solid fa-xmark" />
        </button>
        <div className="flex min-h-0 flex-col md:flex-row">
          <div className="h-48 w-full shrink-0 overflow-hidden bg-[#f3efe6] md:h-auto md:min-h-[320px] md:w-[42%]">
            <img src={image} alt={productTitle} className="block h-full w-full object-cover object-center" />
          </div>
          <div className="relative flex min-w-0 flex-1 flex-col overflow-y-auto bg-[#faf8f5] px-5 py-6 md:px-8 md:py-8">
            <span className="absolute right-[52px] top-5 rounded-full border border-deepGreen/10 bg-[#e5ece9] px-3.5 py-1.5 text-[0.72rem] font-bold uppercase text-deepGreen">
              {discountLabel}
            </span>
            <h2 className="mb-0 mt-2 pr-20 font-display text-[1.85rem] font-bold leading-tight text-[#111111] md:text-[2.35rem]">
              {item?.title || 'Weekend Offer'}
            </h2>
            <hr className="my-3.5 h-0.5 w-[60px] border-0 bg-[#d4cebc]" />
            <p className="mb-5 text-left text-[0.92rem] leading-relaxed text-[#666666]">{description}</p>
            <div className="mb-6 flex max-w-[320px] overflow-hidden rounded-xl border-[1.5px] border-dashed border-[#ebdcb9] bg-white">
              <div className="border-r border-dashed border-[#ebdcb9] bg-base px-4 py-2.5 text-[0.8rem] font-bold uppercase tracking-wide text-[#888888]">
                Use Code
              </div>
              <div className="flex-1 px-4 py-2.5 text-center text-[1.15rem] font-extrabold tracking-widest text-[#8c7a6b]">
                {promoCode}
              </div>
            </div>
            <div className="mb-4 flex items-center gap-2 text-left text-[0.86rem] text-[#555555]">
              <i className="fa-regular fa-clock" /> Valid until Sunday, 11:59 PM
            </div>
            <div className="mb-2.5 text-left text-[0.76rem] font-extrabold uppercase tracking-wide text-[#888888]">Includes:</div>
            <ul className="mb-5 list-none space-y-1.5 p-0 text-left">
              {['15% off on selected sofas', 'Free delivery within Mogadishu', 'Easy returns & 2-year warranty'].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-[0.88rem] text-[#444444]">
                  <i className="fa-regular fa-circle-check text-[#4c7c59]" /> {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex gap-3.5">
              <button
                type="button"
                className="flex-1 rounded-full border border-[#d4cebc] bg-[#fcfbf9] px-6 py-3 text-[0.95rem] font-bold text-[#4a3e35] transition hover:border-[#ebdcb9] hover:bg-[#faf6f0]"
                onClick={() => {
                  localStorage.setItem('openProductModalOnLoad', productTitle);
                  navigate('/products');
                  onClose();
                }}
              >
                View Product
              </button>
              <button
                type="button"
                className="flex-1 rounded-full border border-[#d4cebc] bg-white px-6 py-3 text-[0.95rem] font-bold text-[#4a3e35] transition hover:bg-[#faf6f0]"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
}

function CouponNotificationModal({ onClose, navigate, item }) {
  const meta = item?.metadata || {};
  const promoCode = meta.promoCode || '';
  const description = meta.description || 'Qiimo dhimis gaar ah oo kuu diyaar ah.';
  
  const discountLabel = meta.discountPercent
    ? `${meta.discountPercent}% OFF`
    : meta.discountAmount
      ? `${formatMoney(meta.discountAmount)} OFF`
      : 'Qiimo Dhimis';

  // Format restrictions message
  let restrictionMsg = '';
  if (meta.applicableCategory || meta.applicableProduct) {
    const catText = meta.applicableCategory ? `qaybta "${meta.applicableCategory}"` : '';
    const prodText = meta.applicableProduct ? `alaabta "${meta.applicableProduct}"` : '';
    restrictionMsg = `Kuuboonkan wuxuu u shaqeeyaa oo kaliya ${[catText, prodText].filter(Boolean).join(' ama ')}.`;
  }

  // Format expiration message
  let expiryMsg = 'Waqtigeedu waa xadidan yahay.';
  if (meta.expiresAt) {
    const expDate = new Date(meta.expiresAt);
    if (!isNaN(expDate.getTime())) {
      expiryMsg = `Wuxuu shaqaynayaa ilaa: ${expDate.toLocaleDateString('so-SO', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}`;
    }
  } else if (meta.durationDays) {
    expiryMsg = `Wuxuu shaqaynayaa ${meta.durationDays} maalmood oo kaliya.`;
  }

  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    showTopFloatNotification('Koodhka kuuboonka waa la koobbiyeeyay! ✅');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ModalBackdrop onClose={onClose} maxWidth="max-w-[500px]">
      <div className={compactPremiumCardClass}>
        <CloseAbsoluteBtn onClose={onClose} />
        <PremiumDeco className="mb-4">
          <SuccessCircle className="bg-[#FAF6F0] relative border-2 border-dashed border-gold">
            <i className="fa-solid fa-ticket text-[2rem] text-gold" />
          </SuccessCircle>
        </PremiumDeco>
        
        <h2 className="mb-1 font-display text-[2.1rem] font-bold text-deepGreen">
          {item?.title || 'Kuuboon Cusub!'}
        </h2>
        <span className="inline-block rounded-full bg-gold/15 px-3 py-1 text-[0.78rem] font-extrabold uppercase tracking-wider text-gold mb-3">
          {discountLabel}
        </span>
        <GoldStarSeparator />
        
        <p className="mx-auto mb-5 max-w-[360px] text-[0.92rem] leading-relaxed text-[#666666]">
          {description}
        </p>

        {/* Styled Coupon Card */}
        <div className="mb-5 rounded-2xl border-2 border-dashed border-[#e6dfcc] bg-[#FAF8F5] p-5 relative overflow-hidden flex flex-col items-center">
          {/* Half circles on sides for ticket effect */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-base" />
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-base" />
          
          <span className="text-[0.72rem] font-bold text-[#a0947e] uppercase tracking-widest mb-1.5">
            KOODHKA QIIMO DHIMISTA
          </span>
          <div className="font-mono text-2xl font-extrabold tracking-widest text-[#4a3e35] bg-white px-6 py-2 rounded-xl border border-black/[0.05] shadow-sm select-all">
            {promoCode}
          </div>
          
          <button 
            type="button" 
            onClick={handleCopy} 
            className="mt-3.5 inline-flex items-center gap-1.5 border-0 bg-transparent text-[0.82rem] font-extrabold text-deepGreen hover:text-teal transition"
          >
            <i className={copied ? "fa-solid fa-check" : "fa-regular fa-copy"} />
            {copied ? 'Waa la koobbiyeeyay' : 'Koobbi koodhka'}
          </button>
        </div>

        {/* Constraints Info Box */}
        {(restrictionMsg || expiryMsg) && (
          <div className="mb-6 rounded-[14px] border border-black/[0.04] bg-black/[0.015] px-4.5 py-3 text-left">
            {restrictionMsg && (
              <div className="flex gap-2 text-[0.82rem] text-[#666666] mb-1.5 last:mb-0">
                <span className="text-gold text-[0.9rem]"><i className="fa-solid fa-circle-info" /></span>
                <span className="font-semibold leading-normal">{restrictionMsg}</span>
              </div>
            )}
            {expiryMsg && (
              <div className="flex gap-2 text-[0.82rem] text-[#666666] last:mb-0">
                <span className="text-[#a0947e] text-[0.9rem]"><i className="fa-regular fa-clock" /></span>
                <span className="font-semibold leading-normal">{expiryMsg}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <BtnPrimary 
            onClick={() => {
              navigate('/products');
              onClose();
            }}
          >
            Ku Isticmaal Hadda (Shop)
          </BtnPrimary>
          <BtnSecondary onClick={onClose}>Xir (Close)</BtnSecondary>
        </div>
      </div>
    </ModalBackdrop>
  );
}

function RetryPaymentModal({ onClose, onSuccess, order, userPhone }) {
  const [phone, setPhone] = useState(userPhone || '+252 61 2345678');
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (!order?.orderId) {
      showTopFloatNotification('Order details not found. Please try again from your orders.', 'danger');
      return;
    }

    setPaying(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const amountText = getOrderTotalFormatted(order).replace(/[^0-9.]/g, '');
      const amount = Number(amountText) || Number(order.total) || 0;

      const response = await fetch(apiUrl('/api/payments/waafi'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          orderId: order.orderId,
          accountNo: phone.trim(),
          amount,
          paymentReference: order.paymentReference || '',
          description: `Retry payment for ${order.orderId}`,
        }),
      });
      const data = await response.json();

      if (data.success) {
        onSuccess();
        showTopFloatNotification('✅ Payment completed successfully via Waafi!');
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
    <ModalBackdrop onClose={onClose} maxWidth="max-w-[480px]">
      <div className={compactPremiumCardClass}>
        <CloseAbsoluteBtn onClose={onClose} />
        <PremiumDeco className="mb-4">
          <SuccessCircle compact className="relative bg-[#e5ebe4]">
            <i className="fa-regular fa-credit-card text-[1.65rem] text-[#4a6454]" />
            <span className="absolute -bottom-1 -right-1 text-[0.85rem] text-green-600">
              <i className="fa-solid fa-circle-check" />
            </span>
          </SuccessCircle>
        </PremiumDeco>
        <h2 className="mb-1.5 font-display text-[1.75rem] font-bold leading-tight text-deepGreen sm:text-[1.85rem]">Retry Payment</h2>
        <GoldStarSeparator />
        <p className="mx-auto mb-4 max-w-[360px] text-[0.88rem] leading-relaxed text-[#555555]">
          Your previous EVC Plus payment was not completed. Please confirm your number and try again.
        </p>

        <div className="mb-4 flex rounded-xl border border-[#f0eee8] bg-[#FAF8F5] text-left">
          <div className="flex flex-1 items-center gap-2.5 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f2ece1] text-[0.85rem] text-[#8c7a6b]">
              <i className="fa-regular fa-file-lines" />
            </div>
            <div className="min-w-0">
              <span className="block text-[0.72rem] text-[#888888]">Order ID:</span>
              <span className="block truncate text-[0.88rem] font-bold">{order.orderId}</span>
            </div>
          </div>
          <div className="w-px bg-[#f0eee8]" />
          <div className="flex flex-1 items-center gap-2.5 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f2ece1] text-[0.85rem] text-[#8c7a6b]">
              <i className="fa-solid fa-dollar-sign" />
            </div>
            <div className="min-w-0">
              <span className="block text-[0.72rem] text-[#888888]">Total Amount:</span>
              <span className="block text-[0.88rem] font-bold">{getOrderTotalFormatted(order)}</span>
            </div>
          </div>
        </div>

        <div className="mb-1.5 text-left text-[0.78rem] font-bold text-[#333333]">Payment Method</div>
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-black/[0.08] bg-white px-3.5 py-2.5 text-left">
          <span className="h-3.5 w-3.5 rounded-full border-2 border-deepGreen" />
          <span className="text-[0.88rem] font-bold">EVC Plus</span>
        </div>

        <div className="mb-1.5 text-left text-[0.78rem] font-bold text-[#333333]">EVC Phone Number</div>
        <div className="mb-1 flex items-center rounded-lg border border-black/[0.08] bg-white px-3">
          <span className="pr-2.5 text-[0.9rem] text-deepGreen"><i className="fa-solid fa-phone" /></span>
          <div className="h-5 w-px bg-gray-200" />
          <input type="tel" className="flex-1 border-0 bg-transparent px-2.5 py-2 text-[0.88rem] outline-none" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <p className="mb-4 text-left text-[0.74rem] text-[#888888]">Use the same EVC number for this payment.</p>

        <div className="flex justify-center gap-3">
          <BtnDeepGreen onClick={handlePay} disabled={paying} className="max-w-[140px] flex-none px-5 py-2.5 text-[0.88rem]">
            {paying ? 'Processing...' : 'Pay Now'}
          </BtnDeepGreen>
          <BtnCloseFooter onClick={onClose} className="max-w-[140px] px-5 py-2.5 text-[0.88rem]" />
        </div>
      </div>
    </ModalBackdrop>
  );
}

export function NotificationDetailModal({
  item,
  onClose,
  user,
  onSendFollowUp,
  sendingFollowUp,
}) {
  const navigate = useNavigate();
  const [order, setOrder] = useState(() => getLastOrderDetails());
  const [subModal, setSubModal] = useState(null);

  const orderId = item?.orderId || item?.metadata?.orderId || item?.relatedId;

  useEffect(() => {
    setSubModal(null);
  }, [item?.modalType, item?.index]);

  useEffect(() => {
    let cancelled = false;
    const type = String(item?.type || '');
    const isSupportRelated = type.startsWith('support_') || type === 'new_support_ticket';
    const isOrderRelated = !isSupportRelated && (type.includes('order') || type.includes('payment'));

    if (!item || !orderId || !isOrderRelated) {
      setOrder(getLastOrderDetails());
      return undefined;
    }

    (async () => {
      const fetched = await fetchOrderForNotification(orderId);
      if (!cancelled) setOrder(fetched || getLastOrderDetails());
    })();

    return () => {
      cancelled = true;
    };
  }, [item?.id, orderId, item?.type]);

  if (!item && !subModal) return null;

  const closeAll = () => {
    setSubModal(null);
    onClose();
  };

  if (subModal === 'orderDetails') {
    return <OrderDetailsModal order={order} onClose={() => { setSubModal(null); onClose(); }} />;
  }

  if (subModal === 'retryPayment') {
    return (
      <RetryPaymentModal
        order={order}
        userPhone={user?.phone}
        onClose={() => { setSubModal(null); onClose(); }}
        onSuccess={() => setSubModal('paymentSuccess')}
      />
    );
  }

  if (subModal === 'paymentSuccess') {
    return <PaymentSuccessModal order={order} onClose={() => { setSubModal(null); onClose(); }} />;
  }

  if (!item) return null;

  switch (item.modalType) {
    case 'order-placed':
      return <OrderPlacedModal order={order} onClose={onClose} onViewDetails={() => setSubModal('orderDetails')} />;
    case 'order-confirmed':
      return <OrderConfirmedModal order={order} onClose={onClose} onViewDetails={() => setSubModal('orderDetails')} />;
    case 'payment-success':
      return <PaymentSuccessModal order={order} onClose={onClose} />;
    case 'payment-failed':
      return <PaymentFailedModal order={order} onClose={onClose} onRetry={() => setSubModal('retryPayment')} />;
    case 'order-processing':
      return <OrderProcessingModal item={item} onClose={onClose} activeStep={item.metadata?.currentStep || 1} />;
    case 'order-payment-verified':
      return <OrderProcessingModal item={item} onClose={onClose} activeStep={2} />;
    case 'order-preparing':
      return <OrderProcessingModal item={item} onClose={onClose} activeStep={3} />;
    case 'order-shipped':
      return <OrderShippedModal item={item} order={order} onClose={onClose} />;
    case 'order-delivered':
      return <OrderDeliveredModal item={item} order={order} onClose={onClose} />;
    case 'support-replied':
      return (
        <SupportRepliedModal
          userName={user?.fullName || ''}
          notificationItem={item}
          onSendFollowUp={onSendFollowUp}
          sending={sendingFollowUp}
          onClose={onClose}
        />
      );
    case 'wishlist-available':
      return <WishlistAvailableModal item={item} navigate={navigate} onClose={onClose} />;
    case 'weekend-offer':
      return <WeekendOfferModal item={item} navigate={navigate} onClose={onClose} />;
    case 'coupon-offer':
      return <CouponNotificationModal item={item} navigate={navigate} onClose={onClose} />;
    case 'delivery-assigned':
      return <DeliveryAssignedModal item={item} onClose={onClose} />;
    case 'review-moderated':
      return <GenericNotificationModal item={item} onClose={onClose} />;
    default:
      return <GenericNotificationModal item={item} onClose={onClose} />;
  }
}


/* ═══ SECTION: NOTIFICATIONS TAB ═══ */

const ICON_WRAP_STYLES = {
  'solid-green': 'bg-[#627b6c] text-white',
  'solid-brown': 'bg-[#797166] text-white',
  'solid-yellow': 'bg-[#c39d63] text-white',
  'solid-purple': 'bg-[#8e8095] text-white',
  'solid-orange': 'bg-[#c17260] text-white',
  'solid-red': 'bg-[#fce8e6] text-[#b42318]',
};

const DOT_STYLES = {
  green: 'bg-[#4a7c59]',
  gold: 'bg-[#c39d63]',
  grey: 'hidden',
  red: 'bg-[#b42318]',
};

function NotificationIcon({ type }) {
  switch (type) {
    case 'order-placed':
      return (
        <div className="relative inline-flex items-center justify-center">
          <i className="fa-solid fa-bag-shopping" />
          <i className="fa-solid fa-clock absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-[1.5px] border-white bg-amber-500 text-[0.55rem] text-white" />
        </div>
      );
    case 'order-confirmed':
      return (
        <div className="relative inline-flex items-center justify-center">
          <i className="fa-solid fa-bag-shopping" />
          <i className="fa-solid fa-check absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-[1.5px] border-white bg-[#627b6c] text-[0.55rem] text-white" />
        </div>
      );
    case 'payment-success':
      return <i className="fa-regular fa-credit-card" />;
    case 'order-processing':
      return <i className="fa-solid fa-gear" />;
    case 'payment-failed':
      return <i className="fa-solid fa-circle-exclamation" />;
    case 'support-replied':
      return <i className="fa-solid fa-comment-dots" />;
    case 'wishlist':
      return <i className="fa-regular fa-heart" />;
    case 'coupon_offer':
      return <i className="fa-solid fa-ticket" />;
    case 'weekend-offer':
      return <i className="fa-solid fa-tag" />;
    case 'delivery-assigned':
      return <i className="fa-solid fa-truck" />;
    case 'review-moderated':
      return <i className="fa-solid fa-star" />;
    default:
      return <i className="fa-regular fa-bell" />;
  }
}

export default function ProfileNotificationsTab({
  onUnreadChange,
  supportChat,
  notifications,
}) {
  const { user } = useAuth();
  const {
    items = [],
    loading = false,
    error = null,
    unreadCount = 0,
    markRead = async () => false,
    markAllRead = async () => false,
  } = notifications || {};
  const [filter, setFilter] = useState('all');
  const [activeModal, setActiveModal] = useState(null);

  const visibleItems = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    const merged = list.map((item) => {
      if (!item) return null;
      if (item.type === 'support_replied') {
        const subject = item.metadata?.subject;
        return {
          ...item,
          desc: subject
            ? `Waxaan ka soo jawaabnay fariintaada: "${subject}"`
            : item.desc,
          unread: !item.read,
        };
      }
      return item;
    }).filter(Boolean);
    return filter === 'unread' ? merged.filter((item) => item.unread) : merged;
  }, [items, filter]);

  useEffect(() => {
    onUnreadChange?.(unreadCount);
  }, [unreadCount, onUnreadChange]);

  const handleCardClick = (item) => {
    if (!item?.id) return;
    setActiveModal(item);
    if (item.unread) markRead(item.id);
  };

  const closeModal = () => setActiveModal(null);

  return (
    <div>
      <div className="mb-5 flex w-full items-end justify-between max-md:flex-col max-md:items-start max-md:gap-3">
        <div>
          <h1 className="mb-0.5 font-display text-[2.3rem] font-bold text-deepGreen">Notifications</h1>
          <p className="text-[0.92rem] text-[#666666]">Stay updated with your account activity.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex rounded-full border border-black/[0.04] bg-[#F2ECE1] p-[3px]">
            <button
              type="button"
              className={`rounded-full border-0 px-4 py-1.5 text-[0.85rem] font-bold transition-all duration-200 ${
                filter === 'all' ? 'bg-deepGreen text-white' : 'bg-transparent text-[#4A3F35]'
              }`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`rounded-full border-0 px-4 py-1.5 text-[0.85rem] font-bold transition-all duration-200 ${
                filter === 'unread' ? 'bg-deepGreen text-white' : 'bg-transparent text-[#4A3F35]'
              }`}
              onClick={() => setFilter('unread')}
            >
              Unread
            </button>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border-[1.5px] border-black/[0.12] bg-white px-4 py-2 text-[0.85rem] font-bold text-[#111111] transition-all duration-200 hover:border-black/20 hover:bg-[#FAF9F6]"
            onClick={markAllRead}
          >
            <i className="fa-regular fa-circle-check" /> Mark all as read
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {loading && (!Array.isArray(items) || items.length === 0) ? (
          <p className="p-4 text-[#666666]">Loading notifications...</p>
        ) : null}

        {error && (!Array.isArray(items) || items.length === 0) ? (
          <p className="p-4 text-[0.88rem] text-[#666666]">
            {error}
            {String(error).toLowerCase().includes('session') ? (
              <>
                {' '}
                <Link to="/login" className="font-bold text-deepGreen underline">
                  Dib u soo gal
                </Link>
              </>
            ) : null}
          </p>
        ) : null}

        {!loading && !error && visibleItems.length === 0 ? (
          <p className="p-4 text-[#666666]">No notifications yet.</p>
        ) : null}

        <div className="flex flex-col" id="notificationsList">
          {visibleItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`mb-2 flex w-full cursor-pointer items-center gap-3.5 rounded-lg border px-4 py-2.5 text-left transition-all duration-200 hover:border-[#DCDCD8] hover:bg-[#FAF9F6] ${
                item.highlight && item.unread
                  ? 'border-[#cbd0c4] bg-[#eaeae6]'
                  : 'border-[#EAE9E4] bg-[#FCFBFA]'
              }`}
              data-status={item.unread ? 'unread' : 'read'}
              onClick={() => handleCardClick(item)}
            >
              <div
                className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-[1.15rem] ${
                  ICON_WRAP_STYLES[item.iconWrap] || 'bg-[#627b6c] text-white'
                }`}
              >
                <NotificationIcon type={item.iconType} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="mb-0.5 text-[0.88rem] font-bold text-[#333333]">{item.title}</h4>
                <p className="m-0 line-clamp-2 text-[0.8rem] leading-snug text-[#666666]">{item.desc}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="flex flex-col items-end gap-1">
                  <span className="text-right text-[0.78rem] font-medium text-[#888888]">{item.time}</span>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${DOT_STYLES[item.dot] || DOT_STYLES.grey}`} />
                </div>
                <i className="fa-solid fa-chevron-right text-[0.75rem] text-[#888888]" />
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 py-6 pb-3 text-center text-[0.82rem] font-semibold text-[#888888]">
          New notifications from your orders and support will appear here.
          <i className="fa-regular fa-bell text-[0.9rem]" />
        </div>
      </div>

      {activeModal ? (
        <NotificationDetailModal
          item={activeModal}
          onClose={closeModal}
          user={user}
          onSendFollowUp={supportChat?.sendTicketMessage}
          sendingFollowUp={supportChat?.sending}
        />
      ) : null}
    </div>
  );
}
