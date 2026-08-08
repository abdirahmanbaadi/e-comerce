import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiUrl, fetchWithTimeout } from '../../utils/data';
import { productImage } from '../../utils/format';
import { showTopFloatNotification } from '../../utils/notifications';
import { useIntervalWhenVisible } from '../../hooks/useIntervalWhenVisible';
import { getAvatarBgColor, getOrderPaymentLabel, paymentBadgeClass, getDashboardRefreshMs, getDashboardSalesRange, getDashboardTopProductsRange, ADMIN_SETTINGS_KEYS, ADM_DARK_SURFACE_SM, ADM_DARK_TEXT, ADM_DARK_TEXT_BODY, ADM_DARK_TEXT_MUTED, ADM_DARK_DIVIDE, ADM_DARK_BTN, ADM_DARK_LINK } from './adminShared.js';
import { ADMIN_THEME_EVENT } from '../../hooks/useAdminTheme';
import { OrderEditModal } from './AdminOrdersTab';
import DashboardSupportModal from './DashboardSupportModal';

const ADMIN_FETCH_TIMEOUT = 20000;
const DASHBOARD_SECONDARY_TIMEOUT = 15000;

const SALES_RANGE_OPTIONS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' },
];

const TOP_PRODUCTS_RANGE_OPTIONS = [
  { id: 'all', label: 'All Time' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
];

function parseDashboardDate(str) {
  if (!str) return null;
  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isPaidDashboardOrder(order) {
  return order.paymentType === 'paid' || String(order.payment || '').toLowerCase() === 'paid';
}

function isCancelledDashboardOrder(order) {
  return order.currentStep === 0 || String(order.status || '').toLowerCase() === 'cancelled';
}

function isTopProductsEligibleOrder(order) {
  if (!isPaidDashboardOrder(order) || isCancelledDashboardOrder(order)) return false;
  const step = typeof order.currentStep === 'number' ? order.currentStep : 1;
  return step >= 4;
}

function getTopProductsSalesDate(order) {
  return parseDashboardDate(order.deliveredAt || order.updatedAt || order.paidAt || order.createdAt || order.date);
}

function isDateInTopProductsRange(date, range) {
  const now = new Date();
  if (range === 'all') return true;
  if (range === 'week') {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    return date >= weekStart && date <= now;
  }
  if (range === 'month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return date >= monthStart && date <= now;
  }
  if (range === 'year') {
    const yearStart = new Date(now.getFullYear(), 0, 1);
    return date >= yearStart && date <= now;
  }
  return true;
}

function buildTopProductsFromOrders(orders, range) {
  const counts = new Map();

  (orders || [])
    .filter(isTopProductsEligibleOrder)
    .forEach((order) => {
      const salesDate = getTopProductsSalesDate(order);
      if (!salesDate || !isDateInTopProductsRange(salesDate, range)) return;

      const lineItems =
        Array.isArray(order.items) && order.items.length > 0
          ? order.items
          : [{ id: null, title: order.product || 'Unknown product', quantity: 1 }];

      lineItems.forEach((item) => {
        const title = item.title || order.product || 'Unknown product';
        const key = `${item.id ?? 'na'}-${title}`;
        const prev = counts.get(key) || { id: item.id ?? null, title, sold: 0 };
        prev.sold += Number(item.quantity) > 0 ? Number(item.quantity) : 1;
        counts.set(key, prev);
      });
    });

  return Array.from(counts.values())
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 10);
}

function mergeTopProductsByPeriod(apiPeriod, orders) {
  const ranges = ['all', 'week', 'month', 'year'];

  if (Array.isArray(orders) && orders.length > 0) {
    const fromOrders = {};
    ranges.forEach((range) => {
      fromOrders[range] = buildTopProductsFromOrders(orders, range);
    });
    return fromOrders;
  }

  const base = apiPeriod && typeof apiPeriod === 'object' ? { ...apiPeriod } : {};
  ranges.forEach((range) => {
    if (!Array.isArray(base[range])) base[range] = [];
  });
  return base;
}

function isDateInSalesRange(date, range) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday);
  endOfToday.setHours(23, 59, 59, 999);

  if (range === 'today') {
    return date >= startOfToday && date <= endOfToday;
  }
  if (range === 'all') {
    return true;
  }
  if (range === 'week') {
    const weekStart = new Date(startOfToday);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    return date >= weekStart && date <= endOfToday;
  }
  if (range === 'month') {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
  if (range === 'year') {
    return date.getFullYear() === now.getFullYear();
  }
  return true;
}

function buildSalesDateMap(stats, orders) {
  const dateMap = stats?.salesByDate ? { ...stats.salesByDate } : {};
  const isPaid = (order) =>
    order.paymentType === 'paid' || String(order.payment || '').toLowerCase() === 'paid';

  if (!Object.keys(dateMap).length) {
    orders.filter(isPaid).forEach((order) => {
      const dateKey = order.date || order.paidAt || order.createdAt;
      if (!dateKey) return;
      const parsed = parseDashboardDate(dateKey);
      const label = parsed
        ? parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : String(dateKey);
      const amount =
        typeof order.amount === 'number'
          ? order.amount
          : Number(String(order.amount || '').replace(/[\$,]/g, ''));
      dateMap[label] = (dateMap[label] || 0) + (Number.isNaN(amount) ? 0 : amount);
    });
  }
  return dateMap;
}
function filterSalesChartData(stats, orders, salesRange) {
  const dateMap = buildSalesDateMap(stats, orders);
  const rows = Object.entries(dateMap)
    .map(([dateStr, amount]) => {
      const parsed = parseDashboardDate(dateStr);
      if (!parsed || !isDateInSalesRange(parsed, salesRange)) return null;
      return { dateStr, parsed, amount: Number(amount) || 0 };
    })
    .filter(Boolean)
    .sort((a, b) => a.parsed - b.parsed);

  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  return {
    labels: rows.map((row) => formatChartDate(row.dateStr)),
    values: rows.map((row) => row.amount),
    total,
    isEmpty: rows.length === 0,
  };
}

