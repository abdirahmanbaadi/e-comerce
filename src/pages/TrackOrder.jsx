import { useEffect, useRef, useState } from 'react';
import MainNavbar from '../components/MainNavbar';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { apiUrl } from '../utils/data';
import { showTopFloatNotification } from '../utils/notifications';
import '../styles/pages/TrackOrder.css';

const ORDER_STEPS = [
  {
    key: 'processing',
    title: 'Processing',
    text: 'Your order is being prepared and verified.',
  },
  {
    key: 'shipped',
    title: 'Shipped',
    text: 'Your order has left our warehouse and is on the way.',
  },
  {
    key: 'delivered',
    title: 'Delivered',
    text: 'Your order has been delivered successfully.',
  },
];

const STATUS_LABELS = {
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function resolveStatus(order) {
  if (order?.status) return order.status;
  const step = typeof order?.currentStep === 'number' ? order.currentStep : 1;
  if (step === 0) return 'cancelled';
  if (step >= 5) return 'delivered';
  if (step >= 4) return 'shipped';
  return 'processing';
}

function getActiveStepIndex(status) {
  const index = ORDER_STEPS.findIndex((step) => step.key === status);
  return index >= 0 ? index : 0;
}

function OrderTimeline({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="order-cancelled-banner" role="status">
        <i className="fa-solid fa-ban" />
        <div>
          <strong>Order Cancelled</strong>
          <p>This order was cancelled before shipment.</p>
        </div>
      </div>
    );
  }

  const activeIndex = getActiveStepIndex(status);

  return (
    <div className="timeline">
      {ORDER_STEPS.map((step, index) => {
        let statusClass = '';
        if (index < activeIndex) statusClass = 'done';
        if (index === activeIndex) statusClass = 'active';

        return (
          <div key={step.key} className={`timeline-item ${statusClass}`.trim()}>
            <span className="timeline-dot" />
            <h4 className="timeline-heading">{step.title}</h4>
            <p className="timeline-text">{step.text}</p>
          </div>
        );
      })}
    </div>
  );
}

function PaymentStatus({ payment, paymentType }) {
  const isPaid = paymentType === 'paid';
  return (
    <span className={`status-pill ${isPaid ? 'paid' : 'pending'}`}>
      <i className={`fa-solid ${isPaid ? 'fa-circle-check' : 'fa-clock'}`} />
      {payment}
    </span>
  );
}

