/**
 * ADMIN USERS TAB — customer accounts list, edit & activity modals (Tailwind)
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
  ADMIN_FETCH_TIMEOUT,
  authHeaders,
  formatLastLogin,
  formatActivityLabel,
  formatActivityIcon,
  formatAdminPrice,
  getOrderPaymentLabel,
  ADMIN_MODAL_OVERLAY,
  ADMIN_MODAL_PANEL,
  ADMIN_MODAL_CLOSE_BTN,
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
  const photo = user?.avatar || avatarUrl(name);
  const sz = typeof size === 'number' ? `${size}px` : size;
  const textSize = (typeof size === 'number' ? size : 36) >= 44 ? '0.8rem' : '0.72rem';

  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        className="shrink-0 rounded-full object-cover ring-2 ring-black/[0.04]"
        style={{ width: sz, height: sz }}
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-deepGreen font-bold text-white ring-2 ring-black/[0.04]"
      style={{ width: sz, height: sz, fontSize: textSize }}
      aria-hidden="true"
    >
      {initials(name) || '?'}
    </div>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-[0.68rem] font-extrabold ${
        active
          ? 'bg-emerald-100 text-emerald-700 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300'
          : 'bg-red-100 text-red-600 [.admin-dark_&]:bg-red-500/15 [.admin-dark_&]:text-red-300'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

const USERS_TABLE_MAX_HEIGHT = 'min(520px, 55vh)';

function UsersStatCard({ label, value, icon, iconWrapClass, active, onClick }) {
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

function FilterPill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-bold transition',
        active
          ? 'bg-deepGreen text-white shadow-sm [.admin-dark_&]:bg-emerald-600'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-gray-200 [.admin-dark_&]:hover:bg-white/15',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function UsersFilterToolbar({
  loading,
  filterStatus,
  filterRole,
  statusCounts,
  onStatusChange,
  onRoleChange,
  onExport,
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-deepGreen/[0.06] bg-white px-3.5 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between [.admin-dark_&]:border-white/[0.08] [.admin-dark_&]:bg-[#1a2421]">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="me-1 text-[0.65rem] font-bold uppercase tracking-wide text-gray-400">Status</span>
        {[
          { id: 'all', label: 'All', count: statusCounts.total },
          { id: 'active', label: 'Active', count: statusCounts.active },
          { id: 'inactive', label: 'Inactive', count: statusCounts.inactive },
        ].map((pill) => (
          <FilterPill key={pill.id} active={filterStatus === pill.id} onClick={() => onStatusChange(pill.id)}>
            {pill.label}
            <span
              className={`rounded-full px-1.5 py-px text-[0.62rem] ${
                filterStatus === pill.id ? 'bg-white/20' : 'bg-black/5 [.admin-dark_&]:bg-white/10'
              }`}
            >
              {loading ? '…' : pill.count}
            </span>
          </FilterPill>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="me-1 text-[0.65rem] font-bold uppercase tracking-wide text-gray-400">Role</span>
        {[
          { id: 'all', label: 'All' },
          { id: 'user', label: 'Customer' },
          { id: 'delivery', label: 'Driver' },
          { id: 'admin', label: 'Admin' },
        ].map((pill) => (
          <FilterPill key={pill.id} active={filterRole === pill.id} onClick={() => onRoleChange(pill.id)}>
            {pill.label}
          </FilterPill>
        ))}
        <button
          type="button"
          onClick={onExport}
          className="ms-1 inline-flex items-center gap-1.5 rounded-full border border-deepGreen/15 bg-deepGreen/[0.04] px-2.5 py-1 text-[0.68rem] font-bold text-deepGreen transition hover:bg-deepGreen/10 [.admin-dark_&]:border-emerald-500/20 [.admin-dark_&]:bg-emerald-500/10 [.admin-dark_&]:text-emerald-300"
        >
          <i className="fa-solid fa-download text-[0.62rem]" aria-hidden="true" />
          Export
        </button>
      </div>
    </div>
  );
}

function exportUsersToCSV(usersList) {
  let csvContent = 'data:text/csv;charset=utf-8,';
  csvContent += 'User ID,Name,Email,Phone,Role,Status,Orders,Joined\n';

  usersList.forEach((u) => {
    const id = u.id || '';
    const name = fullName(u).replace(/"/g, '""');
    const email = (u.email || '').replace(/"/g, '""');
    const phone = (u.phone || '').replace(/"/g, '""');
    const role = ROLE_LABELS[u.role] || u.role || 'Customer';
    const status = u.isActive === false ? 'Inactive' : 'Active';
    const orders = u.orderCount || 0;
    const joined = u.joinedDate || '';
    csvContent += `"${id}","${name}","${email}","${phone}","${role}","${status}","${orders}","${joined}"\n`;
  });

  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csvContent));
  link.setAttribute('download', `MMF_Users_Export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showTopFloatNotification('Users exported successfully as CSV!');
}

function ModalShell({ open, onClose, zClass = 'z-[9999]', maxWidth = 'max-w-2xl', children, labelledBy, lockScroll = true }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    if (!lockScroll) {
      return () => document.removeEventListener('keydown', onKey);
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, lockScroll]);

  if (!open || typeof document === 'undefined' || !document.body) return null;

  const isAdminDark =
    typeof document !== 'undefined' && Boolean(document.querySelector('[data-theme="dark"]'));

  return createPortal(
    <div className={isAdminDark ? 'admin-dark' : ''} data-theme={isAdminDark ? 'dark' : 'light'}>
      <div
        className={`fixed inset-0 ${zClass} flex items-center justify-center bg-deepGreen/45 p-4 backdrop-blur-[4px]`}
        onClick={onClose}
        role="presentation"
      >
        <div
          className={ADMIN_MODAL_PANEL}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
        >
          <button
            type="button"
            className={ADMIN_MODAL_CLOSE_BTN}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ═══ EDIT USER MODAL ═══ */

