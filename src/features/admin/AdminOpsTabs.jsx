/**
 * ADMIN OPS TABS — stock, payments, delivery, settings (Tailwind)
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiUrl, clearDeliveryDistrictsCache, fetchWithTimeout } from '../../utils/data';
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
  formatAdminPrice,
  formatUSD,
  getDeliveryStageBadge,
  isDriverSelectable,
  driverOptionLabel,
  MAX_DRIVER_ACTIVE,
} from './adminShared.js';

const BTN_OUTLINE_SUCCESS =
  'inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-600 px-3 py-1.5 text-[0.78rem] font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60 [.admin-dark_&]:border-emerald-500/40 [.admin-dark_&]:text-emerald-400 [.admin-dark_&]:hover:bg-emerald-500/10';
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

const DEFAULT_FEES = {
  Hodan: 0.001,
  Wadajir: 0.001,
  Karaan: 0.002,
  Hamarweyne: 0.001,
};

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
  if (stockVal <= 5) {
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

function driverPillClass(driver) {
  const active = driver.activeDeliveries || 0;
  if (driver.driverStatus === 'offline') return 'bg-gray-100 text-gray-600 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-gray-400';
  if (active >= MAX_DRIVER_ACTIVE) return 'bg-red-100 text-red-700 [.admin-dark_&]:bg-red-500/15 [.admin-dark_&]:text-red-300';
  if (active > 0) return 'bg-amber-100 text-amber-800 [.admin-dark_&]:bg-amber-500/15 [.admin-dark_&]:text-amber-300';
  return 'bg-emerald-100 text-emerald-700 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300';
}

function driverPillLabel(driver) {
  const active = driver.activeDeliveries || 0;
  if (driver.driverStatus === 'offline') return `${driver.name} · Offline`;
  if (active >= MAX_DRIVER_ACTIVE) return `${driver.name} · Full ${active}/${MAX_DRIVER_ACTIVE}`;
  if (active > 0) return `${driver.name} · Busy ${active}/${MAX_DRIVER_ACTIVE}`;
  return `${driver.name} · Available`;
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

// =============================================================================
// AdminStockTab
// =============================================================================

export function AdminStockTab({ headerSearch = '' }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [savingAll, setSavingAll] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  const searchQuery = (headerSearch || localSearch).toLowerCase().trim();

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
    window.addEventListener('admin-stock-invalidate', onInvalidate);
    return () => window.removeEventListener('admin-stock-invalidate', onInvalidate);
  }, [loadProducts]);

  const filtered = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(
      (p) =>
        p.title?.toLowerCase().includes(searchQuery) ||
        p.category?.toLowerCase().includes(searchQuery)
    );
  }, [products, searchQuery]);

  const updateStock = (id, stockVal) => {
    setProducts((rows) =>
      rows.map((p) => (p.id === id ? applyStockFields(p, stockVal) : p))
    );
  };

  const adjustStock = (id, diff) => {
    setProducts((rows) =>
      rows.map((p) => {
        if (p.id !== id) return p;
        return applyStockFields(p, getStockVal(p) + diff);
      })
    );
  };

  const saveStock = async (product) => {
    setSavingId(product.id);
    try {
      const res = await fetch(apiUrl(`/api/products/${product.id}`), {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(buildStockPayload(product)),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification(`Stock for "${product.title}" updated to ${product.stockVal} units.`);
        window.dispatchEvent(new CustomEvent('admin-stock-invalidate'));
        window.dispatchEvent(new CustomEvent('admin-products-invalidate'));
      } else {
        showTopFloatNotification(data.message || 'Save failed.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not save stock level.', 'danger');
    } finally {
      setSavingId(null);
    }
  };

  const saveAllStock = async () => {
    setSavingAll(true);
    try {
      const results = await Promise.all(
        products.map((p) =>
          fetch(apiUrl(`/api/products/${p.id}`), {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(buildStockPayload(p)),
          }).then((r) => r.json())
        )
      );
      const failed = results.filter((r) => !r.success);
      if (failed.length) {
        showTopFloatNotification('Some stock updates failed.', 'danger');
      } else {
        showTopFloatNotification('All inventory changes saved successfully.');
        window.dispatchEvent(new CustomEvent('admin-stock-invalidate'));
        window.dispatchEvent(new CustomEvent('admin-products-invalidate'));
      }
    } catch {
      showTopFloatNotification('Could not save stock levels.', 'danger');
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <div className={ADM_TABLE_CARD}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
          <i className="fa-solid fa-cubes me-2" aria-hidden="true" />
          Inventory &amp; Stock Control
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <AppSearchField
            id="stockSearchQuery"
            placeholder="Search inventory..."
            variant="full"
            className="!mb-0 max-w-[250px]"
            value={localSearch || headerSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
          <button type="button" className={BTN_OUTLINE_SUCCESS} onClick={saveAllStock} disabled={savingAll || loading}>
            {savingAll ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> Saving…
              </>
            ) : (
              <>
                <i className="fa-solid fa-save" aria-hidden="true" /> Save All
              </>
            )}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className={ADM_TABLE}>
          <thead>
            <tr>
              <th>Image</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Price</th>
              <th style={{ width: 160 }}>Stock Level</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  <i className="fa-solid fa-spinner fa-spin me-2" aria-hidden="true" />
                  Loading inventory…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-500">
                  No matching inventory items found.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((p) => {
                const stockVal = getStockVal(p);
                const busy = savingId === p.id;
                return (
                  <tr key={p.id}>
                    <td>
                      <img
                        src={productImage(p.images?.[0])}
                        alt={p.title}
                        className="h-11 w-11 rounded-lg border border-black/6 object-cover"
                      />
                    </td>
                    <td className="font-bold">{p.title}</td>
                    <td>
                      <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[0.78rem] font-semibold text-gray-600 [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-white/5 [.admin-dark_&]:text-gray-300">
                        {formatCategory(p.category)}
                      </span>
                    </td>
                    <td className="font-bold text-emerald-600 [.admin-dark_&]:text-emerald-400">
                      {formatAdminPrice(p.price)}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button type="button" className={BTN_STOCK_ADJ} onClick={() => adjustStock(p.id, -1)} aria-label="Decrease stock">
                          −
                        </button>
                        <input
                          type="number"
                          min="0"
                          className={`${ADM_INPUT} !w-[60px] !px-2 py-1 text-center !text-[0.88rem]`}
                          value={stockVal}
                          onChange={(e) => updateStock(p.id, e.target.value)}
                        />
                        <button type="button" className={BTN_STOCK_ADJ} onClick={() => adjustStock(p.id, 1)} aria-label="Increase stock">
                          +
                        </button>
                      </div>
                    </td>
                    <td>{stockStatusBadge(stockVal)}</td>
                    <td>
                      <button type="button" className={BTN_SUCCESS} disabled={busy} onClick={() => saveStock(p)}>
                        {busy ? (
                          <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
                        ) : (
                          <>
                            <i className="fa-solid fa-check" aria-hidden="true" /> Save
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =============================================================================
// AdminPaymentsTab
// =============================================================================

export function AdminPaymentsTab() {
  const [stats, setStats] = useState({ totalRevenue: 0, evcRevenue: 0, codRevenue: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);

  const loadPayments = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetchWithTimeout(
        apiUrl('/api/payments/transactions'),
        { headers: authHeaders(false) },
        ADMIN_FETCH_TIMEOUT
      );
      const data = await res.json();
      if (data.success) {
        setStats(data.stats || { totalRevenue: 0, evcRevenue: 0, codRevenue: 0 });
        setTransactions(data.transactions || []);
      } else {
        setTransactions([]);
        showTopFloatNotification(data.message || 'Failed to load payments.', 'danger');
      }
    } catch {
      showTopFloatNotification('Failed to load payment transactions.', 'danger');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useEffect(() => {
    const onInvalidate = () => loadPayments({ quiet: true });
    window.addEventListener('admin-payments-invalidate', onInvalidate);
    return () => window.removeEventListener('admin-payments-invalidate', onInvalidate);
  }, [loadPayments]);

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
      } else {
        showTopFloatNotification(data.message || 'Verification failed.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not verify payment.', 'danger');
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <OpsStatCard
          label="Total Revenue"
          value={formatUSD(stats.totalRevenue)}
          icon="fa-sack-dollar"
          iconWrapClass="bg-emerald-500/10 text-emerald-600 [.admin-dark_&]:text-emerald-400"
        />
        <OpsStatCard
          label="EVC Plus Share"
          value={formatUSD(stats.evcRevenue)}
          icon="fa-mobile-screen"
          iconWrapClass="bg-amber-500/10 text-amber-600 [.admin-dark_&]:text-amber-400"
        />
        <OpsStatCard
          label="Cash on Delivery Share"
          value={formatUSD(stats.codRevenue)}
          icon="fa-wallet"
          iconWrapClass="bg-teal/10 text-teal [.admin-dark_&]:text-teal"
        />
      </div>

      <div className={ADM_TABLE_CARD}>
        <h3 className="mb-4 font-display text-xl font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
          <i className="fa-solid fa-credit-card me-2" aria-hidden="true" />
          Payment Transactions History
        </h3>

        <div className="overflow-x-auto">
          <table className={ADM_TABLE}>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Payment Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    <i className="fa-solid fa-spinner fa-spin me-2" aria-hidden="true" />
                    Loading payment transactions…
                  </td>
                </tr>
              )}
              {!loading && transactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No payment transactions yet.
                  </td>
                </tr>
              )}
              {!loading &&
                transactions.map((txn) => {
                  const date = txn.createdAt
                    ? new Date(txn.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—';
                  const busy = verifyingId === txn.orderId;

                  return (
                    <tr key={txn.transactionId || txn.id || txn.orderId}>
                      <td className="font-mono text-gray-500">{txn.transactionId || txn.id || '—'}</td>
                      <td className="font-bold">{txn.customer || '—'}</td>
                      <td>{txn.phone || '—'}</td>
                      <td>
                        <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[0.78rem] font-semibold text-gray-600 [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-white/5 [.admin-dark_&]:text-gray-300">
                          <i className="fa-solid fa-mobile-screen text-emerald-600" aria-hidden="true" />
                          {txn.method || '—'}
                        </span>
                      </td>
                      <td className="font-bold text-emerald-600 [.admin-dark_&]:text-emerald-400">
                        {formatUSD(txn.amount)}
                      </td>
                      <td>{paymentStatusBadge(txn.status)}</td>
                      <td>{date}</td>
                      <td>
                        {txn.status === 'pending' && txn.orderId ? (
                          <button
                            type="button"
                            className={BTN_OUTLINE_SUCCESS}
                            disabled={busy}
                            onClick={() => verifyPayment(txn.orderId)}
                          >
                            {busy ? (
                              <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
                            ) : (
                              'Verify'
                            )}
                          </button>
                        ) : (
                          '—'
                        )}
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

// =============================================================================
// AdminDeliveryTab
// =============================================================================

function DeliveryEditModal({ open, order, drivers, saving, form, onChange, onClose, onSubmit }) {
  if (!open || !order) return null;

  const stageBadge = getDeliveryStageBadge(form.currentStep);

  return (
    <div
      className="fixed inset-0 z-[1060] flex items-center justify-center bg-deepGreen/45 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-[0_25px_60px_rgba(0,0,0,0.22)] [.admin-dark_&]:bg-[#1a2421]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
          <div>
            <h3 className="font-display text-xl font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
              Edit Dispatch Details
            </h3>
            <p className="mb-0 mt-1 text-[0.82rem] text-gray-500 [.admin-dark_&]:text-gray-400">
              Order <span className="font-mono">{order.id}</span>
            </p>
          </div>
          <button type="button" className="text-2xl text-gray-500 hover:text-gray-800" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className={ADM_LABEL} htmlFor="deliveryAssignDriver">
              Assign Approved Driver
            </label>
            <p className="mb-2 text-[0.8rem] text-gray-500 [.admin-dark_&]:text-gray-400">{form.driverHint}</p>
            <select
              id="deliveryAssignDriver"
              className={ADM_SELECT}
              value={form.assignedDriverId}
              onChange={(e) => onChange('assignedDriverId', e.target.value)}
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
          </div>

          <div>
            <label className={ADM_LABEL} htmlFor="deliveryCourier">
              Courier / Driver Info (manual override)
            </label>
            <input
              id="deliveryCourier"
              className={ADM_INPUT}
              value={form.courier}
              onChange={(e) => onChange('courier', e.target.value)}
              placeholder="e.g. Ahmed Ali - 0619988776"
            />
          </div>

          <div>
            <label className={ADM_LABEL} htmlFor="deliveryEstimate">
              Estimated Arrival
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
              Delivery Tracking Stage
            </label>
            <select
              id="deliveryStageSelect"
              className={ADM_SELECT}
              value={form.currentStep}
              onChange={(e) => onChange('currentStep', Number(e.target.value))}
            >
              {DELIVERY_STAGES.map((stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
            <div className="mt-2">
              <span className={`inline-flex rounded-lg px-2.5 py-1 text-[0.75rem] font-extrabold ${stageBadge.cls}`}>
                {stageBadge.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
          <button type="button" className={BTN_GHOST} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className={BTN_PRIMARY} onClick={onSubmit} disabled={saving}>
            {saving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> Updating…
              </>
            ) : (
              'Update Dispatch'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminDeliveryTab() {
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    assignedDriverId: '',
    courier: '',
    estimate: '',
    currentStep: 1,
    driverHint: '',
  });

  const loadDelivery = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const headers = authHeaders(false);
      const [ordersRes, driversRes] = await Promise.all([
        fetchWithTimeout(apiUrl('/api/orders?limit=500'), { headers }, ADMIN_FETCH_TIMEOUT),
        fetchWithTimeout(apiUrl('/api/drivers/approved'), { headers }, ADMIN_FETCH_TIMEOUT),
      ]);
      const [ordersData, driversData] = await Promise.all([ordersRes.json(), driversRes.json()]);
      if (ordersData.success) setOrders(ordersData.orders || []);
      if (driversData.success) setDrivers(driversData.drivers || []);
    } catch {
      showTopFloatNotification('Failed to load delivery data.', 'danger');
    } finally {
      if (!quiet) setLoading(false);
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

  const dispatchOrders = useMemo(() => {
    return orders.filter((order) => {
      const step = typeof order.currentStep === 'number' ? order.currentStep : 1;
      const status = (order.status || '').toLowerCase();
      return status !== 'cancelled' && step !== 0;
    });
  }, [orders]);

  const { activeCount, completedCount } = useMemo(() => {
    let active = 0;
    let completed = 0;
    dispatchOrders.forEach((order) => {
      const step = typeof order.currentStep === 'number' ? order.currentStep : 1;
      if (step >= 5 || (order.status || '').toLowerCase() === 'delivered') completed += 1;
      else active += 1;
    });
    return { activeCount: active, completedCount: completed };
  }, [dispatchOrders]);

  const buildDriverHint = (order, driverList) => {
    const current = driverList.find((d) => d.id === order.assignedDriverId);
    if (current) {
      return `Current driver: ${current.name} (${current.activeDeliveries || 0}/${MAX_DRIVER_ACTIVE} active). Choose another driver to reassign.`;
    }
    if (order.driver && order.driver !== 'Not assigned yet') {
      return `Currently: ${order.driver}. Select an approved driver below to assign or reassign.`;
    }
    return `Offline drivers are blocked. Busy drivers accept new orders until they reach ${MAX_DRIVER_ACTIVE} active deliveries.`;
  };

  const openEditModal = (order) => {
    setActiveOrder(order);
    setForm({
      assignedDriverId: order.assignedDriverId || '',
      courier: order.driver || '',
      estimate: order.estimate || '',
      currentStep: typeof order.currentStep === 'number' ? order.currentStep : 1,
      driverHint: buildDriverHint(order, drivers),
    });
    setModalOpen(true);
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitDeliveryUpdate = async () => {
    if (!activeOrder) return;
    setSaving(true);
    const orderIdEncoded = encodeURIComponent(activeOrder.id);

    try {
      if (form.assignedDriverId) {
        const assignRes = await fetch(apiUrl(`/api/orders/${orderIdEncoded}/assign`), {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ assignedDriverId: form.assignedDriverId }),
        });
        const assignData = await assignRes.json();
        if (!assignData.success) {
          showTopFloatNotification(assignData.message || 'Could not assign driver.', 'danger');
          setSaving(false);
          return;
        }
      }

      const updateRes = await fetch(apiUrl(`/api/orders/${orderIdEncoded}`), {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          driver: form.courier.trim() || undefined,
          estimate: form.estimate.trim() || 'Estimate pending',
          currentStep: form.currentStep,
        }),
      });
      const updateData = await updateRes.json();

      if (updateData.success) {
        showTopFloatNotification(`Dispatch status updated for order ${activeOrder.id}.`);
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
    const driver = drivers.find((d) => d.id === order.assignedDriverId);
    if (driver) {
      return (
        <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[0.75rem] font-extrabold ${driverPillClass(driver)}`}>
          <i className="fa-solid fa-motorcycle" aria-hidden="true" />
          {driverPillLabel(driver)}
        </span>
      );
    }
    const fallback = order.driver || 'Not assigned';
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[0.78rem] font-semibold text-gray-600 [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-white/5 [.admin-dark_&]:text-gray-300">
        <i className="fa-solid fa-user-tag text-blue-500" aria-hidden="true" />
        {fallback}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <OpsStatCard
          label="Active Shipments"
          value={loading ? '—' : activeCount}
          icon="fa-truck-ramp-box"
          iconWrapClass="bg-teal/10 text-teal [.admin-dark_&]:text-teal"
        />
        <OpsStatCard
          label="Delivered Orders"
          value={loading ? '—' : completedCount}
          icon="fa-circle-check"
          iconWrapClass="bg-emerald-500/10 text-emerald-600 [.admin-dark_&]:text-emerald-400"
        />
      </div>

      <div className={ADM_TABLE_CARD}>
        <h3 className="mb-4 font-display text-xl font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
          <i className="fa-solid fa-truck me-2" aria-hidden="true" />
          Order Dispatch &amp; Stage Tracking
        </h3>

        <div className="overflow-x-auto">
          <table className={ADM_TABLE}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>District</th>
                <th>Courier Details</th>
                <th>Estimated Arrival</th>
                <th>Tracking Stage</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    <i className="fa-solid fa-spinner fa-spin me-2" aria-hidden="true" />
                    Loading dispatch orders…
                  </td>
                </tr>
              )}
              {!loading && dispatchOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No orders currently dispatched.
                  </td>
                </tr>
              )}
              {!loading &&
                dispatchOrders.map((order) => {
                  const step = typeof order.currentStep === 'number' ? order.currentStep : 1;
                  const stageBadge = getDeliveryStageBadge(step);
                  const deliverySlot = [order.deliveryDate, order.deliveryTime].filter(Boolean).join(' at ');

                  return (
                    <tr key={order.id}>
                      <td className="font-mono text-gray-500">{order.id}</td>
                      <td className="font-bold">{order.customer}</td>
                      <td>{extractDistrict(order.address)}</td>
                      <td>{renderDriverCell(order)}</td>
                      <td>
                        {order.estimate || 'Estimate pending'}
                        {deliverySlot && (
                          <div className="text-[0.78rem] text-gray-500 [.admin-dark_&]:text-gray-400">{deliverySlot}</div>
                        )}
                      </td>
                      <td>
                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-[0.75rem] font-extrabold ${stageBadge.cls}`}>
                          {stageBadge.label}
                        </span>
                      </td>
                      <td>
                        <button type="button" className={BTN_OUTLINE_SUCCESS} onClick={() => openEditModal(order)}>
                          Edit Stage
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <DeliveryEditModal
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
          }
        }}
        onSubmit={submitDeliveryUpdate}
      />
    </div>
  );
}

// =============================================================================
// AdminSettingsTab
// =============================================================================

export function AdminSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeOpen, setStoreOpen] = useState(true);
  const [fees, setFees] = useState({ ...DEFAULT_FEES });

  const loadSettings = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetchWithTimeout(apiUrl('/api/cms'), {}, ADMIN_FETCH_TIMEOUT);
      const data = await res.json();
      if (data.success && data.cms?.deliveryFees) {
        const feeMap = {};
        data.cms.deliveryFees.forEach((entry) => {
          feeMap[entry.district] = entry.fee;
        });
        setFees({
          Hodan: Number(feeMap.Hodan ?? localStorage.getItem('deliveryFee_Hodan') ?? DEFAULT_FEES.Hodan),
          Wadajir: Number(feeMap.Wadajir ?? localStorage.getItem('deliveryFee_Wadajir') ?? DEFAULT_FEES.Wadajir),
          Karaan: Number(feeMap.Karaan ?? localStorage.getItem('deliveryFee_Karaan') ?? DEFAULT_FEES.Karaan),
          Hamarweyne: Number(
            feeMap.Hamarweyne ?? localStorage.getItem('deliveryFee_Hamarweyne') ?? DEFAULT_FEES.Hamarweyne
          ),
        });
      } else {
        setFees({
          Hodan: Number(localStorage.getItem('deliveryFee_Hodan') || DEFAULT_FEES.Hodan),
          Wadajir: Number(localStorage.getItem('deliveryFee_Wadajir') || DEFAULT_FEES.Wadajir),
          Karaan: Number(localStorage.getItem('deliveryFee_Karaan') || DEFAULT_FEES.Karaan),
          Hamarweyne: Number(localStorage.getItem('deliveryFee_Hamarweyne') || DEFAULT_FEES.Hamarweyne),
        });
      }
    } catch {
      setFees({
        Hodan: Number(localStorage.getItem('deliveryFee_Hodan') || DEFAULT_FEES.Hodan),
        Wadajir: Number(localStorage.getItem('deliveryFee_Wadajir') || DEFAULT_FEES.Wadajir),
        Karaan: Number(localStorage.getItem('deliveryFee_Karaan') || DEFAULT_FEES.Karaan),
        Hamarweyne: Number(localStorage.getItem('deliveryFee_Hamarweyne') || DEFAULT_FEES.Hamarweyne),
      });
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const onInvalidate = () => loadSettings({ quiet: true });
    window.addEventListener('admin-settings-invalidate', onInvalidate);
    return () => window.removeEventListener('admin-settings-invalidate', onInvalidate);
  }, [loadSettings]);

  const updateFee = (district, value) => {
    setFees((prev) => ({ ...prev, [district]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);

    localStorage.setItem('deliveryFee_Hodan', String(fees.Hodan));
    localStorage.setItem('deliveryFee_Wadajir', String(fees.Wadajir));
    localStorage.setItem('deliveryFee_Karaan', String(fees.Karaan));
    localStorage.setItem('deliveryFee_Hamarweyne', String(fees.Hamarweyne));

    const deliveryFees = [
      { district: 'Hodan', fee: Number(fees.Hodan) },
      { district: 'Wadajir', fee: Number(fees.Wadajir) },
      { district: 'Karaan', fee: Number(fees.Karaan) },
      { district: 'Hamarweyne', fee: Number(fees.Hamarweyne) },
      { district: 'Dayniile', fee: Number(fees.Karaan) },
      { district: 'Yaqshid', fee: Number(fees.Hodan) },
    ];

    try {
      const res = await fetch(apiUrl('/api/cms'), {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ deliveryFees }),
      });
      const data = await res.json();
      if (!data.success) {
        showTopFloatNotification(data.message || 'Could not save delivery fees.', 'danger');
      } else {
        clearDeliveryDistrictsCache();
        window.dispatchEvent(new Event('delivery-fees-updated'));
        window.dispatchEvent(new CustomEvent('admin-settings-invalidate'));
        showTopFloatNotification('Configuration parameters updated successfully.');
      }
    } catch {
      showTopFloatNotification('Could not save settings.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const resetCache = () => {
    if (!window.confirm('Clear browser cache only? MongoDB data will NOT be deleted.')) return;
    localStorage.removeItem('products');
    localStorage.removeItem('orders');
    localStorage.removeItem('users');
    localStorage.removeItem('productReviews');
    showTopFloatNotification('Browser cache cleared. Reloading admin panel...');
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className={ADM_TABLE_CARD}>
        <h3 className="mb-4 font-display text-xl font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
          <i className="fa-solid fa-truck-fast me-2" aria-hidden="true" />
          Delivery Settings
        </h3>

        {loading ? (
          <p className="text-gray-500">
            <i className="fa-solid fa-spinner fa-spin me-2" aria-hidden="true" />
            Loading settings…
          </p>
        ) : (
          <>
            <div className="mb-4">
              <label className={ADM_LABEL}>Toggle Store Status</label>
              <label className="flex cursor-pointer items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  className="h-[22px] w-11 cursor-pointer accent-emerald-600"
                  checked={storeOpen}
                  onChange={(e) => setStoreOpen(e.target.checked)}
                />
                <span
                  className={`text-[0.88rem] font-extrabold ${storeOpen ? 'text-emerald-600 [.admin-dark_&]:text-emerald-400' : 'text-red-600 [.admin-dark_&]:text-red-400'}`}
                >
                  {storeOpen ? 'Store Open & Accepting Orders' : 'Store Closed (Maintenance Mode)'}
                </span>
              </label>
            </div>

            <hr className="my-4 border-gray-100 [.admin-dark_&]:border-white/10" />

            <h4 className="mb-3 text-[0.95rem] font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
              District Delivery Fees
            </h4>

            <div className="mb-4 grid grid-cols-2 gap-3">
              {Object.keys(DEFAULT_FEES).map((district) => (
                <div key={district}>
                  <label className={ADM_LABEL} htmlFor={`deliveryFee${district}`}>
                    {district} Delivery Fee ($)
                  </label>
                  <input
                    id={`deliveryFee${district}`}
                    type="number"
                    step="0.001"
                    min="0"
                    className={ADM_INPUT}
                    value={fees[district]}
                    onChange={(e) => updateFee(district, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <button type="button" className={BTN_PRIMARY} onClick={saveSettings} disabled={saving}>
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> Saving…
                </>
              ) : (
                'Save Configuration'
              )}
            </button>
          </>
        )}
      </div>

      <div className={ADM_TABLE_CARD}>
        <h3 className="mb-4 font-display text-xl font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
          <i className="fa-solid fa-shield-halved me-2" aria-hidden="true" />
          System Diagnostics
        </h3>

        <div className="mb-4">
          <span className="mb-1 block text-[0.84rem] font-extrabold text-gray-500 [.admin-dark_&]:text-gray-400">
            DATA STORAGE ENGINE
          </span>
          <span className="block font-mono text-[0.9rem] font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
            <i className="fa-solid fa-database me-2" aria-hidden="true" />
            MongoDB Atlas (Cloud Database)
          </span>
        </div>

        <div className="mb-4">
          <span className="mb-1 block text-[0.84rem] font-extrabold text-gray-500 [.admin-dark_&]:text-gray-400">
            API CONNECTION
          </span>
          <span className="inline-flex rounded-lg bg-emerald-100 px-2.5 py-1 font-mono text-[0.78rem] font-extrabold text-emerald-700 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300">
            Connected via REST API
          </span>
        </div>

        <hr className="my-4 border-gray-100 [.admin-dark_&]:border-white/10" />

        <h4 className="mb-3 text-[0.95rem] font-bold text-red-600 [.admin-dark_&]:text-red-400">Danger Zone</h4>
        <p className="mb-3 text-[0.82rem] text-gray-500 [.admin-dark_&]:text-gray-400">
          Clears browser cache only. All products, orders, and users remain stored in MongoDB.
        </p>
        <button type="button" className={BTN_OUTLINE_DANGER} onClick={resetCache}>
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
          Reset Databases to Default
        </button>
      </div>
    </div>
  );
}