function OrderStatusBadge({ status }) {
  return (
    <span className={`order-status-badge order-status-badge--${status}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export default function TrackOrder() {
  const { syncFromStorage: syncAuth, user } = useAuth();
  const { syncFromStorage: syncCart } = useCart();

  const [orderId, setOrderId] = useState('');
  const [verifyPhone, setVerifyPhone] = useState('');
  const [order, setOrder] = useState(null);
  const [activities, setActivities] = useState([]);
  const [notFound, setNotFound] = useState('');
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const resultRef = useRef(null);

  useEffect(() => {
    syncAuth();
    syncCart();
  }, [syncAuth, syncCart]);

  useEffect(() => {
    const lastCode = localStorage.getItem('lastTrackingCode');
    if (lastCode) setOrderId(lastCode);
    if (user?.phone) setVerifyPhone(user.phone);
  }, [user?.phone]);

  const trackOrder = async (event) => {
    event?.preventDefault();

    const code = orderId.trim().toUpperCase();

    if (!code) {
      showTopFloatNotification('Please enter your Order ID!', 'danger');
      return;
    }

    setLoading(true);
    setNotFound('');
    setOrder(null);
    setActivities([]);

    try {
      const phoneQuery = verifyPhone.trim()
        ? `?phone=${encodeURIComponent(verifyPhone.trim())}`
        : '';
      const response = await fetch(
        apiUrl(`/api/orders/track/${encodeURIComponent(code)}${phoneQuery}`)
      );
      const data = await response.json();

      if (data.success && data.order) {
        setOrder({ ...data.order, status: resolveStatus(data.order) });
        setActivities(data.activities || []);
        requestAnimationFrame(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      } else {
        setNotFound(data.message || 'Order not found. Please check your Order ID and try again.');
      }
    } catch {
      setNotFound('Could not connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async () => {
    if (!order?.id) return;

    const confirmed = window.confirm(
      'Are you sure you want to cancel this order? This can only be done before shipment.'
    );
    if (!confirmed) return;

    setCancelling(true);

    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    let verifyPhone = order.phone;
    if (!token) {
      const entered = window.prompt(
        'Enter the phone number used when ordering to confirm cancellation:'
      );
      if (!entered?.trim()) {
        setCancelling(false);
        return;
      }
      verifyPhone = entered.trim();
    }

    try {
      const response = await fetch(apiUrl(`/api/orders/cancel/${encodeURIComponent(order.id)}`), {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ phone: verifyPhone }),
      });
      const data = await response.json();

      if (data.success && data.order) {
        setOrder({ ...data.order, status: resolveStatus(data.order) });
        setActivities((prev) => [
          ...prev,
          {
            action: 'order_cancelled',
            description: 'Order cancelled before shipment.',
            createdAt: new Date().toISOString(),
          },
        ]);
        showTopFloatNotification('Order cancelled successfully.');
      } else {
        showTopFloatNotification(data.message || 'Could not cancel this order.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not connect to the server. Please try again.', 'danger');
    } finally {
      setCancelling(false);
    }
  };

  const orderStatus = order ? resolveStatus(order) : null;
  const canCancel = orderStatus === 'processing';
  const orderItems = order?.items?.length
    ? order.items
    : order
      ? [{ title: order.product, quantity: 1, price: order.amount }]
      : [];

  const ACTIVITY_LABELS = {
    order_placed: 'Order placed',
    status_changed: 'Status updated',
    payment_updated: 'Payment updated',
    driver_assigned: 'Driver assigned',
    driver_reassigned: 'Driver reassigned',
    order_cancelled: 'Order cancelled',
    estimate_updated: 'Delivery estimate updated',
  };

  function formatActivityTime(value) {
    if (!value) return '';
    return new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <div className="trackOrder-page">
      <MainNavbar />

      <section className="track-hero text-center">
        <div className="container">
          <span className="track-label">Delivery Tracking</span>
          <h1 className="track-title">Track Your Furniture Order</h1>
          <p className="track-desc">
            Enter your Order ID to view payment status, delivery progress, and estimated delivery
            time inside Mogadishu.
          </p>
        </div>
      </section>

      <section className="track-section">
        <div className="container">
          <form className="track-search-card" onSubmit={trackOrder}>
            <div className="row g-3 align-items-end">
              <div className="col-md-10">
                <label className="form-label" htmlFor="trackingInput">
                  Order ID
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="trackingInput"
                  placeholder="Example: #MF-260703-962"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="col-md-10">
                <label className="form-label" htmlFor="trackPhoneInput">
                  Phone (for full address details)
                </label>
                <input
                  type="tel"
                  className="form-control"
                  id="trackPhoneInput"
                  placeholder="Phone used at checkout"
                  value={verifyPhone}
                  onChange={(e) => setVerifyPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>

              <div className="col-md-2">
                <button type="submit" className="track-btn" disabled={loading}>
                  <i className={`fa-solid ${loading ? 'fa-spinner fa-spin' : 'fa-magnifying-glass'} me-2`} />
                  {loading ? 'Searching…' : 'Track'}
                </button>
              </div>
            </div>

            <div className="hint-box">
              <strong>Tip:</strong> Haddii aad checkout ka timid, isticmaal Order ID-ga modal-ka kuu soo
              baxay (tusaale: #MF-260703-962).
            </div>

            {notFound && (
              <div className="not-found not-found--visible" role="alert">
                <i className="fa-solid fa-circle-exclamation me-2" />
                {notFound}
              </div>
            )}

            {order && order.verificationHint && !order.phoneVerified && (
              <div className="hint-box mt-2">
                <strong>Privacy:</strong> {order.verificationHint}
              </div>
            )}
          </form>

          {order && (
            <div className="order-result order-result--visible" ref={resultRef}>
              <div className="order-summary-card">
                <div className="summary-header-row">
                  <div>
                    <h2 className="summary-title">Order Summary</h2>
                    <p className="summary-sub">
                      {order.product} • {order.address}
                    </p>
                  </div>
                  <OrderStatusBadge status={orderStatus} />
                </div>

                <div className="row g-3">
                  <div className="col-md-3">
                    <div className="info-box">
                      <div className="info-label">Order ID</div>
                      <div className="info-value">{order.id}</div>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="info-box">
                      <div className="info-label">Customer</div>
                      <div className="info-value">{order.customer}</div>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="info-box">
                      <div className="info-label">Total Amount</div>
                      <div className="info-value">{order.amount}</div>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="info-box">
                      <div className="info-label">Payment</div>
                      <PaymentStatus payment={order.payment} paymentType={order.paymentType} />
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="info-box">
                      <div className="info-label">Delivery Address</div>
                      <div className="info-value">{order.address}</div>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="info-box">
                      <div className="info-label">Driver</div>
                      <div className="info-value">{order.driver}</div>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="info-box">
                      <div className="info-label">Preferred Delivery</div>
                      <div className="info-value">
                        {order.deliveryDate || order.deliveryTime
                          ? `${order.deliveryDate || '—'}${order.deliveryTime ? ` at ${order.deliveryTime}` : ''}`
                          : 'Not specified'}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="info-box">
                      <div className="info-label">Estimated Delivery</div>
                      <div className="info-value">{order.estimate}</div>
                    </div>
                  </div>
                </div>
              </div>

              {orderItems.length > 0 && (
                <div className="order-summary-card mt-3">
                  <h3 className="summary-title" style={{ fontSize: '1.1rem' }}>Order Items</h3>
                  <ul className="list-unstyled mb-0 mt-3">
                    {orderItems.map((item, index) => (
                      <li
                        key={`${item.title}-${index}`}
                        className="d-flex justify-content-between align-items-center py-2 border-bottom"
                      >
                        <span>
                          {item.title}
                          <span className="text-muted ms-2">×{item.quantity || 1}</span>
                        </span>
                        <span className="fw-semibold">
                          {typeof item.price === 'number'
                            ? `$${Number(item.price * (item.quantity || 1)).toFixed(3)}`
                            : item.price || '—'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="timeline-card">
                <div className="timeline-card-header">
                  <h2 className="timeline-title">Order Status</h2>
                  {canCancel && (
                    <button
                      type="button"
                      className="cancel-order-btn"
                      onClick={cancelOrder}
                      disabled={cancelling}
                    >
                      <i className={`fa-solid ${cancelling ? 'fa-spinner fa-spin' : 'fa-xmark'}`} />
                      {cancelling ? 'Cancelling…' : 'Cancel Order'}
                    </button>
                  )}
                </div>
                <OrderTimeline status={orderStatus} />

                {activities.length > 0 && (
                  <div className="order-activity-log mt-4 pt-3 border-top">
                    <h3 className="timeline-title" style={{ fontSize: '1rem' }}>Activity Log</h3>
                    <ul className="list-unstyled mb-0 mt-3">
                      {activities.map((entry, index) => (
                        <li key={entry.id || index} className="mb-3">
                          <div className="fw-semibold">
                            {ACTIVITY_LABELS[entry.action] || entry.action}
                          </div>
                          {entry.description && (
                            <div className="text-secondary small">{entry.description}</div>
                          )}
                          <div className="text-muted small">{formatActivityTime(entry.createdAt)}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