function getOrderStatusLabel(order) {
  if (order.currentStep === 0 || order.status === 'Cancelled') return 'Cancelled';
  if (order.currentStep === 5 || order.status === 'Delivered') return 'Delivered';
  if (order.currentStep === 4 || order.status === 'Shipped') return 'Shipped';
  if (order.currentStep === 2 || order.currentStep === 3 || order.status === 'Processing') return 'Processing';
  return 'Pending';
}

function statusBadgeClass(status) {
  if (status === 'Delivered') return 'bg-emerald-100 text-emerald-700 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300';
  if (status === 'Shipped') return 'bg-blue-100 text-blue-700 [.admin-dark_&]:bg-blue-500/15 [.admin-dark_&]:text-blue-300';
  if (status === 'Cancelled') return 'bg-red-100 text-red-700 [.admin-dark_&]:bg-red-500/15 [.admin-dark_&]:text-red-300';
  if (status === 'Processing') return 'bg-amber-100 text-amber-800 [.admin-dark_&]:bg-amber-500/15 [.admin-dark_&]:text-amber-300';
  return 'bg-slate-100 text-slate-600 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-slate-300';
}

function formatTrend(trend) {
  if (trend === null || trend === undefined) return null;
  const up = trend >= 0;
  return { up, label: `${up ? '+' : ''}${trend}%` };
}

function isTrendReliable(metric, stats) {
  if (!stats) return false;
  if (metric === 'orders') return (stats.totalOrders ?? 0) >= 10;
  if (metric === 'users') return (stats.totalUsers ?? 0) >= 5;
  if (metric === 'revenue') return (stats.revenue ?? 0) >= 10;
  return false;
}