function EditUserModal({ open, form, saving, onChange, onClose, onSubmit }) {
  const name = `${form.firstName || ''} ${form.lastName || ''}`.trim() || 'Edit account';
  const roleLabel = ROLE_LABELS[form.role] || form.role || 'Customer';

  return (
    <ModalShell open={open} onClose={onClose} zClass="z-[10000]" labelledBy="editUserTitle" lockScroll={false}>
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
        <div className="min-w-0 pr-10">
          <h3 id="editUserTitle" className="font-display text-xl font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
            {name}
          </h3>
          <p className="mb-0 mt-1 text-[0.82rem] text-gray-500 [.admin-dark_&]:text-gray-400">{form.email || '—'}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-[0.75rem] font-extrabold text-slate-700 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-slate-200">
              {roleLabel}
            </span>
            <span
              className={`inline-flex rounded-lg px-2.5 py-1 text-[0.75rem] font-extrabold ${
                form.isActive
                  ? 'bg-emerald-100 text-emerald-700 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300'
                  : 'bg-red-100 text-red-700 [.admin-dark_&]:bg-red-500/15 [.admin-dark_&]:text-red-300'
              }`}
            >
              {form.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 [scrollbar-width:thin]">
        <form id="editUserForm" className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={ADM_LABEL} htmlFor="admUserFirstName">
                First name
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
                Last name
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

          <div className="grid gap-3 sm:grid-cols-2">
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
                {form.role === 'admin' ? <option value="admin">Admin</option> : null}
                <option value="user">Customer</option>
                <option value="delivery">Driver</option>
              </select>
              {form.role !== 'admin' ? (
                <p className="mt-1.5 text-[0.72rem] text-gray-500 [.admin-dark_&]:text-gray-400">
                  To make this user an admin, close Edit and use <strong>Promote to Admin</strong> (password required).
                </p>
              ) : null}
            </div>
            <div>
              <label className={ADM_LABEL} htmlFor="admUserStatus">
                Status
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
        </form>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
        <button type="button" className={BTN_GHOST} onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button type="submit" form="editUserForm" className={BTN_PRIMARY} disabled={saving}>
          {saving ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> Saving…
            </>
          ) : (
            'Save changes'
          )}
        </button>
      </div>
    </ModalShell>
  );
}

