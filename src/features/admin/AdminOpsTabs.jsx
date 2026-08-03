/**
 * ADMIN OPS TABS — stock, payments, delivery, settings (Tailwind)
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useIntervalWhenVisible } from '../../hooks/useIntervalWhenVisible';
import { apiUrl, clearDeliveryDistrictsCache, fetchWithTimeout } from '../../utils/data';
import { productImage } from '../../utils/format';
import { showTopFloatNotification } from '../../utils/notifications';
import ForceDeliverModal from './ForceDeliverModal';
import {
  ProductModalGallery,
  ProductModalHeroRow,
  PRODUCT_MODAL_BODY_CLASS,
  PRODUCT_MODAL_DETAILS_COL_CLASS,
} from '../products/ProductModalGallery';
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
  ADMIN_PAYMENTS_FETCH_TIMEOUT,
  authHeaders,
  formatAdminPrice,
  formatUSD,
  formatLastLogin,
  formatOrderDate,
  formatRelativeTime,
  getDeliveryStageBadge,
  isDriverSelectable,
  driverOptionLabel,
  MAX_DRIVER_ACTIVE,
  getDriverAssignmentMeta,
  buildDriverAssignmentHint,
  isDriverAssignmentLocked,
  getAssignedDriverDisplayName,
  getDriverTableName,
  getLowStockThreshold,
  getOrderPaymentLabel,
  paymentBadgeClass,
  isOrderPaid,
  ADM_DARK_SURFACE_SM,
  ADM_DARK_BTN,
  ADM_DARK_TEXT_MUTED,
  ADMIN_MODAL_OVERLAY,
  ADMIN_MODAL_PANEL,
  ADMIN_MODAL_CLOSE_BTN,
} from './adminShared.js';
import { OrderItemsList } from './AdminOrdersTab.jsx';

const STOCK_TABLE_MAX_HEIGHT = 'min(520px, 55vh)';

const PAYMENT_FILTER_PILLS = [
  { id: 'all', label: 'All', countKey: 'all' },
  { id: 'success', label: 'Paid', countKey: 'paid' },
  { id: 'pending', label: 'Pending', countKey: 'pending' },
  { id: 'failed', label: 'Failed', countKey: 'failed' },
];

function normalizePaymentTxnStatus(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'paid' || value === 'success') return 'success';
  if (value === 'failed' || value === 'fail') return 'failed';
  if (value === 'pending') return 'pending';
  if (value === 'refunded') return 'refunded';
  return value || 'pending';
}
const DELIVERY_TABLE_MAX_HEIGHT = 'min(520px, 55vh)';
const DELIVERY_AUTO_REFRESH_MS = 60000;
const PAYMENTS_AUTO_REFRESH_MS = 45000;

const BTN_OUTLINE_DANGER =
  'inline-flex items-center justify-center gap-1 rounded-lg border border-red-500 px-3 py-1.5 text-[0.78rem] font-bold text-red-600 transition hover:bg-red-50 [.admin-dark_&]:border-red-500/40 [.admin-dark_&]:text-red-400 [.admin-dark_&]:hover:bg-red-500/10';
const BTN_STOCK_ADJ =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm font-bold text-gray-700 transition hover:bg-gray-100 [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-white/5 [.admin-dark_&]:text-gray-200';

const DELIVERY_STAGES = [
  { value: 1, label: 'Step 1: Order Placed' },
  { value: 2, label: 'Step 2: Payment Verified' },
  { value: 3, label: 'Step 3: Preparing Order' },
  { value: 4, label: 'Step 4: Out for Delivery' },
  { value: 5, label: 'Step 5: Delivered' },
];

const DELIVERY_FILTER_PILLS = [
  { id: 'all', label: 'All paid', countKey: 'all' },
  { id: 'preparing', label: 'Preparing', countKey: 'preparing' },
  { id: 'out', label: 'On the way', countKey: 'out' },
  { id: 'delivered', label: 'Delivered', countKey: 'delivered' },
];

const DELIVERY_DISPATCH_STAGES = DELIVERY_STAGES.filter((stage) => stage.value >= 2);

function getOrderStep(order) {
  return typeof order?.currentStep === 'number' ? order.currentStep : 1;
}

function isOrderDelivered(order) {
  const step = getOrderStep(order);
  return step >= 5 || (order.status || '').toLowerCase() === 'delivered';
}

function isOrderUnassigned(order) {
  return !hasAssignedDriver(order);
}

function hasAssignedDriver(order) {
  if (String(order?.assignedDriverId || '').trim()) return true;
  const driver = (order.driver || '').trim();
  return Boolean(driver && driver !== 'Not assigned yet' && driver !== 'Not assigned');
}

function isDriverDeclined(order) {
  return Boolean(String(order?.assignmentRejectReason || '').trim());
}

function isAwaitingDriverAccept(order) {
  return (
    order?.assignmentStatus === 'pending' &&
    Boolean(order?.assignedDriverId) &&
    !isOrderDelivered(order)
  );
}

function deliveryMatchesFilter(order, filterId) {
  const step = getOrderStep(order);
  if (filterId === 'all') return true;
  if (filterId === 'preparing') return step === 3;
  if (filterId === 'out') return step === 4;
  if (filterId === 'delivered') return isOrderDelivered(order);
  return true;
}

function deliveryMatchesAssignmentFilter(order, filterId) {
  if (filterId === 'all') return true;
  if (filterId === 'assigned') return hasAssignedDriver(order) && !isOrderDelivered(order);
  if (filterId === 'unassigned') return !hasAssignedDriver(order) && !isOrderDelivered(order);
  if (filterId === 'rejected') return isDriverDeclined(order) && !isOrderDelivered(order);
  return true;
}

function isDeliveryEligible(order) {
  if (!isOrderPaid(order)) return false;
  const step = getOrderStep(order);
  const status = (order.status || '').toLowerCase();
  return status !== 'cancelled' && step !== 0;
}

function getStockVal(p) {
  return typeof p.stockVal === 'number' ? p.stockVal : p.stock === 'in-stock' ? 12 : 0;
}

function applyStockFields(p, stockVal) {
  const val = Math.max(0, Number(stockVal) || 0);
  return {
    ...p,
    stockVal: val,
    stock: val > 0 ? 'in-stock' : 'out-of-stock',
    availability: val > 0 ? 'In Stock' : 'Out of Stock',
  };
}

function stockStatusBadge(stockVal) {
  if (stockVal === 0) {
    return (
      <span className="inline-flex rounded-lg bg-red-100 px-2.5 py-1 text-[0.75rem] font-extrabold text-red-700 [.admin-dark_&]:bg-red-500/15 [.admin-dark_&]:text-red-300">
        Out of Stock
      </span>
    );
  }
  if (stockVal <= getLowStockThreshold()) {
    return (
      <span className="inline-flex rounded-lg bg-amber-100 px-2.5 py-1 text-[0.75rem] font-extrabold text-amber-800 [.admin-dark_&]:bg-amber-500/15 [.admin-dark_&]:text-amber-300">
        Low Stock
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-lg bg-emerald-100 px-2.5 py-1 text-[0.75rem] font-extrabold text-emerald-700 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300">
      In Stock
    </span>
  );
}

function paymentStatusBadge(status) {
  const label = status === 'success' ? 'Paid' : status === 'failed' ? 'Failed' : 'Pending';
  const cls =
    status === 'success'
      ? 'bg-emerald-100 text-emerald-700 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300'
      : status === 'failed'
        ? 'bg-red-100 text-red-700 [.admin-dark_&]:bg-red-500/15 [.admin-dark_&]:text-red-300'
        : 'bg-amber-100 text-amber-800 [.admin-dark_&]:bg-amber-500/15 [.admin-dark_&]:text-amber-300';
  return (
    <span className={`inline-flex rounded-lg px-2.5 py-1 text-[0.75rem] font-extrabold ${cls}`}>{label}</span>
  );
}

function formatCategory(cat) {
  if (!cat) return '—';
  if (cat === 'living-room') return 'Living Room';
  if (cat === 'dining-room') return 'Dining Room';
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

function extractDistrict(address) {
  const parts = (address || '').split(',');
  return parts.length > 1 ? parts[1]?.trim() || parts[0] : parts[0] || 'Mogadishu';
}

function OpsStatCard({ label, value, icon, iconWrapClass }) {
  return (
    <div className={STAT_CARD}>
      <div className="min-w-0">
        <p className="mb-1 text-[0.72rem] font-extrabold uppercase tracking-wider text-teal [.admin-dark_&]:text-teal/90">
          {label}
        </p>
        <p className="font-display text-2xl font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">{value}</p>
      </div>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconWrapClass}`}>
        <i className={`fa-solid ${icon} text-lg`} aria-hidden="true" />
      </div>
    </div>
  );
}

function buildStockPayload(p) {
  return {
    title: p.title,
    category: p.category,
    price: p.price,
    stockVal: p.stockVal,
    stock: p.stock,
    availability: p.availability,
    status: p.status,
  };
}

function formatStockDelta(delta) {
  const n = Number(delta) || 0;
  if (n > 0) return `+${n} unit${n === 1 ? '' : 's'} added`;
  if (n < 0) return `${Math.abs(n)} unit${Math.abs(n) === 1 ? '' : 's'} removed`;
  return 'No change';
}

function stockDeltaBadgeClass(delta) {
  const n = Number(delta) || 0;
  if (n > 0) {
    return 'bg-emerald-100 text-emerald-700 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300';
  }
  if (n < 0) {
    return 'bg-red-100 text-red-700 [.admin-dark_&]:bg-red-500/15 [.admin-dark_&]:text-red-300';
  }
  return 'bg-slate-100 text-slate-600 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-slate-300';
}

async function fetchProductStockConsumption(productId, batchId) {
  const query = batchId ? `?batchId=${encodeURIComponent(batchId)}` : '';
  const res = await fetchWithTimeout(
    apiUrl(`/api/products/${productId}/stock-consumption${query}`),
    { headers: authHeaders() },
    ADMIN_FETCH_TIMEOUT
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    const err = new Error(data.message || `Stock consumption unavailable (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

function sortStockSoldEntries(entries) {
  return [...entries].sort(
    (a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime()
  );
}

async function fetchProductStockInventory(productId, product) {
  const res = await fetchWithTimeout(
    apiUrl(`/api/products/${productId}/stock-inventory`),
    { headers: authHeaders() },
    ADMIN_FETCH_TIMEOUT
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    const err = new Error(data.message || `Stock inventory unavailable (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

function StockSubModal({ open, title, onClose, children, maxWidth = 'max-w-lg', compact = false, zIndex = 10001, maxHeight }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined' || !document.body) return null;

  const bodyMaxHeight = maxHeight || (compact ? 'min(40vh,280px)' : 'min(60vh,460px)');

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      style={{ zIndex }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`animate-productModalIn w-full ${maxWidth} overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.2)] [.admin-dark_&]:border-white/10 dark:bg-[#243029] dark:border-white/14 [.admin-dark_&]:bg-[#243029] [.admin-dark_&]:border-white/14`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3 [.admin-dark_&]:border-white/10">
          <h4 className="m-0 text-[0.92rem] font-bold text-deepGreen [.admin-dark_&]:text-emerald-300">{title}</h4>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 [.admin-dark_&]:hover:bg-white/10"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto p-4 [scrollbar-width:thin]" style={{ maxHeight: bodyMaxHeight }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

function StockOrderProductsModal({ open, orderId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!open || !orderId) {
      setOrder(null);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchWithTimeout(
          apiUrl(`/api/orders/${encodeURIComponent(orderId)}/details`),
          { headers: authHeaders(false) },
          ADMIN_FETCH_TIMEOUT
        );
        const data = await res.json();
        if (!cancelled && data.success) {
          setOrder(data.order || null);
        }
      } catch {
        if (!cancelled) setOrder(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, orderId]);

  return (
    <StockSubModal
      open={open}
      title={orderId ? `Order ${orderId}` : 'Order products'}
      onClose={onClose}
      maxWidth="max-w-lg"
      maxHeight="min(60vh,460px)"
      zIndex={10002}
    >
      {loading ? (
        <p className="m-0 text-[0.84rem] text-gray-400">Loading order…</p>
      ) : order ? (
        <OrderItemsList order={order} />
      ) : (
        <p className="m-0 text-[0.84rem] text-gray-400">Could not load order details.</p>
      )}
    </StockSubModal>
  );
}

function formatStockDate(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatStockTime(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function StockSoldModal({ open, onClose, productId, batchId, onOrderClick }) {
  const [consumption, setConsumption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !productId || !batchId) {
      setConsumption(null);
      setError('');
      return undefined;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchProductStockConsumption(productId, batchId);
        if (!cancelled) setConsumption(data);
      } catch (err) {
        if (!cancelled) {
          setConsumption(null);
          setError(err.message || 'Could not load sales breakdown.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, productId, batchId]);

  const entries = useMemo(
    () => sortStockSoldEntries(consumption?.entries || []),
    [consumption]
  );
  const totalSold = consumption?.totals?.sold ?? consumption?.batch?.unitsSold ?? 0;
  const totalLeft = consumption?.totals?.remaining ?? consumption?.batch?.unitsRemaining ?? 0;
  const isEmpty = !loading && !error && entries.length === 0;

  if (isEmpty) {
    return (
      <StockSubModal open={open} title="How stock was sold" onClose={onClose} maxWidth="max-w-sm" compact>
        <div className="py-1 text-center">
          <p className="m-0 text-[0.84rem] font-semibold text-gray-600 [.admin-dark_&]:text-gray-300">
            No sales from this stock batch yet.
          </p>
        </div>
      </StockSubModal>
    );
  }

  return (
    <StockSubModal
      open={open}
      title="How stock was sold"
      onClose={onClose}
      maxWidth="max-w-2xl"
      maxHeight="min(72vh,560px)"
    >
      {loading ? (
        <p className="m-0 text-[0.84rem] text-gray-400">Loading sales…</p>
      ) : error ? (
        <p className="m-0 text-[0.84rem] text-amber-700 [.admin-dark_&]:text-amber-300">{error}</p>
      ) : (
        <div>
          <div className="overflow-x-auto overflow-y-auto rounded-[12px] border border-black/[0.06] [scrollbar-width:thin] [.admin-dark_&]:border-white/10">
            <table className="w-full min-w-[560px] border-collapse text-left text-[0.8rem]">
              <thead className="sticky top-0 z-[1] bg-gray-50 [.admin-dark_&]:bg-[#141f1b]">
                <tr className="text-[0.62rem] font-extrabold uppercase tracking-wide text-gray-400">
                  <th className="px-3 py-2.5">Customer</th>
                  <th className="px-3 py-2.5">Order ID</th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5 text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={`${entry.orderId}-${entry.customer}`}
                    onClick={() => onOrderClick?.(entry.orderId)}
                    className="cursor-pointer border-t border-black/[0.04] transition hover:bg-deepGreen/[0.04] [.admin-dark_&]:border-white/[0.06] [.admin-dark_&]:hover:bg-emerald-500/[0.06]"
                    title="View order products"
                  >
                    <td className="max-w-[140px] truncate px-3 py-2.5 font-semibold text-deepGreen [.admin-dark_&]:text-emerald-300">
                      {entry.customer}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[0.78rem] font-bold text-gray-700 [.admin-dark_&]:text-gray-200">
                      {entry.orderId}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-gray-500 [.admin-dark_&]:text-gray-400">
                      {formatOrderDate(entry.orderedAt)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-bold text-red-600 [.admin-dark_&]:text-red-300">
                      −{entry.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mb-0 mt-3 text-right text-[0.82rem] font-semibold text-gray-600 [.admin-dark_&]:text-gray-300">
            <span className="text-red-600 [.admin-dark_&]:text-red-300">{totalSold} sold</span>
            <span className="mx-1.5 text-gray-300 [.admin-dark_&]:text-gray-600">·</span>
            <span className="text-deepGreen [.admin-dark_&]:text-emerald-300">{totalLeft} left</span>
          </p>
        </div>
      )}
    </StockSubModal>
  );
}

function StockUpdatesTable({ batches, loading, onBatchClick }) {
  if (loading) {
    return <p className="mb-0 mt-3 text-[0.72rem] text-gray-400">Loading stock updates…</p>;
  }

  if (!batches?.length) {
    return (
      <p className="mb-0 mt-3 text-[0.72rem] text-gray-400">
        No stock updates yet. Save a new stock level to start tracking.
      </p>
    );
  }

  return (
    <div className="mt-3 border-t border-black/[0.06] pt-3 [.admin-dark_&]:border-white/10">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="m-0 text-[0.65rem] font-bold uppercase tracking-wide text-gray-400">Last stock updates</p>
        <span className="text-[0.68rem] font-semibold text-gray-400">
          {batches[0]?.id?.startsWith('BATCH-MOCK-') ? 'Preview · ' : ''}
          {batches.length} shown
        </span>
      </div>

      <div className="max-h-[220px] overflow-y-auto overflow-x-hidden rounded-[12px] border border-black/[0.06] [scrollbar-width:thin] [.admin-dark_&]:border-white/10">
        <table className="w-full border-collapse text-left text-[0.78rem]">
          <thead className="sticky top-0 z-[1] bg-gray-50 [.admin-dark_&]:bg-[#141f1b]">
            <tr className="text-[0.62rem] font-extrabold uppercase tracking-wide text-gray-400">
              <th className="px-2.5 py-2">By</th>
              <th className="px-2.5 py-2">Date</th>
              <th className="px-2.5 py-2">Time</th>
              <th className="px-2.5 py-2">Before</th>
              <th className="px-2.5 py-2">Add</th>
              <th className="px-2.5 py-2">Now</th>
              <th className="px-2.5 py-2 text-right">Sold</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr
                key={batch.id}
                onClick={() => onBatchClick?.(batch)}
                className="cursor-pointer border-t border-black/[0.04] transition hover:bg-deepGreen/[0.03] [.admin-dark_&]:border-white/[0.06]"
              >
                <td className="max-w-[88px] truncate px-2.5 py-2 font-semibold text-gray-800 [.admin-dark_&]:text-gray-100">
                  {batch.addedBy?.name || 'Unknown'}
                </td>
                <td className="whitespace-nowrap px-2.5 py-2 text-gray-500">{formatStockDate(batch.createdAt)}</td>
                <td className="whitespace-nowrap px-2.5 py-2 text-gray-500">{formatStockTime(batch.createdAt)}</td>
                <td className="px-2.5 py-2 font-semibold text-gray-700 [.admin-dark_&]:text-gray-200">{batch.stockBefore}</td>
                <td className="px-2.5 py-2 font-bold text-emerald-700 [.admin-dark_&]:text-emerald-300">+{batch.unitsAdded}</td>
                <td className="px-2.5 py-2 font-semibold text-gray-700 [.admin-dark_&]:text-gray-200">{batch.stockAfter}</td>
                <td className="px-2.5 py-2 text-right font-semibold text-red-600 [.admin-dark_&]:text-red-300">
                  {batch.unitsSold ?? Math.max(0, batch.unitsAdded - batch.unitsRemaining)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {batches.length > 4 && (
        <p className="mb-0 mt-1.5 text-[0.7rem] text-gray-400">
          Scroll for more updates. Click a row for sales breakdown.
        </p>
      )}
    </div>
  );
}

function exportStockToCSV(rows) {
  if (!rows.length) {
    showTopFloatNotification('No inventory to export.', 'danger');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'ID,Product,Category,Price,Stock,Status\n';

  rows.forEach((p) => {
    const stockVal = getStockVal(p);
    const status =
      stockVal === 0 ? 'Out of Stock' : stockVal <= getLowStockThreshold() ? 'Low Stock' : 'In Stock';
    const title = String(p.title || '').replace(/"/g, '""');
    csvContent += `"${p.id}","${title}","${formatCategory(p.category)}","${p.price}","${stockVal}","${status}"\n`;
  });

  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csvContent));
  link.setAttribute('download', `MMF_Stock_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showTopFloatNotification('Stock inventory exported as CSV.');
}

function StockStatCard({ label, value, icon, iconWrapClass, active, onClick }) {
  const className = [
    'group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all duration-300',
    active
      ? 'border-deepGreen/20 bg-deepGreen/[0.04] shadow-[0_6px_20px_rgba(7,61,53,0.08)]'
      : 'border-deepGreen/[0.06] bg-white hover:-translate-y-px hover:border-deepGreen/12 hover:shadow-[0_6px_20px_rgba(7,61,53,0.07)]',
    'cursor-pointer active:scale-[0.99]',
    '[.admin-dark_&]:border-white/[0.08] dark:bg-[#1a2421] [.admin-dark_&]:bg-[#1a2421] [.admin-dark_&]:hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)]',
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

function StockFilterToolbar({ filterCategory, categoryOptions, onCategoryChange, onExport }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-deepGreen/[0.06] bg-white px-3 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.03)] [.admin-dark_&]:border-white/[0.08] dark:bg-[#1a2421] [.admin-dark_&]:bg-[#1a2421]">
      <div className="flex items-center gap-1.5">
        <span className="text-[0.62rem] font-bold uppercase tracking-wide text-gray-400">Category</span>
        <select
          id="admStockCategoryFilter"
          className={`${ADM_SELECT} !min-h-0 w-auto min-w-[10rem] !py-1 !pl-2 !pr-7 !text-[0.68rem] !font-semibold`}
          value={filterCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          aria-label="Filter by category"
        >
          {categoryOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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

function StockMetaField({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[0.65rem] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <div className="mt-1 text-[0.86rem] font-semibold text-gray-900 [.admin-dark_&]:text-gray-100">{children}</div>
    </div>
  );
}

function PaymentsStatCard({ label, value, icon, iconWrapClass, active, onClick, interactive = true }) {
  const className = [
    'group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all duration-300',
    active
      ? 'border-deepGreen/20 bg-deepGreen/[0.04] shadow-[0_6px_20px_rgba(7,61,53,0.08)]'
      : 'border-deepGreen/[0.06] bg-white hover:-translate-y-px hover:border-deepGreen/12 hover:shadow-[0_6px_20px_rgba(7,61,53,0.07)]',
    interactive ? 'cursor-pointer active:scale-[0.99]' : '',
    '[.admin-dark_&]:border-white/[0.08] dark:bg-[#1a2421] [.admin-dark_&]:bg-[#1a2421] [.admin-dark_&]:hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)]',
    active ? '[.admin-dark_&]:border-emerald-500/25 [.admin-dark_&]:bg-emerald-500/10' : '',
  ].join(' ');

  const content = (
    <>
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
      {interactive && (
        <i
          className="fa-solid fa-chevron-right shrink-0 text-[0.55rem] text-gray-300 transition group-hover:text-deepGreen [.admin-dark_&]:text-gray-600 [.admin-dark_&]:group-hover:text-emerald-300"
          aria-hidden="true"
        />
      )}
    </>
  );

  if (!interactive) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  );
}

function PaymentDetailModal({ open, transaction, verifying, onClose, onVerify, onOrderClick }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !verifying) onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, verifying]);

  if (!open || !transaction || typeof document === 'undefined' || !document.body) return null;

  const txn = transaction;
  const status = normalizePaymentTxnStatus(txn.status);
  const canVerify = status === 'pending' && txn.orderId;
  const evcId = txn.referenceId || txn.transactionId || txn.id || '—';
  const customerName = txn.customer || 'Customer';
  const methodLabel = txn.method || 'EVC Plus';

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
          aria-labelledby="paymentDetailTitle"
        >
          <button
            type="button"
            className="absolute right-[15px] top-[15px] z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 bg-white text-[1.4rem] leading-none text-[#111] shadow-[0_2px_10px_rgba(0,0,0,0.15)] [.admin-dark_&]:bg-[#243029] [.admin-dark_&]:text-gray-200"
            onClick={onClose}
            disabled={verifying}
            aria-label="Close"
          >
            ×
          </button>

          <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
            <div className="min-w-0 pr-10">
              <h3
                id="paymentDetailTitle"
                className="font-display text-xl font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]"
              >
                {customerName}
              </h3>
              <p className="mb-0 mt-1 font-mono text-[0.82rem] text-gray-500 [.admin-dark_&]:text-gray-400">
                {txn.orderId || '—'}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {paymentStatusBadge(status)}
                <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-[0.75rem] font-extrabold text-slate-700 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-slate-200">
                  {methodLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 [scrollbar-width:thin]">
            <div className="grid gap-3 rounded-xl border border-gray-100 bg-[#fdfbf8] p-4 sm:grid-cols-2 [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-white/[0.03]">
              <div>
                <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">Phone</p>
                <p className="mb-0 text-[0.88rem] font-semibold text-gray-800 [.admin-dark_&]:text-gray-100">
                  {txn.phone || '—'}
                </p>
              </div>
              <div>
                <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">Amount</p>
                <p className="mb-0 text-[0.88rem] font-semibold text-emerald-700 [.admin-dark_&]:text-emerald-400">
                  {formatUSD(txn.amount)}
                </p>
              </div>
              <div>
                <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">Order ID</p>
                {txn.orderId ? (
                  <button
                    type="button"
                    className="mb-0 font-mono text-[0.88rem] font-bold text-deepGreen underline decoration-deepGreen/30 underline-offset-2 hover:decoration-deepGreen [.admin-dark_&]:text-emerald-400"
                    onClick={() => onOrderClick?.(txn.orderId)}
                  >
                    {txn.orderId}
                  </button>
                ) : (
                  <p className="mb-0 text-[0.88rem] font-semibold text-gray-800 [.admin-dark_&]:text-gray-100">—</p>
                )}
              </div>
              <div>
                <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">Date</p>
                <p className="mb-0 text-[0.88rem] font-semibold text-gray-800 [.admin-dark_&]:text-gray-100">
                  {formatOrderDate(txn.createdAt)}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">EVC / Transaction ID</p>
                <p className="mb-0 break-all font-mono text-[0.88rem] font-semibold text-gray-800 [.admin-dark_&]:text-gray-100">
                  {evcId}
                </p>
              </div>
              {txn.message ? (
                <div className="sm:col-span-2">
                  <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">Message</p>
                  <p className="mb-0 text-[0.88rem] font-semibold leading-relaxed text-gray-800 [.admin-dark_&]:text-gray-100">
                    {txn.message}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
            <button type="button" className={BTN_GHOST} onClick={onClose} disabled={verifying}>
              Close
            </button>
            {canVerify ? (
              <button
                type="button"
                className={BTN_PRIMARY}
                disabled={verifying}
                onClick={() => onVerify?.(txn.orderId)}
              >
                {verifying ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> Verifying…
                  </>
                ) : (
                  'Verify payment'
                )}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function StockDetailsModal({ open, product, saving, historyRefreshKey, onClose, onSave }) {
  const [draftStockVal, setDraftStockVal] = useState(0);
  const [inventory, setInventory] = useState(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState('');
  const [soldOpen, setSoldOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [orderProductsOpen, setOrderProductsOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');

  useEffect(() => {
    if (open && product) {
      setDraftStockVal(getStockVal(product));
    }
  }, [open, product?.id, product?.stockVal]);

  useEffect(() => {
    if (!open) {
      setInventory(null);
      setInventoryError('');
      setSoldOpen(false);
      setSelectedBatchId('');
      setOrderProductsOpen(false);
      setSelectedOrderId('');
      return undefined;
    }

    if (!product?.id) return undefined;

    let cancelled = false;
    (async () => {
      setInventoryLoading(true);
      setInventoryError('');
      try {
        const data = await fetchProductStockInventory(product.id, product);
        if (!cancelled) setInventory(data);
      } catch (err) {
        if (!cancelled) {
          setInventory(null);
          setInventoryError(
            err.status === 404
              ? 'Stock inventory is unavailable. Restart the backend server to load the latest API.'
              : err.message || 'Could not load stock inventory.'
          );
        }
      } finally {
        if (!cancelled) setInventoryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, product?.id, historyRefreshKey]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (orderProductsOpen) {
        setOrderProductsOpen(false);
        setSelectedOrderId('');
      } else if (soldOpen) {
        setSoldOpen(false);
        setSelectedBatchId('');
      } else {
        onClose?.();
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, soldOpen, orderProductsOpen]);

  const handleOrderClick = (orderId) => {
    setSelectedOrderId(orderId);
    setOrderProductsOpen(true);
  };

  const handleBatchClick = (batch) => {
    setSelectedBatchId(batch.id);
    setSoldOpen(true);
  };

  if (!open || !product || typeof document === 'undefined' || !document.body) return null;

  const stockVal = draftStockVal;
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
          className="animate-productModalIn relative flex max-h-[92vh] w-full max-w-[930px] flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_25px_60px_rgba(0,0,0,0.22)] dark:bg-[#243029] dark:border-white/14 [.admin-dark_&]:bg-[#243029] [.admin-dark_&]:border-white/14"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="stockDetailTitle"
        >
          <button
            type="button"
            className="absolute right-[15px] top-[15px] z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 bg-white text-[1.4rem] leading-none text-[#111] shadow-[0_2px_10px_rgba(0,0,0,0.15)] [.admin-dark_&]:bg-[#243029] [.admin-dark_&]:text-gray-200"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
            <div className={PRODUCT_MODAL_BODY_CLASS}>
              <ProductModalHeroRow
                gallery={
                  <ProductModalGallery
                    images={product.images}
                    title={product.title}
                    resetKey={product.id}
                  />
                }
                details={
                  <div className={PRODUCT_MODAL_DETAILS_COL_CLASS}>
                    <p className="font-mono text-[0.72rem] font-semibold text-gray-400">ID #{product.id}</p>
                    <h3
                      id="stockDetailTitle"
                      className="mb-2 mt-0.5 pr-8 font-display text-[1.75rem] font-bold leading-[1.15] text-deepGreen md:text-[2rem] [.admin-dark_&]:text-[#e8f0ed]"
                    >
                      {product.title}
                    </h3>
                    <div className="mb-4">{stockStatusBadge(stockVal)}</div>

                    <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-3">
                      <StockMetaField label="Category">{formatCategory(product.category)}</StockMetaField>
                      <StockMetaField label="Price">{formatAdminPrice(product.price)}</StockMetaField>
                      <StockMetaField label="Availability">
                        {product.availability || (stockVal > 0 ? 'In Stock' : 'Out of Stock')}
                      </StockMetaField>
                      <StockMetaField label="Catalog status">{product.status || 'Active'}</StockMetaField>
                    </div>

                    <div className="rounded-xl border border-deepGreen/10 bg-deepGreen/[0.03] p-4 [.admin-dark_&]:border-emerald-500/15 [.admin-dark_&]:bg-emerald-500/[0.06]">
                      <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-wide text-gray-500">
                        Adjust stock level
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                        <button
                          type="button"
                          className={`${BTN_STOCK_ADJ} !h-10 !w-10 !text-base`}
                          onClick={() => setDraftStockVal((v) => Math.max(0, v - 1))}
                          aria-label="Decrease stock"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="0"
                          className={`${ADM_INPUT} !w-[84px] !px-2 py-2.5 text-center !text-[1.15rem] !font-bold`}
                          value={stockVal}
                          onChange={(e) => {
                            const next = Math.max(0, parseInt(e.target.value, 10) || 0);
                            setDraftStockVal(next);
                          }}
                        />
                        <button
                          type="button"
                          className={`${BTN_STOCK_ADJ} !h-10 !w-10 !text-base`}
                          onClick={() => setDraftStockVal((v) => v + 1)}
                          aria-label="Increase stock"
                        >
                          +
                        </button>
                      </div>
                      <p className="mt-3 text-center text-[0.78rem] text-gray-500 sm:text-left [.admin-dark_&]:text-gray-400">
                        units currently in inventory
                      </p>
                    </div>

                    <StockUpdatesTable
                      batches={inventory?.batches}
                      loading={inventoryLoading}
                      onBatchClick={handleBatchClick}
                    />
                    {inventoryError && (
                      <p className="mt-2 text-[0.75rem] text-amber-700 [.admin-dark_&]:text-amber-300">{inventoryError}</p>
                    )}
                  </div>
                }
              />
            </div>
          </div>

          <StockSoldModal
            open={soldOpen}
            onClose={() => {
              setSoldOpen(false);
              setSelectedBatchId('');
            }}
            productId={product.id}
            batchId={selectedBatchId}
            onOrderClick={handleOrderClick}
          />

          <StockOrderProductsModal
            open={orderProductsOpen}
            orderId={selectedOrderId}
            onClose={() => {
              setOrderProductsOpen(false);
              setSelectedOrderId('');
            }}
          />

          <div className="flex justify-end gap-2 border-t border-black/[0.06] bg-gray-50/80 px-6 py-3.5 [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#141f1b]">
            <button type="button" className={BTN_GHOST} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className={BTN_PRIMARY}
              disabled={saving}
              onClick={() => onSave?.(applyStockFields(product, draftStockVal))}
            >
              {saving ? 'Saving…' : 'Save Stock'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// =============================================================================
// AdminStockTab
// =============================================================================

export function AdminStockTab({ headerSearch = '' }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStock, setFilterStock] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const searchQuery = headerSearch.toLowerCase().trim();

  const loadProducts = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetchWithTimeout(apiUrl('/api/products'), {}, ADMIN_FETCH_TIMEOUT);
      const data = await res.json();
      if (data.success) {
        setProducts((data.products || []).map((p) => applyStockFields(p, getStockVal(p))));
      }
    } catch {
      showTopFloatNotification('Failed to load inventory.', 'danger');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    const onInvalidate = () => loadProducts({ quiet: true });
    const onFilter = (e) => {
      const title = e.detail?.title;
      const productId = e.detail?.productId;
      const q = title || (productId ? String(productId) : '');
      if (q) {
        window.applyAdminHeaderSearch?.(q, 'stock');
        window.dispatchEvent(new CustomEvent('admin-header-search-sync'));
      }
    };
    window.addEventListener('admin-stock-invalidate', onInvalidate);
    window.addEventListener('admin-stock-filter', onFilter);
    return () => {
      window.removeEventListener('admin-stock-invalidate', onInvalidate);
      window.removeEventListener('admin-stock-filter', onFilter);
    };
  }, [loadProducts]);

  const stockStats = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    products.forEach((p) => {
      const stockVal = getStockVal(p);
      if (stockVal === 0) outOfStock += 1;
      else if (stockVal <= getLowStockThreshold()) lowStock += 1;
      else inStock += 1;
    });
    return { total: products.length, inStock, lowStock, outOfStock };
  }, [products]);

  const categoryOptions = useMemo(() => {
    const slugs = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
    return [
      { value: 'all', label: 'All Categories' },
      ...slugs.map((slug) => ({ value: slug, label: formatCategory(slug) })),
    ];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const stockVal = getStockVal(p);
      const matchQuery =
        !searchQuery ||
        p.title?.toLowerCase().includes(searchQuery) ||
        p.category?.toLowerCase().includes(searchQuery) ||
        String(p.id).includes(searchQuery);

      const matchCategory = filterCategory === 'all' || p.category?.toLowerCase() === filterCategory;

      const matchStock =
        filterStock === 'all'
          ? true
          : filterStock === 'inStock'
            ? stockVal > 5
            : filterStock === 'lowStock'
              ? stockVal > 0 && stockVal <= getLowStockThreshold()
              : filterStock === 'outOfStock'
                ? stockVal === 0
                : true;

      return matchQuery && matchCategory && matchStock;
    });
  }, [products, searchQuery, filterCategory, filterStock]);

  const activeStatKey =
    filterStock === 'all'
      ? 'total'
      : filterStock === 'inStock'
        ? 'inStock'
        : filterStock === 'lowStock'
          ? 'lowStock'
          : filterStock === 'outOfStock'
            ? 'outOfStock'
            : null;

  const saveStock = async (productWithStock, { closeOnSuccess = false } = {}) => {
    setSavingId(productWithStock.id);
    try {
      const res = await fetch(apiUrl(`/api/products/${productWithStock.id}`), {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(buildStockPayload(productWithStock)),
      });
      const data = await res.json();
      if (data.success) {
        const saved = data.product
          ? applyStockFields(data.product, getStockVal(data.product))
          : productWithStock;
        setProducts((rows) => rows.map((p) => (p.id === saved.id ? saved : p)));
        if (selectedProduct?.id === saved.id) {
          setSelectedProduct(saved);
        }
        if (data.lastStockChange || data.lastStockBatch) {
          setHistoryRefreshKey((k) => k + 1);
        }
        showTopFloatNotification(`Stock for "${saved.title}" updated to ${saved.stockVal} units.`);
        window.dispatchEvent(new CustomEvent('admin-stock-invalidate'));
        window.dispatchEvent(new CustomEvent('admin-products-invalidate'));
        if (closeOnSuccess) {
          setDetailsOpen(false);
          setSelectedProduct(null);
        }
      } else {
        showTopFloatNotification(data.message || 'Save failed.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not save stock level.', 'danger');
    } finally {
      setSavingId(null);
    }
  };

  const openStockDetails = (product) => {
    setSelectedProduct(product);
    setDetailsOpen(true);
  };

  const closeStockDetails = () => {
    setDetailsOpen(false);
    setSelectedProduct(null);
  };

  const modalProduct = selectedProduct
    ? products.find((p) => p.id === selectedProduct.id) || selectedProduct
    : null;

  return (
    <div className="animate-cardRise space-y-2.5">
      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <StockStatCard
          label="Total Items"
          value={loading ? '…' : stockStats.total.toLocaleString()}
          icon="fa-cubes"
          iconWrapClass="bg-blue-500/10 text-blue-600"
          active={activeStatKey === 'total'}
          onClick={() => {
            setFilterStock('all');
            setFilterCategory('all');
          }}
        />
        <StockStatCard
          label="In Stock"
          value={loading ? '…' : stockStats.inStock.toLocaleString()}
          icon="fa-circle-check"
          iconWrapClass="bg-emerald-500/10 text-emerald-600"
          active={activeStatKey === 'inStock'}
          onClick={() => setFilterStock('inStock')}
        />
        <StockStatCard
          label="Low Stock"
          value={loading ? '…' : stockStats.lowStock.toLocaleString()}
          icon="fa-triangle-exclamation"
          iconWrapClass="bg-amber-500/10 text-amber-600"
          active={activeStatKey === 'lowStock'}
          onClick={() => setFilterStock('lowStock')}
        />
        <StockStatCard
          label="Out of Stock"
          value={loading ? '…' : stockStats.outOfStock.toLocaleString()}
          icon="fa-circle-xmark"
          iconWrapClass="bg-red-500/10 text-red-600"
          active={activeStatKey === 'outOfStock'}
          onClick={() => setFilterStock('outOfStock')}
        />
      </div>

      <StockFilterToolbar
        filterCategory={filterCategory}
        categoryOptions={categoryOptions}
        onCategoryChange={setFilterCategory}
        onExport={() => exportStockToCSV(filtered)}
      />

      <div className={`${ADM_TABLE_CARD} !p-0 overflow-hidden`}>
        <div
          className="overflow-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-deepGreen/15 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5"
          style={{ maxHeight: STOCK_TABLE_MAX_HEIGHT }}
        >
          <table className={`${ADM_TABLE} [&_tbody_tr]:cursor-pointer [&_tbody_tr]:transition-colors`}>
            <thead className="sticky top-0 z-[5] bg-white dark:bg-[#1a2421] [.admin-dark_&]:bg-[#1a2421]">
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="cursor-default py-8 text-center text-gray-400">
                    <i className="fa-solid fa-spinner fa-spin me-2" aria-hidden="true" />
                    Loading stock…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="cursor-default py-10 text-center">
                    <div className="mx-auto max-w-xs">
                      <i className="fa-solid fa-inbox mb-2 text-2xl text-gray-300" aria-hidden="true" />
                      <p className="text-[0.85rem] font-semibold text-gray-500 [.admin-dark_&]:text-gray-400">
                        No matching inventory
                      </p>
                      <p className="mt-1 text-[0.75rem] text-gray-400">
                        Try changing filters or search from the header.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((p) => {
                  const stockVal = getStockVal(p);
                  return (
                    <tr
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openStockDetails(p)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openStockDetails(p);
                        }
                      }}
                      className="hover:bg-deepGreen/[0.03]"
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <img
                            src={productImage(p.images?.[0])}
                            alt=""
                            className="h-11 w-11 rounded-lg object-cover"
                          />
                          <span className="font-bold text-gray-900 [.admin-dark_&]:text-gray-100">{p.title}</span>
                        </div>
                      </td>
                      <td className="font-medium text-gray-600 [.admin-dark_&]:text-gray-400">
                        {formatCategory(p.category)}
                      </td>
                      <td className="font-bold text-gray-900 [.admin-dark_&]:text-gray-100">
                        {formatAdminPrice(p.price)}
                      </td>
                      <td className="font-medium text-gray-600">
                        {stockVal <= getLowStockThreshold() && stockVal > 0 ? (
                          <span className="font-bold text-amber-600">{stockVal} <small>(Low)</small></span>
                        ) : (
                          stockVal
                        )}
                      </td>
                      <td>{stockStatusBadge(stockVal)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <StockDetailsModal
        open={detailsOpen}
        product={modalProduct}
        saving={Boolean(savingId && modalProduct && savingId === modalProduct.id)}
        historyRefreshKey={historyRefreshKey}
        onClose={closeStockDetails}
        onSave={(productWithStock) => saveStock(productWithStock, { closeOnSuccess: false })}
      />
    </div>
  );
}

// =============================================================================
// AdminPaymentsTab
// =============================================================================

export function AdminPaymentsTab({ headerSearch = '' }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [detailTxn, setDetailTxn] = useState(null);
  const [orderProductsOpen, setOrderProductsOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');

  const loadPayments = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetchWithTimeout(
        apiUrl('/api/payments/transactions'),
        { headers: authHeaders(false) },
        ADMIN_PAYMENTS_FETCH_TIMEOUT
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setTransactions(data.transactions || []);
      } else {
        if (!quiet) {
          showTopFloatNotification(
            data.message || `Failed to load payments (${res.status || 'network'}).`,
            'danger'
          );
        }
      }
    } catch {
      if (!quiet) {
        showTopFloatNotification(
          'Payments request timed out. Check backend on port 5000 and refresh.',
          'danger'
        );
      }
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useIntervalWhenVisible(() => loadPayments({ quiet: true }), PAYMENTS_AUTO_REFRESH_MS, true);

  useEffect(() => {
    const onInvalidate = () => loadPayments({ quiet: true });
    window.addEventListener('admin-payments-invalidate', onInvalidate);
    return () => window.removeEventListener('admin-payments-invalidate', onInvalidate);
  }, [loadPayments]);

  const paymentStats = useMemo(() => {
    const paid = transactions.filter((txn) => normalizePaymentTxnStatus(txn.status) === 'success').length;
    const failed = transactions.filter((txn) => normalizePaymentTxnStatus(txn.status) === 'failed').length;
    const pending = transactions.filter((txn) => normalizePaymentTxnStatus(txn.status) === 'pending').length;
    const totalRevenue = transactions
      .filter((txn) => normalizePaymentTxnStatus(txn.status) === 'success')
      .reduce((sum, txn) => sum + (Number(txn.amount) || 0), 0);
    return {
      all: transactions.length,
      paid,
      pending,
      failed,
      totalRevenue,
    };
  }, [transactions]);

  const filtered = useMemo(() => {
    const q = headerSearch.trim().toLowerCase();
    return transactions.filter((txn) => {
      const status = normalizePaymentTxnStatus(txn.status);
      if (filterStatus !== 'all' && status !== filterStatus) return false;
      if (!q) return true;
      const hay = [txn.transactionId, txn.id, txn.orderId, txn.customer, txn.phone, txn.referenceId, status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [transactions, filterStatus, headerSearch]);

  const statFilterMap = {
    all: 'all',
    paid: 'success',
    pending: 'pending',
    failed: 'failed',
  };

  const activeStatKey =
    filterStatus === 'all'
      ? 'all'
      : filterStatus === 'success'
        ? 'paid'
        : filterStatus === 'pending'
          ? 'pending'
          : filterStatus === 'failed'
            ? 'failed'
            : null;

  const verifyPayment = async (orderId) => {
    if (!orderId) return;
    setVerifyingId(orderId);
    try {
      const res = await fetch(apiUrl(`/api/payments/admin/verify/${encodeURIComponent(orderId)}`), {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification(`Payment verified for order ${orderId}.`);
        window.dispatchEvent(new CustomEvent('admin-payments-invalidate'));
        window.dispatchEvent(new CustomEvent('admin-dashboard-invalidate'));
        setDetailTxn(null);
      } else {
        showTopFloatNotification(data.message || 'Verification failed.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not verify payment.', 'danger');
    } finally {
      setVerifyingId(null);
    }
  };

  const openDetail = (txn) => setDetailTxn(txn);

  const openOrderProducts = (orderId) => {
    if (!orderId) return;
    setSelectedOrderId(orderId);
    setOrderProductsOpen(true);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2.5 pb-1">
      <div className="grid shrink-0 grid-cols-2 gap-2.5 xl:grid-cols-4">
        <PaymentsStatCard
          label="All Payments"
          value={loading ? '…' : (paymentStats.all ?? 0).toLocaleString()}
          icon="fa-credit-card"
          iconWrapClass="bg-blue-500/10 text-blue-600"
          active={activeStatKey === 'all'}
          onClick={() => setFilterStatus(statFilterMap.all)}
        />
        <PaymentsStatCard
          label="Paid"
          value={loading ? '…' : (paymentStats.paid ?? 0).toLocaleString()}
          icon="fa-circle-check"
          iconWrapClass="bg-emerald-500/10 text-emerald-600"
          active={activeStatKey === 'paid'}
          onClick={() => setFilterStatus(statFilterMap.paid)}
        />
        <PaymentsStatCard
          label="Revenue"
          value={loading ? '…' : formatUSD(paymentStats.totalRevenue)}
          icon="fa-sack-dollar"
          iconWrapClass="bg-teal/10 text-teal [.admin-dark_&]:text-teal"
          interactive={false}
        />
        <PaymentsStatCard
          label="Failed"
          value={loading ? '…' : (paymentStats.failed ?? 0).toLocaleString()}
          icon="fa-circle-xmark"
          iconWrapClass="bg-red-500/10 text-red-600"
          active={activeStatKey === 'failed'}
          onClick={() => setFilterStatus(statFilterMap.failed)}
        />
      </div>

      <div
        className={`flex shrink-0 flex-wrap items-center gap-1.5 rounded-xl border border-deepGreen/[0.06] bg-white px-3 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.03)] ${ADM_DARK_SURFACE_SM}`}
      >
        <span className={`mr-1 text-[0.65rem] font-bold uppercase tracking-wide text-gray-400 ${ADM_DARK_TEXT_MUTED}`}>
          Filter
        </span>
        {PAYMENT_FILTER_PILLS.map((pill) => {
          const active = filterStatus === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => setFilterStatus(pill.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-bold transition ${
                active
                  ? 'bg-deepGreen text-white shadow-[0_2px_8px_rgba(7,61,53,0.18)] [.admin-dark_&]:bg-emerald-600'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-slate-200 [.admin-dark_&]:hover:bg-white/15'
              }`}
            >
              {pill.label}
              <span
                className={`min-w-[1.1rem] rounded-full px-1 text-center text-[0.62rem] ${
                  active ? 'bg-white/20 text-white' : 'bg-white/70 dark:bg-black/20 [.admin-dark_&]:bg-black/20'
                }`}
              >
                {loading ? '…' : (paymentStats[pill.countKey] ?? 0)}
              </span>
            </button>
          );
        })}
        {filterStatus !== 'all' && (
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className="ml-1 text-[0.68rem] font-bold text-blue-500 hover:text-blue-600 [.admin-dark_&]:text-blue-400"
          >
            Clear filter
          </button>
        )}
      </div>

      <div className={`${ADM_TABLE_CARD} flex min-h-0 flex-1 flex-col !p-0 overflow-hidden`}>
        <div className="min-h-0 flex-1 overflow-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-deepGreen/15 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5">
          <table
            className={`${ADM_TABLE} [&_tbody_tr]:cursor-pointer [&_tbody_tr]:transition-colors [&_td]:py-2 [&_th]:py-2.5`}
          >
            <thead className="sticky top-0 z-[2] bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)] dark:bg-[#1a2421] [.admin-dark_&]:bg-[#1a2421] [.admin-dark_&]:shadow-[0_1px_0_rgba(255,255,255,0.06)]">
              <tr>
                <th>Customer</th>
                <th>Order ID</th>
                <th>Phone</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="cursor-default py-8 text-center text-gray-500">
                    <i className="fa-solid fa-spinner fa-spin me-2" aria-hidden="true" />
                    Loading payment transactions…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="cursor-default py-10 text-center">
                    <div className="mx-auto max-w-xs">
                      <i className="fa-solid fa-inbox mb-2 text-2xl text-gray-300" aria-hidden="true" />
                      <p className="text-[0.85rem] font-semibold text-gray-500 [.admin-dark_&]:text-gray-400">
                        No matching payments
                      </p>
                      <p className="mt-1 text-[0.75rem] text-gray-400">
                        Try a stat card filter or search from the header.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((txn) => (
                  <tr
                    key={`${txn.id || txn.transactionId || txn.orderId}-${txn.status}-${txn.createdAt}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => openDetail(txn)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openDetail(txn);
                      }
                    }}
                    className="hover:bg-deepGreen/[0.03]"
                  >
                    <td className="font-bold">{txn.customer || '—'}</td>
                    <td className="font-mono text-[0.78rem] font-bold text-gray-700 [.admin-dark_&]:text-gray-200">
                      {txn.orderId || '—'}
                    </td>
                    <td>{txn.phone || '—'}</td>
                    <td className="font-bold text-emerald-600 [.admin-dark_&]:text-emerald-400">
                      {formatUSD(txn.amount)}
                    </td>
                    <td>{paymentStatusBadge(normalizePaymentTxnStatus(txn.status))}</td>
                    <td className="whitespace-nowrap text-gray-500">{formatOrderDate(txn.createdAt)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <PaymentDetailModal
        open={Boolean(detailTxn)}
        transaction={detailTxn}
        verifying={Boolean(detailTxn?.orderId && verifyingId === detailTxn.orderId)}
        onClose={() => setDetailTxn(null)}
        onVerify={verifyPayment}
        onOrderClick={openOrderProducts}
      />

      <StockOrderProductsModal
        open={orderProductsOpen}
        orderId={selectedOrderId}
        onClose={() => {
          setOrderProductsOpen(false);
          setSelectedOrderId('');
        }}
      />
    </div>
  );
}

// =============================================================================
// AdminDeliveryTab
// =============================================================================

function DeliveryFilterBar({ loading, filterCounts, stageFilter, refreshing, onStageFilter }) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border border-deepGreen/[0.06] bg-white px-3 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.03)] sm:flex-row sm:items-center sm:justify-between ${ADM_DARK_SURFACE_SM}`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`mr-1 text-[0.65rem] font-bold uppercase tracking-wide text-gray-400 ${ADM_DARK_TEXT_MUTED}`}>
          Stage
        </span>
        {DELIVERY_FILTER_PILLS.map((pill) => {
          const active = stageFilter === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => onStageFilter(pill.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-bold transition ${
                active
                  ? 'bg-deepGreen text-white shadow-[0_2px_8px_rgba(7,61,53,0.18)] [.admin-dark_&]:bg-emerald-600'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-slate-200 [.admin-dark_&]:hover:bg-white/15'
              }`}
            >
              {pill.label}
              <span
                className={`min-w-[1.1rem] rounded-full px-1 text-center text-[0.62rem] ${
                  active ? 'bg-white/20 text-white' : 'bg-white/70 dark:bg-black/20 [.admin-dark_&]:bg-black/20'
                }`}
              >
                {loading ? '…' : (filterCounts?.[pill.countKey] ?? 0)}
              </span>
            </button>
          );
        })}
      </div>
      <p className={`mb-0 flex items-center gap-1.5 text-[0.68rem] font-medium text-gray-400 ${ADM_DARK_TEXT_MUTED}`}>
        <i className={`fa-solid ${refreshing ? 'fa-spinner fa-spin' : 'fa-arrows-rotate'} text-[0.62rem]`} aria-hidden="true" />
        Auto-refresh · 60s
      </p>
    </div>
  );
}

function DeliveryDispatchModal({ open, order, drivers, saving, form, onChange, onClose, onSubmit }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !saving) onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, saving]);

  if (!open || !order) return null;
  if (typeof document === 'undefined' || !document.body) return null;

  const stageBadge = getDeliveryStageBadge(form.currentStep);
  const payment = getOrderPaymentLabel(order);
  const deliverySlot = [order.deliveryDate, order.deliveryTime].filter(Boolean).join(' at ');
  const declined = isDriverDeclined(order);
  const assignmentLocked = isDriverAssignmentLocked(order);
  const assignment = getDriverAssignmentMeta(order);
  const assignedDriverName = getAssignedDriverDisplayName(order, drivers);
  const driverChanged =
    Boolean(form.assignedDriverId) && form.assignedDriverId !== (order.assignedDriverId || '');
  const isAdminDark = Boolean(document.querySelector('[data-theme="dark"]'));

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
          aria-labelledby="delivery-dispatch-title"
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
              <h3 id="delivery-dispatch-title" className="font-display text-xl font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
                {order.customer}
              </h3>
              <p className="mb-0 mt-1 font-mono text-[0.82rem] text-gray-500 [.admin-dark_&]:text-gray-400">{order.id}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-lg px-2.5 py-1 text-[0.75rem] font-extrabold ${paymentBadgeClass(payment)}`}>
                  {payment}
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
              <p className="mb-0 text-[0.88rem] font-semibold text-emerald-700 [.admin-dark_&]:text-emerald-400">{order.amount || '—'}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">Delivery address</p>
              <p className="mb-0 text-[0.88rem] font-semibold text-gray-800 [.admin-dark_&]:text-gray-100">{order.address || '—'}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">Product</p>
              <p className="mb-0 text-[0.88rem] font-semibold text-gray-800 [.admin-dark_&]:text-gray-100">{order.product || '—'}</p>
            </div>
            {deliverySlot && (
              <div className="sm:col-span-2">
                <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">Customer preferred slot</p>
                <p className="mb-0 text-[0.88rem] font-semibold text-gray-800 [.admin-dark_&]:text-gray-100">{deliverySlot}</p>
              </div>
            )}
              </div>

              <div>
                {assignmentLocked ? (
                  <>
                    <p className={ADM_LABEL}>Assigned driver</p>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 [.admin-dark_&]:border-emerald-500/30 [.admin-dark_&]:bg-emerald-500/10">
                      <p className="mb-1 flex items-center gap-2 text-[0.9rem] font-extrabold text-emerald-900 [.admin-dark_&]:text-emerald-100">
                        <i className="fa-solid fa-circle-check" aria-hidden="true" />
                        {assignedDriverName}
                      </p>
                      <p className="mb-0 text-[0.78rem] font-semibold text-emerald-800 [.admin-dark_&]:text-emerald-200">
                        Driver accepted this delivery. Assignment is locked until delivered.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <label className={ADM_LABEL} htmlFor="deliveryAssignDriver">
                      {declined || driverChanged ? 'Reassign driver' : 'Assign driver'}
                    </label>
                    <p className="mb-2 text-[0.78rem] text-gray-500 [.admin-dark_&]:text-gray-400">
                      {declined
                        ? 'Choose another available driver below. Offline or at-capacity drivers cannot be selected.'
                        : form.driverHint}
                    </p>
                    <select
                      id="deliveryAssignDriver"
                      className={ADM_SELECT}
                      value={form.assignedDriverId}
                      onChange={(e) => onChange('assignedDriverId', e.target.value)}
                      disabled={saving}
                    >
                      <option value="">— Select driver —</option>
                      {drivers.map((driver) => (
                        <option
                          key={driver.id}
                          value={driver.id}
                          disabled={!isDriverSelectable(driver, form.assignedDriverId)}
                        >
                          {driverOptionLabel(driver)}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>

              <div>
                <label className={ADM_LABEL} htmlFor="deliveryEstimate">
                  Estimated arrival
                </label>
                <input
                  id="deliveryEstimate"
                  className={ADM_INPUT}
                  value={form.estimate}
                  onChange={(e) => onChange('estimate', e.target.value)}
                  placeholder="e.g. Today, 4:00 PM"
                />
              </div>

              <div>
                <label className={ADM_LABEL} htmlFor="deliveryStageSelect">
                  Delivery stage
                </label>
                <select
                  id="deliveryStageSelect"
                  className={ADM_SELECT}
                  value={form.currentStep}
                  onChange={(e) => onChange('currentStep', Number(e.target.value))}
                >
                  {DELIVERY_DISPATCH_STAGES.map((stage) => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </select>
                <p className="mb-0 mt-2 text-[0.78rem] text-gray-500 [.admin-dark_&]:text-gray-400">
                  Paid orders start at Payment Verified. Move to Preparing before dispatch when possible.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
            <button type="button" className={BTN_GHOST} onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="button" className={BTN_PRIMARY} onClick={onSubmit} disabled={saving}>
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> Saving…
                </>
              ) : (
                'Save dispatch'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function AdminDeliveryTab({ headerSearch = '' }) {
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stageFilter, setStageFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [forceModalOpen, setForceModalOpen] = useState(false);
  const [form, setForm] = useState({
    assignedDriverId: '',
    estimate: '',
    currentStep: 2,
    driverHint: '',
  });

  const loadDelivery = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const headers = authHeaders(false);
      const [ordersRes, driversRes] = await Promise.all([
        fetchWithTimeout(apiUrl('/api/orders?limit=120'), { headers }, ADMIN_FETCH_TIMEOUT),
        fetchWithTimeout(apiUrl('/api/drivers/approved'), { headers }, ADMIN_FETCH_TIMEOUT),
      ]);
      const [ordersData, driversData] = await Promise.all([ordersRes.json(), driversRes.json()]);
      if (ordersData.success) setOrders(ordersData.orders || []);
      if (driversData.success) setDrivers(driversData.drivers || []);
    } catch {
      showTopFloatNotification('Failed to load delivery data.', 'danger');
    } finally {
      if (!quiet) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDelivery();
  }, [loadDelivery]);

  useEffect(() => {
    const onInvalidate = () => loadDelivery({ quiet: true });
    window.addEventListener('admin-delivery-invalidate', onInvalidate);
    return () => window.removeEventListener('admin-delivery-invalidate', onInvalidate);
  }, [loadDelivery]);

  useIntervalWhenVisible(() => loadDelivery({ quiet: true }), DELIVERY_AUTO_REFRESH_MS, true);

  const dispatchOrders = useMemo(() => orders.filter(isDeliveryEligible), [orders]);

  const searchQuery = (headerSearch || '').trim().toLowerCase();

  const filterCounts = useMemo(() => {
    const counts = {
      all: dispatchOrders.length,
      preparing: 0,
      out: 0,
      delivered: 0,
    };
    dispatchOrders.forEach((order) => {
      const step = getOrderStep(order);
      if (step === 3) counts.preparing += 1;
      if (step === 4) counts.out += 1;
      if (isOrderDelivered(order)) counts.delivered += 1;
    });
    return counts;
  }, [dispatchOrders]);

  const filteredOrders = useMemo(() => {
    return dispatchOrders.filter((order) => {
      if (!deliveryMatchesFilter(order, stageFilter)) return false;
      if (!deliveryMatchesAssignmentFilter(order, assignmentFilter)) return false;
      if (!searchQuery) return true;
      const district = extractDistrict(order.address);
      return [order.id, order.customer, order.driver, order.phone, order.address, district]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchQuery));
    });
  }, [dispatchOrders, stageFilter, assignmentFilter, searchQuery]);

  const toggleAssignmentFilter = useCallback((filterId) => {
    setAssignmentFilter((prev) => (prev === filterId ? 'all' : filterId));
  }, []);

  const { totalPaidCount, driverAssignedCount, unassignedCount, driverRejectedCount } = useMemo(() => {
    let driverAssigned = 0;
    let unassigned = 0;
    let driverRejected = 0;
    dispatchOrders.forEach((order) => {
      if (isOrderDelivered(order)) return;
      if (hasAssignedDriver(order)) driverAssigned += 1;
      if (!hasAssignedDriver(order)) unassigned += 1;
      if (isDriverDeclined(order)) driverRejected += 1;
    });
    return {
      totalPaidCount: dispatchOrders.length,
      driverAssignedCount: driverAssigned,
      unassignedCount: unassigned,
      driverRejectedCount: driverRejected,
    };
  }, [dispatchOrders]);

  const buildDriverHint = (order, driverList) => {
    const assignmentHint = buildDriverAssignmentHint(order);
    const current = driverList.find((d) => d.id === order.assignedDriverId);
    let hint = '';
    if (current) {
      hint = `Current driver: ${current.name} (${current.activeDeliveries || 0}/${MAX_DRIVER_ACTIVE} active). Choose another driver to reassign.`;
    } else if (order.driver && order.driver !== 'Not assigned yet') {
      hint = `Currently: ${order.driver}. Select an approved driver below to assign or reassign.`;
    } else {
      hint = `Offline drivers are blocked. Busy drivers accept new orders until they reach ${MAX_DRIVER_ACTIVE} active deliveries.`;
    }
    if (assignmentHint) hint += ` ${assignmentHint}`;
    return hint;
  };

  const openDispatchModal = (order) => {
    const step = Math.max(2, getOrderStep(order));
    setActiveOrder(order);
    setForm({
      assignedDriverId: order.assignedDriverId || '',
      estimate:
        order.estimate && !['Awaiting driver acceptance', 'Driver declined — assign another driver'].includes(order.estimate)
          ? order.estimate
          : '',
      currentStep: step,
      driverHint: buildDriverHint(order, drivers),
    });
    setModalOpen(true);
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitDeliveryUpdate = async ({ forceDeliver = false, forceDeliverReason = '' } = {}) => {
    if (!activeOrder) return;

    const nextDriverId = form.assignedDriverId || '';
    const driverChanged =
      nextDriverId && nextDriverId !== (activeOrder.assignedDriverId || '') && !isDriverAssignmentLocked(activeOrder);
    const needsDriver = isOrderUnassigned(activeOrder) || isDriverDeclined(activeOrder);
    const nextStep = Math.max(2, form.currentStep);
    const prevStep = getOrderStep(activeOrder);

    if (needsDriver && !nextDriverId) {
      showTopFloatNotification('Select a driver before saving dispatch.', 'danger');
      return;
    }

    if (nextStep >= 5 && prevStep < 5 && !forceDeliver) {
      setForceModalOpen(true);
      return;
    }

    setSaving(true);
    const orderIdEncoded = encodeURIComponent(activeOrder.id);

    try {
      if (driverChanged) {
        const assignRes = await fetch(apiUrl(`/api/orders/${orderIdEncoded}/assign`), {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ assignedDriverId: nextDriverId }),
        });
        const assignData = await assignRes.json();
        if (!assignData.success) {
          showTopFloatNotification(assignData.message || 'Could not assign driver.', 'danger');
          setSaving(false);
          return;
        }
        window.dispatchEvent(new CustomEvent('driver-assignment-updated'));
      }

      const body = {
        estimate: form.estimate.trim() || 'Estimate pending',
        currentStep: nextStep,
      };
      if (forceDeliver) {
        body.forceDeliver = true;
        body.forceDeliverReason = forceDeliverReason;
      }

      const updateRes = await fetch(apiUrl(`/api/orders/${orderIdEncoded}`), {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const updateData = await updateRes.json();

      if (updateData.success) {
        setForceModalOpen(false);
        showTopFloatNotification(
          forceDeliver
            ? `Order ${activeOrder.id} force-marked delivered (admin override).`
            : `Dispatch updated for ${activeOrder.customer} (${activeOrder.id}).`
        );
        setModalOpen(false);
        setActiveOrder(null);
        window.dispatchEvent(new CustomEvent('admin-delivery-invalidate'));
        window.dispatchEvent(new CustomEvent('admin-dashboard-invalidate'));
      } else {
        showTopFloatNotification(updateData.message || 'Update failed.', 'danger');
      }
    } catch {
      showTopFloatNotification('An error occurred while updating dispatch.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const renderDriverCell = (order) => {
    const name = getDriverTableName(order, drivers);
    if (!name || name === '—') {
      return <span className="text-[0.8rem] font-semibold text-gray-400">—</span>;
    }
    return (
      <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[0.75rem] font-extrabold text-emerald-800 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-200">
        <i className="fa-solid fa-truck-fast shrink-0 text-[0.68rem]" aria-hidden="true" />
        <span className="truncate">{name}</span>
      </span>
    );
  };

  return (
    <div className="animate-cardRise space-y-3">
      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <PaymentsStatCard
          label="Total Paid"
          value={loading ? '…' : totalPaidCount.toLocaleString()}
          icon="fa-circle-check"
          iconWrapClass="bg-emerald-500/10 text-emerald-600"
          active={assignmentFilter === 'all'}
          onClick={() => setAssignmentFilter('all')}
        />
        <PaymentsStatCard
          label="Driver Assigned"
          value={loading ? '…' : driverAssignedCount.toLocaleString()}
          icon="fa-motorcycle"
          iconWrapClass="bg-blue-500/10 text-blue-600"
          active={assignmentFilter === 'assigned'}
          onClick={() => toggleAssignmentFilter('assigned')}
        />
        <PaymentsStatCard
          label="Unassigned"
          value={loading ? '…' : unassignedCount.toLocaleString()}
          icon="fa-user-clock"
          iconWrapClass="bg-amber-500/10 text-amber-600"
          active={assignmentFilter === 'unassigned'}
          onClick={() => toggleAssignmentFilter('unassigned')}
        />
        <PaymentsStatCard
          label="Driver Rejected"
          value={loading ? '…' : driverRejectedCount.toLocaleString()}
          icon="fa-circle-xmark"
          iconWrapClass="bg-red-500/10 text-red-600"
          active={assignmentFilter === 'rejected'}
          onClick={() => toggleAssignmentFilter('rejected')}
        />
      </div>

      <DeliveryFilterBar
        loading={loading}
        refreshing={refreshing}
        filterCounts={filterCounts}
        stageFilter={stageFilter}
        onStageFilter={setStageFilter}
      />

      <div className={`${ADM_TABLE_CARD} !p-0 overflow-hidden`}>
        <div
          className="overflow-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-deepGreen/15 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5"
          style={{ maxHeight: DELIVERY_TABLE_MAX_HEIGHT }}
        >
          <table className={`${ADM_TABLE} [&_tbody_tr]:cursor-pointer [&_tbody_tr]:transition-colors`}>
            <thead className="sticky top-0 z-[2] bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)] dark:bg-[#1a2421] [.admin-dark_&]:bg-[#1a2421] [.admin-dark_&]:shadow-[0_1px_0_rgba(255,255,255,0.06)]">
              <tr>
                <th>Customer</th>
                <th>Order ID</th>
                <th>District</th>
                <th>Driver</th>
                <th>Stage</th>
                <th>Estimate</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    <i className="fa-solid fa-spinner fa-spin me-2" aria-hidden="true" />
                    Loading paid orders…
                  </td>
                </tr>
              )}
              {!loading && filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    {dispatchOrders.length === 0
                      ? 'No paid orders ready for delivery dispatch yet.'
                      : 'No orders match this filter.'}
                  </td>
                </tr>
              )}
              {!loading &&
                filteredOrders.map((order) => {
                  const step = getOrderStep(order);
                  const stageBadge = getDeliveryStageBadge(step);
                  const deliverySlot = [order.deliveryDate, order.deliveryTime].filter(Boolean).join(' at ');

                  return (
                    <tr
                      key={order.id}
                      tabIndex={0}
                      role="button"
                      onClick={() => openDispatchModal(order)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openDispatchModal(order);
                        }
                      }}
                      className="hover:bg-deepGreen/[0.03] focus-visible:bg-deepGreen/[0.04] focus-visible:outline-none"
                    >
                      <td className="font-bold">{order.customer}</td>
                      <td className="font-mono text-[0.82rem] text-gray-500">{order.id}</td>
                      <td>{extractDistrict(order.address)}</td>
                      <td>{renderDriverCell(order)}</td>
                      <td>
                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-[0.75rem] font-extrabold ${stageBadge.cls}`}>
                          {stageBadge.label}
                        </span>
                      </td>
                      <td>
                        {order.estimate || 'Estimate pending'}
                        {deliverySlot && (
                          <div className="text-[0.78rem] text-gray-500 [.admin-dark_&]:text-gray-400">{deliverySlot}</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <DeliveryDispatchModal
        open={modalOpen}
        order={activeOrder}
        drivers={drivers}
        saving={saving}
        form={form}
        onChange={updateForm}
        onClose={() => {
          if (!saving) {
            setModalOpen(false);
            setActiveOrder(null);
            setForceModalOpen(false);
          }
        }}
        onSubmit={() => submitDeliveryUpdate()}
      />
      <ForceDeliverModal
        open={forceModalOpen && Boolean(activeOrder)}
        order={activeOrder}
        busy={saving}
        onClose={() => {
          if (!saving) setForceModalOpen(false);
        }}
        onConfirm={(reason) =>
          submitDeliveryUpdate({ forceDeliver: true, forceDeliverReason: reason })
        }
      />
    </div>
  );
}
