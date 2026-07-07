/**
 * ADMIN USERS TAB — customer accounts list, edit & activity modals (Tailwind)
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiUrl, fetchWithTimeout } from '../../utils/data';
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
  ADMIN_FETCH_TIMEOUT,
  authHeaders,
  formatLastLogin,
  formatActivityLabel,
  formatActivityIcon,
} from './adminShared.js';

const ROLE_LABELS = { user: 'Customer', delivery: 'Driver', admin: 'Admin' };

const AVATAR_PHOTOS = [
  { match: 'abdi hassan', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
  { match: 'hodan ali', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
  { match: 'ayan abdullahi', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' },
  { match: 'mustafa omar', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
  { match: 'mohamed yusuf', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150' },
  { match: 'omar mohamed', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150' },
];

const EMPTY_EDIT_FORM = {
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'user',
  isActive: true,
};

function fullName(user) {
  return `${user.firstName || ''} ${user.lastName || ''}`.trim();
}

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

function avatarUrl(name) {
  const lower = name.toLowerCase();
  const hit = AVATAR_PHOTOS.find((p) => lower.includes(p.match));
  return hit?.url || null;
}

function UserAvatar({ user, size = 36 }) {
  const name = fullName(user);
  const photo = avatarUrl(name);
  const sz = `${size}px`;

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className="shrink-0 rounded-full object-cover"
        style={{ width: sz, height: sz }}
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-deepGreen text-[0.76rem] font-bold text-white"
      style={{ width: sz, height: sz }}
      aria-hidden="true"
    >
      {initials(name) || '?'}
    </div>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-block rounded-md px-2.5 py-1 text-[0.72rem] font-bold ${
        active
          ? 'bg-emerald-100 text-emerald-700 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300'
          : 'bg-red-100 text-red-600 [.admin-dark_&]:bg-red-500/15 [.admin-dark_&]:text-red-300'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

/* ═══ EDIT USER MODAL ═══ */