function CustomerAvatar({ name }) {
  const initials = (name || '?')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.62rem] font-bold text-white"
      style={{ backgroundColor: getAvatarBgColor(name || '?') }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

function formatChartDate(label) {
  if (!label || label === 'No Data') return label;
  const parsed = new Date(label);
  if (Number.isNaN(parsed.getTime())) return label;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatChartCurrency(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '';
  if (num === 0) return '$0';
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}k`;
  if (num >= 1) return `$${Math.round(num)}`;
  return `$${num.toFixed(2)}`;
}

function salesAreaGradient(chart) {
  const { ctx, chartArea } = chart;
  if (!chartArea) return 'rgba(7, 61, 53, 0.12)';
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, 'rgba(7, 61, 53, 0.28)');
  gradient.addColorStop(0.45, 'rgba(15, 111, 100, 0.1)');
  gradient.addColorStop(1, 'rgba(7, 61, 53, 0)');
  return gradient;
}

function salesLineGradient(chart) {
  const { ctx, chartArea } = chart;
  if (!chartArea) return '#073D35';
  const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
  gradient.addColorStop(0, '#073D35');
  gradient.addColorStop(0.5, '#0f6f64');
  gradient.addColorStop(1, '#D8A128');
  return gradient;
}

function isAdminDarkTheme() {
  if (typeof document === 'undefined') return false;
  const root = document.documentElement;
  return (
    root.classList.contains('admin-dark') ||
    root.classList.contains('dark') ||
    root.getAttribute('data-admin-theme') === 'dark'
  );
}

function buildSalesChartOptions(suggestedMax) {
  const dark = isAdminDarkTheme();
  const gridColor = dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(7, 61, 53, 0.06)';
  const tickColor = dark ? '#9ca3af' : '#6b7280';

  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 8, right: 6, bottom: 0, left: 0 } },
    interaction: { mode: 'index', intersect: false },
    animation: { duration: 700, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(7, 61, 53, 0.96)',
        titleColor: '#f3f7f5',
        bodyColor: '#D8A128',
        titleFont: { size: 12, weight: '600', family: 'inherit' },
        bodyFont: { size: 13, weight: '700', family: 'inherit' },
        padding: 12,
        cornerRadius: 10,
        displayColors: false,
        borderColor: 'rgba(216, 161, 40, 0.35)',
        borderWidth: 1,
        callbacks: {
          title: (items) => items[0]?.label || '',
          label: (ctx) => formatChartCurrency(ctx.parsed.y),
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax,
        border: { display: false },
        grid: {
          color: gridColor,
          drawTicks: false,
          borderDash: [4, 6],
        },
        ticks: {
          maxTicksLimit: 4,
          padding: 12,
          color: tickColor,
          font: { size: 11, weight: '500' },
          callback: (value) => formatChartCurrency(value),
        },
      },
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: {
          maxTicksLimit: 7,
          maxRotation: 0,
          autoSkip: true,
          padding: 10,
          color: tickColor,
          font: { size: 11, weight: '500' },
        },
      },
    },
    elements: {
      line: {
        borderCapStyle: 'round',
        borderJoinStyle: 'round',
      },
      point: {
        hoverBorderWidth: 3,
      },
    },
  };
}

function buildSalesChartDataset(chartData) {
  return {
    label: 'Sales Revenue',
    data: chartData,
    borderWidth: 2.5,
    fill: true,
    tension: 0.42,
    cubicInterpolationMode: 'monotone',
    pointRadius: 0,
    pointHoverRadius: 6,
    pointHitRadius: 18,
    pointBackgroundColor: '#D8A128',
    pointBorderColor: '#ffffff',
    pointHoverBackgroundColor: '#D8A128',
    pointHoverBorderColor: '#073D35',
    borderColor(context) {
      return salesLineGradient(context.chart);
    },
    backgroundColor(context) {
      return salesAreaGradient(context.chart);
    },
  };
}

function formatRelativeTime(iso) {
  if (!iso) return 'Just now';
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function SupportAvatar({ name, avatar }) {
  const src = avatar ? productImage(avatar) : '';
  if (src) {
    return <img src={src} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />;
  }
  const lower = name.toLowerCase();
  if (lower === 'hodan ali') {
    return (
      <img
        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
        alt={name}
        className="h-8 w-8 shrink-0 rounded-full object-cover"
      />
    );
  }
  if (lower === 'mustafa omar') {
    return (
      <img
        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
        alt={name}
        className="h-8 w-8 shrink-0 rounded-full object-cover"
      />
    );
  }
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-deepGreen text-[0.72rem] font-bold text-white">
      {initials}
    </div>
  );
}

function SupportStatusBadge({ status }) {
  if (status === 'Open' || status === 'New') {
    return (
      <span className="rounded px-1.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide text-white bg-red-500">
        New
      </span>
    );
  }
  if (status === 'Pending' || status === 'In Progress') {
    return (
      <span className="rounded px-1.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide bg-amber-400 text-amber-950">
        In Progress
      </span>
    );
  }
  return (
    <span className="rounded px-1.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide bg-emerald-500 text-white">
      Resolved
    </span>
  );
}

function TrendBadge({ trend, compact = false, enabled = true }) {
  if (!enabled) {
    return (
      <span className={`font-semibold text-gray-400 dark:text-gray-500 [.admin-dark_&]:text-gray-500 ${compact ? 'text-[0.62rem]' : 'text-[0.72rem]'}`}>
        —
      </span>
    );
  }
  const formatted = formatTrend(trend);
  if (!formatted) {
    return (
      <span className={`font-bold text-emerald-600 [.admin-dark_&]:text-emerald-400 ${compact ? 'text-[0.62rem]' : 'text-[0.72rem]'}`}>
        Live
      </span>
    );
  }
  const { up, label } = formatted;
  return (
    <div className="flex flex-col items-end gap-0.5">
    <span
        className={`inline-flex items-center gap-0.5 rounded-md font-bold ${
          compact ? 'px-1.5 py-0.5 text-[0.62rem]' : 'gap-1 px-2 py-0.5 text-[0.72rem]'
        } ${
        up
          ? 'bg-emerald-500/10 text-emerald-600 [.admin-dark_&]:text-emerald-400'
          : 'bg-red-500/10 text-red-600 [.admin-dark_&]:text-red-400'
      }`}
    >
        <i className={`fa-solid fa-arrow-${up ? 'up' : 'down'} text-[0.55rem]`} aria-hidden="true" />
      {label}
    </span>
      {compact && (
        <span className="text-[0.58rem] font-medium text-gray-400">vs last week</span>
      )}
    </div>
  );
}

function StatCard({ label, value, trend, trendEnabled = true, icon, iconWrapClass, hint, onClick }) {
  const className = [
    'group flex w-full items-center gap-3 rounded-xl border border-deepGreen/[0.06] bg-white px-3 py-2.5 text-left shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all duration-300',
    onClick
      ? 'cursor-pointer hover:-translate-y-px hover:border-deepGreen/12 hover:shadow-[0_6px_20px_rgba(7,61,53,0.07)] active:scale-[0.99]'
      : '',
    'dark:hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] [.admin-dark_&]:hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)]',
    ADM_DARK_SURFACE_SM,
  ].join(' ');

  const content = (
    <>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconWrapClass}`}>
        <i className={`fa-solid ${icon} text-[0.9rem]`} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[0.65rem] font-semibold uppercase tracking-wide text-gray-400 ${ADM_DARK_TEXT_MUTED}`}>
          {label}
        </p>
        <p className={`font-display text-[1.15rem] font-bold leading-tight text-deepGreen ${ADM_DARK_TEXT}`}>
          {value}
        </p>
        {hint && (
          <p className={`mt-0.5 truncate text-[0.62rem] font-medium text-gray-400 ${ADM_DARK_TEXT_MUTED}`}>
            {hint}
          </p>
        )}
        </div>
      <div className="shrink-0">
        <TrendBadge
          trend={trend}
          compact
          enabled={trend === null || trend === undefined ? true : trendEnabled}
        />
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

const QUICK_ACTIONS = [{ id: 'add-product', label: 'Add Product', icon: 'fa-plus' }];

const ORDER_STATUS_PILLS = [
  { id: 'Pending', label: 'Pending', countKey: 'pending', className: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-200 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-slate-200' },
  { id: 'Processing', label: 'Processing', countKey: 'processing', className: 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-300 [.admin-dark_&]:bg-amber-500/15 [.admin-dark_&]:text-amber-300' },
  { id: 'Paid', label: 'Paid', countKey: 'paid', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300' },
  { id: 'Delivered', label: 'Delivered', countKey: 'delivered', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300' },
  { id: 'Cancelled', label: 'Cancelled', countKey: 'cancelled', className: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/15 dark:text-red-300 [.admin-dark_&]:bg-red-500/15 [.admin-dark_&]:text-red-300' },
];

function DashboardToolbar({ loading, statusCounts, activeFilter, onQuickAction, onStatusFilter }) {
  return (
    <div className={`flex flex-col gap-2.5 rounded-xl border border-deepGreen/[0.06] bg-white px-3 py-2.5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] lg:flex-row lg:items-center lg:justify-between ${ADM_DARK_SURFACE_SM}`}>
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => onQuickAction(action.id)}
            className={`inline-flex items-center gap-2 rounded-lg border border-deepGreen/[0.08] bg-[#fdfbf8] px-3 py-1.5 text-[0.76rem] font-semibold text-deepGreen transition hover:border-deepGreen/15 hover:bg-white hover:shadow-[0_2px_8px_rgba(7,61,53,0.06)] ${ADM_DARK_BTN}`}
          >
            <i className={`fa-solid ${action.icon} text-[0.72rem] text-gold`} aria-hidden="true" />
            {action.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`mr-1 text-[0.65rem] font-bold uppercase tracking-wide text-gray-400 ${ADM_DARK_TEXT_MUTED}`}>Orders</span>
        {ORDER_STATUS_PILLS.map((pill) => {
          const isActive = activeFilter === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => onStatusFilter(pill.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-bold transition ${pill.className} ${
                isActive ? 'ring-2 ring-deepGreen/35 ring-offset-1 [.admin-dark_&]:ring-emerald-400/40' : ''
              }`}
              aria-pressed={isActive}
            >
              {pill.label}
              <span className="min-w-[1.1rem] rounded-full bg-white/70 px-1 text-center text-[0.62rem] dark:bg-black/20 [.admin-dark_&]:bg-black/20">
                {loading ? '…' : (statusCounts?.[pill.countKey] ?? 0)}
              </span>
            </button>
          );
        })}
        {activeFilter !== 'all' && (
          <button
            type="button"
            onClick={() => onStatusFilter('all')}
            className="inline-flex items-center rounded-full px-2 py-1 text-[0.65rem] font-bold text-gray-500 transition hover:bg-gray-100 [.admin-dark_&]:text-gray-400 [.admin-dark_&]:hover:bg-white/10"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

function CardShell({ title, action, children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-deepGreen/8 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-[#1a2421] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#1a2421] [.admin-dark_&]:shadow-[0_4px_20px_rgba(0,0,0,0.25)] ${className}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[0.9rem] font-bold text-deepGreen dark:text-[#e8f0ed] [.admin-dark_&]:text-[#e8f0ed]">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function SalesRangeSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="cursor-pointer rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[0.65rem] font-semibold text-gray-600 outline-none transition hover:border-deepGreen/25 focus:border-deepGreen/40 dark:border-white/10 dark:bg-[#101814] dark:text-gray-300 [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#101814] [.admin-dark_&]:text-gray-300"
      aria-label="Sales period"
    >
      {SALES_RANGE_OPTIONS.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

const INSIGHTS_PANEL_HEIGHT_PX = 210;

function resolveTopProductsForRange(byPeriod, range) {
  if (!byPeriod || typeof byPeriod !== 'object') return [];
  if (range === 'all') {
    if (Array.isArray(byPeriod.all) && byPeriod.all.length > 0) return byPeriod.all;
    if (Array.isArray(byPeriod.year) && byPeriod.year.length > 0) return byPeriod.year;
    if (Array.isArray(byPeriod.month) && byPeriod.month.length > 0) return byPeriod.month;
    return Array.isArray(byPeriod.week) ? byPeriod.week : [];
  }
  return Array.isArray(byPeriod[range]) ? byPeriod[range] : [];
}

function TopProductsContent({ loading, products, periodLabel, onProductClick }) {
  const maxSold = Math.max(...(products || []).map((p) => p.sold || 0), 1);

  if (loading) {
    return (
      <p className="py-6 text-center text-[0.8rem] text-gray-400">
        <i className="fa-solid fa-spinner fa-spin me-2" aria-hidden="true" />
        Loading…
      </p>
    );
  }
  if (!products || products.length === 0) {
    const emptyText =
      periodLabel.toLowerCase() === 'all time'
        ? 'No out-for-delivery sales yet.'
        : `No out-for-delivery sales this ${periodLabel.toLowerCase()} yet.`;
    return (
      <p className="py-6 text-center text-[0.8rem] text-gray-400">{emptyText}</p>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-deepGreen/15 [&::-webkit-scrollbar]:w-1">
      <ul className="space-y-2">
        {products.map((product, index) => {
          const width = Math.max(8, Math.round(((product.sold || 0) / maxSold) * 100));
          return (
            <li key={`${product.id}-${product.title}`}>
              <button
                type="button"
                onClick={() => onProductClick?.(product)}
                className="flex w-full items-center gap-2 rounded-lg px-0.5 py-0.5 text-left transition hover:bg-deepGreen/[0.04] [.admin-dark_&]:hover:bg-white/[0.04]"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-deepGreen/10 text-[0.62rem] font-bold text-deepGreen">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-center justify-between gap-1">
                    <span className={`truncate text-[0.76rem] font-semibold text-gray-900 ${ADM_DARK_TEXT_BODY}`}>
                      {product.title}
                    </span>
                    <span className="shrink-0 text-[0.68rem] font-bold text-deepGreen [.admin-dark_&]:text-emerald-300">
                      {product.sold}
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10 [.admin-dark_&]:bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-deepGreen to-teal transition-all duration-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function LowStockContent({ loading, products, totalCount, onProductClick }) {
  if (loading) {
    return (
      <p className="py-6 text-center text-[0.8rem] text-gray-400">
        <i className="fa-solid fa-spinner fa-spin me-2" aria-hidden="true" />
        Loading…
      </p>
    );
  }
  if (!products || products.length === 0) {
    return <p className="py-6 text-center text-[0.8rem] text-gray-400">All products are well stocked.</p>;
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-deepGreen/15 [&::-webkit-scrollbar]:w-1">
        <ul className="divide-y divide-gray-100 [.admin-dark_&]:divide-white/10">
          {products.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => onProductClick?.(product)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-0.5 py-1.5 text-left transition hover:bg-deepGreen/[0.04] [.admin-dark_&]:hover:bg-white/[0.04]"
              >
                <div className="min-w-0">
                  <p className={`truncate text-[0.76rem] font-semibold text-gray-900 ${ADM_DARK_TEXT_BODY}`}>
                    {product.title}
                  </p>
                  {product.category && (
                    <p className="truncate text-[0.64rem] text-gray-400">{product.category}</p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[0.64rem] font-bold ${
                    product.stockVal <= 2
                      ? 'bg-red-100 text-red-700 [.admin-dark_&]:bg-red-500/15 [.admin-dark_&]:text-red-300'
                      : 'bg-amber-100 text-amber-800 [.admin-dark_&]:bg-amber-500/15 [.admin-dark_&]:text-amber-300'
                  }`}
                >
                  {product.stockVal} left
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {totalCount > (products?.length || 0) && (
        <p className="mt-1 shrink-0 truncate text-[0.62rem] font-medium text-gray-400">
          +{totalCount - products.length} more low on stock
        </p>
      )}
    </div>
  );
}

function TopProductsRangeSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="cursor-pointer rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[0.62rem] font-semibold text-gray-600 outline-none transition hover:border-deepGreen/25 focus:border-deepGreen/40 dark:border-white/10 dark:bg-[#101814] dark:text-gray-300 [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#101814] [.admin-dark_&]:text-gray-300"
      aria-label="Top products period"
    >
      {TOP_PRODUCTS_RANGE_OPTIONS.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function ProductsInsightsCarousel({
  loading,
  topProductsByPeriod,
  lowStockProducts,
  lowStockCount,
  onViewProducts,
  onViewStock,
  onTopProductClick,
  onLowStockProductClick,
  defaultTopProductsRange = 'month',
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [topProductsRange, setTopProductsRange] = useState(defaultTopProductsRange);
  const touchStartRef = useRef(null);

  useEffect(() => {
    setTopProductsRange(defaultTopProductsRange);
  }, [defaultTopProductsRange]);

  const filteredTopProducts = useMemo(
    () => resolveTopProductsForRange(topProductsByPeriod, topProductsRange),
    [topProductsByPeriod, topProductsRange]
  );
  const topPeriodLabel =
    TOP_PRODUCTS_RANGE_OPTIONS.find((opt) => opt.id === topProductsRange)?.label || 'Week';

  const slides = useMemo(
    () => [
      {
        id: 'top',
        title: 'Top Products',
        actionLabel: 'Products',
        onAction: onViewProducts,
        content: (
          <TopProductsContent
            loading={loading}
            products={filteredTopProducts}
            periodLabel={topPeriodLabel}
            onProductClick={onTopProductClick}
          />
        ),
      },
      {
        id: 'stock',
        title: 'Low Stock',
        actionLabel: 'Stock',
        onAction: onViewStock,
        content: (
          <LowStockContent
            loading={loading}
            products={lowStockProducts}
            totalCount={lowStockCount}
            onProductClick={onLowStockProductClick}
          />
        ),
      },
    ],
    [
      loading,
      filteredTopProducts,
      topPeriodLabel,
      lowStockProducts,
      lowStockCount,
      onViewProducts,
      onViewStock,
      onTopProductClick,
      onLowStockProductClick,
    ]
  );

  const goToSlide = useCallback(
    (index) => {
      setActiveIndex((index + slides.length) % slides.length);
    },
    [slides.length]
  );

  const handleTouchStart = (event) => {
    touchStartRef.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event) => {
    if (touchStartRef.current === null) return;
    const diff = event.changedTouches[0].clientX - touchStartRef.current;
    touchStartRef.current = null;
    if (Math.abs(diff) < 48) return;
    if (diff < 0) goToSlide(activeIndex + 1);
    else goToSlide(activeIndex - 1);
  };

  const activeSlide = slides[activeIndex];

  const carouselLinkBtn =
    'shrink-0 text-[0.72rem] font-bold text-blue-500 transition hover:text-blue-600 [.admin-dark_&]:text-blue-400 [.admin-dark_&]:hover:text-blue-300';

  const carouselNavBtn =
    'inline-flex h-5 w-5 items-center justify-center rounded-md text-gray-400 transition hover:bg-deepGreen/5 hover:text-deepGreen [.admin-dark_&]:hover:bg-white/10 [.admin-dark_&]:hover:text-emerald-300';

  return (
    <CardShell
      className="!p-3 [&>div:first-child]:!mb-2"
      title={
        <span className="text-[0.85rem] transition-opacity duration-300" key={activeSlide.id}>
          {activeSlide.title}
        </span>
      }
      action={
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          {activeIndex === 0 && (
            <TopProductsRangeSelect value={topProductsRange} onChange={setTopProductsRange} />
          )}
          <button
            type="button"
            className={carouselNavBtn}
            onClick={() => goToSlide(activeIndex - 1)}
            aria-label="Previous panel"
          >
            <i className="fa-solid fa-chevron-left text-[0.55rem]" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-1" role="tablist" aria-label="Product insights">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={slide.title}
                onClick={() => goToSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? 'w-4 bg-deepGreen [.admin-dark_&]:bg-emerald-400'
                    : 'w-1.5 bg-gray-300 [.admin-dark_&]:bg-white/20'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            className={carouselNavBtn}
            onClick={() => goToSlide(activeIndex + 1)}
            aria-label="Next panel"
          >
            <i className="fa-solid fa-chevron-right text-[0.55rem]" aria-hidden="true" />
          </button>
          <button type="button" className={carouselLinkBtn} onClick={activeSlide.onAction}>
            {activeSlide.actionLabel}
          </button>
        </div>
      }
    >
      <div
        className="relative overflow-hidden touch-pan-y"
        style={{ height: `${INSIGHTS_PANEL_HEIGHT_PX}px` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex h-full transition-transform duration-500 ease-in-out will-change-transform"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="flex h-full w-full shrink-0 flex-col overflow-hidden px-0.5"
              aria-hidden={slide.id !== activeSlide.id}
            >
              {slide.content}
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  );
}

function RecentOrdersPanel({ loading, orders, filterLabel, linkBtn, onViewAll, onViewOrder }) {
  const title = filterLabel && filterLabel !== 'all' ? `Recent Orders · ${filterLabel}` : 'Recent Orders';

  return (
    <CardShell
      title={title}
      className="!p-3 [&>div:first-child]:!mb-2"
      action={
        <button type="button" className={linkBtn} onClick={onViewAll}>
          View all orders
        </button>
      }
    >
      <div
        className="overflow-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-deepGreen/15 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar]:w-1"
        style={{ height: `${INSIGHTS_PANEL_HEIGHT_PX}px` }}
      >
        <table className="w-full text-left text-[0.78rem]">
          <thead className="sticky top-0 z-[1] bg-white dark:bg-[#1a2421] [.admin-dark_&]:bg-[#1a2421]">
            <tr className="border-b border-gray-100 text-[0.68rem] font-extrabold uppercase tracking-wider text-gray-400 dark:border-white/10 [.admin-dark_&]:border-white/10">
              <th className="pb-1.5 pr-2">Customer</th>
              <th className="pb-1.5 pr-2">Order ID</th>
              <th className="pb-1.5 pr-2">Status</th>
              <th className="pb-1.5 pr-2">Payment</th>
              <th className="pb-1.5 pr-2">Amount</th>
              <th className="pb-1.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-gray-400">
                  <i className="fa-solid fa-spinner fa-spin me-2" aria-hidden="true" />
                  Loading orders…
                </td>
              </tr>
            )}
            {!loading && orders.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-[0.8rem] text-gray-400">
                  {filterLabel && filterLabel !== 'all'
                    ? `No orders match the ${filterLabel} filter.`
                    : 'No recent orders.'}
                </td>
              </tr>
            )}
            {!loading &&
              orders.map((order) => {
                const status = getOrderStatusLabel(order);
                const payment = getOrderPaymentLabel(order);
                return (
                  <tr
                    key={order.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onViewOrder(order.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onViewOrder(order.id);
                      }
                    }}
                    className="group cursor-pointer border-b border-gray-50 transition-colors last:border-0 hover:bg-deepGreen/[0.04] dark:border-white/5 dark:hover:bg-white/[0.04] [.admin-dark_&]:border-white/5 [.admin-dark_&]:hover:bg-white/[0.04]"
                  >
                    <td className="py-1.5 pr-2">
                      <div className="flex items-center gap-1.5">
                        <CustomerAvatar name={order.customer} />
                        <span className={`max-w-[88px] truncate font-semibold text-gray-900 ${ADM_DARK_TEXT_BODY}`}>
                          {order.customer}
                        </span>
                      </div>
                    </td>
                    <td className="py-1.5 pr-2 font-mono text-[0.72rem] font-bold text-emerald-700 [.admin-dark_&]:text-emerald-400">
                      {order.id}
                    </td>
                    <td className="py-1.5 pr-2">
                      <span
                        className={`inline-block rounded-md px-1.5 py-0.5 text-[0.64rem] font-bold ${statusBadgeClass(status)}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="py-1.5 pr-2">
                      <span
                        className={`inline-block rounded-md px-1.5 py-0.5 text-[0.64rem] font-bold ${paymentBadgeClass(payment)}`}
                      >
                        {payment}
                      </span>
                    </td>
                    <td className={`py-1.5 pr-2 font-bold text-gray-900 ${ADM_DARK_TEXT_BODY}`}>
                      {order.amount}
                    </td>
                    <td className="py-1.5">
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 transition group-hover:text-deepGreen [.admin-dark_&]:text-gray-500"
                        aria-hidden="true"
                      >
                        <i className="fa-regular fa-eye" />
                      </span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </CardShell>
  );
}

export default function DashboardAdminTab({ headerSearch = '', onTabChange, userRole = 'admin' }) {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [salesRange, setSalesRange] = useState(() => getDashboardSalesRange());
  const [refreshMs, setRefreshMs] = useState(() => getDashboardRefreshMs());
  const [defaultTopProductsRange, setDefaultTopProductsRange] = useState(() => getDashboardTopProductsRange());
  const [modalOrder, setModalOrder] = useState(null);
  const [supportModalTicketId, setSupportModalTicketId] = useState(null);
  const [supportModalPreview, setSupportModalPreview] = useState(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [themeTick, setThemeTick] = useState(0);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const loadDashboard = useCallback(async ({ quiet = false } = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      if (!quiet) {
        setLoading(false);
        setOrdersLoading(false);
      }
      return;
    }
    if (!quiet) setLoading(true);
    if (!quiet) setOrdersLoading(true);

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    try {
      const statsRes = await fetchWithTimeout(
        apiUrl('/api/admin/dashboard-stats'),
        { headers },
        ADMIN_FETCH_TIMEOUT
      );
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      } else if (!quiet) {
        showTopFloatNotification(statsData.message || 'Failed to load dashboard stats.', 'warning');
      }
    } catch (err) {
      console.warn('Dashboard stats failed:', err);
      if (!quiet) {
        showTopFloatNotification(
          'Dashboard stats timed out. Check that the backend is running on port 5000.',
          'warning'
        );
      }
    } finally {
      if (!quiet) setLoading(false);
    }

    Promise.allSettled([
      fetchWithTimeout(apiUrl('/api/orders?limit=40'), { headers }, DASHBOARD_SECONDARY_TIMEOUT).then((r) =>
        r.json()
      ),
      fetchWithTimeout(apiUrl('/api/support/admin/chats'), { headers }, DASHBOARD_SECONDARY_TIMEOUT).then((r) =>
        r.json()
      ),
    ]).then(([ordersResult, supportResult]) => {
      if (ordersResult.status === 'fulfilled' && ordersResult.value?.success) {
        setOrders(ordersResult.value.orders || []);
      }
      if (supportResult.status === 'fulfilled' && supportResult.value?.success) {
        const sorted = (supportResult.value.tickets || []).sort(
          (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
        );
        setTickets(sorted);
      }
      setOrdersLoading(false);
    });
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const onInvalidate = () => loadDashboard({ quiet: true });
    window.addEventListener('admin-dashboard-invalidate', onInvalidate);
    return () => window.removeEventListener('admin-dashboard-invalidate', onInvalidate);
  }, [loadDashboard]);

  useEffect(() => {
    const syncPrefs = () => {
      setRefreshMs(getDashboardRefreshMs());
      setSalesRange(getDashboardSalesRange());
      setDefaultTopProductsRange(getDashboardTopProductsRange());
    };
    window.addEventListener('admin-settings-invalidate', syncPrefs);
    return () => window.removeEventListener('admin-settings-invalidate', syncPrefs);
  }, []);

  useEffect(() => {
    const onTheme = () => setThemeTick((n) => n + 1);
    window.addEventListener(ADMIN_THEME_EVENT, onTheme);
    return () => window.removeEventListener(ADMIN_THEME_EVENT, onTheme);
  }, []);

  useIntervalWhenVisible(
    () => {
      if (refreshMs) loadDashboard({ quiet: true });
    },
    refreshMs || 0,
    Boolean(refreshMs)
  );

  const handleSalesRangeChange = useCallback((nextRange) => {
    setSalesRange(nextRange);
    try {
      localStorage.setItem(ADMIN_SETTINGS_KEYS.dashboardSalesRange, nextRange);
    } catch {
      // ignore quota errors
    }
  }, []);

  const salesChartData = useMemo(
    () => filterSalesChartData(stats, orders, salesRange),
    [stats, orders, salesRange]
  );

  useEffect(() => {
    if (!chartRef.current || !window.Chart) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    if (salesChartData.isEmpty) return;

    const { labels: chartLabels, values: chartData } = salesChartData;
    const maxSale = Math.max(...chartData, 0);
    const suggestedMax = maxSale > 0 ? Math.ceil(maxSale * 1.25 * 100) / 100 : 1;

    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [buildSalesChartDataset(chartData)],
      },
      options: buildSalesChartOptions(suggestedMax),
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [salesChartData, themeTick]);

  const dashQuery = headerSearch.toLowerCase().trim();

  const dashboardStatusCounts = useMemo(() => {
    const counts = {
      pending: 0,
      processing: 0,
      delivered: 0,
      cancelled: 0,
      paid: 0,
    };
    orders.forEach((order) => {
      const status = getOrderStatusLabel(order);
      const payment = getOrderPaymentLabel(order);
      if (status === 'Pending') counts.pending += 1;
      else if (status === 'Processing' || status === 'Shipped') counts.processing += 1;
      else if (status === 'Delivered') counts.delivered += 1;
      else if (status === 'Cancelled') counts.cancelled += 1;
      if (payment === 'Paid') counts.paid += 1;
    });
    return counts;
  }, [orders]);

  const recentOrders = useMemo(() => {
    let list = orders.slice();
    if (orderStatusFilter !== 'all') {
      if (orderStatusFilter === 'Paid') {
        list = list.filter((order) => getOrderPaymentLabel(order) === 'Paid');
      } else {
        list = list.filter((order) => getOrderStatusLabel(order) === orderStatusFilter);
      }
    }
    if (dashQuery) {
      list = list.filter((order) => {
        const status = getOrderStatusLabel(order);
        const payment = getOrderPaymentLabel(order);
        return [order.id, order.customer, order.amount, order.date, status, payment].some((v) =>
          String(v || '').toLowerCase().includes(dashQuery)
        );
      });
    }
    const limit = orderStatusFilter === 'all' ? 5 : 20;
    return list.slice(0, limit);
  }, [orders, dashQuery, orderStatusFilter]);

  const recentTickets = useMemo(() => {
    let list = tickets.slice();
    if (dashQuery) {
      list = list.filter((tkt) => {
        const name = tkt.name || 'Anonymous';
        const msgSnippet = tkt.lastMessageText || tkt.subject || '';
        return [tkt.id, name, msgSnippet, tkt.status, tkt.subject].some((v) =>
          String(v || '').toLowerCase().includes(dashQuery)
        );
      });
    }
    return list;
  }, [tickets, dashQuery]);

  const revenueDisplay = stats
    ? `$${Number(stats.revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—';

  const salesRangeLabel = SALES_RANGE_OPTIONS.find((o) => o.id === salesRange)?.label || 'All Time';
  const periodRevenueDisplay = loading
    ? '…'
    : salesRange === 'all' && stats?.revenue != null
      ? `$${Number(stats.revenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : formatChartCurrency(salesChartData.total);

  const statusCounts =
    orders.length > 0
      ? dashboardStatusCounts
      : {
          pending: stats?.orderStatusCounts?.pending ?? 0,
          processing: stats?.orderStatusCounts?.processing ?? 0,
          delivered: stats?.orderStatusCounts?.delivered ?? 0,
          cancelled: stats?.orderStatusCounts?.cancelled ?? 0,
          paid: 0,
        };

  const handleDashboardOrderFilter = useCallback((status) => {
    setOrderStatusFilter((prev) => (prev === status ? 'all' : status));
  }, []);

  const handleQuickAction = useCallback((actionId) => {
    if (actionId === 'add-product') {
      window.openAddProductModal?.();
    }
  }, []);

  const handleViewOrder = (orderId) => {
    const found = orders.find((o) => o.id === orderId);
    if (found) {
      setModalOrder(found);
      return;
    }
    showTopFloatNotification('Order not found.', 'warning');
  };

  const handleOpenTicket = (tkt) => {
    setSupportModalPreview(tkt);
    setSupportModalTicketId(tkt.id);
  };

  const handleDashboardRefresh = useCallback(() => {
    loadDashboard({ quiet: true });
  }, [loadDashboard]);

  const goToStockProduct = useCallback(
    (product) => {
      if (!product) return;
      onTabChange?.('stock');
      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('admin-stock-filter', {
            detail: { productId: product.id, title: product.title },
          })
        );
      }, 50);
    },
    [onTabChange]
  );

  const goToProductsItem = useCallback(
    (product) => {
      if (!product) return;
      onTabChange?.('products');
      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('admin-products-filter', {
            detail: { productId: product.id, title: product.title },
          })
        );
      }, 50);
    },
    [onTabChange]
  );

  const topProductsByPeriod = useMemo(
    () =>
      mergeTopProductsByPeriod(
        stats?.topProductsByPeriod ?? {
          all: stats?.topProducts ?? [],
          week: stats?.topProducts ?? [],
          month: stats?.topProducts ?? [],
          year: stats?.topProducts ?? [],
        },
        orders
      ),
    [stats, orders]
  );
  const insightsLoading = loading || ordersLoading;
  const lowStockProducts = stats?.lowStockProducts ?? [];
  const lowStockCount = stats?.lowStockCount ?? 0;

  const linkBtn = `text-[0.78rem] font-bold text-blue-500 transition hover:text-blue-600 ${ADM_DARK_LINK}`;

  return (
    <div className="animate-cardRise space-y-2">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <StatCard
          label="Orders"
          value={loading ? '…' : (stats?.totalOrders ?? 0).toLocaleString()}
          trend={stats?.trends?.orders}
          trendEnabled={isTrendReliable('orders', stats)}
          icon="fa-bag-shopping"
          iconWrapClass="bg-emerald-500/10 text-emerald-600"
          onClick={() => onTabChange?.('orders')}
        />
        <StatCard
          label="Users"
          value={loading ? '…' : (stats?.totalUsers ?? 0).toLocaleString()}
          trend={userRole === 'staff' ? null : stats?.trends?.users}
          trendEnabled={userRole !== 'staff' && isTrendReliable('users', stats)}
          icon="fa-user-group"
          iconWrapClass="bg-blue-500/10 text-blue-600"
          onClick={userRole === 'staff' ? undefined : () => onTabChange?.('users')}
        />
        <StatCard
          label="Revenue"
          value={periodRevenueDisplay}
          hint={`${salesRangeLabel} · Total ${revenueDisplay}`}
          trend={userRole === 'staff' ? null : stats?.trends?.revenue}
          trendEnabled={userRole !== 'staff' && isTrendReliable('revenue', stats)}
          icon="fa-dollar-sign"
          iconWrapClass="bg-gold/15 text-gold"
          onClick={userRole === 'staff' ? undefined : () => onTabChange?.('payments')}
        />
        <StatCard
          label="Products"
          value={loading ? '…' : (stats?.totalProducts ?? 0).toLocaleString()}
          trend={null}
          icon="fa-couch"
          iconWrapClass="bg-emerald-500/10 text-emerald-600"
          onClick={() => onTabChange?.('products')}
        />
      </div>

      <DashboardToolbar
        loading={loading}
        statusCounts={statusCounts}
        activeFilter={orderStatusFilter}
        onQuickAction={handleQuickAction}
        onStatusFilter={handleDashboardOrderFilter}
      />

      {/* Chart + Support */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <CardShell
            title="Sales Overview"
            className="h-full !p-3 [&>div:first-child]:!mb-2"
            action={
              <SalesRangeSelect value={salesRange} onChange={handleSalesRangeChange} />
            }
          >
            <div
              className="relative w-full px-1 pb-1 pt-1"
              style={{ height: `${INSIGHTS_PANEL_HEIGHT_PX}px` }}
            >
              {salesChartData.isEmpty ? (
                <p className={`flex h-full items-center justify-center text-[0.78rem] text-gray-400 ${ADM_DARK_TEXT_MUTED}`}>
                  No sales in this period
                </p>
              ) : (
              <canvas ref={chartRef} />
              )}
            </div>
          </CardShell>
        </div>
        <div className="lg:col-span-4">
          <CardShell
            title="Support Requests"
            className="flex h-full flex-col !p-3 [&>div:first-child]:!mb-2"
            action={
              <button type="button" className={linkBtn} onClick={() => onTabChange?.('support')}>
                View all
              </button>
            }
          >
            {loading && (
              <div
                className={`flex items-center justify-center gap-2 text-[0.8rem] text-gray-400 ${ADM_DARK_TEXT_MUTED}`}
                style={{ height: `${INSIGHTS_PANEL_HEIGHT_PX}px` }}
              >
                <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
                Loading…
              </div>
            )}
            {!loading && recentTickets.length === 0 && (
              <p
                className={`flex items-center justify-center text-center text-[0.8rem] text-gray-400 ${ADM_DARK_TEXT_MUTED}`}
                style={{ height: `${INSIGHTS_PANEL_HEIGHT_PX}px` }}
              >
                No support requests.
              </p>
            )}
            {!loading && recentTickets.length > 0 && (
              <div
                className="overflow-y-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-deepGreen/15 [&::-webkit-scrollbar]:w-1"
                style={{ height: `${INSIGHTS_PANEL_HEIGHT_PX}px` }}
              >
                <div className={`divide-y divide-gray-100 ${ADM_DARK_DIVIDE}`}>
                {recentTickets.map((tkt) => {
                  const name = tkt.name || 'Anonymous';
                  const msgSnippet = tkt.lastMessageText || tkt.subject || 'No messages';
                  return (
                    <button
                      key={tkt.id}
                      type="button"
                        onClick={() => handleOpenTicket(tkt)}
                        className="group flex w-full cursor-pointer items-center justify-between gap-2 px-1 py-2.5 text-left transition hover:bg-deepGreen/[0.04] dark:hover:bg-white/[0.04] [.admin-dark_&]:hover:bg-white/[0.04]"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                          <SupportAvatar name={name} avatar={tkt.avatar} />
                        <div className="min-w-0">
                            <span className={`block truncate text-[0.78rem] font-bold text-gray-900 ${ADM_DARK_TEXT_BODY}`}>
                            {name}
                          </span>
                            <span className={`block max-w-[150px] truncate text-[0.7rem] text-gray-500 ${ADM_DARK_TEXT_MUTED}`}>
                            {msgSnippet}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-end">
                          <span className={`mb-0.5 block text-[0.68rem] font-medium text-gray-400 ${ADM_DARK_TEXT_MUTED}`}>
                          {formatRelativeTime(tkt.lastMessageAt)}
                        </span>
                        <SupportStatusBadge status={tkt.status} />
                      </div>
                    </button>
                  );
                })}
                </div>
              </div>
            )}
          </CardShell>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-5">
          <ProductsInsightsCarousel
            loading={insightsLoading}
            topProductsByPeriod={topProductsByPeriod}
            lowStockProducts={lowStockProducts}
            lowStockCount={lowStockCount}
            onViewProducts={() => onTabChange?.('products')}
            onViewStock={() => onTabChange?.('stock')}
            onTopProductClick={goToProductsItem}
            onLowStockProductClick={goToStockProduct}
            defaultTopProductsRange={defaultTopProductsRange}
          />
        </div>
        <div className="lg:col-span-7">
          <RecentOrdersPanel
            loading={loading}
            orders={recentOrders}
            filterLabel={orderStatusFilter}
            linkBtn={linkBtn}
            onViewAll={() => onTabChange?.('orders')}
            onViewOrder={handleViewOrder}
          />
        </div>
      </div>

      <OrderEditModal
        open={Boolean(modalOrder)}
        order={modalOrder}
        onClose={() => setModalOrder(null)}
        onSaved={handleDashboardRefresh}
      />

      <DashboardSupportModal
        open={Boolean(supportModalTicketId)}
        ticketId={supportModalTicketId}
        ticketPreview={supportModalPreview}
        onClose={() => {
          setSupportModalTicketId(null);
          setSupportModalPreview(null);
        }}
        onUpdated={handleDashboardRefresh}
      />
    </div>
  );
}
