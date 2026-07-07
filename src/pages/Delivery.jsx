import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { apiUrl } from '../utils/data';
import { showTopFloatNotification } from '../utils/notifications';

function normalizePhone(phone) {
  return (phone || '').replace(/\D/g, '');
}

function getStepLabel(step) {
  if (step >= 5) return 'Delivered';
  if (step >= 4) return 'Out for delivery';
  if (step >= 3) return 'Ready to dispatch';
  return 'Preparing';
}

function statusLabel(status, activeDeliveries = 0) {
  if (status === 'offline') return 'Offline';
  if (status === 'busy') return `Busy (${activeDeliveries}/3)`;
  return 'Available';
}

export default function Delivery() {
  const { user, logout } = useAuth();
  const { items: notifications, unreadCount } = useNotifications({
    enabled: Boolean(user?.isLoggedIn),
    pollMs: 15000,
  });
  const newAssignments = useMemo(
    () => notifications.filter((n) => n.type === 'delivery_assigned' && n.unread).length,
    [notifications]
  );
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [driverStatus, setDriverStatus] = useState('available');
  const [activeDeliveries, setActiveDeliveries] = useState(0);
  const [statusSaving, setStatusSaving] = useState(false);

  const loadDriverStatus = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(apiUrl('/api/drivers/my-status'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDriverStatus(data.driverStatus || 'available');
        setActiveDeliveries(data.activeDeliveries || 0);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(apiUrl('/api/orders'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    loadDriverStatus();
    const id = setInterval(() => {
      loadOrders();
      loadDriverStatus();
    }, 30000);
    return () => clearInterval(id);
  }, [loadOrders, loadDriverStatus]);

  const stats = useMemo(() => {
    const active = orders.filter((o) => (o.currentStep || 1) < 5 && o.status !== 'cancelled').length;
    const done = orders.filter((o) => (o.currentStep || 0) >= 5 || o.status === 'delivered').length;
    return { active, done };
  }, [orders]);

  const toggleAvailability = async () => {
    const nextStatus = driverStatus === 'offline' ? 'available' : 'offline';
    setStatusSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('/api/drivers/my-status'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setDriverStatus(data.driverStatus);
        setActiveDeliveries(data.activeDeliveries || 0);
        showTopFloatNotification(data.message);
      } else {
        showTopFloatNotification(data.message || 'Could not update status', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not update availability', 'danger');
    } finally {
      setStatusSaving(false);
    }
  };

  const updateOrder = async (order, nextStep, estimate) => {
    setUpdatingId(order.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/orders/${encodeURIComponent(order.id)}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentStep: nextStep, estimate }),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('✅ Order updated!');
        await loadOrders();
        await loadDriverStatus();
      } else {
        showTopFloatNotification(`❌ ${data.message}`, 'danger');
      }
    } catch {
      showTopFloatNotification('❌ Update failed', 'danger');
    } finally {
      setUpdatingId(null);
    }
  };

  const firstName = user?.fullName?.split(' ')[0] || 'Driver';
  const isOffline = driverStatus === 'offline';

  return (
    <div className="delivery-page">
      <header className="delivery-header">
        <Link to="/" className="delivery-brand">
          <span>MF</span>
          <strong>Delivery</strong>
        </Link>
        <button type="button" className="delivery-logout" onClick={logout}>
          <i className="fa-solid fa-right-from-bracket" />
        </button>
      </header>

      <main className="delivery-main">
        <section className="delivery-greeting">
          <h1>Hello, {firstName} 👋</h1>
          <p>Orders assigned to you today</p>
        </section>

        <section className="delivery-availability-bar">
          <div>
            <span className={`delivery-status-pill delivery-status-pill--${driverStatus}`}>
              {statusLabel(driverStatus, activeDeliveries)}
            </span>
            <span className="delivery-status-meta">
              {activeDeliveries} active {activeDeliveries === 1 ? 'delivery' : 'deliveries'}
              {newAssignments > 0 ? ` · ${newAssignments} new assignment${newAssignments === 1 ? '' : 's'}` : ''}
            </span>
          </div>
          <button
            type="button"
            className="delivery-btn delivery-btn--outline"
            disabled={statusSaving || (driverStatus === 'busy' && !isOffline)}
            onClick={toggleAvailability}
          >
            {statusSaving ? 'Saving…' : isOffline ? 'Go Available' : 'Go Offline'}
          </button>
        </section>

        <section className="delivery-stats">
          <div className="delivery-stat">
            <span className="delivery-stat-value">{stats.active}</span>
            <span className="delivery-stat-label">Active</span>
          </div>
          <div className="delivery-stat">
            <span className="delivery-stat-value">{stats.done}</span>
            <span className="delivery-stat-label">Completed</span>
          </div>
        </section>

        {loading ? (
          <p className="delivery-empty">
            <i className="fa-solid fa-spinner fa-spin me-2" />
            Loading deliveries from server…
          </p>
        ) : isOffline ? (
          <div className="delivery-empty-card">
            <i className="fa-solid fa-moon" />
            <h2>You are offline</h2>
            <p>Go available to receive new delivery assignments from admin.</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="delivery-empty-card">
            <i className="fa-solid fa-truck" />
            <h2>No deliveries yet</h2>
            <p>Admin will assign orders to you here.</p>
          </div>
        ) : (
          <div className="delivery-list">
            {orders.map((order) => {
              const step = order.currentStep || 1;
              const isDelivered = step >= 5 || order.status === 'delivered';
              const phoneDigits = normalizePhone(order.phone);
              const telHref = phoneDigits ? `tel:${phoneDigits.startsWith('252') ? '+' : '+252'}${phoneDigits.replace(/^252|^0/, '')}` : undefined;
              const mapsQuery = encodeURIComponent(order.address || '');
              const busy = updatingId === order.id;

              return (
                <article key={order.id} className={`delivery-card ${isDelivered ? 'delivery-card--done' : ''}`}>
                  <div className="delivery-card-top">
                    <span className="delivery-order-id">{order.id}</span>
                    <span className="delivery-step-badge">{getStepLabel(step)}</span>
                  </div>
                  <h3>{order.customer}</h3>
                  <p className="delivery-address">
                    <i className="fa-solid fa-location-dot" /> {order.address}
                  </p>
                  <p className="delivery-product">{order.product}</p>
                  {(order.deliveryDate || order.deliveryTime) && (
                    <p className="delivery-slot">
                      <i className="fa-solid fa-calendar-day" /> Preferred:{' '}
                      {[order.deliveryDate, order.deliveryTime].filter(Boolean).join(' at ')}
                    </p>
                  )}
                  <p className="delivery-amount">{order.amount}</p>
                  {order.estimate && <p className="delivery-estimate">{order.estimate}</p>}

                  <div className="delivery-actions-row">
                    {telHref && (
                      <a href={telHref} className="delivery-action delivery-action--call">
                        <i className="fa-solid fa-phone" /> Call
                      </a>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                      target="_blank"
                      rel="noreferrer"
                      className="delivery-action delivery-action--map"
                    >
                      <i className="fa-solid fa-map-location-dot" /> Map
                    </a>
                  </div>

                  {!isDelivered && (
                    <div className="delivery-status-actions">
                      {step < 4 && (
                        <button
                          type="button"
                          className="delivery-btn delivery-btn--primary"
                          disabled={busy}
                          onClick={() => updateOrder(order, 4, 'Out for delivery — on the way')}
                        >
                          Start Delivery
                        </button>
                      )}
                      {step >= 4 && step < 5 && (
                        <button
                          type="button"
                          className="delivery-btn delivery-btn--success"
                          disabled={busy}
                          onClick={() => updateOrder(order, 5, 'Delivered successfully')}
                        >
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
