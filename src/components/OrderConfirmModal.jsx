import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import InvoiceLetter from './InvoiceLetter';
import { downloadInvoice } from '../utils/invoiceActions';
import '../styles/order-confirm-modal.css';
import '../styles/invoice.css';

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

  if (showInvoice) {
    return (
      <div className="ocm-overlay" role="presentation">
        <div
          className="ocm-dialog ocm-dialog--invoice"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invoiceViewTitle"
        >
          <button type="button" className="ocm-back" onClick={() => setShowInvoice(false)}>
            <i className="fa-solid fa-arrow-left" />
            Back
          </button>

          <InvoiceLetter order={order} variant="full" />

          <button
            type="button"
            className="invoice-action-btn invoice-action-btn--download invoice-action-btn--full"
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
    <div className="ocm-overlay" onClick={onClose} role="presentation">
      <div
        className="ocm-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="orderConfirmTitle"
      >
        <header className="ocm-header">
          <div className="ocm-check" aria-hidden="true">
            <i className="fa-solid fa-check" />
          </div>
          <h2 id="orderConfirmTitle" className="ocm-title">
            Order Placed Successfully
          </h2>
          <p className="ocm-desc">
            Your order has been received. Use the tracking code below to follow your delivery.
          </p>
        </header>

        <section className="ocm-receipt" aria-label="Order summary">
          <div className="ocm-receipt-code">
            <span className="ocm-receipt-code__label">Tracking Code</span>
            <strong className="ocm-receipt-code__value">{order.trackingCode}</strong>
          </div>

          <dl className="ocm-receipt-list">
            <div className="ocm-receipt-item">
              <dt>Customer</dt>
              <dd>{order.customer}</dd>
            </div>
            <div className="ocm-receipt-item">
              <dt>Payment</dt>
              <dd>{order.payment}</dd>
            </div>
            {order.transactionId && (
              <div className="ocm-receipt-item">
                <dt>Transaction ID</dt>
                <dd>{order.transactionId}</dd>
              </div>
            )}
            {order.paymentReference && (
              <div className="ocm-receipt-item">
                <dt>Payment Reference</dt>
                <dd>{order.paymentReference}</dd>
              </div>
            )}
            {(order.deliveryDate || order.deliveryTime) && (
              <div className="ocm-receipt-item">
                <dt>Preferred Delivery</dt>
                <dd>
                  {order.deliveryDate}
                  {order.deliveryTime ? ` at ${order.deliveryTime}` : ''}
                </dd>
              </div>
            )}
          </dl>

          <div className="ocm-receipt-total">
            <span>Total</span>
            <strong>{order.total}</strong>
          </div>
        </section>

        <div className="ocm-actions">
          <Link to="/track-order" className="ocm-btn ocm-btn--primary" onClick={onClose}>
            <i className="fa-solid fa-truck-fast" />
            Track Order
          </Link>

          <Link to="/products" className="ocm-btn ocm-btn--outline" onClick={onClose}>
            <i className="fa-solid fa-bag-shopping" />
            Continue Shopping
          </Link>

          <button
            type="button"
            className="ocm-btn ocm-btn--accent"
            onClick={() => setShowInvoice(true)}
          >
            <i className="fa-solid fa-file-invoice" />
            View Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