function EditUserModal({ open, title, form, saving, onChange, onClose, onSubmit }) {
  if (!open) return null;

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
          <h3 className="font-display text-xl font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">{title}</h3>
          <button
            type="button"
            className="text-2xl text-gray-500 hover:text-gray-800 [.admin-dark_&]:text-gray-400 [.admin-dark_&]:hover:text-gray-200"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form className="space-y-3 p-5" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={ADM_LABEL} htmlFor="admUserFirstName">
                First Name
              </label>
              <input
                id="admUserFirstName"
                className={ADM_INPUT}
                required
                value={form.firstName}
                onChange={(e) => onChange('firstName', e.target.value)}
              />
            </div>
            <div>
              <label className={ADM_LABEL} htmlFor="admUserLastName">
                Last Name
              </label>
              <input
                id="admUserLastName"
                className={ADM_INPUT}
                value={form.lastName}
                onChange={(e) => onChange('lastName', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={ADM_LABEL} htmlFor="admUserEmail">
              Email
            </label>
            <input
              id="admUserEmail"
              type="email"
              className={ADM_INPUT}
              required
              value={form.email}
              onChange={(e) => onChange('email', e.target.value)}
            />
          </div>

          <div>
            <label className={ADM_LABEL} htmlFor="admUserPhone">
              Phone
            </label>
            <input
              id="admUserPhone"
              type="tel"
              className={ADM_INPUT}
              required
              value={form.phone}
              onChange={(e) => onChange('phone', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={ADM_LABEL} htmlFor="admUserRole">
                Role
              </label>
              <select
                id="admUserRole"
                className={ADM_SELECT}
                required
                value={form.role}
                onChange={(e) => onChange('role', e.target.value)}
              >
                <option value="user">Customer</option>
                <option value="delivery">Driver</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className={ADM_LABEL} htmlFor="admUserStatus">
                Account Status
              </label>
              <select
                id="admUserStatus"
                className={ADM_SELECT}
                required
                value={form.isActive ? 'true' : 'false'}
                onChange={(e) => onChange('isActive', e.target.value === 'true')}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className={BTN_GHOST} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={BTN_PRIMARY} disabled={saving}>
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" /> Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══ VIEW USER / ACTIVITY MODAL ═══ */

function ViewUserModal({ open, loading, error, data, onClose }) {
  if (!open) return null;

  const user = data?.user;
  const stats = data?.stats || {};
  const activities = data?.activities || [];
  const recentOrders = data?.recentOrders || [];
  const name = user ? fullName(user) : '';
  const isActive = user?.isActive !== false;

  return (
    <div
      className="fixed inset-0 z-[1060] flex items-center justify-center bg-deepGreen/45 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-[0_25px_60px_rgba(0,0,0,0.22)] [.admin-dark_&]:bg-[#1a2421]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
          <h3 className="font-display text-xl font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
            {loading ? 'Customer Activity' : `Customer Activity — ${name}`}
          </h3>
          <button
            type="button"
            className="text-2xl text-gray-500 hover:text-gray-800 [.admin-dark_&]:text-gray-400 [.admin-dark_&]:hover:text-gray-200"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-5">
          {loading && (
            <div className="py-8 text-center text-gray-500 [.admin-dark_&]:text-gray-400">
              <i className="fa-solid fa-spinner fa-spin me-2" />
              Loading customer activity…
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-[0.88rem] font-semibold text-red-700 [.admin-dark_&]:text-red-300">
              {error}
            </div>
          )}

          {!loading && !error && user && (
            <>
              <div className="mb-4 grid gap-3 md:grid-cols-2">
                <div className="h-full rounded-xl border border-gray-100 p-4 [.admin-dark_&]:border-white/10">
                  <div className="mb-2 text-[0.72rem] font-extrabold uppercase tracking-wide text-gray-500">
                    Profile
                  </div>
                  <div className="mb-1 font-bold text-gray-900 [.admin-dark_&]:text-gray-100">{name}</div>
                  <div className="text-[0.84rem] text-gray-600 [.admin-dark_&]:text-gray-400">{user.email}</div>
                  <div className="text-[0.84rem] text-gray-600 [.admin-dark_&]:text-gray-400">
                    {user.phone || '—'}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-block rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-[0.78rem] font-bold text-gray-700 [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-white/5 [.admin-dark_&]:text-gray-300">
                      {ROLE_LABELS[user.role] || user.role}
                    </span>
                    <StatusBadge active={isActive} />
                  </div>
                </div>

                <div className="h-full rounded-xl border border-gray-100 p-4 [.admin-dark_&]:border-white/10">
                  <div className="mb-2 text-[0.72rem] font-extrabold uppercase tracking-wide text-gray-500">
                    Stats
                  </div>
                  <div className="mb-2 flex justify-between text-[0.88rem]">
                    <span className="text-gray-600 [.admin-dark_&]:text-gray-400">Total Orders</span>
                    <span className="font-bold text-gray-900 [.admin-dark_&]:text-gray-100">
                      {stats.totalOrders || 0}
                    </span>
                  </div>
                  <div className="mb-2 flex justify-between text-[0.88rem]">
                    <span className="text-gray-600 [.admin-dark_&]:text-gray-400">Total Spent</span>
                    <span className="font-bold text-gray-900 [.admin-dark_&]:text-gray-100">
                      ${Number(stats.totalSpent || 0).toFixed(3)}
                    </span>
                  </div>
                  <div className="mb-2 flex justify-between text-[0.88rem]">
                    <span className="text-gray-600 [.admin-dark_&]:text-gray-400">Last Login</span>
                    <span className="font-semibold text-gray-800 [.admin-dark_&]:text-gray-200">
                      {formatLastLogin(user.lastLoginAt)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[0.88rem]">
                    <span className="text-gray-600 [.admin-dark_&]:text-gray-400">Joined</span>
                    <span className="font-semibold text-gray-800 [.admin-dark_&]:text-gray-200">
                      {user.joinedDate || '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="mb-3 text-[0.95rem] font-bold text-gray-900 [.admin-dark_&]:text-gray-100">
                  <i className="fa-solid fa-clock-rotate-left me-2 text-deepGreen" />
                  Recent Activity
                </h4>
                {activities.length === 0 ? (
                  <p className="mb-0 text-[0.88rem] text-gray-500 [.admin-dark_&]:text-gray-400">
                    No activity recorded yet for this customer.
                  </p>
                ) : (
                  <div className="space-y-0">
                    {activities.map((item, idx) => (
                      <div
                        key={item.id || `${item.action}-${idx}`}
                        className="flex gap-3 border-b border-gray-100 py-3 last:border-b-0 [.admin-dark_&]:border-white/10"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-deepGreen/10 text-deepGreen">
                          <i className={`fa-solid ${formatActivityIcon(item.action)}`} />
                        </div>
                        <div>
                          <div className="text-[0.88rem] font-semibold text-gray-900 [.admin-dark_&]:text-gray-100">
                            {formatActivityLabel(item.action)}
                          </div>
                          {item.description && (
                            <div className="text-[0.8rem] text-gray-600 [.admin-dark_&]:text-gray-400">
                              {item.description}
                            </div>
                          )}
                          <div className="text-[0.74rem] text-gray-500 [.admin-dark_&]:text-gray-500">
                            {formatLastLogin(item.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="mb-3 text-[0.95rem] font-bold text-gray-900 [.admin-dark_&]:text-gray-100">
                  <i className="fa-solid fa-receipt me-2 text-deepGreen" />
                  Recent Orders
                </h4>
                {recentOrders.length === 0 ? (
                  <p className="mb-0 text-[0.88rem] text-gray-500 [.admin-dark_&]:text-gray-400">
                    No orders placed yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[0.84rem]">
                      <thead>
                        <tr className="border-b border-gray-100 text-left text-[0.72rem] font-extrabold uppercase tracking-wide text-gray-500 [.admin-dark_&]:border-white/10">
                          <th className="px-3 py-2">Order</th>
                          <th className="px-3 py-2">Product</th>
                          <th className="px-3 py-2">Amount</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((order) => (
                          <tr
                            key={order.id}
                            className="border-b border-gray-100 [.admin-dark_&]:border-white/10"
                          >
                            <td className="px-3 py-2 font-semibold text-gray-900 [.admin-dark_&]:text-gray-100">
                              {order.id}
                            </td>
                            <td className="px-3 py-2 text-gray-700 [.admin-dark_&]:text-gray-300">
                              {order.product || '—'}
                            </td>
                            <td className="px-3 py-2 font-medium text-gray-800 [.admin-dark_&]:text-gray-200">
                              ${Number(order.amount || 0).toFixed(3)}
                            </td>
                            <td className="px-3 py-2">
                              <span className="inline-block rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[0.78rem] font-bold text-gray-700 [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-white/5 [.admin-dark_&]:text-gray-300">
                                {order.status || '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ MAIN TAB ═══ */

export default function AdminUsersTab({ headerSearch = '' }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState('');
  const [actingId, setActingId] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [editTitle, setEditTitle] = useState('Edit User Account');
  const [saving, setSaving] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState('');
  const [viewData, setViewData] = useState(null);

  const searchQuery = (headerSearch || localSearch).toLowerCase().trim();

  const loadUsers = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetchWithTimeout(
        apiUrl('/api/auth/users'),
        { headers: authHeaders(false) },
        ADMIN_FETCH_TIMEOUT
      );
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        try {
          localStorage.setItem('adminUsers', JSON.stringify(data.users || []));
        } catch {
          /* ignore quota errors */
        }
      } else {
        showTopFloatNotification(data.message || 'Failed to load users.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not connect to the server. Try again.', 'danger');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const onInvalidate = () => loadUsers({ quiet: true });
    window.addEventListener('admin-users-invalidate', onInvalidate);
    return () => window.removeEventListener('admin-users-invalidate', onInvalidate);
  }, [loadUsers]);

  const filtered = useMemo(() => {
    const customersOnly = users.filter((u) => u.email?.toLowerCase() !== 'admin@gmail.com');

    const matched = customersOnly.filter((u) => {
      if (!searchQuery) return true;
      const name = fullName(u).toLowerCase();
      return (
        name.includes(searchQuery) ||
        u.email?.toLowerCase().includes(searchQuery) ||
        (u.phone && u.phone.includes(searchQuery)) ||
        String(u.id).includes(searchQuery)
      );
    });

    return [...matched].sort((a, b) => {
      const nameA = fullName(a).toLowerCase();
      const nameB = fullName(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [users, searchQuery]);

  const openView = async (userId) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewError('');
    setViewData(null);

    try {
      const res = await fetchWithTimeout(
        apiUrl(`/api/auth/users/${userId}/details`),
        { headers: authHeaders(false) },
        ADMIN_FETCH_TIMEOUT
      );
      const data = await res.json();
      if (data.success) {
        setViewData(data);
      } else {
        setViewError(data.message || 'Failed to load user details.');
      }
    } catch {
      setViewError('An error occurred while loading customer details.');
    } finally {
      setViewLoading(false);
    }
  };

  const openEdit = (customer) => {
    setEditForm({
      id: customer.id,
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      role: customer.role || 'user',
      isActive: customer.isActive !== false,
    });
    setEditTitle(`Edit User: ${fullName(customer)}`);
    setEditOpen(true);
  };

  const handleEditChange = (field, value) => {
    setEditForm((f) => ({ ...f, [field]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      firstName: editForm.firstName.trim(),
      lastName: editForm.lastName.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim(),
      role: editForm.role,
      isActive: editForm.isActive,
    };

    try {
      const res = await fetch(apiUrl(`/api/auth/users/${editForm.id}`), {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('User account updated successfully!');
        setEditOpen(false);
        loadUsers({ quiet: true });
        window.dispatchEvent(new CustomEvent('admin-users-invalidate'));
      } else {
        showTopFloatNotification(data.message || 'Request failed.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not connect to the server. Try again.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (customer) => {
    const nextActive = customer.isActive === false;
    const actionLabel = nextActive ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${actionLabel} '${fullName(customer)}'?`)) return;

    setActingId(customer.id);
    try {
      const res = await fetch(apiUrl(`/api/auth/users/${customer.id}`), {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ isActive: nextActive }),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification(
          `User account ${nextActive ? 'activated' : 'deactivated'} successfully.`
        );
        loadUsers({ quiet: true });
        window.dispatchEvent(new CustomEvent('admin-users-invalidate'));
      } else {
        showTopFloatNotification(data.message || 'Request failed.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not connect to the server. Try again.', 'danger');
    } finally {
      setActingId('');
    }
  };

  const handleDelete = async (customer) => {
    if (!window.confirm(`Are you sure you want to delete customer account '${fullName(customer)}'?`)) {
      return;
    }

    setActingId(customer.id);
    try {
      const res = await fetch(apiUrl(`/api/auth/users/${customer.id}`), {
        method: 'DELETE',
        headers: authHeaders(false),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('Customer account deleted successfully.');
        loadUsers({ quiet: true });
        window.dispatchEvent(new CustomEvent('admin-users-invalidate'));
      } else {
        showTopFloatNotification(data.message || 'Request failed.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not connect to the server. Try again.', 'danger');
    } finally {
      setActingId('');
    }
  };

  return (
    <div className="animate-cardRise">
      <div className={ADM_TABLE_CARD}>
        <div className="mb-4">
          <AppSearchField
            value={localSearch || headerSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search customer accounts..."
            className="max-w-[320px]"
          />
        </div>

        <div className="max-h-[480px] overflow-x-auto overflow-y-auto rounded-xl border border-black/5 [.admin-dark_&]:border-white/10">
          <table className={ADM_TABLE}>
            <thead className="sticky top-0 z-[5] bg-white [.admin-dark_&]:bg-[#1a2421]">
              <tr>
                <th>User</th>
                <th>Email / Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Orders</th>
                <th>Last Login</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    <i className="fa-solid fa-spinner fa-spin me-2" />
                    Loading customers…
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No customer accounts registered yet.
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((customer) => {
                  const name = fullName(customer);
                  const isActive = customer.isActive !== false;
                  const busy = actingId === customer.id;

                  return (
                    <tr key={customer.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <UserAvatar user={customer} />
                          <span className="text-[0.84rem] font-bold text-gray-900 [.admin-dark_&]:text-gray-100">
                            {name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="text-[0.84rem] font-semibold text-gray-800 [.admin-dark_&]:text-gray-200">
                          {customer.email}
                        </div>
                        <div className="text-[0.74rem] text-gray-500 [.admin-dark_&]:text-gray-400">
                          {customer.phone || '---'}
                        </div>
                      </td>
                      <td className="text-[0.84rem] text-gray-600 [.admin-dark_&]:text-gray-400">
                        {ROLE_LABELS[customer.role] || 'Customer'}
                      </td>
                      <td>
                        <StatusBadge active={isActive} />
                      </td>
                      <td className="text-[0.84rem] text-gray-600 [.admin-dark_&]:text-gray-400">
                        {customer.orderCount || 0}
                      </td>
                      <td className="text-[0.84rem] text-gray-600 [.admin-dark_&]:text-gray-400">
                        {formatLastLogin(customer.lastLoginAt)}
                      </td>
                      <td className="text-[0.84rem] text-gray-600 [.admin-dark_&]:text-gray-400">
                        {customer.joinedDate || 'May 20, 2026'}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="border-0 bg-transparent p-0 text-[0.95rem] text-deepGreen hover:text-teal disabled:opacity-50"
                            title="View Activity"
                            disabled={busy}
                            onClick={() => openView(customer.id)}
                          >
                            <i className="fa-regular fa-eye" />
                          </button>
                          <button
                            type="button"
                            className="border-0 bg-transparent p-0 text-[0.95rem] text-gray-600 hover:text-gray-800 disabled:opacity-50 [.admin-dark_&]:text-gray-400 [.admin-dark_&]:hover:text-gray-200"
                            title="Edit Account"
                            disabled={busy}
                            onClick={() => openEdit(customer)}
                          >
                            <i className="fa-regular fa-pen-to-square" />
                          </button>
                          <button
                            type="button"
                            className={`border-0 bg-transparent p-0 text-[0.95rem] disabled:opacity-50 ${
                              isActive
                                ? 'text-amber-600 hover:text-amber-700'
                                : 'text-emerald-600 hover:text-emerald-700'
                            }`}
                            title={isActive ? 'Deactivate' : 'Activate'}
                            disabled={busy}
                            onClick={() => toggleActive(customer)}
                          >
                            <i className={`fa-solid ${isActive ? 'fa-user-slash' : 'fa-user-check'}`} />
                          </button>
                          <button
                            type="button"
                            className="border-0 bg-transparent p-0 text-[0.95rem] text-red-600 hover:text-red-700 disabled:opacity-50"
                            title="Delete Account"
                            disabled={busy}
                            onClick={() => handleDelete(customer)}
                          >
                            <i className="fa-regular fa-trash-can" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <EditUserModal
        open={editOpen}
        title={editTitle}
        form={editForm}
        saving={saving}
        onChange={handleEditChange}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
      />

      <ViewUserModal
        open={viewOpen}
        loading={viewLoading}
        error={viewError}
        data={viewData}
        onClose={() => setViewOpen(false)}
      />
    </div>
  );
}
