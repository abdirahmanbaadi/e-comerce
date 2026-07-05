import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductsContext';
import { apiUrl } from '../../utils/data';
import { formatMoney, productImage } from '../../utils/format';
import { downloadInvoice } from '../../utils/invoiceActions';
import { getDeliveryBadge, getPaymentBadge, resolveOrderStatus } from '../../utils/orderStatus';
import { showTopFloatNotification } from '../../utils/notifications';

function findProductImage(products, title) {
  if (!title) return '';
  const match = products.find(
    (p) => p.title?.toLowerCase() === title.toLowerCase() || title.toLowerCase().includes(p.title?.toLowerCase())
  );
  return match?.images?.[0] ? productImage(match.images[0]) : '';
}

function countOrderItems(order) {
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0);
  }
  return 1;
}

export default function ProfileOrdersTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { products } = useProducts();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancellingId, setCancellingId] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(apiUrl('/api/orders'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!cancelled && data.success) {
          setOrders(
            (data.orders || []).map((order) => ({
              ...order,
              status: resolveOrderStatus(order),
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.toLowerCase().trim();
    return orders.filter((order) => {
      const orderId = `#${order.id}`.toLowerCase();
      const delivery = getDeliveryBadge(order.status);
      const payment = getPaymentBadge(order.paymentType);
      const deliveryKey = delivery.className;
      const paymentKey = payment.label.toLowerCase();

      const matchesSearch = !query || orderId.includes(query) || order.id.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' && paymentKey === 'paid') ||
        (statusFilter === 'pending' && paymentKey === 'pending') ||
        deliveryKey === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const handleTrack = (orderId) => {
    localStorage.setItem('lastTrackingCode', orderId);
    navigate('/track-order');
  };

  const handleCancel = async (order) => {
    if (resolveOrderStatus(order) !== 'processing') {
      showTopFloatNotification('This order can no longer be cancelled.', 'danger');
      return;
    }

    const confirmed = window.confirm(
      `Cancel order ${order.id}? This can only be done before shipment.`
    );
    if (!confirmed) return;

    setCancellingId(order.id);
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const response = await fetch(apiUrl(`/api/orders/cancel/${encodeURIComponent(order.id)}`), {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ phone: user?.phone || order.phone }),
      });
      const data = await response.json();

      if (data.success && data.order) {
        setOrders((prev) =>
          prev.map((item) =>
            item.id === order.id ? { ...item, ...data.order, status: resolveOrderStatus(data.order) } : item
          )
        );
        showTopFloatNotification('Order cancelled successfully.');
      } else {
        showTopFloatNotification(data.message || 'Could not cancel this order.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not connect to the server. Please try again.', 'danger');
    } finally {
      setCancellingId('');
    }
  };

  return (
    <div className="pf-tab active">
      <h1 className="pf-main-title">My Orders</h1>
      <p className="pf-main-sub">View and track your order history</p>

      <div className="pf-generic-card">
        <div className="pf-form-title" style={{ marginBottom: '20px' }}>
          Order History
        </div>

        <div className="pf-orders-controls">
          <div className="pf-search-box">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              type="text"
              className="pf-search-input"
              placeholder="Search by Order ID"
              id="orderSearchInput"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="pf-filter-box">
            <i className="fa-solid fa-filter" />
            <select
              className="pf-filter-select"
              id="orderStatusFilter"
              style={{ paddingLeft: '38px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="delivered">Delivered</option>
              <option value="out-for-delivery">Out for Delivery</option>
              <option value="processing">Processing</option>
            </select>
          </div>
        </div>

        <div className="pf-orders-scrollable" style={{ overflowX: 'auto' }}>
          <table className="pf-orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Product</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment Status</th>
                <th>Delivery Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="ordersTableBody">
              {loading && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px' }}>
                    Loading orders...
                  </td>
                </tr>
              )}
              {!loading && filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#888' }}>
                    No orders found. <Link to="/products">Start shopping</Link>
                  </td>
                </tr>
              )}
              {!loading &&
                filteredOrders.map((order) => {
                  const imgSrc = findProductImage(products, order.product);
                  const payment = getPaymentBadge(order.paymentType);
                  const delivery = getDeliveryBadge(order.status);
                  const amountNum = parseFloat(String(order.amount).replace(/[^0-9.]/g, '')) || 0;
                  const itemCount = countOrderItems(order);
                  const canCancel = resolveOrderStatus(order) === 'processing';

                  return (
                    <tr key={order.id}>
                      <td className="pf-order-id">#{order.id}</td>
                      <td className="pf-order-date">{order.date}</td>
                      <td>
                        {imgSrc ? (
                          <img src={imgSrc} alt={order.product} className="pf-order-item-img" />
                        ) : (
                          <div
                            className="pf-order-item-img"
                            style={{
                              background: '#f3f4f6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#9ca3af',
                            }}
                          >
                            <i className="fa-solid fa-couch" />
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="pf-order-item-info">
                          <span className="pf-order-item-title">{order.product}</span>
                          <span className="pf-order-item-qty">Qty: {itemCount}</span>
                        </div>
                      </td>
                      <td className="pf-order-total" style={{ fontWeight: 700 }}>
                        {order.amount?.startsWith('$') ? order.amount : formatMoney(amountNum)}
                      </td>
                      <td>
                        <span className={`pf-status-badge ${payment.className}`}>{payment.label}</span>
                      </td>
                      <td>
                        <span className={`pf-status-badge ${delivery.className}`}>{delivery.label}</span>
                        {(order.deliveryDate || order.deliveryTime) && (
                          <div className="small text-muted mt-1">
                            {order.deliveryDate}
                            {order.deliveryTime ? ` ${order.deliveryTime}` : ''}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1 align-items-start">
                          <button
                            type="button"
                            className="pf-change-link border-0 bg-transparent p-0"
                            onClick={() => handleTrack(order.id)}
                          >
                            Track
                          </button>
                          <button
                            type="button"
                            className="pf-change-link border-0 bg-transparent p-0"
                            onClick={() =>
                              downloadInvoice({
                                trackingCode: order.id,
                                customer: order.customer,
                                phone: order.phone,
                                address: order.address,
                                payment: order.payment,
                                paymentMethod: order.paymentMethod,
                                items: order.items || [{ title: order.product, quantity: 1, price: amountNum }],
                                total: amountNum,
                                deliveryDate: order.deliveryDate,
                                deliveryTime: order.deliveryTime,
                              })
                            }
                          >
                            PDF
                          </button>
                          {canCancel && (
                            <button
                              type="button"
                              className="pf-change-link border-0 bg-transparent p-0 text-danger"
                              disabled={cancellingId === order.id}
                              onClick={() => handleCancel(order)}
                            >
                              {cancellingId === order.id ? 'Cancelling…' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