function PromoteAdminModal({
  open,
  user,
  password,
  configured,
  saving,
  onPasswordChange,
  onClose,
  onConfirm,
}) {
  const name = user ? fullName(user) : 'User';

  return (
    <ModalShell open={open} onClose={onClose} zClass="z-[10001]" labelledBy="promoteAdminTitle" lockScroll={false}>
      <div className="border-b border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
        <h3 id="promoteAdminTitle" className="font-display text-xl font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]">
          Promote to Admin
        </h3>
        <p className="mb-0 mt-1 text-[0.84rem] text-gray-500 [.admin-dark_&]:text-gray-400">
          {name} ({user?.email || '—'})
        </p>
      </div>

      <div className="space-y-4 p-5">
        {!configured ? (
          <div className="rounded-xl border border-amber-500/25 bg-amber-50/90 px-3 py-3 text-[0.82rem] text-amber-900 [.admin-dark_&]:border-amber-500/20 [.admin-dark_&]:bg-amber-500/10 [.admin-dark_&]:text-amber-100">
            Admin promotion password is not set. Go to <strong>Settings</strong> and set it before promoting anyone.
          </div>
        ) : (
          <>
            <p className="mb-0 text-[0.82rem] leading-relaxed text-gray-600 [.admin-dark_&]:text-gray-300">
              Geli admin promotion password-ka si aad u sameyso admin cusub. Waa inaad gacanta ku qortaa mar kasta.
            </p>
            <div>
              <label className={ADM_LABEL} htmlFor="promoteAdminPassword">
                Admin promotion password
              </label>
              <input
                id="promoteAdminPassword"
                type="password"
                autoComplete="off"
                className={ADM_INPUT}
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="Enter promotion password"
              />
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
        <button type="button" className={BTN_GHOST} onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button
          type="button"
          className={BTN_PRIMARY}
          disabled={saving || !configured || !password.trim()}
          onClick={onConfirm}
        >
          {saving ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> Promoting…
            </>
          ) : (
            'Confirm promotion'
          )}
        </button>
      </div>
    </ModalShell>
  );
}

/* ═══ VIEW USER / ACTIVITY MODAL ═══ */

function parseAmount(value) {
  return Number(String(value || 0).replace(/[^0-9.-]/g, '')) || 0;
}

function deliveryStageLabel(order) {
  const step = Number(order?.currentStep);
  if (step === 0 || order?.status === 'Cancelled') return 'Cancelled';
  if (step >= 5 || order?.status === 'Delivered') return 'Delivered';
  if (step === 4 || order?.status === 'Shipped') return 'Out for delivery';
  if (step === 3) return 'Preparing';
  const payment = getOrderPaymentLabel(order);
  if (payment === 'Paid') return 'Paid';
  if (payment === 'Failed') return 'Failed';
  if (step === 2) return 'Paid';
  return 'Placed';
}

function deliveryStageBadgeClass(label) {
  if (label === 'Delivered') return 'bg-emerald-100 text-emerald-700 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300';
  if (label === 'Out for delivery') return 'bg-blue-100 text-blue-700 [.admin-dark_&]:bg-blue-500/15 [.admin-dark_&]:text-blue-300';
  if (label === 'Preparing') return 'bg-amber-100 text-amber-800 [.admin-dark_&]:bg-amber-500/15 [.admin-dark_&]:text-amber-300';
  if (label === 'Cancelled' || label === 'Failed') return 'bg-red-100 text-red-700 [.admin-dark_&]:bg-red-500/15 [.admin-dark_&]:text-red-300';
  if (label === 'Paid') return 'bg-emerald-50 text-emerald-700 [.admin-dark_&]:bg-emerald-500/10 [.admin-dark_&]:text-emerald-300';
  return 'bg-slate-100 text-slate-600 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-slate-300';
}

function MiniDeliveryProgress({ currentStep, paymentStatus }) {
  const step = Math.min(Math.max(Number(currentStep) || 1, 1), 5);
  const payment = String(paymentStatus || 'Pending');
  const nodes = [
    { id: 'placed', label: 'Placed', done: true },
    {
      id: 'payment',
      label: payment === 'Failed' ? 'Failed' : payment === 'Pending' ? 'Pending' : 'Paid',
      done: payment === 'Paid',
      failed: payment === 'Failed',
      pending: payment === 'Pending',
    },
    { id: 'prep', label: 'Preparing', done: step > 3, current: step === 3 },
    { id: 'out', label: 'Out', done: step > 4, current: step === 4 },
    { id: 'done', label: 'Delivered', done: step >= 5, current: false },
  ];

  return (
    <div>
      <p className="mb-2.5 text-[0.65rem] font-bold uppercase tracking-wide text-gray-400">Delivery progress</p>
      <div className="flex items-start">
        {nodes.map((node, idx) => {
          const circle =
            node.failed
              ? 'bg-red-500 text-white'
              : node.done || node.current
                ? 'bg-deepGreen text-white'
                : node.pending
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-gray-100 text-gray-400 [.admin-dark_&]:bg-white/10';
          return (
            <div key={node.id} className="flex min-w-0 flex-1 items-start">
              <div className="flex w-full flex-col items-center gap-1">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[0.58rem] font-bold ${circle}`}>
                  {node.failed ? '!' : node.done ? '✓' : idx + 1}
                </span>
                <span className="px-0.5 text-center text-[0.58rem] font-semibold leading-tight text-gray-500">
                  {node.label}
                </span>
              </div>
              {idx < nodes.length - 1 && (
                <div
                  className={`mt-3 h-0.5 w-full min-w-[6px] shrink ${
                    nodes[idx + 1].done || node.done ? 'bg-deepGreen/40' : 'bg-gray-200 [.admin-dark_&]:bg-white/10'
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

function normalizeProductTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function splitProductNames(productField) {
  return String(productField || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildItemsFromProductNames(productField, catalog = []) {
  const names = splitProductNames(productField);
  if (!names.length) return [];

  const byTitle = new Map();
  catalog.forEach((p) => {
    const key = normalizeProductTitle(p.title);
    if (key && !byTitle.has(key)) byTitle.set(key, p);
  });

  return names.map((name) => {
    const match = byTitle.get(normalizeProductTitle(name));
    const image = match?.images?.[0] || match?.image || 'product-images/hero1.jpeg';
    const price = Number(match?.price ?? 0) || 0;
    return {
      title: match?.title || name,
      quantity: 1,
      price,
      image,
      _resolved: Boolean(match),
    };
  });
}

async function loadProductsCatalog() {
  const res = await fetchWithTimeout(apiUrl('/api/products'), {}, ADMIN_FETCH_TIMEOUT);
  const data = await res.json().catch(() => ({}));
  if (data.success && Array.isArray(data.products)) return data.products;
  if (Array.isArray(data)) return data;
  return [];
}

function UserOrderItemsModal({ open, order, onClose }) {
  const [detail, setDetail] = useState(null);
  const [lineItems, setLineItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !order?.id) {
      setDetail(null);
      setLineItems([]);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        let merged = { ...order };
        let items = Array.isArray(order.items) ? [...order.items] : [];

        // Always refresh from order details so we get full payload when available.
        try {
          const res = await fetchWithTimeout(
            apiUrl(`/api/orders/${encodeURIComponent(order.id)}/details`),
            { headers: authHeaders(false) },
            ADMIN_FETCH_TIMEOUT
          );
          const data = await res.json().catch(() => ({}));
          if (data.success && data.order) {
            merged = {
              ...order,
              ...data.order,
              product: data.order.product || order.product,
              amount: data.order.amount ?? order.amount,
              currentStep: data.order.currentStep ?? order.currentStep,
              payment: data.order.payment ?? order.payment,
              paymentType: data.order.paymentType ?? order.paymentType,
            };
            if (Array.isArray(data.order.items) && data.order.items.length > 0) {
              items = data.order.items;
            }
          }
        } catch {
          /* keep list payload */
        }

        // Legacy orders: only a comma-separated product string — resolve from catalog.
        if (!items.length && merged.product) {
          const catalog = await loadProductsCatalog();
          items = buildItemsFromProductNames(merged.product, catalog);
        }

        if (cancelled) return;
        setDetail(merged);
        setLineItems(items);
      } catch {
        if (!cancelled) {
          setDetail(order);
          setLineItems(Array.isArray(order.items) ? order.items : []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, order]);

  if (!open || !order) return null;

  const source = detail || order;
  const items = lineItems;
  const itemsSubtotal = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );
  const orderAmount = parseAmount(source.amount);
  const reconstructed = items.some((item) => Object.prototype.hasOwnProperty.call(item, '_resolved'));
  const subtotal = reconstructed ? orderAmount || itemsSubtotal : itemsSubtotal || orderAmount;
  const payment = getOrderPaymentLabel(source);
  const step = Number(source.currentStep) || 1;

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/35 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={ADMIN_MODAL_PANEL}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Order products"
      >
        <button
          type="button"
          className="absolute right-[15px] top-[15px] z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 bg-white text-[1.4rem] leading-none text-[#111] shadow-[0_2px_10px_rgba(0,0,0,0.15)] [.admin-dark_&]:bg-[#243029] [.admin-dark_&]:text-gray-200"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="border-b border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
          <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">Order products</p>
          <p className="mb-0 font-mono text-[0.95rem] font-bold text-deepGreen [.admin-dark_&]:text-emerald-400">{order.id}</p>
          {!loading && items.length > 0 && (
            <p className="mb-0 mt-1 text-[0.78rem] text-gray-500 [.admin-dark_&]:text-gray-400">
              {items.length} item{items.length === 1 ? '' : 's'}
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 [scrollbar-width:thin]">
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-14 rounded-[10px] bg-gray-100 [.admin-dark_&]:bg-white/5" />
              <div className="h-14 rounded-[10px] bg-gray-100 [.admin-dark_&]:bg-white/5" />
              <div className="h-14 rounded-[10px] bg-gray-100 [.admin-dark_&]:bg-white/5" />
            </div>
          ) : items.length > 0 ? (
            <div className="overflow-hidden rounded-[12px] border border-black/[0.07] [.admin-dark_&]:border-white/10">
              <div className="max-h-[min(58vh,480px)] overflow-y-auto [scrollbar-width:thin]">
                <table className="w-full border-collapse text-left">
                  <thead className="sticky top-0 z-[1] bg-gray-50 [.admin-dark_&]:bg-[#141f1b]">
                    <tr className="text-[0.65rem] font-extrabold uppercase tracking-wide text-gray-400">
                      <th className="w-[72px] px-3 py-2.5">Product</th>
                      <th className="px-3 py-2.5">Name</th>
                      <th className="w-[72px] px-3 py-2.5 text-center">Qty</th>
                      <th className="w-[100px] px-3 py-2.5 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const qty = Math.max(1, Number(item.quantity) || 1);
                      const unit = Number(item.price || 0);
                      const lineTotal = unit * qty;
                      return (
                        <tr
                          key={`${item.title}-${idx}`}
                          className="border-t border-black/[0.05] [.admin-dark_&]:border-white/[0.07]"
                        >
                          <td className="px-3 py-2.5">
                            <img
                              src={productImage(item.image || 'product-images/hero1.jpeg')}
                              alt=""
                              className="h-12 w-12 rounded-[10px] border border-black/5 bg-gray-50 object-cover"
                              onError={(e) => {
                                e.currentTarget.src = productImage('product-images/hero1.jpeg');
                              }}
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="text-[0.88rem] font-bold text-gray-900 [.admin-dark_&]:text-gray-100">
                              {item.title}
                            </p>
                            {unit > 0 && (
                              <p className="mt-0.5 text-[0.72rem] text-gray-400">{formatAdminPrice(unit)} each</p>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center text-[0.88rem] font-semibold text-gray-700 [.admin-dark_&]:text-gray-200">
                            {qty}
                          </td>
                          <td className="px-3 py-2.5 text-right text-[0.9rem] font-bold text-deepGreen [.admin-dark_&]:text-emerald-300">
                            {formatAdminPrice(lineTotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-[10px] border border-dashed border-black/10 p-5 text-center">
              <p className="text-[0.86rem] font-bold text-gray-900">{source.product || 'No products'}</p>
              <p className="mt-1 text-[0.78rem] text-gray-500">Could not load product lines for this order.</p>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-black/[0.06] pt-3.5 [.admin-dark_&]:border-white/10">
            <span className="text-[0.78rem] font-bold uppercase tracking-wide text-gray-400">Subtotal</span>
            <span className="text-[1.05rem] font-bold text-deepGreen [.admin-dark_&]:text-emerald-300">
              {formatAdminPrice(subtotal)}
            </span>
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4 [.admin-dark_&]:border-white/10">
            <MiniDeliveryProgress currentStep={step} paymentStatus={payment} />
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
          <button type="button" className={BTN_GHOST} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewUserModal({
  open,
  loading,
  error,
  data,
  listCustomer,
  acting,
  onClose,
  onEdit,
  onToggleActive,
  onDelete,
  onPromote,
  promotionConfigured,
}) {
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!open) setSelectedOrder(null);
  }, [open]);

  const user = data?.user || listCustomer;
  const stats = data?.stats || {
    totalOrders: listCustomer?.orderCount || 0,
    totalSpent: listCustomer?.totalSpent || 0,
  };
  const activities = data?.activities || [];
  const recentOrders = data?.recentOrders || [];
  const driverRating = data?.driverRating || null;
  const name = user ? fullName(user) : '';
  const isActive = user?.isActive !== false;
  const spentLabel = formatAdminPrice(stats.totalSpent || 0);

  const handleStatusSelect = (e) => {
    const nextActive = e.target.value === 'true';
    if (nextActive === isActive) return;
    onToggleActive?.(user);
  };

  const roleLabel = user ? ROLE_LABELS[user.role] || user.role || 'Customer' : '';

  return (
    <ModalShell open={open} onClose={onClose} labelledBy="userDetailTitle">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
          <div className="min-w-0 pr-10">
            <h3
              id="userDetailTitle"
              className="font-display text-xl font-bold text-deepGreen [.admin-dark_&]:text-[#e8f0ed]"
            >
              {loading && !user ? 'Loading…' : name || 'Customer'}
            </h3>
            <p className="mb-0 mt-1 text-[0.82rem] text-gray-500 [.admin-dark_&]:text-gray-400">{user?.email || '—'}</p>
            {user && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-[0.75rem] font-extrabold text-slate-700 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-slate-200">
                  {roleLabel}
                </span>
                <span
                  className={`inline-flex rounded-lg px-2.5 py-1 text-[0.75rem] font-extrabold ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-700 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300'
                      : 'bg-red-100 text-red-700 [.admin-dark_&]:bg-red-500/15 [.admin-dark_&]:text-red-300'
                  }`}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 [scrollbar-width:thin]">
          <div className="space-y-4">
            {user && (
              <div className="grid gap-3 rounded-xl border border-gray-100 bg-[#fdfbf8] p-4 sm:grid-cols-2 [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-white/[0.03]">
                <div>
                  <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">Phone</p>
                  <p className="mb-0 text-[0.88rem] font-semibold text-gray-800 [.admin-dark_&]:text-gray-100">{user.phone || '—'}</p>
                </div>
                <div>
                  <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">Account status</p>
                  <select
                    className={`${ADM_SELECT} !py-1.5 text-[0.82rem]`}
                    value={isActive ? 'true' : 'false'}
                    disabled={acting}
                    onChange={handleStatusSelect}
                    aria-label="Account status"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div>
                  <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">Orders</p>
                  <p className="mb-0 text-[0.88rem] font-semibold text-gray-800 [.admin-dark_&]:text-gray-100">{stats.totalOrders || 0}</p>
                </div>
                <div>
                  <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">Total spent</p>
                  <p className="mb-0 text-[0.88rem] font-semibold text-emerald-700 [.admin-dark_&]:text-emerald-400">{spentLabel}</p>
                </div>
                {user.role === 'delivery' && (
                  <div>
                    <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">Driver rating</p>
                    <p className="mb-0 text-[0.88rem] font-semibold text-amber-600 [.admin-dark_&]:text-amber-300">
                      {(driverRating?.avg || user.driverRatingAvg || 0) > 0
                        ? `${driverRating?.avg || user.driverRatingAvg} ★ (${driverRating?.count || user.driverRatingCount || 0} reviews)`
                        : 'No ratings yet'}
                    </p>
                  </div>
                )}
                <div>
                  <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">Joined</p>
                  <p className="mb-0 text-[0.88rem] font-semibold text-gray-800 [.admin-dark_&]:text-gray-100">{user.joinedDate || '—'}</p>
                </div>
                <div>
                  <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">Last login</p>
                  <p className="mb-0 text-[0.88rem] font-semibold text-gray-800 [.admin-dark_&]:text-gray-100">{formatLastLogin(user.lastLoginAt)}</p>
                </div>
                {user.id && (
                  <div className="sm:col-span-2">
                    <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">User ID</p>
                    <p className="mb-0 break-all font-mono text-[0.88rem] font-semibold text-gray-800 [.admin-dark_&]:text-gray-100">{user.id}</p>
                  </div>
                )}
              </div>
            )}

            {user?.role === 'delivery' && driverRating?.recentRatings?.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-[0.65rem] font-bold uppercase tracking-wide text-gray-400">Customer delivery ratings</p>
                  <span className="text-[0.68rem] font-semibold text-gray-400">
                    {driverRating.recentRatings.length} recent
                  </span>
                </div>
                <div className="max-h-[200px] space-y-2 overflow-y-auto rounded-[12px] border border-black/[0.06] p-3 [scrollbar-width:thin] [.admin-dark_&]:border-white/10">
                  {driverRating.recentRatings.map((entry) => (
                    <div
                      key={entry.orderId}
                      className="rounded-[10px] border border-black/[0.05] bg-white px-3 py-2.5 [.admin-dark_&]:border-white/[0.07] [.admin-dark_&]:bg-white/[0.02]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[0.76rem] font-bold text-deepGreen [.admin-dark_&]:text-emerald-400">
                          {entry.orderId}
                        </span>
                        <span className="text-[0.82rem] font-bold text-amber-500">{entry.rating} ★</span>
                      </div>
                      {entry.comment && (
                        <p className="mb-0 mt-1 text-[0.76rem] text-gray-600 [.admin-dark_&]:text-gray-300">
                          {entry.comment}
                        </p>
                      )}
                      {entry.customer && (
                        <p className="mb-0 mt-1 text-[0.7rem] text-gray-400">— {entry.customer}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[0.65rem] font-bold uppercase tracking-wide text-gray-400">Recent activity</p>
                {!loading && !error && activities.length > 0 && (
                  <span className="text-[0.68rem] font-semibold text-gray-400">{activities.length} events</span>
                )}
              </div>

              {loading && (
                <div className="py-6 text-center text-[0.84rem] text-gray-400">
                  <i className="fa-solid fa-spinner fa-spin me-2" />
                  Loading…
                </div>
              )}

              {!loading && error && (
                <p className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[0.78rem] font-medium text-red-700 [.admin-dark_&]:border-red-500/25 [.admin-dark_&]:bg-red-500/10 [.admin-dark_&]:text-red-300">
                  {error}
                </p>
              )}

              {!loading && !error && activities.length === 0 && (
                <div className="rounded-[12px] border border-dashed border-black/[0.08] px-4 py-5 text-center [.admin-dark_&]:border-white/10">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-deepGreen/[0.06] text-deepGreen">
                    <i className="fa-solid fa-clock-rotate-left text-[0.8rem]" />
                  </div>
                  <p className="text-[0.84rem] font-semibold text-gray-700 [.admin-dark_&]:text-gray-200">No activity yet</p>
                  <p className="mt-0.5 text-[0.74rem] text-gray-400">Logins and account changes will show here.</p>
                </div>
              )}

              {!loading && !error && activities.length > 0 && (
                <div className="max-h-[168px] overflow-y-auto rounded-[12px] border border-black/[0.06] [scrollbar-width:thin] [.admin-dark_&]:border-white/10">
                  <ul className="relative ms-3 border-l border-deepGreen/15 py-1 pe-2 ps-4 [.admin-dark_&]:border-emerald-500/20">
                    {activities.slice(0, 12).map((item, idx) => (
                      <li key={item.id || `${item.action}-${idx}`} className="relative py-2.5">
                        <span className="absolute -left-[21px] top-3.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-deepGreen [.admin-dark_&]:border-[#1a2421]" />
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-deepGreen/[0.08] text-[0.62rem] text-deepGreen">
                                <i className={`fa-solid ${formatActivityIcon(item.action)}`} />
                              </span>
                              <span className="text-[0.82rem] font-semibold text-gray-900 [.admin-dark_&]:text-gray-100">
                                {formatActivityLabel(item.action)}
                              </span>
                            </div>
                            {item.description && (
                              <p className="mt-0.5 truncate text-[0.74rem] text-gray-500">{item.description}</p>
                            )}
                          </div>
                          <span className="shrink-0 text-[0.68rem] text-gray-400">{formatLastLogin(item.createdAt)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {!loading && !error && (
              <div>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-[0.65rem] font-bold uppercase tracking-wide text-gray-400">Recent orders</p>
                  {recentOrders.length > 0 && (
                    <span className="text-[0.68rem] font-semibold text-gray-400">{recentOrders.length} shown</span>
                  )}
                </div>

                {recentOrders.length === 0 ? (
                  <p className="text-[0.84rem] text-gray-400">No orders placed yet.</p>
                ) : (
                  <div className="max-h-[220px] overflow-y-auto overflow-x-hidden rounded-[12px] border border-black/[0.06] [scrollbar-width:thin] [.admin-dark_&]:border-white/10">
                    <table className="w-full border-collapse text-left text-[0.8rem]">
                      <thead className="sticky top-0 z-[1] bg-gray-50 [.admin-dark_&]:bg-[#141f1b]">
                        <tr className="text-[0.62rem] font-extrabold uppercase tracking-wide text-gray-400">
                          <th className="px-3 py-2">Order</th>
                          <th className="px-3 py-2">Progress</th>
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.map((order) => {
                          const stage = deliveryStageLabel(order);
                          const amount = parseAmount(order.amount);
                          const dateLabel =
                            order.date ||
                            (order.createdAt
                              ? new Date(order.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '—');
                          return (
                            <tr
                              key={order.id}
                              onClick={() => setSelectedOrder(order)}
                              className="cursor-pointer border-t border-black/[0.04] transition hover:bg-deepGreen/[0.03] [.admin-dark_&]:border-white/[0.06]"
                            >
                              <td className="px-3 py-2.5 font-mono text-[0.78rem] font-bold text-deepGreen">
                                {order.id}
                              </td>
                              <td className="px-3 py-2.5">
                                <span
                                  className={`inline-block rounded-md px-2 py-0.5 text-[0.66rem] font-extrabold ${deliveryStageBadgeClass(stage)}`}
                                >
                                  {stage}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-gray-500">{dateLabel}</td>
                              <td className="px-3 py-2.5 text-right font-bold text-gray-900 [.admin-dark_&]:text-gray-100">
                                {formatAdminPrice(amount)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {recentOrders.length > 4 && (
                  <p className="mt-1.5 text-[0.7rem] text-gray-400">Showing 4 rows — scroll for more. Click a row for products.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {user && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-5 py-4 [.admin-dark_&]:border-white/10">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-[0.8rem] font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50 [.admin-dark_&]:hover:bg-red-500/10"
                disabled={acting}
                onClick={() => onDelete?.(user)}
              >
                <i className="fa-regular fa-trash-can text-[0.75rem]" />
                Delete
              </button>
              {user.role !== 'admin' && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-deepGreen/20 bg-deepGreen/[0.06] px-3 py-2 text-[0.8rem] font-bold text-deepGreen transition hover:bg-deepGreen/10 disabled:opacity-50 [.admin-dark_&]:border-emerald-500/25 [.admin-dark_&]:bg-emerald-500/10 [.admin-dark_&]:text-emerald-300"
                  disabled={acting || !promotionConfigured}
                  title={promotionConfigured ? 'Promote to admin' : 'Set promotion password in Settings first'}
                  onClick={() => onPromote?.(user)}
                >
                  <i className="fa-solid fa-user-shield text-[0.75rem]" />
                  Promote to Admin
                </button>
              )}
            </div>
            <button type="button" className={BTN_PRIMARY} disabled={acting} onClick={() => onEdit?.(user)}>
              <i className="fa-regular fa-pen-to-square" />
              Edit
            </button>
          </div>
        )}

        <UserOrderItemsModal open={Boolean(selectedOrder)} order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      </div>
    </ModalShell>
  );
}

/* ═══ MAIN TAB ═══ */

export default function AdminUsersTab({ headerSearch = '' }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [saving, setSaving] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState('');
  const [viewData, setViewData] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [promotionConfigured, setPromotionConfigured] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteTarget, setPromoteTarget] = useState(null);
  const [promotePassword, setPromotePassword] = useState('');
  const [promoteSaving, setPromoteSaving] = useState(false);

  const searchQuery = headerSearch.toLowerCase().trim();

  const loadUsers = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    try {
      const res = await fetchWithTimeout(
        apiUrl('/api/auth/users'),
        { headers: authHeaders(false) },
        ADMIN_FETCH_TIMEOUT
      );
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setUsers(data.users || []);
        try {
          localStorage.setItem('adminUsers', JSON.stringify(data.users || []));
        } catch {
          /* ignore quota errors */
        }
      } else if (!quiet) {
        showTopFloatNotification(data.message || 'Failed to load users.', 'danger');
      }
    } catch (err) {
      if (!quiet) {
        const timedOut = err?.name === 'AbortError';
        showTopFloatNotification(
          timedOut ? 'Loading users timed out. Try again.' : 'Could not connect to the server. Try again.',
          'danger'
        );
      }
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const loadPromotionStatus = useCallback(async () => {
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

  useEffect(() => {
    loadPromotionStatus();
    const onUpdated = () => loadPromotionStatus();
    window.addEventListener('admin-promotion-password-updated', onUpdated);
    return () => window.removeEventListener('admin-promotion-password-updated', onUpdated);
  }, [loadPromotionStatus]);

  useEffect(() => {
    const onInvalidate = () => loadUsers({ quiet: true });
    window.addEventListener('admin-users-invalidate', onInvalidate);
    return () => window.removeEventListener('admin-users-invalidate', onInvalidate);
  }, [loadUsers]);

  const customersOnly = useMemo(
    () => users.filter((u) => u.email?.toLowerCase() !== 'admin@gmail.com'),
    [users]
  );

  const userStats = useMemo(() => {
    let active = 0;
    let inactive = 0;
    let drivers = 0;
    customersOnly.forEach((u) => {
      if (u.isActive === false) inactive += 1;
      else active += 1;
      if (u.role === 'delivery') drivers += 1;
    });
    return {
      total: customersOnly.length,
      active,
      inactive,
      drivers,
    };
  }, [customersOnly]);

  const statusCounts = useMemo(
    () => ({
      total: userStats.total,
      active: userStats.active,
      inactive: userStats.inactive,
    }),
    [userStats]
  );

  const filtered = useMemo(() => {
    const matched = customersOnly.filter((u) => {
      const isActive = u.isActive !== false;
      const name = fullName(u).toLowerCase();

      const matchesSearch =
        !searchQuery ||
        name.includes(searchQuery) ||
        u.email?.toLowerCase().includes(searchQuery) ||
        (u.phone && u.phone.includes(searchQuery)) ||
        String(u.id).includes(searchQuery);

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && isActive) ||
        (filterStatus === 'inactive' && !isActive) ||
        (filterStatus === 'drivers' && u.role === 'delivery');

      const matchesRole = filterRole === 'all' || u.role === filterRole;

      return matchesSearch && matchesStatus && matchesRole;
    });

    return [...matched].sort((a, b) => {
      const nameA = fullName(a).toLowerCase();
      const nameB = fullName(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [customersOnly, searchQuery, filterStatus, filterRole]);

  const activeStatKey =
    filterStatus === 'all'
      ? 'total'
      : filterStatus === 'active'
        ? 'active'
        : filterStatus === 'inactive'
          ? 'inactive'
          : filterStatus === 'drivers'
            ? 'drivers'
            : null;

  const openView = async (customer) => {
    setSelectedCustomer(customer);
    setViewOpen(true);
    setViewLoading(true);
    setViewError('');
    setViewData(null);

    try {
      const res = await fetchWithTimeout(
        apiUrl(`/api/auth/users/${customer.id}/details`),
        { headers: authHeaders(false) },
        ADMIN_FETCH_TIMEOUT
      );
      const data = await res.json();
      if (data.success) {
        setViewData(data);
        if (data.user) setSelectedCustomer((prev) => ({ ...prev, ...data.user }));
      } else {
        setViewError(data.message || 'Failed to load user details.');
      }
    } catch {
      setViewError('An error occurred while loading customer details.');
    } finally {
      setViewLoading(false);
    }
  };

  const closeView = () => {
    setViewOpen(false);
    setViewData(null);
    setViewError('');
    setSelectedCustomer(null);
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
    setEditOpen(true);
  };

  const openPromote = (customer) => {
    if (!promotionConfigured) {
      showTopFloatNotification('Set the admin promotion password in Settings first.', 'warning');
      return;
    }
    setPromoteTarget(customer);
    setPromotePassword('');
    setPromoteOpen(true);
  };

  const closePromote = () => {
    setPromoteOpen(false);
    setPromoteTarget(null);
    setPromotePassword('');
  };

  const handlePromoteConfirm = async () => {
    if (!promoteTarget?.id || !promotePassword.trim()) return;

    setPromoteSaving(true);
    try {
      const res = await fetch(apiUrl(`/api/auth/users/${promoteTarget.id}/promote-admin`), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ adminPromotionPassword: promotePassword }),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification(data.message || 'User promoted to admin.');
        closePromote();
        closeView();
        loadUsers({ quiet: true });
        window.dispatchEvent(new CustomEvent('admin-users-invalidate'));
      } else {
        showTopFloatNotification(data.message || 'Promotion failed.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not connect to the server. Try again.', 'danger');
    } finally {
      setPromoteSaving(false);
      setPromotePassword('');
    }
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
        if (viewOpen && selectedCustomer?.id === editForm.id) {
          setSelectedCustomer((prev) => (prev ? { ...prev, ...payload } : prev));
          setViewData((prev) =>
            prev?.user ? { ...prev, user: { ...prev.user, ...payload } } : prev
          );
        }
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
        setSelectedCustomer((prev) => (prev?.id === customer.id ? { ...prev, isActive: nextActive } : prev));
        setViewData((prev) =>
          prev?.user?.id === customer.id
            ? { ...prev, user: { ...prev.user, isActive: nextActive } }
            : prev
        );
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
        closeView();
        setEditOpen(false);
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
    <div className="animate-cardRise space-y-2.5">
      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <UsersStatCard
          label="Total Customers"
          value={loading ? '…' : userStats.total.toLocaleString()}
          icon="fa-users"
          iconWrapClass="bg-blue-500/10 text-blue-600"
          active={activeStatKey === 'total'}
          onClick={() => {
            setFilterStatus('all');
            setFilterRole('all');
          }}
        />
        <UsersStatCard
          label="Active"
          value={loading ? '…' : userStats.active.toLocaleString()}
          icon="fa-user-check"
          iconWrapClass="bg-emerald-500/10 text-emerald-600"
          active={activeStatKey === 'active'}
          onClick={() => setFilterStatus('active')}
        />
        <UsersStatCard
          label="Inactive"
          value={loading ? '…' : userStats.inactive.toLocaleString()}
          icon="fa-user-slash"
          iconWrapClass="bg-amber-500/10 text-amber-600"
          active={activeStatKey === 'inactive'}
          onClick={() => setFilterStatus('inactive')}
        />
        <UsersStatCard
          label="Drivers"
          value={loading ? '…' : userStats.drivers.toLocaleString()}
          icon="fa-motorcycle"
          iconWrapClass="bg-violet-500/10 text-violet-600"
          active={activeStatKey === 'drivers'}
          onClick={() => {
            setFilterStatus('drivers');
            setFilterRole('all');
          }}
        />
      </div>

      <UsersFilterToolbar
        loading={loading}
        filterStatus={filterStatus === 'drivers' ? 'all' : filterStatus}
        filterRole={filterRole}
        statusCounts={statusCounts}
        onStatusChange={(id) => setFilterStatus(id)}
        onRoleChange={setFilterRole}
        onExport={() => exportUsersToCSV(filtered)}
      />

      <div className={`${ADM_TABLE_CARD} !p-0 overflow-hidden`}>
        <div
          className="overflow-auto [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-deepGreen/15 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5"
          style={{ maxHeight: USERS_TABLE_MAX_HEIGHT }}
        >
          <table className={`${ADM_TABLE} [&_tbody_tr]:cursor-pointer [&_tbody_tr]:transition-colors`}>
            <thead className="sticky top-0 z-[5] bg-white [.admin-dark_&]:bg-[#1a2421]">
              <tr>
                <th>User</th>
                <th>Email / Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Orders</th>
                <th>Last Login</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="cursor-default py-8 text-center text-gray-400">
                    <i className="fa-solid fa-spinner fa-spin me-2" />
                    Loading customers…
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="cursor-default py-8 text-center text-gray-400">
                    No customer accounts match these filters.
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((customer) => {
                  const name = fullName(customer);
                  const isActive = customer.isActive !== false;

                  return (
                    <tr
                      key={customer.id}
                      onClick={() => openView(customer)}
                      className="hover:bg-deepGreen/[0.03]"
                    >
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
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <EditUserModal
        open={editOpen}
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
        listCustomer={selectedCustomer}
        acting={Boolean(actingId && selectedCustomer && actingId === selectedCustomer.id)}
        promotionConfigured={promotionConfigured}
        onClose={closeView}
        onEdit={openEdit}
        onPromote={openPromote}
        onToggleActive={toggleActive}
        onDelete={handleDelete}
      />

      <PromoteAdminModal
        open={promoteOpen}
        user={promoteTarget}
        password={promotePassword}
        configured={promotionConfigured}
        saving={promoteSaving}
        onPasswordChange={setPromotePassword}
        onClose={closePromote}
        onConfirm={handlePromoteConfirm}
      />
    </div>
  );
}
