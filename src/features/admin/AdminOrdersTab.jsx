/**
 * ADMIN ORDERS TAB — list, filters, stats, edit modal (Tailwind)
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiUrl, fetchWithTimeout } from '../../utils/data';
import { productImage } from '../../utils/format';
import { showTopFloatNotification } from '../../utils/notifications';
import {
  ADM_TABLE_CARD,
  ADM_TABLE,
  ADM_LABEL,
  ADM_INPUT,
  ADM_SELECT,
  BTN_PRIMARY,
  BTN_GHOST,
  BTN_SUCCESS,
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
  isDriverSelectable,
  driverOptionLabel,
  isDriverAssignmentLocked,
  getAssignedDriverDisplayName,
  getDeliveryStageBadge,
  getAvatarBgColor,
  formatOrderAmount,
  parseOrderAmount,
  parseOrderDate,
  formatAdminPrice,
  ADMIN_MODAL_OVERLAY,
  ADMIN_MODAL_PANEL,
  ADMIN_MODAL_CLOSE_BTN,
} from './adminShared.js';

const ORDER_TABLE_MAX_HEIGHT = 'min(520px, 55vh)';

const STATUS_PILLS = [
  { id: 'all', label: 'All', countKey: null },
  { id: 'Pending', label: 'Pending', countKey: 'pending' },
  { id: 'Processing', label: 'Processing', countKey: 'processing' },
  { id: 'Shipped', label: 'Shipped', countKey: 'shipped' },
];

const PAYMENT_PILLS = [
  { id: 'all', label: 'All' },
  { id: 'Paid', label: 'Paid' },
  { id: 'Pending', label: 'Pending' },
  { id: 'Failed', label: 'Failed' },
];

const DATE_PILLS = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'This Week' },
];

const STEP_ESTIMATES = [
  'Waiting for order confirmation',
  'Payment verified. Preparing order',
  'Preparing order for dispatch',
  'Out for delivery via driver',
  'Delivered successfully',
];

const ADMIN_STAGE_STEPS = [
  { value: 3, label: 'Preparing', icon: 'fa-box-open' },
  { value: 4, label: 'Out for delivery', icon: 'fa-truck' },
  { value: 5, label: 'Delivered', icon: 'fa-circle-check' },
];

function SortableTh({ label, sortKey, sortBy, sortDir, onSort }) {
  const active = sortBy === sortKey;
  return (
    <th>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-inherit transition hover:text-deepGreen [.admin-dark_&]:hover:text-emerald-300"
      >
        {label}
        <i
          className={`fa-solid text-[0.58rem] ${
            active
              ? sortDir === 'asc'
                ? 'fa-arrow-up text-deepGreen [.admin-dark_&]:text-emerald-300'
                : 'fa-arrow-down text-deepGreen [.admin-dark_&]:text-emerald-300'
              : 'fa-sort text-gray-300 [.admin-dark_&]:text-gray-600'
          }`}
          aria-hidden="true"
        />
      </button>
    </th>
  );
}

function CustomerAvatar({ name, avatar, size = 'sm' }) {
  const initials = (name || '?')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const sizeClass = size === 'lg' ? 'h-11 w-11 text-[0.8rem]' : 'h-8 w-8 text-[0.68rem]';
  const [broken, setBroken] = useState(false);
  const showPhoto = Boolean(avatar) && !broken;

  if (showPhoto) {
    return (
      <img
        src={avatar}
        alt=""
        className={`shrink-0 rounded-full object-cover ${sizeClass}`}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${sizeClass}`}
      style={{ backgroundColor: getAvatarBgColor(name || '?') }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

function OrdersStatCard({ label, value, icon, iconWrapClass, active, onClick }) {
  const className = [
    'group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all duration-300',
    active
      ? 'border-deepGreen/20 bg-deepGreen/[0.04] shadow-[0_6px_20px_rgba(7,61,53,0.08)]'
      : 'border-deepGreen/[0.06] bg-white hover:-translate-y-px hover:border-deepGreen/12 hover:shadow-[0_6px_20px_rgba(7,61,53,0.07)]',
    'cursor-pointer active:scale-[0.99]',
    '[.admin-dark_&]:border-white/[0.08] [.admin-dark_&]:bg-[#1a2421] [.admin-dark_&]:hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)]',
    active ? '[.admin-dark_&]:border-emerald-500/25 [.admin-dark_&]:bg-emerald-500/10' : '',
  ].join(' ');

  return (
    <button type="button" className={className} onClick={onClick}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconWrapClass}`}>
        <i className={`fa-solid ${icon} text-[0.9rem]`} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-[0.65rem] font-semibold uppercase tracking-wide text-gray-400 [.admin-dark_&]:text-gray-500">
          {label}
        </p>
        <p className="font-display text-[1.15rem] font-bold leading-tight text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
          {value}
        </p>
      </div>
      <i
        className="fa-solid fa-chevron-right shrink-0 text-[0.55rem] text-gray-300 transition group-hover:text-deepGreen [.admin-dark_&]:text-gray-600 [.admin-dark_&]:group-hover:text-emerald-300"
        aria-hidden="true"
      />
    </button>
  );
}

function FilterPill({ active, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-bold transition',
        active
          ? 'bg-deepGreen text-white shadow-sm [.admin-dark_&]:bg-emerald-600'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-gray-200 [.admin-dark_&]:hover:bg-white/15',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function OrdersFilterToolbar({
  loading,
  filterStatus,
  filterPayment,
  filterDate,
  statusCounts,
  onStatusChange,
  onPaymentChange,
  onDateChange,
  onExport,
}) {
  const statusFromCard = filterStatus === 'Delivered' || filterStatus === 'Cancelled';

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-deepGreen/[0.06] bg-white px-3 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.03)] [.admin-dark_&]:border-white/[0.08] [.admin-dark_&]:bg-[#1a2421]">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-0.5 text-[0.62rem] font-bold uppercase tracking-wide text-gray-400">Status</span>
          {STATUS_PILLS.map((pill) => (
            <FilterPill
              key={pill.id}
              active={!statusFromCard && filterStatus === pill.id}
              onClick={() => onStatusChange(pill.id)}
            >
              {pill.label}
              {pill.countKey && (
                <span
                  className={`min-w-[1.1rem] rounded-full px-1 text-center text-[0.6rem] ${
                    !statusFromCard && filterStatus === pill.id
                      ? 'bg-white/20'
                      : 'bg-white/80 [.admin-dark_&]:bg-black/20'
                  }`}
                >
                  {loading ? '…' : (statusCounts?.[pill.countKey] ?? 0)}
                </span>
              )}
            </FilterPill>
          ))}
        </div>

        <span
          className="hidden h-5 w-px shrink-0 bg-gray-200 sm:inline [.admin-dark_&]:bg-white/10"
          aria-hidden="true"
        />

        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-0.5 text-[0.62rem] font-bold uppercase tracking-wide text-gray-400">Payment</span>
          {PAYMENT_PILLS.map((pill) => (
            <FilterPill
              key={pill.id}
              active={filterPayment === pill.id}
              onClick={() => onPaymentChange(pill.id)}
            >
              {pill.label}
            </FilterPill>
          ))}
        </div>

        <span
          className="hidden h-5 w-px shrink-0 bg-gray-200 sm:inline [.admin-dark_&]:bg-white/10"
          aria-hidden="true"
        />

        <div className="flex items-center gap-1.5">
          <span className="text-[0.62rem] font-bold uppercase tracking-wide text-gray-400">Date</span>
          <select
            className={`${ADM_SELECT} !min-h-0 w-auto min-w-[7.5rem] !py-1 !pl-2 !pr-7 !text-[0.68rem] !font-semibold`}
            value={filterDate}
            onChange={(e) => onDateChange(e.target.value)}
            aria-label="Filter by date"
          >
            {DATE_PILLS.map((pill) => (
              <option key={pill.id} value={pill.id}>
                {pill.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <button
          type="button"
          className={`${BTN_SUCCESS} !min-h-0 shrink-0 !px-3 !py-1.5 !text-[0.72rem]`}
          onClick={onExport}
        >
          <i className="fa-solid fa-download text-[0.7rem]" aria-hidden="true" />
          Export
        </button>
      </div>
    </div>
  );
}

export function OrderItemsList({ order }) {
  const items = order?.items;
  if (items?.length) {
    return (
      <div className="divide-y divide-gray-100 overflow-hidden rounded-[10px] border border-black/8 [.admin-dark_&]:divide-white/10 [.admin-dark_&]:border-white/10">
        {items.map((item, idx) => (
          <div key={`${item.title}-${idx}`} className="flex items-center gap-3 p-3">
            <img
              src={productImage(item.image || 'product-images/hero1.jpeg')}
              alt=""
              className="h-14 w-14 shrink-0 rounded-[10px] border border-black/5 object-cover [.admin-dark_&]:border-white/10"
              onError={(e) => {
                e.currentTarget.src = productImage('product-images/hero1.jpeg');
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.86rem] font-bold text-gray-900 [.admin-dark_&]:text-gray-100">
                {item.title}
              </p>
              <p className="mt-0.5 text-[0.75rem] text-gray-500">Qty {item.quantity}</p>
            </div>
            <span className="shrink-0 text-[0.86rem] font-bold text-deepGreen [.admin-dark_&]:text-emerald-300">
              {formatAdminPrice(Number(item.price || 0) * Number(item.quantity || 1))}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-[10px] border border-dashed border-black/10 p-6 text-center [.admin-dark_&]:border-white/15">
      <p className="text-[0.86rem] font-bold text-gray-900 [.admin-dark_&]:text-gray-100">
        {order?.product || 'No products'}
      </p>
      <p className="mt-1 text-[0.78rem] text-gray-500">No line items on this order.</p>
      {order && (
        <p className="mt-2 text-[0.9rem] font-bold text-deepGreen [.admin-dark_&]:text-emerald-300">
          {formatOrderAmount(order)}
        </p>
      )}
    </div>
  );
}

/** Read-only progress: Placed + payment auto; Preparing → Delivered from admin. */
function DeliveryProgressBar({ currentStep, paymentStatus }) {
  const step = Math.min(Math.max(currentStep || 1, 1), 5);
  const payment = String(paymentStatus || 'Pending');

  const nodes = [
    { id: 'placed', label: 'Placed', state: 'done' },
    {
      id: 'payment',
      label: payment === 'Failed' ? 'Failed' : payment === 'Pending' ? 'Pending' : 'Paid',
      state: payment === 'Paid' ? 'done' : payment === 'Failed' ? 'failed' : 'pending',
    },
    {
      id: 'preparing',
      label: 'Preparing',
      state: step > 3 ? 'done' : step === 3 ? 'current' : 'idle',
    },
    {
      id: 'out',
      label: 'Out for delivery',
      state: step > 4 ? 'done' : step === 4 ? 'current' : 'idle',
    },
    {
      id: 'delivered',
      label: 'Delivered',
      state: step >= 5 ? 'done' : 'idle',
    },
  ];

  return (
    <div>
      <p className={`${ADM_LABEL} !mb-3`}>Delivery progress</p>
      <div className="flex items-start gap-0">
        {nodes.map((node, idx) => {
          const circleClass =
            node.state === 'done'
              ? 'bg-deepGreen text-white'
              : node.state === 'failed'
                ? 'bg-red-500 text-white'
                : node.state === 'current'
                  ? 'bg-deepGreen text-white'
                  : node.state === 'pending'
                    ? 'bg-amber-100 text-amber-800 [.admin-dark_&]:bg-amber-500/20 [.admin-dark_&]:text-amber-300'
                    : 'bg-gray-100 text-gray-400 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-gray-500';

          return (
            <div key={node.id} className="flex min-w-0 flex-1 items-start">
              <div className="flex w-full flex-col items-center gap-1.5">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[0.65rem] font-bold ${circleClass}`}
                  title={node.label}
                >
                  {node.state === 'done' ? (
                    <i className="fa-solid fa-check text-[0.55rem]" aria-hidden="true" />
                  ) : node.state === 'failed' ? (
                    <i className="fa-solid fa-xmark text-[0.6rem]" aria-hidden="true" />
                  ) : node.state === 'pending' ? (
                    <i className="fa-solid fa-clock text-[0.55rem]" aria-hidden="true" />
                  ) : (
                    idx + 1
                  )}
                </span>
                <span
                  className={`text-center text-[0.62rem] font-semibold leading-tight ${
                    node.state === 'failed'
                      ? 'text-red-600'
                      : node.state === 'done' || node.state === 'current'
                        ? 'text-deepGreen [.admin-dark_&]:text-emerald-300'
                        : 'text-gray-400'
                  }`}
                >
                  {node.label}
                </span>
              </div>
              {idx < nodes.length - 1 && (
                <div
                  className={`mt-3.5 h-px w-2 shrink-0 sm:w-3 ${
                    idx === 0 || (idx === 1 && payment === 'Paid') || (idx >= 2 && step > idx + 1)
                      ? 'bg-deepGreen'
                      : 'bg-gray-200 [.admin-dark_&]:bg-white/15'
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OrderEditModal({ open, order, onClose, onSaved }) {
  const [drivers, setDrivers] = useState([]);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(false);
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
    setItemsOpen(false);
    const paymentLabel = getOrderPaymentLabel(order);
    let step = order.currentStep > 0 ? order.currentStep : 1;
    if (paymentLabel === 'Paid' && step < 2) step = 2;
    if (paymentLabel !== 'Paid' && step > 1) step = 1;
    setDeliveryStep(step);
    setAssignedDriverId(order.assignedDriverId || '');
    setEstimate(order.estimate === 'Waiting for order confirmation' ? '' : order.estimate || '');
    setDetails(null);
    loadDrivers();
    loadDetails(order.id);
  }, [open, order, loadDrivers, loadDetails]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (itemsOpen) {
        setItemsOpen(false);
        return;
      }
      onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, itemsOpen]);

  if (!open || !order) return null;
  if (typeof document === 'undefined' || !document.body) return null;

  // Prefer freshest payment from details API when available
  const orderPayment = getOrderPaymentLabel(details?.order || order);
  const canAdvanceStage = orderPayment === 'Paid';
  const assignmentLocked = isDriverAssignmentLocked(order);
  const assignedDriverName = getAssignedDriverDisplayName(order, drivers);
  const assignment = getDriverAssignmentMeta(order);
  const declined = Boolean(String(order?.assignmentRejectReason || '').trim());
  const savedStep = Math.max(1, Number(order.currentStep) || 1);
  const isDelivered = savedStep >= 5;
  const selectableStages = ADMIN_STAGE_STEPS.filter((stage) => stage.value >= Math.max(3, savedStep));

  const itemsSource = {
    ...order,
    items: details?.order?.items || order.items,
    product: details?.order?.product || order.product,
  };
  const estimatedLabel =
    estimate ||
    order.estimate ||
    [order.deliveryDate, order.deliveryTime].filter(Boolean).join(' at ') ||
    '—';

  const handleStageChange = (step) => {
    if (!canAdvanceStage) {
      showTopFloatNotification(
        orderPayment === 'Failed'
          ? 'Payment failed. Customer must retry EVC Plus successfully before progress can update.'
          : 'Payment is still pending. Wait until EVC Plus confirms Paid.',
        'danger'
      );
      return;
    }
    if (isDelivered) {
      showTopFloatNotification('This order is already delivered. Progress is locked.', 'danger');
      return;
    }
    if (step < savedStep) {
      showTopFloatNotification('Delivery progress cannot move backwards.', 'danger');
      return;
    }
    setDeliveryStep(step);
    if (!estimate.trim()) {
      setEstimate(STEP_ESTIMATES[step - 1] || '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!order) return;

    if (!canAdvanceStage) {
      showTopFloatNotification(
        orderPayment === 'Failed'
          ? 'Cannot update this order until the customer completes EVC Plus payment.'
          : 'Cannot update delivery while payment is Pending.',
        'danger'
      );
      return;
    }

    if (isDelivered && deliveryStep === savedStep) {
      // Allow ETA / driver updates on delivered? User said progress locked.
      // Still allow driver/ETA if needed - but if they try to change step, blocked.
    }

    if (deliveryStep < 3) {
      showTopFloatNotification('Select Preparing, Out for delivery, or Delivered before updating.', 'danger');
      return;
    }

    if (deliveryStep < savedStep) {
      showTopFloatNotification('Delivery progress cannot move backwards.', 'danger');
      return;
    }

    setSaving(true);

    let finalEstimate = estimate.trim();
    if (!finalEstimate) {
      finalEstimate = STEP_ESTIMATES[deliveryStep - 1] || 'Processing';
    }

    // Payment is system-owned (EVC) — do not send payment fields from admin modal
    const payload = {
      currentStep: deliveryStep,
      estimate: finalEstimate,
    };

    const orderIdEncoded = encodeURIComponent(order.id);

    try {
      const driverChanged = assignedDriverId && assignedDriverId !== (order.assignedDriverId || '');
      if (driverChanged && !assignmentLocked) {
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
        window.dispatchEvent(new CustomEvent('driver-assignment-updated'));
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
        window.dispatchEvent(new CustomEvent('admin-dashboard-invalidate'));
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

  const lockHint =
    orderPayment === 'Failed'
      ? 'Payment failed. Customer must retry EVC Plus. Stages stay locked until Paid.'
      : orderPayment === 'Pending'
        ? 'Payment pending EVC Plus confirmation. Stages stay locked until Paid.'
        : isDelivered
          ? 'Order already delivered. Delivery stage is locked and cannot go backwards.'
          : null;

  const stageBadge = getDeliveryStageBadge(deliveryStep);

  const isAdminDark =
    typeof document !== 'undefined' && Boolean(document.querySelector('[data-theme="dark"]'));

  return createPortal(
    <div className={isAdminDark ? 'admin-dark' : ''} data-theme={isAdminDark ? 'dark' : 'light'}>
      <div
        className={ADMIN_MODAL_OVERLAY}
        onClick={onClose}
        role="presentation"
      >
        <div
          className={ADMIN_MODAL_PANEL}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="orderEditModalTitle"
        >
          <button
            type="button"
            className="absolute right-[15px] top-[15px] z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 bg-white text-[1.4rem] leading-none text-[#111] shadow-[0_2px_10px_rgba(0,0,0,0.15)] [.admin-dark_&]:bg-[#243029] [.admin-dark_&]:text-gray-200"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            ×
          </button>

          <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
            <div className="min-w-0 pr-10">
              <h3
                id="orderEditModalTitle"
                className="font-display text-xl font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]"
              >
                {order.customer}
              </h3>
              <p className="mb-0 mt-1 font-mono text-[0.82rem] text-gray-500 [.admin-dark_&]:text-gray-400">{order.id}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-lg px-2.5 py-1 text-[0.75rem] font-extrabold ${paymentBadgeClass(orderPayment)}`}>
                  {orderPayment}
                </span>
                <span className={`inline-flex rounded-lg px-2.5 py-1 text-[0.75rem] font-extrabold ${stageBadge.cls}`}>
                  {stageBadge.label}
                </span>
                {assignment && (
                  <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[0.75rem] font-extrabold ${assignment.cls}`}>
                    <i className={`fa-solid ${assignment.icon}`} aria-hidden="true" />
                    {assignment.label}
                  </span>
                )}
              </div>
            </div>
          </div>

          {declined && order.assignmentRejectReason && (
            <div className="border-b border-red-100 bg-red-50 px-5 py-3 [.admin-dark_&]:border-red-500/20 [.admin-dark_&]:bg-red-500/10">
              <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-wide text-red-600 [.admin-dark_&]:text-red-300">
                Driver decline reason
              </p>
              <p className="mb-0 text-[0.86rem] font-semibold leading-relaxed text-red-800 [.admin-dark_&]:text-red-100">
                {order.assignmentRejectReason}
              </p>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 [scrollbar-width:thin]">
            <div className="space-y-4">
              <div className="grid gap-3 rounded-xl border border-gray-100 bg-[#fdfbf8] p-4 sm:grid-cols-2 [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-white/[0.03]">
                <div>
                  <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">Phone</p>
                  <p className="mb-0 text-[0.88rem] font-semibold text-gray-800 [.admin-dark_&]:text-gray-100">{order.phone || '—'}</p>
                </div>
                <div>
                  <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">Amount</p>
                  <p className="mb-0 text-[0.88rem] font-semibold text-emerald-700 [.admin-dark_&]:text-emerald-400">
                    {formatOrderAmount(order)}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">Order ID</p>
                  <button
                    type="button"
                    onClick={() => setItemsOpen(true)}
                    className="mb-0 inline-flex max-w-full items-center gap-1.5 font-mono text-[0.88rem] font-bold text-deepGreen underline decoration-deepGreen/30 underline-offset-2 hover:decoration-deepGreen [.admin-dark_&]:text-emerald-400"
                    title="View ordered products"
                  >
                    <span className="truncate">{order.id}</span>
                    <i className="fa-solid fa-box-open text-[0.65rem] opacity-70" aria-hidden="true" />
                  </button>
                </div>
                <div>
                  <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">Date</p>
                  <p className="mb-0 text-[0.88rem] font-semibold text-gray-800 [.admin-dark_&]:text-gray-100">{order.date || '—'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">Estimated arrival</p>
                  <p className="mb-0 text-[0.88rem] font-semibold text-gray-800 [.admin-dark_&]:text-gray-100">{estimatedLabel}</p>
                </div>
              </div>

              <DeliveryProgressBar currentStep={deliveryStep} paymentStatus={orderPayment} />

              <form id="orderEditForm" onSubmit={handleSubmit} className="space-y-3">
                <p className="text-[0.65rem] font-bold uppercase tracking-wide text-gray-400">Manage order</p>

                {lockHint && (
                  <p className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-[0.75rem] font-medium text-amber-800 [.admin-dark_&]:border-amber-500/25 [.admin-dark_&]:bg-amber-500/10 [.admin-dark_&]:text-amber-300">
                    <i className="fa-solid fa-lock me-1.5 text-[0.65rem]" aria-hidden="true" />
                    {lockHint}
                  </p>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={ADM_LABEL} htmlFor="formOrderStage">
                      Delivery stage
                    </label>
                    <select
                      id="formOrderStage"
                      className={ADM_SELECT}
                      value={canAdvanceStage && deliveryStep >= 3 ? deliveryStep : ''}
                      onChange={(e) => handleStageChange(Number(e.target.value))}
                      disabled={!canAdvanceStage || isDelivered}
                      required={canAdvanceStage && !isDelivered}
                    >
                      <option value="" disabled>
                        {!canAdvanceStage
                          ? 'Locked until Paid'
                          : isDelivered
                            ? 'Delivered — locked'
                            : '— Select stage —'}
                      </option>
                      {selectableStages.map((stage) => (
                        <option key={stage.value} value={stage.value}>
                          {stage.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={ADM_LABEL} htmlFor="formOrderEstimate">
                      Estimated date
                    </label>
                    <input
                      id="formOrderEstimate"
                      type="text"
                      className={ADM_INPUT}
                      placeholder="Today, 4:00 PM"
                      value={estimate}
                      onChange={(e) => setEstimate(e.target.value)}
                      disabled={!canAdvanceStage}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    {assignmentLocked ? (
                      <>
                        <p className={ADM_LABEL}>Assigned driver</p>
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 [.admin-dark_&]:border-emerald-500/30 [.admin-dark_&]:bg-emerald-500/10">
                          <p className="mb-1 flex items-center gap-2 text-[0.9rem] font-extrabold text-emerald-900 [.admin-dark_&]:text-emerald-100">
                            <i className="fa-solid fa-circle-check" aria-hidden="true" />
                            {assignedDriverName}
                          </p>
                          <p className="mb-0 text-[0.78rem] font-semibold text-emerald-800 [.admin-dark_&]:text-emerald-200">
                            Driver accepted — assignment locked until delivered.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <label className={ADM_LABEL} htmlFor="formOrderAssignDriver">
                          {declined ? 'Reassign driver' : 'Assign driver'}
                        </label>
                        <p className="mb-2 text-[0.78rem] text-gray-500 [.admin-dark_&]:text-gray-400">
                          {!canAdvanceStage
                            ? 'Driver and stage unlock after payment is Paid.'
                            : declined
                              ? 'Choose another available driver. Offline or at-capacity drivers cannot be selected.'
                              : buildDriverAssignmentHint(order) ||
                                'Offline drivers are blocked. Busy drivers accept new orders until they reach 3 active deliveries.'}
                        </p>
                        <select
                          id="formOrderAssignDriver"
                          className={ADM_SELECT}
                          value={assignedDriverId}
                          onChange={(e) => setAssignedDriverId(e.target.value)}
                          disabled={!canAdvanceStage}
                        >
                          <option value="">— Select driver —</option>
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
                      </>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
            <button type="button" className={BTN_GHOST} onClick={onClose} disabled={saving}>
              {canAdvanceStage ? 'Cancel' : 'Close'}
            </button>
            {canAdvanceStage && (
              <button type="submit" form="orderEditForm" className={BTN_PRIMARY} disabled={saving}>
                {saving ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> Updating…
                  </>
                ) : (
                  'Update order'
                )}
              </button>
            )}
          </div>

          {itemsOpen && (
            <div
              className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 p-4"
              onClick={() => setItemsOpen(false)}
              role="presentation"
            >
              <div
                className={ADMIN_MODAL_PANEL}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Ordered products"
              >
                <button
                  type="button"
                  className="absolute right-[15px] top-[15px] z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 bg-white text-[1.4rem] leading-none text-[#111] shadow-[0_2px_10px_rgba(0,0,0,0.15)] [.admin-dark_&]:bg-[#243029] [.admin-dark_&]:text-gray-200"
                  onClick={() => setItemsOpen(false)}
                  aria-label="Close products"
                >
                  ×
                </button>
                <div className="border-b border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
                  <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">Order products</p>
                  <p className="mb-0 font-mono text-[0.95rem] font-bold text-deepGreen [.admin-dark_&]:text-emerald-400">{order.id}</p>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 [scrollbar-width:thin]">
                  {detailsLoading && !itemsSource.items?.length ? (
                    <div className="animate-pulse space-y-3">
                      <div className="h-14 rounded-[10px] bg-gray-100 [.admin-dark_&]:bg-white/5" />
                      <div className="h-14 rounded-[10px] bg-gray-100 [.admin-dark_&]:bg-white/5" />
                    </div>
                  ) : (
                    <OrderItemsList order={itemsSource} />
                  )}
                </div>
                <div className="flex justify-end border-t border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
                  <button type="button" className={BTN_GHOST} onClick={() => setItemsOpen(false)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
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
    const amount = formatOrderAmount(order).replace(/[$,]/g, '');
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
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [modalOrder, setModalOrder] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  const searchQuery = headerSearch.toLowerCase().trim();

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
    const onFilter = (e) => {
      const status = e.detail?.status;
      if (status) {
        setFilterStatus(status);
      }
    };

    window.addEventListener('admin-orders-invalidate', onInvalidate);
    window.addEventListener('admin-orders-open', onOpen);
    window.addEventListener('admin-orders-filter', onFilter);
    return () => {
      window.removeEventListener('admin-orders-invalidate', onInvalidate);
      window.removeEventListener('admin-orders-open', onOpen);
      window.removeEventListener('admin-orders-filter', onFilter);
    };
  }, [orders, refresh, loadOrders]);

  const filtered = useMemo(() => {
    return orders.filter((order) => {
      const orderId = String(order.id || '').toLowerCase();
      const customerName = String(order.customer || '').toLowerCase();
      const phone = String(order.phone || '').toLowerCase();
      const orderStatus = getOrderStatusLabel(order);
      const orderPayment = getOrderPaymentLabel(order);

      const matchesSearch =
        !searchQuery ||
        orderId.includes(searchQuery) ||
        customerName.includes(searchQuery) ||
        phone.includes(searchQuery);
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' &&
          !['Delivered', 'Cancelled'].includes(orderStatus)) ||
        orderStatus === filterStatus;
      const matchesPayment =
        filterPayment === 'all' || orderPayment === filterPayment;
      const matchesDate = isOrderInDateRange(order, filterDate);

      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });
  }, [orders, searchQuery, filterStatus, filterPayment, filterDate]);

  const statusCounts = useMemo(() => {
    const counts = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    orders.forEach((order) => {
      const status = getOrderStatusLabel(order);
      if (status === 'Pending') counts.pending += 1;
      else if (status === 'Processing') counts.processing += 1;
      else if (status === 'Shipped') counts.shipped += 1;
      else if (status === 'Delivered') counts.delivered += 1;
      else if (status === 'Cancelled') counts.cancelled += 1;
    });
    return counts;
  }, [orders]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'amount') {
        cmp = parseOrderAmount(a) - parseOrderAmount(b);
      } else if (sortBy === 'date') {
        const aTime = parseOrderDate(a)?.getTime() ?? 0;
        const bTime = parseOrderDate(b)?.getTime() ?? 0;
        cmp = aTime - bTime;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filtered, sortBy, sortDir]);

  const handleFilterChange = (setter) => (value) => {
    setter(value);
  };

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir(key === 'date' ? 'desc' : 'desc');
    }
  };

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterPayment('all');
    setFilterDate('all');
  };

  const hasActiveFilters =
    filterStatus !== 'all' || filterPayment !== 'all' || filterDate !== 'all' || searchQuery;

  const handleExport = () => exportOrdersToCSV(sorted);

  const orderStats = useMemo(() => {
    let activeOrders = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;
    orders.forEach((order) => {
      const status = getOrderStatusLabel(order);
      if (status === 'Delivered') deliveredOrders += 1;
      else if (status === 'Cancelled') cancelledOrders += 1;
      else activeOrders += 1;
    });
    return {
      totalOrders: orders.length,
      activeOrders,
      deliveredOrders,
      cancelledOrders,
    };
  }, [orders]);

  const statFilterMap = {
    total: 'all',
    active: 'active',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  const activeStatKey =
    filterStatus === 'all'
      ? 'total'
      : filterStatus === 'active'
        ? 'active'
        : filterStatus === 'Delivered'
          ? 'delivered'
          : filterStatus === 'Cancelled'
            ? 'cancelled'
            : null;

  const openOrder = (order) => setModalOrder(order);

  return (
    <div className="animate-cardRise space-y-2.5">
      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <OrdersStatCard
          label="Total Orders"
          value={loading ? '…' : (orderStats.totalOrders ?? 0).toLocaleString()}
          icon="fa-bag-shopping"
          iconWrapClass="bg-blue-500/10 text-blue-600"
          active={activeStatKey === 'total'}
          onClick={() => handleFilterChange(setFilterStatus)(statFilterMap.total)}
        />
        <OrdersStatCard
          label="Active Orders"
          value={loading ? '…' : (orderStats.activeOrders ?? 0).toLocaleString()}
          icon="fa-clock"
          iconWrapClass="bg-amber-500/10 text-amber-600"
          active={activeStatKey === 'active'}
          onClick={() => handleFilterChange(setFilterStatus)(statFilterMap.active)}
        />
        <OrdersStatCard
          label="Delivered"
          value={loading ? '…' : (orderStats.deliveredOrders ?? 0).toLocaleString()}
          icon="fa-circle-check"
          iconWrapClass="bg-emerald-500/10 text-emerald-600"
          active={activeStatKey === 'delivered'}
          onClick={() => handleFilterChange(setFilterStatus)(statFilterMap.delivered)}
        />
        <OrdersStatCard
          label="Cancelled"
          value={loading ? '…' : (orderStats.cancelledOrders ?? 0).toLocaleString()}
          icon="fa-circle-xmark"
          iconWrapClass="bg-red-500/10 text-red-600"
          active={activeStatKey === 'cancelled'}
          onClick={() => handleFilterChange(setFilterStatus)(statFilterMap.cancelled)}
        />
      </div>

      <OrdersFilterToolbar
        loading={loading}
        filterStatus={filterStatus}
        filterPayment={filterPayment}
        filterDate={filterDate}
        statusCounts={statusCounts}
        onStatusChange={handleFilterChange(setFilterStatus)}
        onPaymentChange={handleFilterChange(setFilterPayment)}
        onDateChange={handleFilterChange(setFilterDate)}
        onExport={handleExport}
      />

      {/* Table */}
      <div className={`${ADM_TABLE_CARD} !p-0 overflow-hidden`}>
        <div
          className="overflow-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-deepGreen/15 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5"
          style={{ maxHeight: ORDER_TABLE_MAX_HEIGHT }}
        >
          <table className={`${ADM_TABLE} [&_tbody_tr]:cursor-pointer [&_tbody_tr]:transition-colors`}>
            <thead className="sticky top-0 z-[2] bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)] [.admin-dark_&]:bg-[#1a2421] [.admin-dark_&]:shadow-[0_1px_0_rgba(255,255,255,0.06)]">
              <tr>
                <th>Customer</th>
                <th>Order ID</th>
                <th>Status</th>
                <th>Payment</th>
                <SortableTh
                  label="Amount"
                  sortKey="amount"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableTh
                  label="Date"
                  sortKey="date"
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    <i className="fa-solid fa-spinner fa-spin me-2" aria-hidden="true" />
                    Loading orders…
                  </td>
                </tr>
              )}
              {!loading && sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center">
                    <div className="mx-auto max-w-xs">
                      <i className="fa-solid fa-inbox mb-2 text-2xl text-gray-300" aria-hidden="true" />
                      <p className="text-[0.85rem] font-semibold text-gray-500 [.admin-dark_&]:text-gray-400">
                        No matching orders
                      </p>
                      <p className="mt-1 text-[0.75rem] text-gray-400">
                        Try changing filters or search from the header.
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-deepGreen/15 bg-deepGreen/[0.04] px-3 py-1.5 text-[0.75rem] font-bold text-deepGreen transition hover:bg-deepGreen/10 [.admin-dark_&]:text-emerald-300"
                        >
                          <i className="fa-solid fa-filter-circle-xmark text-[0.7rem]" aria-hidden="true" />
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              {!loading &&
                sorted.map((order) => {
                  const status = getOrderStatusLabel(order);
                  const payment = getOrderPaymentLabel(order);
                  return (
                    <tr
                      key={order.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openOrder(order)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openOrder(order);
                        }
                      }}
                      className="group transition-colors hover:bg-deepGreen/[0.04] [.admin-dark_&]:hover:bg-white/[0.04]"
                    >
                      <td>
                        <div className="flex items-center gap-2.5">
                          <CustomerAvatar name={order.customer} />
                          <span className="text-[0.84rem] font-semibold text-gray-900 [.admin-dark_&]:text-gray-100">
                            {order.customer}
                          </span>
                        </div>
                      </td>
                      <td className="font-mono text-[0.8rem] font-bold text-emerald-600 [.admin-dark_&]:text-emerald-400">
                        {order.id}
                      </td>
                      <td>
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[0.68rem] font-extrabold ${orderStatusBadgeClass(status)}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[0.68rem] font-extrabold ${paymentBadgeClass(payment)}`}
                        >
                          {payment}
                        </span>
                      </td>
                      <td className="text-[0.84rem] font-bold text-gray-900 [.admin-dark_&]:text-gray-100">
                        {formatOrderAmount(order)}
                      </td>
                      <td className="text-[0.8rem] text-gray-500 [.admin-dark_&]:text-gray-400">
                        {order.date || '—'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 px-4 py-2.5 [.admin-dark_&]:border-white/10">
          <p className="text-[0.8rem] font-semibold text-gray-500 [.admin-dark_&]:text-gray-400">
            {loading
              ? 'Loading orders…'
              : sorted.length === 0
                ? 'No orders'
                : `${sorted.length} order${sorted.length === 1 ? '' : 's'}`}
          </p>
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
