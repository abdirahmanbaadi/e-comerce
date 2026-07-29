/**
 * ADMIN SETTINGS — store, appearance, delivery, notifications, dashboard prefs, system
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiUrl, clearDeliveryDistrictsCache, fetchWithTimeout } from '../../utils/data';
import { showTopFloatNotification } from '../../utils/notifications';
import { useAdminTheme } from '../../hooks/useAdminTheme';
import {
  ADM_TABLE_CARD,
  ADM_LABEL,
  ADM_INPUT,
  ADM_SELECT,
  BTN_PRIMARY,
  BTN_GHOST,
  ADMIN_FETCH_TIMEOUT,
  authHeaders,
  ADMIN_SETTINGS_KEYS,
  DEFAULT_ADMIN_NOTIF_PREFS,
  ADMIN_SALES_RANGE_OPTIONS,
  ADMIN_TOP_PRODUCTS_RANGE_OPTIONS,
  ADMIN_TABLE_PAGE_SIZE_OPTIONS,
} from './adminShared.js';

const DEFAULT_FEES = {
  Hodan: 0.01,
  Wadajir: 0.01,
  Karaan: 0.02,
  Hamarweyne: 0.01,
};

const DEFAULT_STORE_SETTINGS = {
  isOpen: true,
  maintenanceMessage: 'We are temporarily closed for maintenance. Please check back soon.',
  lowStockThreshold: 5,
  supportPhone: '+252 61 000 0000',
  supportEmail: 'support@mogadishumodernfurniture.com',
  storeDisplayName: 'Mogadishu Modern Furniture',
  minOrderAmount: 0,
};

const REFRESH_OPTIONS = [
  { value: '30000', label: 'Every 30 seconds' },
  { value: '60000', label: 'Every 1 minute' },
  { value: '120000', label: 'Every 2 minutes' },
  { value: '0', label: 'Manual only' },
];

const SALES_RANGE_LABELS = {
  all: 'All time',
  today: 'Today',
  week: 'This week',
  month: 'This month',
  year: 'This year',
};

const TOP_PRODUCTS_RANGE_LABELS = {
  all: 'All Time',
  week: 'Week',
  month: 'Month',
  year: 'Year',
};

function SettingsSection({ icon, title, description, children, className = '', span = '' }) {
  return (
    <section className={`${ADM_TABLE_CARD} ${span} ${className}`}>
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-deepGreen/10 text-deepGreen [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300">
          <i className={`fa-solid ${icon} text-[0.95rem]`} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="m-0 font-display text-[1.05rem] font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
            {title}
          </h3>
          {description ? (
            <p className="mb-0 mt-0.5 text-[0.78rem] leading-relaxed text-gray-500 [.admin-dark_&]:text-gray-400">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function SettingsToggle({ label, hint, checked, onChange, disabled = false }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-black/[0.05] px-3 py-2.5 transition hover:bg-deepGreen/[0.02] [.admin-dark_&]:border-white/[0.08] [.admin-dark_&]:hover:bg-white/[0.03]">
      <span className="min-w-0">
        <span className="block text-[0.84rem] font-semibold text-gray-800 [.admin-dark_&]:text-gray-100">{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-[0.72rem] text-gray-500 [.admin-dark_&]:text-gray-400">{hint}</span>
        ) : null}
      </span>
      <input
        type="checkbox"
        className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-emerald-600"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

function ThemeOption({ active, icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex flex-1 flex-col items-center gap-2 rounded-xl border px-3 py-3 text-center transition',
        active
          ? 'border-deepGreen/25 bg-deepGreen/[0.06] shadow-[0_4px_14px_rgba(7,61,53,0.08)] [.admin-dark_&]:border-emerald-500/30 [.admin-dark_&]:bg-emerald-500/10'
          : 'border-black/[0.06] bg-white hover:border-deepGreen/15 [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#141f1b]',
      ].join(' ')}
    >
      <i className={`fa-solid ${icon} text-lg ${active ? 'text-deepGreen [.admin-dark_&]:text-emerald-300' : 'text-gray-400'}`} />
      <span className={`text-[0.78rem] font-bold ${active ? 'text-deepGreen [.admin-dark_&]:text-emerald-300' : 'text-gray-600 [.admin-dark_&]:text-gray-300'}`}>
        {label}
      </span>
    </button>
  );
}

function readNotifPrefs() {
  try {
    const raw = localStorage.getItem(ADMIN_SETTINGS_KEYS.notifPrefs);
    if (!raw) return { ...DEFAULT_ADMIN_NOTIF_PREFS };
    return { ...DEFAULT_ADMIN_NOTIF_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_ADMIN_NOTIF_PREFS };
  }
}

function readLocalPref(key, fallback) {
  if (typeof localStorage === 'undefined') return fallback;
  const value = localStorage.getItem(key);
  return value ?? fallback;
}

export function AdminSettingsTab() {
  const { isDark, setIsDark } = useAdminTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [fees, setFees] = useState({ ...DEFAULT_FEES });
  const [store, setStore] = useState({ ...DEFAULT_STORE_SETTINGS });
  const [notifPrefs, setNotifPrefs] = useState(readNotifPrefs);
  const [refreshMs, setRefreshMs] = useState(
    () => readLocalPref(ADMIN_SETTINGS_KEYS.dashboardRefreshMs, '60000')
  );
  const [salesRange, setSalesRange] = useState(
    () => readLocalPref(ADMIN_SETTINGS_KEYS.dashboardSalesRange, 'week')
  );
  const [topProductsRange, setTopProductsRange] = useState(
    () => readLocalPref(ADMIN_SETTINGS_KEYS.dashboardTopProductsRange, 'month')
  );
  const [tablePageSize, setTablePageSize] = useState(
    () => readLocalPref(ADMIN_SETTINGS_KEYS.tablePageSize, '20')
  );
  const [sidebarCompact, setSidebarCompact] = useState(
    () => readLocalPref(ADMIN_SETTINGS_KEYS.sidebarCompact, 'false') === 'true'
  );
  const [compactTables, setCompactTables] = useState(
    () => readLocalPref(ADMIN_SETTINGS_KEYS.compactTables, 'false') === 'true'
  );
  const [promotionConfigured, setPromotionConfigured] = useState(false);
  const [promotionNew, setPromotionNew] = useState('');
  const [promotionConfirm, setPromotionConfirm] = useState('');
  const [promotionSaving, setPromotionSaving] = useState(false);

  const markDirty = useCallback(() => setDirty(true), []);

  const loadPromotionPasswordStatus = useCallback(async () => {
    try {
      const res = await fetchWithTimeout(
        apiUrl('/api/auth/admin-promotion-password/status'),
        { headers: authHeaders(false) },
        ADMIN_FETCH_TIMEOUT
      );
      const data = await res.json();
      if (data.success) setPromotionConfigured(Boolean(data.configured));
    } catch {
      setPromotionConfigured(false);
    }
  }, []);

  const loadSettings = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetchWithTimeout(apiUrl('/api/cms'), {}, ADMIN_FETCH_TIMEOUT);
      const data = await res.json();

      if (data.success && data.cms) {
        const feeMap = {};
        (data.cms.deliveryFees || []).forEach((entry) => {
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

        const ss = data.cms.storeSettings || {};
        setStore({
          isOpen: ss.isOpen !== false,
          maintenanceMessage: ss.maintenanceMessage || DEFAULT_STORE_SETTINGS.maintenanceMessage,
          lowStockThreshold: Number(ss.lowStockThreshold) || DEFAULT_STORE_SETTINGS.lowStockThreshold,
          supportPhone: ss.supportPhone || DEFAULT_STORE_SETTINGS.supportPhone,
          supportEmail: ss.supportEmail || DEFAULT_STORE_SETTINGS.supportEmail,
          storeDisplayName: ss.storeDisplayName || DEFAULT_STORE_SETTINGS.storeDisplayName,
          minOrderAmount: Number(ss.minOrderAmount) || 0,
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
      if (!quiet) {
        setLoading(false);
        setDirty(false);
      }
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadPromotionPasswordStatus();
  }, [loadSettings, loadPromotionPasswordStatus]);

  useEffect(() => {
    const onInvalidate = () => loadSettings({ quiet: true });
    window.addEventListener('admin-settings-invalidate', onInvalidate);
    return () => window.removeEventListener('admin-settings-invalidate', onInvalidate);
  }, [loadSettings]);

  const updateStore = (patch) => {
    setStore((prev) => ({ ...prev, ...patch }));
    markDirty();
  };

  const updateFee = (district, value) => {
    setFees((prev) => ({ ...prev, [district]: value }));
    markDirty();
  };

  const updateNotif = (key, value) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: value }));
    markDirty();
  };

  const savePromotionPassword = async () => {
    if (!promotionNew || !promotionConfirm) {
      showTopFloatNotification('Enter and confirm the admin promotion password.', 'warning');
      return;
    }
    if (promotionNew !== promotionConfirm) {
      showTopFloatNotification('Passwords do not match.', 'danger');
      return;
    }

    setPromotionSaving(true);
    try {
      const res = await fetch(apiUrl('/api/auth/admin-promotion-password'), {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({
          newPassword: promotionNew,
          confirmPassword: promotionConfirm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification(data.message || 'Admin promotion password saved.');
        setPromotionConfigured(true);
        setPromotionNew('');
        setPromotionConfirm('');
        window.dispatchEvent(new CustomEvent('admin-promotion-password-updated'));
      } else {
        showTopFloatNotification(data.message || 'Could not save password.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not connect to the server.', 'danger');
    } finally {
      setPromotionSaving(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);

    localStorage.setItem('deliveryFee_Hodan', String(fees.Hodan));
    localStorage.setItem('deliveryFee_Wadajir', String(fees.Wadajir));
    localStorage.setItem('deliveryFee_Karaan', String(fees.Karaan));
    localStorage.setItem('deliveryFee_Hamarweyne', String(fees.Hamarweyne));
    localStorage.setItem(ADMIN_SETTINGS_KEYS.lowStockThreshold, String(store.lowStockThreshold));
    localStorage.setItem(ADMIN_SETTINGS_KEYS.storeOpen, String(store.isOpen));
    localStorage.setItem(ADMIN_SETTINGS_KEYS.notifPrefs, JSON.stringify(notifPrefs));
    localStorage.setItem(ADMIN_SETTINGS_KEYS.dashboardRefreshMs, refreshMs);
    localStorage.setItem(ADMIN_SETTINGS_KEYS.dashboardSalesRange, salesRange);
    localStorage.setItem(ADMIN_SETTINGS_KEYS.dashboardTopProductsRange, topProductsRange);
    localStorage.setItem(ADMIN_SETTINGS_KEYS.tablePageSize, tablePageSize);
    localStorage.setItem(ADMIN_SETTINGS_KEYS.sidebarCompact, String(sidebarCompact));
    localStorage.setItem(ADMIN_SETTINGS_KEYS.compactTables, String(compactTables));

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
        body: JSON.stringify({
          deliveryFees,
          storeSettings: {
            isOpen: store.isOpen,
            maintenanceMessage: store.maintenanceMessage,
            lowStockThreshold: Number(store.lowStockThreshold) || 5,
            supportPhone: store.supportPhone,
            supportEmail: store.supportEmail,
            storeDisplayName: store.storeDisplayName,
            minOrderAmount: Number(store.minOrderAmount) || 0,
          },
        }),
      });
      const data = await res.json();
      if (!data.success) {
        showTopFloatNotification(data.message || 'Could not save settings.', 'danger');
      } else {
        clearDeliveryDistrictsCache();
        window.dispatchEvent(new Event('delivery-fees-updated'));
        window.dispatchEvent(new CustomEvent('admin-settings-invalidate'));
        window.dispatchEvent(new CustomEvent('admin-dashboard-invalidate'));
        setDirty(false);
        showTopFloatNotification('Settings saved successfully.');
      }
    } catch {
      showTopFloatNotification('Could not save settings.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const resetLocalCache = () => {
    if (!window.confirm('Clear browser cache only? MongoDB data will NOT be deleted.')) return;
    ['products', 'orders', 'users', 'productReviews'].forEach((key) => localStorage.removeItem(key));
    showTopFloatNotification('Browser cache cleared. Reloading…');
    setTimeout(() => window.location.reload(), 800);
  };

  const systemInfo = useMemo(
    () => ({
      api: import.meta.env.VITE_API_URL || 'Local development API',
      storage: 'MongoDB Atlas',
      payment: 'EVC Plus / Waafi',
      theme: isDark ? 'Dark' : 'Light',
    }),
    [isDark]
  );

  if (loading) {
    return (
      <div className={`${ADM_TABLE_CARD} py-12 text-center text-gray-500 [.admin-dark_&]:text-gray-400`}>
        <i className="fa-solid fa-spinner fa-spin me-2" aria-hidden="true" />
        Loading settings…
      </div>
    );
  }

  return (
    <div className="animate-cardRise space-y-4 pb-2">
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-deepGreen/[0.08] bg-white/95 px-4 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] backdrop-blur-sm [.admin-dark_&]:border-white/[0.08] [.admin-dark_&]:bg-[#1a2421]/95">
        <div>
          <p className="mb-0 text-[0.65rem] font-bold uppercase tracking-wide text-gray-400">Admin settings</p>
          <p className="mb-0 text-[0.88rem] font-semibold text-gray-700 [.admin-dark_&]:text-gray-200">
            Configure store, dashboard, appearance, and system preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty ? (
            <span className="text-[0.72rem] font-semibold text-amber-600 [.admin-dark_&]:text-amber-300">
              Unsaved changes
            </span>
          ) : null}
          <button type="button" className={BTN_GHOST} onClick={() => loadSettings()} disabled={saving}>
            Reset
          </button>
          <button type="button" className={BTN_PRIMARY} onClick={saveSettings} disabled={saving}>
            {saving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin me-1.5" aria-hidden="true" />
                Saving…
              </>
            ) : (
              'Save all settings'
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SettingsSection
          icon="fa-palette"
          title="Appearance"
          description="Theme applies to the full admin panel instantly — sidebar, tables, and modals."
        >
          <div className="flex gap-2">
            <ThemeOption active={!isDark} icon="fa-sun" label="Light mode" onClick={() => setIsDark(false)} />
            <ThemeOption active={isDark} icon="fa-moon" label="Dark mode" onClick={() => setIsDark(true)} />
          </div>
          <div className="mt-4 space-y-2">
            <SettingsToggle
              label="Compact sidebar by default"
              hint="Sidebar starts collapsed when you open admin"
              checked={sidebarCompact}
              onChange={(v) => {
                setSidebarCompact(v);
                markDirty();
              }}
            />
            <SettingsToggle
              label="Compact admin tables"
              hint="Tighter row padding across orders, users, and payments"
              checked={compactTables}
              onChange={(v) => {
                setCompactTables(v);
                markDirty();
              }}
            />
          </div>
        </SettingsSection>

        <SettingsSection
          icon="fa-gauge-high"
          title="Dashboard preferences"
          description="Synced with the dashboard — sales chart, refresh, and product insights."
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={ADM_LABEL} htmlFor="dashboardRefresh">
                Auto-refresh dashboard
              </label>
              <select
                id="dashboardRefresh"
                className={ADM_SELECT}
                value={refreshMs}
                onChange={(e) => {
                  setRefreshMs(e.target.value);
                  markDirty();
                }}
              >
                {REFRESH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={ADM_LABEL} htmlFor="salesRangeDefault">
                Default sales chart range
              </label>
              <select
                id="salesRangeDefault"
                className={ADM_SELECT}
                value={salesRange}
                onChange={(e) => {
                  setSalesRange(e.target.value);
                  markDirty();
                }}
              >
                {ADMIN_SALES_RANGE_OPTIONS.map((id) => (
                  <option key={id} value={id}>
                    {SALES_RANGE_LABELS[id]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={ADM_LABEL} htmlFor="topProductsRangeDefault">
                Default top products range
              </label>
              <select
                id="topProductsRangeDefault"
                className={ADM_SELECT}
                value={topProductsRange}
                onChange={(e) => {
                  setTopProductsRange(e.target.value);
                  markDirty();
                }}
              >
                {ADMIN_TOP_PRODUCTS_RANGE_OPTIONS.map((id) => (
                  <option key={id} value={id}>
                    {TOP_PRODUCTS_RANGE_LABELS[id]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={ADM_LABEL} htmlFor="tablePageSize">
                Default table page size
              </label>
              <select
                id="tablePageSize"
                className={ADM_SELECT}
                value={tablePageSize}
                onChange={(e) => {
                  setTablePageSize(e.target.value);
                  markDirty();
                }}
              >
                {ADMIN_TABLE_PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={String(size)}>
                    {size} rows per page
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          icon="fa-store"
          title="Store & checkout"
          description="Store name, order rules, and maintenance mode."
        >
          <div className="space-y-3">
            <div>
              <label className={ADM_LABEL} htmlFor="storeDisplayName">
                Store display name
              </label>
              <input
                id="storeDisplayName"
                type="text"
                className={ADM_INPUT}
                value={store.storeDisplayName}
                onChange={(e) => updateStore({ storeDisplayName: e.target.value })}
              />
            </div>
            <div>
              <label className={ADM_LABEL} htmlFor="minOrderAmount">
                Minimum order amount ($)
              </label>
              <input
                id="minOrderAmount"
                type="number"
                step="0.01"
                min="0"
                className={`${ADM_INPUT} max-w-[160px]`}
                value={store.minOrderAmount}
                onChange={(e) => updateStore({ minOrderAmount: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <SettingsToggle
              label="Store open for orders"
              hint={store.isOpen ? 'Checkout is enabled' : 'Maintenance mode — new orders blocked'}
              checked={store.isOpen}
              onChange={(checked) => updateStore({ isOpen: checked })}
            />
          </div>
          {!store.isOpen ? (
            <div className="mt-3">
              <label className={ADM_LABEL} htmlFor="maintenanceMessage">
                Maintenance message
              </label>
              <textarea
                id="maintenanceMessage"
                rows={3}
                className={`${ADM_INPUT} min-h-[80px] resize-y`}
                value={store.maintenanceMessage}
                onChange={(e) => updateStore({ maintenanceMessage: e.target.value })}
              />
            </div>
          ) : null}
        </SettingsSection>

        <SettingsSection
          icon="fa-cubes"
          title="Inventory alerts"
          description="Used on Stock tab and dashboard low-stock panel."
        >
          <label className={ADM_LABEL} htmlFor="lowStockThreshold">
            Low stock alert threshold (units)
          </label>
          <input
            id="lowStockThreshold"
            type="number"
            min="1"
            max="100"
            className={`${ADM_INPUT} max-w-[120px]`}
            value={store.lowStockThreshold}
            onChange={(e) => updateStore({ lowStockThreshold: e.target.value })}
          />
          <p className="mb-0 mt-2 text-[0.72rem] text-gray-500 [.admin-dark_&]:text-gray-400">
            Products at or below this quantity appear in low-stock alerts.
          </p>
        </SettingsSection>

        <SettingsSection
          icon="fa-truck-fast"
          title="Delivery fees"
          description="District fees synced to checkout and CMS."
        >
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(DEFAULT_FEES).map((district) => (
              <div key={district}>
                <label className={ADM_LABEL} htmlFor={`fee-${district}`}>
                  {district} ($)
                </label>
                <input
                  id={`fee-${district}`}
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
          <p className="mb-0 mt-3 text-[0.72rem] text-gray-500 [.admin-dark_&]:text-gray-400">
            Dayniile uses Karaan fee · Yaqshid uses Hodan fee (auto-synced on save).
          </p>
        </SettingsSection>

        <SettingsSection
          icon="fa-headset"
          title="Support contact"
          description="Shown to customers on help and contact flows."
        >
          <div className="space-y-3">
            <div>
              <label className={ADM_LABEL} htmlFor="supportPhone">
                Support phone
              </label>
              <input
                id="supportPhone"
                type="tel"
                className={ADM_INPUT}
                value={store.supportPhone}
                onChange={(e) => updateStore({ supportPhone: e.target.value })}
              />
            </div>
            <div>
              <label className={ADM_LABEL} htmlFor="supportEmail">
                Support email
              </label>
              <input
                id="supportEmail"
                type="email"
                className={ADM_INPUT}
                value={store.supportEmail}
                onChange={(e) => updateStore({ supportEmail: e.target.value })}
              />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          icon="fa-bell"
          title="Admin notifications"
          description="Choose which events highlight in your admin inbox."
        >
          <div className="space-y-2">
            <SettingsToggle label="New orders" checked={notifPrefs.newOrders} onChange={(v) => updateNotif('newOrders', v)} />
            <SettingsToggle label="Support tickets" checked={notifPrefs.newSupport} onChange={(v) => updateNotif('newSupport', v)} />
            <SettingsToggle
              label="Driver applications"
              checked={notifPrefs.driverApplications}
              onChange={(v) => updateNotif('driverApplications', v)}
            />
            <SettingsToggle
              label="Pending payments"
              checked={notifPrefs.paymentPending}
              onChange={(v) => updateNotif('paymentPending', v)}
            />
            <SettingsToggle
              label="Low stock alerts"
              checked={notifPrefs.lowStockAlerts}
              onChange={(v) => updateNotif('lowStockAlerts', v)}
            />
          </div>
        </SettingsSection>

        <SettingsSection
          icon="fa-shield-halved"
          title="Admin promotion password"
          description="Required each time you promote a customer or driver to admin. Typed manually — never stored in the browser."
        >
          <div
            className={`mb-4 rounded-xl border px-3 py-2.5 text-[0.78rem] ${
              promotionConfigured
                ? 'border-emerald-500/25 bg-emerald-50/80 text-emerald-800 [.admin-dark_&]:border-emerald-500/20 [.admin-dark_&]:bg-emerald-500/10 [.admin-dark_&]:text-emerald-200'
                : 'border-amber-500/25 bg-amber-50/80 text-amber-900 [.admin-dark_&]:border-amber-500/20 [.admin-dark_&]:bg-amber-500/10 [.admin-dark_&]:text-amber-100'
            }`}
          >
            <i className={`fa-solid ${promotionConfigured ? 'fa-circle-check' : 'fa-triangle-exclamation'} me-2`} />
            {promotionConfigured
              ? 'Promotion password is set. You will be asked for it on every Promote to Admin action.'
              : 'Not set yet — promoting users to admin is blocked until you save a password here.'}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={ADM_LABEL} htmlFor="promotionPasswordNew">
                New password
              </label>
              <input
                id="promotionPasswordNew"
                type="password"
                autoComplete="new-password"
                className={ADM_INPUT}
                value={promotionNew}
                onChange={(e) => setPromotionNew(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className={ADM_LABEL} htmlFor="promotionPasswordConfirm">
                Confirm password
              </label>
              <input
                id="promotionPasswordConfirm"
                type="password"
                autoComplete="new-password"
                className={ADM_INPUT}
                value={promotionConfirm}
                onChange={(e) => setPromotionConfirm(e.target.value)}
                placeholder="Repeat password"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={BTN_PRIMARY}
              disabled={promotionSaving}
              onClick={savePromotionPassword}
            >
              {promotionSaving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> Saving…
                </>
              ) : promotionConfigured ? (
                'Update promotion password'
              ) : (
                'Set promotion password'
              )}
            </button>
            <p className="mb-0 text-[0.72rem] text-gray-500 [.admin-dark_&]:text-gray-400">
              Any admin can update this password. Share it only with trusted staff.
            </p>
          </div>
        </SettingsSection>

        <SettingsSection
          icon="fa-server"
          title="System info"
          description="Environment details and local cache tools."
          span="xl:col-span-2"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 rounded-xl border border-black/[0.05] bg-gray-50/80 p-3 text-[0.8rem] [.admin-dark_&]:border-white/[0.08] [.admin-dark_&]:bg-white/[0.03]">
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">Database</span>
                <span className="font-semibold text-deepGreen [.admin-dark_&]:text-emerald-300">{systemInfo.storage}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">Payments</span>
                <span className="font-semibold">{systemInfo.payment}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">Current theme</span>
                <span className="font-semibold">{systemInfo.theme}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-500">API</span>
                <span className="truncate font-mono text-[0.72rem]">{systemInfo.api}</span>
              </div>
            </div>

            <div className="rounded-xl border border-red-500/20 bg-red-50/40 p-3 [.admin-dark_&]:border-red-500/25 [.admin-dark_&]:bg-red-500/5">
              <p className="mb-2 text-[0.72rem] font-bold uppercase tracking-wide text-red-600 [.admin-dark_&]:text-red-400">
                Danger zone
              </p>
              <p className="mb-3 text-[0.78rem] text-gray-600 [.admin-dark_&]:text-gray-400">
                Clears local browser cache only. All MongoDB data stays safe.
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-3 py-1.5 text-[0.78rem] font-bold text-red-600 transition hover:bg-red-50 [.admin-dark_&]:text-red-400 [.admin-dark_&]:hover:bg-red-500/10"
                onClick={resetLocalCache}
              >
                <i className="fa-solid fa-trash-can" aria-hidden="true" />
                Clear browser cache
              </button>
            </div>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}

export default AdminSettingsTab;
