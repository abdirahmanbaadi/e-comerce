/**
 * ADMIN ORDERS TAB — list, filters, stats, edit modal (Tailwind)
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiUrl, fetchWithTimeout } from '../../utils/data';
import { productImage } from '../../utils/format';
import { showTopFloatNotification } from '../../utils/notifications';
import { AppSearchField } from '../nav/StoreNavbar';
import {
  ADM_TABLE_CARD,
  ADM_TABLE,
  ADM_LABEL,
  ADM_INPUT,
  ADM_SELECT,
  BTN_PRIMARY,
  BTN_GHOST,
  BTN_SUCCESS,
  STAT_CARD,
  ADMIN_FETCH_TIMEOUT,
  authHeaders,
  token,
  getOrderStatusLabel,
  getOrderPaymentLabel,
  orderStatusBadgeClass,
  paymentBadgeClass,
  getDriverAssignmentMeta,
  buildDriverAssignmentHint,
  isOrderInDateRange,
  formatActivityLabel,
  formatActivityIcon,
  formatLastLogin,
  isDriverSelectable,
  driverOptionLabel,
} from './adminShared.js';

const ORDER_PAGE_SIZE = 7;

const STEP_ESTIMATES = [
  'Waiting for order confirmation',
  'Payment verified. Preparing order',
  'Preparing order for dispatch',
  'Out for delivery via driver',
  'Delivered successfully',
];

const STATUS_FILTERS = [
  { value: 'all', label: 'All Status' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Shipped', label: 'Shipped' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Processing', label: 'Processing' },
];

const PAYMENT_FILTERS = [
  { value: 'all', label: 'All Payment' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Failed', label: 'Failed' },
];

const DATE_FILTERS = [
  { value: 'all', label: 'All Date' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
];

const DELIVERY_STEPS = [
  { value: 1, label: 'Step 1: Order Placed' },
  { value: 2, label: 'Step 2: Payment Verified' },
  { value: 3, label: 'Step 3: Preparing Order' },
  { value: 4, label: 'Step 4: Out for Delivery' },
  { value: 5, label: 'Step 5: Delivered' },
];

function formatTrend(trend) {
  if (trend === null || trend === undefined) return null;
  const up = trend >= 0;
  return { up, label: `${up ? '+' : ''}${trend}%` };
}

function TrendBadge({ trend, fallback = '—' }) {
  const formatted = formatTrend(trend);
  if (!formatted) {
    return (
      <span className="inline-block rounded px-1.5 py-0.5 text-[0.65rem] font-bold text-emerald-600 [.admin-dark_&]:text-emerald-400">
        {fallback}
      </span>
    );
  }
  const { up, label } = formatted;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.65rem] font-bold ${
        up
          ? 'bg-emerald-500/10 text-emerald-600 [.admin-dark_&]:text-emerald-400'
          : 'bg-red-500/10 text-red-600 [.admin-dark_&]:text-red-400'
      }`}
    >
      <i className={`fa-solid fa-arrow-${up ? 'up' : 'down'}`} aria-hidden="true" />
      {label}
    </span>
  );
}

function OrderStatCard({ label, value, trend, trendFallback, icon, iconClass }) {
  return (
    <div className={`${STAT_CARD} gap-3 p-[14px_18px]`}>
      <div className="min-w-0">
        <p className="mb-1 text-[0.72rem] font-extrabold uppercase tracking-wide text-gray-500 [.admin-dark_&]:text-gray-400">
          {label}
        </p>
        <p className="font-display text-[1.55rem] font-bold leading-tight text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
          {value}
        </p>
        <div className="mt-1">
          <TrendBadge trend={trend} fallback={trendFallback} />
        </div>
      </div>
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconClass}`}
      >
        <i className={`fa-solid ${icon} text-[1.1rem]`} aria-hidden="true" />
      </div>
    </div>
  );
}

function OrderBreakdown({ breakdown }) {
  if (!breakdown) {
    return <p className="text-[0.82rem] text-gray-400">Loading breakdown…</p>;
  }
  return (
    <div className="space-y-1 text-[0.84rem]">
      <div className="flex justify-between">
        <span className="text-gray-500 [.admin-dark_&]:text-gray-400">Items</span>
        <span className="font-semibold">{breakdown.itemCount || 0}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500 [.admin-dark_&]:text-gray-400">Subtotal</span>
        <span className="font-semibold">${Number(breakdown.subtotal || 0).toFixed(3)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500 [.admin-dark_&]:text-gray-400">Delivery</span>
        <span className="font-semibold">${Number(breakdown.deliveryFee || 0).toFixed(3)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500 [.admin-dark_&]:text-gray-400">Discount</span>
        <span className="font-semibold">-${Number(breakdown.discount || 0).toFixed(3)}</span>
      </div>
      {breakdown.couponCode && (
        <div className="flex justify-between">
          <span className="text-gray-500 [.admin-dark_&]:text-gray-400">Coupon</span>
          <span className="font-semibold">{breakdown.couponCode}</span>
        </div>
      )}
      <div className="mt-2 flex justify-between border-t border-gray-100 pt-2 [.admin-dark_&]:border-white/10">
        <span className="font-bold text-gray-900 [.admin-dark_&]:text-gray-100">Grand Total</span>
        <span className="font-bold text-emerald-600 [.admin-dark_&]:text-emerald-400">
          ${Number(breakdown.grandTotal || 0).toFixed(3)}
        </span>
      </div>
    </div>
  );
}

function ActivityTimeline({ activities }) {
  if (!activities?.length) {
    return (
      <p className="text-[0.82rem] text-gray-400 [.admin-dark_&]:text-gray-500">
        No activity recorded yet for this order.
      </p>
    );
  }
  return (
    <div className="space-y-0">
      {activities.map((item, idx) => (
        <div
          key={`${item.action}-${item.createdAt}-${idx}`}
          className="mb-3 flex items-start gap-3 border-b border-gray-100 pb-3 last:mb-0 last:border-0 [.admin-dark_&]:border-white/10"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-deepGreen [.admin-dark_&]:bg-emerald-500/10 [.admin-dark_&]:text-emerald-300">
            <i className={`fa-solid ${formatActivityIcon(item.action)} text-[0.75rem]`} aria-hidden="true" />
          </div>
          <div>
            <div className="text-[0.84rem] font-semibold text-gray-900 [.admin-dark_&]:text-gray-100">
              {formatActivityLabel(item.action)}
            </div>
            {item.description && (
              <div className="text-[0.78rem] text-gray-500 [.admin-dark_&]:text-gray-400">{item.description}</div>
            )}
            <div className="text-[0.72rem] text-gray-400">{formatLastLogin(item.createdAt)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function OrderItemsList({ order }) {
  if (order.items?.length) {
    return (
      <div className="space-y-2">
        {order.items.map((item, idx) => (
          <div
            key={`${item.title}-${idx}`}
            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/80 p-2.5 [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-white/[0.03]"
          >
            <img
              src={productImage(item.image || 'product-images/hero1.jpeg')}
              alt=""
              className="h-12 w-12 shrink-0 rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.src = productImage('product-images/hero1.jpeg');
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[0.84rem] font-bold text-gray-900 [.admin-dark_&]:text-gray-100">
                {item.title}
              </div>
              <div className="text-[0.78rem] text-gray-500 [.admin-dark_&]:text-gray-400">
                {item.category || 'Furniture'} • Qty: {item.quantity}
              </div>
            </div>
            <span className="shrink-0 text-[0.84rem] font-bold text-gray-900 [.admin-dark_&]:text-gray-100">
              ${Number(item.price * item.quantity).toLocaleString()}.00
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3 [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-white/[0.03]">
      <div className="text-[0.84rem] font-bold text-gray-900 [.admin-dark_&]:text-gray-100">{order.product}</div>
      <div className="text-[0.78rem] text-gray-500 [.admin-dark_&]:text-gray-400">Default catalog order description</div>
      <div className="mt-1 text-[0.84rem] font-bold text-gray-900 [.admin-dark_&]:text-gray-100">{order.amount}</div>
    </div>
  );
}

function OrderEditModal({ open, order, onClose, onSaved }) {
  const [drivers, setDrivers] = useState([]);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payment, setPayment] = useState('Pending');
  const [deliveryStep, setDeliveryStep] = useState(1);
  const [assignedDriverId, setAssignedDriverId] = useState('');
  const [estimate, setEstimate] = useState('');

  const loadDrivers = useCallback(async () => {
    if (!token()) return;
    try {
      const res = await fetch(apiUrl('/api/drivers/approved'), {
        headers: authHeaders(false),
      });
      const data = await res.json();
      if (data.success) setDrivers(data.drivers || []);
    } catch {
      /* ignore */
    }
  }, []);

  const loadDetails = useCallback(async (orderId) => {
    if (!token()) return;
    setDetailsLoading(true);
    setDetails(null);
    try {
      const res = await fetch(apiUrl(`/api/orders/${encodeURIComponent(orderId)}/details`), {
        headers: authHeaders(false),
      });
      const data = await res.json();
      if (data.success) setDetails(data);
    } catch {
      /* ignore */
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !order) return;
    setPayment(order.paymentType === 'paid' ? 'Paid' : 'Pending');
    setDeliveryStep(order.currentStep || 1);
    setAssignedDriverId(order.assignedDriverId || '');
    setEstimate(order.estimate === 'Waiting for order confirmation' ? '' : order.estimate || '');
    setDetails(null);
    loadDrivers();
    loadDetails(order.id);
  }, [open, order, loadDrivers, loadDetails]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!order) return;
    setSaving(true);

    let finalEstimate = estimate.trim();
    if (!finalEstimate) {
      finalEstimate = STEP_ESTIMATES[deliveryStep - 1] || 'Processing';
    }

    const payload = {
      payment,
      paymentType: payment === 'Paid' ? 'paid' : 'pending',
      currentStep: deliveryStep,
      estimate: finalEstimate,
    };

    const orderIdEncoded = encodeURIComponent(order.id);

    try {
      if (assignedDriverId) {
        const assignRes = await fetch(apiUrl(`/api/orders/${orderIdEncoded}/assign`), {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ assignedDriverId }),
        });
        const assignData = await assignRes.json();
        if (!assignData.success) {
          showTopFloatNotification(assignData.message || 'Could not assign driver.', 'danger');
          setSaving(false);
          return;
        }
      }

      const res = await fetch(apiUrl(`/api/orders/${orderIdEncoded}`), {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        showTopFloatNotification(`Order '${order.id}' status updated successfully!`);
        window.dispatchEvent(new CustomEvent('admin-orders-invalidate'));
        onSaved();
        onClose();
      } else {
        showTopFloatNotification(data.message || 'Update failed.', 'danger');
      }
    } catch {
      showTopFloatNotification('An error occurred while communicating with the server!', 'danger');
    } finally {
      setSaving(false);
    }
  };

  if (!open || !order) return null;

  const deliverySlot = [order.deliveryDate, order.deliveryTime].filter(Boolean).join(' at ');
  const paymentRef =
    details?.transactions?.[0]?.referenceId || details?.transactions?.[0]?.transactionId || '—';

  return (
    <div
      className="fixed inset-0 z-[1060] flex items-center justify-center bg-deepGreen/45 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-[0_25px_60px_rgba(0,0,0,0.22)] [.admin-dark_&]:bg-[#1a2421]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="orderEditModalTitle"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
          <h3
            id="orderEditModalTitle"
            className="font-display text-xl font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]"
          >
            Manage Order Details
          </h3>
          <button
            type="button"
            className="text-2xl text-gray-500 hover:text-gray-800 [.admin-dark_&]:text-gray-400"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <h4 className="mb-3 text-[0.82rem] font-extrabold uppercase tracking-wide text-deepGreen [.admin-dark_&]:text-emerald-300">
                Customer Information
              </h4>
              <div className="space-y-2 text-[0.86rem]">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500 [.admin-dark_&]:text-gray-400">Customer Name:</span>
                  <span className="font-semibold text-gray-900 [.admin-dark_&]:text-gray-100">{order.customer}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500 [.admin-dark_&]:text-gray-400">Phone Number:</span>
                  <span className="font-semibold text-gray-900 [.admin-dark_&]:text-gray-100">{order.phone || '---'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500 [.admin-dark_&]:text-gray-400">Shipping Address:</span>
                  <span className="text-right font-semibold text-gray-900 [.admin-dark_&]:text-gray-100">
                    {order.address || 'Mogadishu Delivery Address'}
                  </span>
                </div>
              </div>

              <h4 className="mb-3 mt-5 text-[0.82rem] font-extrabold uppercase tracking-wide text-deepGreen [.admin-dark_&]:text-emerald-300">
                Order Metadata
              </h4>
              <div className="space-y-2 text-[0.86rem]">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500 [.admin-dark_&]:text-gray-400">Order Date:</span>
                  <span className="font-semibold text-gray-900 [.admin-dark_&]:text-gray-100">{order.date || '---'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500 [.admin-dark_&]:text-gray-400">Preferred Delivery:</span>
                  <span className="font-semibold text-gray-900 [.admin-dark_&]:text-gray-100">
                    {deliverySlot || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500 [.admin-dark_&]:text-gray-400">Total Amount:</span>
                  <span className="font-extrabold text-deepGreen [.admin-dark_&]:text-emerald-300">{order.amount}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500 [.admin-dark_&]:text-gray-400">Payment Reference:</span>
                  <span className="font-semibold text-gray-900 [.admin-dark_&]:text-gray-100">{paymentRef}</span>
                </div>
              </div>

              <h4 className="mb-2 mt-4 text-[0.82rem] font-extrabold uppercase tracking-wide text-deepGreen [.admin-dark_&]:text-emerald-300">
                Order Breakdown
              </h4>
              {detailsLoading ? (
                <p className="text-[0.82rem] text-gray-400">
                  <i className="fa-solid fa-spinner fa-spin me-2" />
                  Loading breakdown…
                </p>
              ) : (
                <OrderBreakdown breakdown={details?.breakdown} />
              )}
            </div>

            <div>
              <h4 className="mb-3 text-[0.82rem] font-extrabold uppercase tracking-wide text-deepGreen [.admin-dark_&]:text-emerald-300">
                Purchased Items
              </h4>
              <OrderItemsList order={order} />

              <h4 className="mb-3 mt-5 text-[0.82rem] font-extrabold uppercase tracking-wide text-deepGreen [.admin-dark_&]:text-emerald-300">
                Order Activity
              </h4>
              {detailsLoading ? (
                <p className="text-[0.82rem] text-gray-400">
                  <i className="fa-solid fa-spinner fa-spin me-2" />
                  Loading activity…
                </p>
              ) : (
                <ActivityTimeline activities={details?.activities} />
              )}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-[0.82rem] font-extrabold uppercase tracking-wide text-deepGreen [.admin-dark_&]:text-emerald-300">
              Manage Delivery Status & Assignments
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={ADM_LABEL} htmlFor="formOrderPayment">
                    Payment Status
                  </label>
                  <select
                    id="formOrderPayment"
                    className={ADM_SELECT}
                    required
                    value={payment}
                    onChange={(e) => setPayment(e.target.value)}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className={ADM_LABEL} htmlFor="formOrderDeliveryStep">
                    Delivery Progress Step
                  </label>
                  <select
                    id="formOrderDeliveryStep"
                    className={ADM_SELECT}
                    required
                    value={deliveryStep}
                    onChange={(e) => setDeliveryStep(Number(e.target.value))}
                  >
                    {DELIVERY_STEPS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={ADM_LABEL} htmlFor="formOrderAssignDriver">
                    Assign Delivery Driver
                  </label>
                  <select
                    id="formOrderAssignDriver"
                    className={ADM_SELECT}
                    value={assignedDriverId}
                    onChange={(e) => setAssignedDriverId(e.target.value)}
                  >
                    <option value="">— Select approved driver —</option>
                    {drivers.map((driver) => (
                      <option
                        key={driver.id}
                        value={driver.id}
                        disabled={!isDriverSelectable(driver, order.assignedDriverId)}
                      >
                        {driverOptionLabel(driver)}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[0.75rem] text-gray-500 [.admin-dark_&]:text-gray-400">
                    <i className="fa-solid fa-circle-info me-1" aria-hidden="true" />
                    {buildDriverAssignmentHint(order) ||
                      'Offline drivers are blocked. Busy drivers accept new orders until they reach 3 active deliveries.'}
                  </p>
                </div>
                <div>
                  <label className={ADM_LABEL} htmlFor="formOrderEstimate">
                    Estimated Delivery Time
                  </label>
                  <input
                    id="formOrderEstimate"
                    type="text"
                    className={ADM_INPUT}
                    placeholder="e.g. Today, 4:00 PM"
                    value={estimate}
                    onChange={(e) => setEstimate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className={BTN_GHOST} onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className={BTN_PRIMARY} disabled={saving}>
                  {saving ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
                      Updating…
                    </>
                  ) : (
                    'Update Order'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function exportOrdersToCSV(ordersList) {
  const dataToExport = ordersList.length > 0 ? ordersList : [];

  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'Order ID,Customer,Status,Payment,Amount,Date\n';

  dataToExport.forEach((order) => {
    const orderId = order.id;
    const customer = (order.customer || '').replace(/"/g, '""');
    const status = getOrderStatusLabel(order);
    const payment = getOrderPaymentLabel(order);
    const amount = String(order.amount || '').replace(/[$,]/g, '');
    const date = order.date || 'May 22, 2026';
    csvContent += `"${orderId}","${customer}","${status}","${payment}","${amount}","${date}"\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `MMF_Orders_Export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showTopFloatNotification('Orders exported successfully as CSV!');
}

export default function AdminOrdersTab({ headerSearch = '' }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOrder, setModalOrder] = useState(null);

  const searchQuery = (headerSearch || localSearch).toLowerCase().trim();

  const loadOrders = useCallback(async ({ quiet = false } = {}) => {
    if (!token()) return [];
    if (!quiet) setLoading(true);
    try {
      const res = await fetchWithTimeout(
        apiUrl('/api/orders?limit=120'),
        { headers: authHeaders(false) },
        ADMIN_FETCH_TIMEOUT
      );
      const data = await res.json();
      if (data.success) {
        const list = data.orders || [];
        setOrders(list);
        return list;
      }
      showTopFloatNotification(data.message || 'Failed to load orders.', 'danger');
      return [];
    } catch {
      showTopFloatNotification('Failed to load orders.', 'danger');
      return [];
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  const refresh = useCallback(
    async ({ quiet = false } = {}) => {
      await loadOrders({ quiet });
    },
    [loadOrders]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onInvalidate = () => refresh({ quiet: true });
    const onOpen = async (e) => {
      const orderId = e.detail?.orderId;
      if (!orderId) return;
      let list = orders;
      let found = list.find((o) => o.id === orderId);
      if (!found) {
        list = await loadOrders({ quiet: true });
        found = list.find((o) => o.id === orderId);
      }
      if (found) setModalOrder(found);
    };

    window.addEventListener('admin-orders-invalidate', onInvalidate);
    window.addEventListener('admin-orders-open', onOpen);
    return () => {
      window.removeEventListener('admin-orders-invalidate', onInvalidate);
      window.removeEventListener('admin-orders-open', onOpen);
    };
  }, [orders, refresh, loadOrders]);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const orderId = String(order.id || '').toLowerCase();
      const customerName = String(order.customer || '').toLowerCase();
      const phone = String(order.phone || '').toLowerCase();
      const orderStatus = getOrderStatusLabel(order).toLowerCase();
      const orderPayment = getOrderPaymentLabel(order).toLowerCase();

      const matchesSearch =
        !searchQuery ||
        orderId.includes(searchQuery) ||
        customerName.includes(searchQuery) ||
        phone.includes(searchQuery);
      const matchesStatus =
        filterStatus === 'all' || orderStatus === filterStatus.toLowerCase();
      const matchesPayment =
        filterPayment === 'all' || orderPayment === filterPayment.toLowerCase();
      const matchesDate = isOrderInDateRange(order, filterDate);

      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });
  }, [orders, searchQuery, filterStatus, filterPayment, filterDate]);

  const totalPages = Math.ceil(filtered.length / ORDER_PAGE_SIZE) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * ORDER_PAGE_SIZE;
  const endIdx = Math.min(startIdx + ORDER_PAGE_SIZE, filtered.length);
  const paginated = filtered.slice(startIdx, endIdx);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterPayment, filterDate]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const handleExport = () => exportOrdersToCSV(filtered);

  const orderStats = useMemo(() => {
    const totalOrders = orders.length;
    let pendingOrders = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;
    orders.forEach((order) => {
      const status = (order.status || '').toLowerCase();
      if (status === 'delivered') deliveredOrders += 1;
      else if (status === 'cancelled') cancelledOrders += 1;
      else pendingOrders += 1;
    });
    return { totalOrders, pendingOrders, deliveredOrders, cancelledOrders };
  }, [orders]);

  const trends = {};

  return (
    <div className="animate-cardRise">
      {/* Filters */}
      <div className={`${ADM_TABLE_CARD} mb-4 !p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3" style={{ maxWidth: 800 }}>
            <AppSearchField
              value={localSearch || headerSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search orders..."
              variant="full"
              className="mb-0 max-w-[250px]"
            />
            <select
              className={`${ADM_SELECT} w-auto min-w-[140px]`}
              value={filterStatus}
              onChange={handleFilterChange(setFilterStatus)}
            >
              {STATUS_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <select
              className={`${ADM_SELECT} w-auto min-w-[140px]`}
              value={filterPayment}
              onChange={handleFilterChange(setFilterPayment)}
            >
              {PAYMENT_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <select
              className={`${ADM_SELECT} w-auto min-w-[130px]`}
              value={filterDate}
              onChange={handleFilterChange(setFilterDate)}
            >
              {DATE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className={BTN_SUCCESS} onClick={handleExport}>
            <i className="fa-solid fa-download" aria-hidden="true" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`${ADM_TABLE_CARD} mb-4`}>
        <div className="overflow-x-auto">
          <table className={ADM_TABLE}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    <i className="fa-solid fa-spinner fa-spin me-2" aria-hidden="true" />
                    Loading orders…
                  </td>
                </tr>
              )}
              {!loading && paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    No matching orders found.
                  </td>
                </tr>
              )}
              {!loading &&
                paginated.map((order) => {
                  const status = getOrderStatusLabel(order);
                  const payment = getOrderPaymentLabel(order);
                  return (
                    <tr key={order.id}>
                      <td className="font-mono text-[0.84rem] font-bold text-emerald-600 [.admin-dark_&]:text-emerald-400">
                        {order.id}
                      </td>
                      <td className="text-[0.84rem] font-semibold text-gray-900 [.admin-dark_&]:text-gray-100">
                        {order.customer}
                      </td>
                      <td>
                        <div className="space-y-1">
                          <span
                            className={`inline-block rounded-md px-2 py-1 text-[0.72rem] font-extrabold ${orderStatusBadgeClass(status)}`}
                          >
                            {status}
                          </span>
                          {(() => {
                            const assignment = getDriverAssignmentMeta(order);
                            if (!assignment) return null;
                            return (
                              <div>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.65rem] font-extrabold ${assignment.cls}`}
                                  title={assignment.reason || undefined}
                                >
                                  <i className={`fa-solid ${assignment.icon}`} aria-hidden="true" />
                                  {assignment.label}
                                </span>
                                {assignment.reason && (
                                  <div
                                    className="mt-0.5 max-w-[200px] truncate text-[0.65rem] text-red-600 [.admin-dark_&]:text-red-300"
                                    title={assignment.reason}
                                  >
                                    {assignment.reason}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`inline-block rounded-md px-2 py-1 text-[0.72rem] font-extrabold ${paymentBadgeClass(payment)}`}
                        >
                          {payment}
                        </span>
                      </td>
                      <td className="text-[0.84rem] font-bold text-gray-900 [.admin-dark_&]:text-gray-100">
                        {order.amount}
                      </td>
                      <td className="text-[0.84rem] text-gray-500 [.admin-dark_&]:text-gray-400">
                        {order.date || 'May 22, 2026'}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="text-[0.95rem] text-gray-500 transition hover:text-deepGreen [.admin-dark_&]:text-gray-400 [.admin-dark_&]:hover:text-emerald-300"
                          title="View Details"
                          onClick={() => setModalOrder(order)}
                        >
                          <i className="fa-regular fa-eye" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 [.admin-dark_&]:border-white/10">
          <p className="text-[0.8rem] font-semibold text-gray-500 [.admin-dark_&]:text-gray-400">
            {loading
              ? 'Loading orders…'
              : filtered.length === 0
                ? 'Showing 0 to 0 of 0 orders'
                : `Showing ${startIdx + 1} to ${endIdx} of ${filtered.length} orders`}
          </p>
          <nav aria-label="Order pagination">
            <ul className="mb-0 flex list-none items-center gap-1 p-0">
              <li>
                <button
                  type="button"
                  className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-[0.82rem] font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 [.admin-dark_&]:border-white/10 [.admin-dark_&]:text-gray-300 [.admin-dark_&]:hover:bg-white/5"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  «
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <li key={page}>
                  <button
                    type="button"
                    className={`rounded-lg border px-2.5 py-1.5 text-[0.82rem] font-bold transition ${
                      safePage === page
                        ? 'border-deepGreen bg-deepGreen text-white [.admin-dark_&]:border-emerald-500 [.admin-dark_&]:bg-emerald-500'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50 [.admin-dark_&]:border-white/10 [.admin-dark_&]:text-gray-300 [.admin-dark_&]:hover:bg-white/5'
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-[0.82rem] font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-40 [.admin-dark_&]:border-white/10 [.admin-dark_&]:text-gray-300 [.admin-dark_&]:hover:bg-white/5"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                >
                  »
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-4">
        <h3 className="mb-3 text-[0.95rem] font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
          Order Statistics
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OrderStatCard
            label="Total Orders"
            value={(orderStats.totalOrders ?? 0).toLocaleString()}
            trend={trends.orders}
            icon="fa-bag-shopping"
            iconClass="bg-blue-500/10 text-blue-500"
          />
          <OrderStatCard
            label="Pending Orders"
            value={(orderStats.pendingOrders ?? 0).toLocaleString()}
            trend={null}
            trendFallback="Active"
            icon="fa-clock"
            iconClass="bg-orange-500/10 text-orange-500"
          />
          <OrderStatCard
            label="Delivered Orders"
            value={(orderStats.deliveredOrders ?? 0).toLocaleString()}
            trend={trends.orders}
            icon="fa-circle-check"
            iconClass="bg-emerald-500/10 text-emerald-500"
          />
          <OrderStatCard
            label="Cancelled Orders"
            value={(orderStats.cancelledOrders ?? 0).toLocaleString()}
            trend={null}
            trendFallback="—"
            icon="fa-circle-xmark"
            iconClass="bg-red-500/10 text-red-500"
          />
        </div>
      </div>

      <OrderEditModal
        open={Boolean(modalOrder)}
        order={modalOrder}
        onClose={() => setModalOrder(null)}
        onSaved={() => refresh({ quiet: true })}
      />
    </div>
  );
}
