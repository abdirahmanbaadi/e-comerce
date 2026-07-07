import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiUrl, fetchWithTimeout } from '../../utils/data';

const ADMIN_FETCH_TIMEOUT = 8000;

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

function SupportAvatar({ name }) {
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

function TrendBadge({ trend }) {
  const formatted = formatTrend(trend);
  if (!formatted) return <span className="text-[0.72rem] font-bold text-emerald-600 [.admin-dark_&]:text-emerald-400">Live</span>;
  const { up, label } = formatted;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.72rem] font-bold ${
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

function StatCard({ label, value, trend, icon, iconWrapClass }) {
  return (
    <div className="group flex items-center justify-between gap-4 rounded-2xl border border-deepGreen/8 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#1a2421] [.admin-dark_&]:shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
      <div className="min-w-0">
        <p className="mb-1 text-[0.72rem] font-extrabold uppercase tracking-wider text-teal [.admin-dark_&]:text-teal/90">
          {label}
        </p>
        <p className="font-display text-2xl font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
          {value}
        </p>
        <div className="mt-1.5">
          <TrendBadge trend={trend} />
        </div>
      </div>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconWrapClass}`}>
        <i className={`fa-solid ${icon} text-lg`} aria-hidden="true" />
      </div>
    </div>
  );
}

function CardShell({ title, action, children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-deepGreen/8 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#1a2421] [.admin-dark_&]:shadow-[0_4px_20px_rgba(0,0,0,0.25)] ${className}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[0.9rem] font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function DashboardAdminTab({ adminName, headerSearch = '', onTabChange }) {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const dateStr = useMemo(
    () => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    []
  );

  const loadDashboard = useCallback(async ({ quiet = false } = {}) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!quiet) setLoading(true);

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    try {
      const [statsRes, ordersRes, supportRes] = await Promise.all([
        fetchWithTimeout(apiUrl('/api/admin/dashboard-stats'), { headers }, ADMIN_FETCH_TIMEOUT),
        fetchWithTimeout(apiUrl('/api/orders?limit=8'), { headers }, ADMIN_FETCH_TIMEOUT),
        fetchWithTimeout(apiUrl('/api/support/admin/chats'), { headers }, ADMIN_FETCH_TIMEOUT),
      ]);

      const [statsData, ordersData, supportData] = await Promise.all([
        statsRes.json(),
        ordersRes.json(),
        supportRes.json(),
      ]);

      if (statsData.success) setStats(statsData.stats);
      if (ordersData.success) setOrders(ordersData.orders || []);
      if (supportData.success) {
        const sorted = (supportData.tickets || []).sort(
          (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
        );
        setTickets(sorted);
      }
    } catch (err) {
      console.warn('Dashboard load failed:', err);
    } finally {
      if (!quiet) setLoading(false);
    }
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
    if (!chartRef.current || !window.Chart) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const dateMap = stats?.salesByDate ? { ...stats.salesByDate } : {};
    if (!Object.keys(dateMap).length) {
      orders.forEach((order) => {
        if (!order.date) return;
        const amount =
          typeof order.amount === 'number'
            ? order.amount
            : Number(String(order.amount || '').replace(/[\$,]/g, ''));
        dateMap[order.date] = (dateMap[order.date] || 0) + (Number.isNaN(amount) ? 0 : amount);
      });
    }

    const sortedDates = Object.keys(dateMap).sort();
    const salesValues = sortedDates.map((d) => dateMap[d]);
    const chartLabels = sortedDates.length > 0 ? sortedDates : ['No Data'];
    const chartData = salesValues.length > 0 ? salesValues : [0];

    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [
          {
            label: 'Sales Revenue ($)',
            data: chartData,
            borderColor: '#073D35',
            backgroundColor: 'rgba(7, 61, 53, 0.05)',
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#D8A128',
            pointBorderColor: '#073D35',
            pointHoverRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.03)' } },
          x: { grid: { display: false } },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [stats, orders]);

  const dashQuery = headerSearch.toLowerCase().trim();

  const recentOrders = useMemo(() => {
    let list = orders.slice();
    if (dashQuery) {
      list = list.filter((order) => {
        const status = getOrderStatusLabel(order);
        return [order.id, order.customer, order.amount, order.date, status].some((v) =>
          String(v || '').toLowerCase().includes(dashQuery)
        );
      });
    }
    return list.slice(0, 5);
  }, [orders, dashQuery]);

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
    return list.slice(0, 4);
  }, [tickets, dashQuery]);

  const apiBadgeText = stats
    ? `MongoDB · ${stats.openSupportTickets || 0} open tickets · ${stats.unreadAdminNotifications || 0} alerts`
    : 'MongoDB · syncing…';

  const revenueDisplay = stats
    ? `$${Number(stats.revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—';

  const handleViewOrder = (orderId) => {
    if (window.openOrderEditModalById) {
      window.openOrderEditModalById(orderId);
      return;
    }
    onTabChange?.('orders');
  };

  const handleOpenTicket = (ticketId) => {
    if (window.switchTab && window.selectSupportTicket) {
      window.switchTab('support').then(() => window.selectSupportTicket(ticketId));
      return;
    }
    onTabChange?.('support');
  };

  const linkBtn =
    'text-[0.78rem] font-bold text-blue-500 transition hover:text-blue-600 [.admin-dark_&]:text-blue-400 [.admin-dark_&]:hover:text-blue-300';

  return (
    <div className="animate-cardRise space-y-3">
      {/* Welcome strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-deepGreen/8 bg-gradient-to-br from-deepGreen/[0.06] to-gold/[0.08] px-5 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] [.admin-dark_&]:border-white/10 [.admin-dark_&]:from-deepGreen/20 [.admin-dark_&]:to-gold/10 [.admin-dark_&]:shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
        <div>
          <p className="mb-1 text-[0.72rem] font-extrabold uppercase tracking-wider text-teal">Dashboard Overview</p>
          <h2 className="font-display text-[1.65rem] font-bold leading-tight text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
            Welcome back, <span>{adminName}</span>
          </h2>
          <p className="mt-1 text-[0.84rem] text-gray-500 [.admin-dark_&]:text-gray-400">{dateStr}</p>
        </div>
        <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-emerald-500/12 px-3.5 py-2 text-[0.75rem] font-extrabold text-emerald-600 before:h-2 before:w-2 before:rounded-full before:bg-emerald-500 before:content-[''] [.admin-dark_&]:text-emerald-400">
          {apiBadgeText}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Orders"
          value={loading ? '…' : (stats?.totalOrders ?? 0).toLocaleString()}
          trend={stats?.trends?.orders}
          icon="fa-bag-shopping"
          iconWrapClass="bg-emerald-500/10 text-emerald-600"
        />
        <StatCard
          label="Total Users"
          value={loading ? '…' : (stats?.totalUsers ?? 0).toLocaleString()}
          trend={stats?.trends?.users}
          icon="fa-user-group"
          iconWrapClass="bg-blue-500/10 text-blue-600"
        />
        <StatCard
          label="Total Revenue"
          value={loading ? '…' : revenueDisplay}
          trend={stats?.trends?.revenue}
          icon="fa-dollar-sign"
          iconWrapClass="bg-gold/15 text-gold"
        />
        <StatCard
          label="Total Products"
          value={loading ? '…' : (stats?.totalProducts ?? 0).toLocaleString()}
          trend={null}
          icon="fa-couch"
          iconWrapClass="bg-emerald-500/10 text-emerald-600"
        />
      </div>

      {/* Chart + Support */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <CardShell title="Sales Overview" className="h-full">
            <div className="relative h-[260px] w-full">
              <canvas ref={chartRef} />
            </div>
          </CardShell>
        </div>
        <div className="lg:col-span-4">
          <CardShell
            title="Support Requests"
            className="h-full"
            action={
              <button type="button" className={linkBtn} onClick={() => onTabChange?.('support')}>
                View all
              </button>
            }
          >
            {loading && (
              <div className="flex items-center justify-center gap-2 py-8 text-[0.8rem] text-gray-400">
                <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
                Loading…
              </div>
            )}
            {!loading && recentTickets.length === 0 && (
              <p className="py-6 text-center text-[0.8rem] text-gray-400">No support requests.</p>
            )}
            {!loading && recentTickets.length > 0 && (
              <div className="divide-y divide-gray-100 [.admin-dark_&]:divide-white/10">
                {recentTickets.map((tkt) => {
                  const name = tkt.name || 'Anonymous';
                  const msgSnippet = tkt.lastMessageText || tkt.subject || 'No messages';
                  return (
                    <button
                      key={tkt.id}
                      type="button"
                      onClick={() => handleOpenTicket(tkt.id)}
                      className="flex w-full items-center justify-between gap-2 py-2.5 text-left transition hover:bg-gray-50 [.admin-dark_&]:hover:bg-white/5"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <SupportAvatar name={name} />
                        <div className="min-w-0">
                          <span className="block truncate text-[0.78rem] font-bold text-gray-900 [.admin-dark_&]:text-gray-100">
                            {name}
                          </span>
                          <span className="block max-w-[150px] truncate text-[0.7rem] text-gray-500 [.admin-dark_&]:text-gray-400">
                            {msgSnippet}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-end">
                        <span className="mb-0.5 block text-[0.68rem] font-medium text-gray-400">
                          {formatRelativeTime(tkt.lastMessageAt)}
                        </span>
                        <SupportStatusBadge status={tkt.status} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardShell>
        </div>
      </div>

      {/* Recent orders */}
      <CardShell
        title="Recent Orders"
        action={
          <button type="button" className={linkBtn} onClick={() => onTabChange?.('orders')}>
            View all orders
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[0.8rem]">
            <thead>
              <tr className="border-b border-gray-100 text-[0.72rem] font-extrabold uppercase tracking-wider text-gray-400 [.admin-dark_&]:border-white/10">
                <th className="pb-2 pr-4">Order ID</th>
                <th className="pb-2 pr-4">Customer</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Amount</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2">Actions</th>
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
              {!loading && recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[0.8rem] text-gray-400">
                    No recent orders.
                  </td>
                </tr>
              )}
              {!loading &&
                recentOrders.map((order) => {
                  const status = getOrderStatusLabel(order);
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-gray-50 last:border-0 [.admin-dark_&]:border-white/5"
                    >
                      <td className="py-2.5 pr-4 font-mono font-bold text-emerald-700 [.admin-dark_&]:text-emerald-400">
                        {order.id}
                      </td>
                      <td className="py-2.5 pr-4 font-semibold text-gray-900 [.admin-dark_&]:text-gray-100">
                        {order.customer}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[0.68rem] font-bold ${statusBadgeClass(status)}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 font-bold text-gray-900 [.admin-dark_&]:text-gray-100">
                        {order.amount}
                      </td>
                      <td className="py-2.5 pr-4 text-gray-500 [.admin-dark_&]:text-gray-400">
                        {order.date || '—'}
                      </td>
                      <td className="py-2.5">
                        <button
                          type="button"
                          onClick={() => handleViewOrder(order.id)}
                          className="text-gray-500 transition hover:text-deepGreen [.admin-dark_&]:hover:text-teal"
                          title="View Details"
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
      </CardShell>
    </div>
  );
}
