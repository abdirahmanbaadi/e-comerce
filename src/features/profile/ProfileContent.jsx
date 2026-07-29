import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductsContext';
import { apiUrl } from '../../utils/data';
import { formatMoney, productImage } from '../../utils/format';
import { parsePhoneForStorage } from '../../utils/phone';
import { downloadInvoice } from '../../utils/invoiceActions';
import { getDeliveryBadge, getPaymentBadge, resolveOrderStatus } from '../../utils/orderStatus';
import { canCustomerCancelOrder } from '../../utils/orderCancel';
import { showTopFloatNotification } from '../../utils/notifications';
import RetryPaymentModal from '../checkout/RetryPaymentModal';
import WriteReviewModal from '../products/WriteReviewModal';
import { AppSearchField } from '../nav/StoreNavbar';
import ProfileSupportForm from './ProfileSupportForm';
import { OrderItemsList } from '../admin/AdminOrdersTab.jsx';
import {
  ADMIN_MODAL_CLOSE_BTN,
  ADMIN_MODAL_OVERLAY,
  ADMIN_MODAL_PANEL,
  BTN_GHOST,
  BTN_PRIMARY,
} from '../admin/adminShared.js';

/* ═══ SECTION: INFO TAB ═══ */
function ProfileField({ label, htmlFor, icon, children }) {
  return (
    <div className="mb-3.5">
      <label htmlFor={htmlFor} className="mb-1.5 block text-[0.85rem] font-bold text-[#4A3F35]">
        {label}
      </label>
      <div className="relative flex items-center">
        <i className={`${icon} pointer-events-none absolute left-4 text-[#7A6F62]`} />
        {children}
      </div>
    </div>
  );
}

export function ProfileInfoTab() {
  const { user, updateProfile } = useAuth();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    avatar: '',
  });

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(apiUrl('/api/auth/profile'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!cancelled && data.success) {
          const u = data.user;
          setForm({
            fullName: `${u.firstName} ${u.lastName || ''}`.trim(),
            email: u.email || '',
            phone: u.phone || '',
            address: u.address || '',
            avatar: u.avatar || '',
          });
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loading && user) {
      setForm((prev) => ({
        ...prev,
        fullName: user.fullName || prev.fullName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        address: user.address || prev.address,
        avatar: user.avatar || prev.avatar,
      }));
    }
  }, [user, loading]);

  const updateField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64 = evt.target?.result;
      if (!base64) return;

      const data = await updateProfile({ avatar: base64 });
      if (data.success) {
        setForm((prev) => ({ ...prev, avatar: base64 }));
        showTopFloatNotification('✅ Profile picture updated successfully!');
      } else {
        showTopFloatNotification(`❌ ${data.message || 'Failed to update avatar'}`, 'danger');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const phoneParsed = parsePhoneForStorage(form.phone.trim());
      if (!phoneParsed.ok) {
        showTopFloatNotification(`❌ ${phoneParsed.message}`, 'danger');
        return;
      }

      const data = await updateProfile({
        fullName: form.fullName.trim(),
        phone: phoneParsed.e164,
        address: form.address.trim(),
      });
      if (data.success) {
        showTopFloatNotification('✅ Your profile has been updated successfully!');
      } else {
        showTopFloatNotification(`❌ ${data.message || 'Failed to update profile'}`, 'danger');
      }
    } finally {
      setSaving(false);
    }
  };

  const displayName = form.fullName || 'User Name';

  const inputClass =
    'w-full rounded-[10px] border-[1.5px] border-black/[0.08] bg-white py-[11px] pl-11 pr-20 text-[0.92rem] font-semibold text-[#111111] outline-none transition-all duration-[250ms] focus:border-deepGreen focus:shadow-[0_0_0_4px_rgba(7,61,53,0.06)]';

  const readOnlyClass =
    'w-full cursor-not-allowed rounded-[10px] border-[1.5px] border-black/[0.05] bg-[#FAF8F5] py-[11px] pl-11 pr-5 text-[0.92rem] font-semibold text-[#666666] outline-none';

  return (
    <div>
      <h1 className="mb-0.5 font-display text-[2.3rem] font-bold text-deepGreen">My Profile</h1>
      <p className="mb-2 text-[0.92rem] text-[#666666]">Manage your personal information</p>

      <div className="grid items-stretch gap-6 max-lg:grid-cols-1 lg:grid-cols-[300px_1fr]">
        <div className="flex h-full flex-col items-center justify-start gap-4 rounded-2xl border border-black/[0.04] bg-white p-6 shadow-[0_10px_30px_rgba(7,61,53,0.03)]">
          <div className="relative mb-2.5 h-40 w-40">
            <div
              className="flex h-full w-full cursor-pointer items-center justify-center overflow-hidden rounded-full border-[3px] border-deepGreen/[0.08] bg-[#F2ECE1] transition-opacity duration-[250ms] hover:opacity-90"
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              {form.avatar ? (
                <img src={form.avatar} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <i className="fa-regular fa-image text-5xl text-[#a3a29d]" />
              )}
            </div>
            <button
              type="button"
              className="absolute bottom-1.5 right-1.5 z-[2] flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-full border border-black/[0.08] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-200 hover:scale-[1.08] hover:bg-[#FAF9F6]"
              onClick={() => fileRef.current?.click()}
              aria-label="Change profile photo"
            >
              <i className="fa-solid fa-camera text-[1.1rem] text-deepGreen" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} hidden />
          </div>

          <div className="mb-1 text-center font-display text-[1.85rem] font-bold capitalize text-deepGreen">
            {displayName}
          </div>

          <div className="mt-1 flex w-full flex-col gap-2">
            <div className="flex w-full items-center gap-3 text-[0.88rem] font-semibold text-[#4A3F35]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F2ECE1]">
                <i className="fa-regular fa-envelope text-[0.95rem] text-deepGreen" />
              </div>
              <span>{form.email || '—'}</span>
            </div>
            <div className="flex w-full items-center gap-3 text-[0.88rem] font-semibold text-[#4A3F35]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F2ECE1]">
                <i className="fa-solid fa-phone text-[0.95rem] text-deepGreen" />
              </div>
              <span>{form.phone || '—'}</span>
            </div>
          </div>
        </div>

        <div className="flex h-full flex-col justify-between rounded-2xl border border-black/[0.04] bg-white px-8 py-6 shadow-[0_10px_30px_rgba(7,61,53,0.03)] max-sm:px-5">
          <div className="relative mb-5 pb-1.5 font-display text-[1.45rem] font-bold text-deepGreen">
            Personal Information
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <ProfileField label="Full Name" htmlFor="profileNameInput" icon="fa-regular fa-user">
              <input
                type="text"
                id="profileNameInput"
                className={inputClass}
                placeholder="Magacaaga oo dhamaystiran"
                value={form.fullName}
                onChange={updateField('fullName')}
              />
              <button
                type="button"
                className="absolute right-4 cursor-pointer select-none text-[0.85rem] font-bold text-blue-600 transition-opacity hover:underline hover:opacity-85"
                onClick={() => document.getElementById('profileNameInput')?.focus()}
              >
                Change
              </button>
            </ProfileField>

            <ProfileField label="Email Address" htmlFor="profileEmailInput" icon="fa-regular fa-envelope">
              <input
                type="email"
                id="profileEmailInput"
                className={readOnlyClass}
                placeholder="email@example.com"
                value={form.email}
                readOnly
              />
            </ProfileField>

            <ProfileField label="Phone Number" htmlFor="profilePhoneInput" icon="fa-solid fa-phone">
              <input
                type="tel"
                id="profilePhoneInput"
                className={readOnlyClass}
                placeholder="+252 61 0000000"
                value={form.phone}
                readOnly
              />
            </ProfileField>

            <ProfileField label="Address" htmlFor="profileAddressInput" icon="fa-solid fa-location-dot">
              <input
                type="text"
                id="profileAddressInput"
                className={inputClass}
                placeholder="Mogadishu, Somalia"
                value={form.address}
                onChange={updateField('address')}
              />
              <button
                type="button"
                className="absolute right-4 cursor-pointer select-none text-[0.85rem] font-bold text-blue-600 transition-opacity hover:underline hover:opacity-85"
                onClick={() => document.getElementById('profileAddressInput')?.focus()}
              >
                Change
              </button>
            </ProfileField>

            <button
              type="submit"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-[10px] border-0 bg-deepGreen py-3 text-[0.95rem] font-bold text-white transition-all duration-[250ms] hover:bg-[#0A5246] hover:shadow-[0_6px_18px_rgba(7,61,53,0.18)] disabled:opacity-60"
              disabled={saving || loading}
            >
              <i className="fa-regular fa-floppy-disk" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


/* ═══ SECTION: ORDERS TAB ═══ */

function findProductImagePath(products, title) {
  if (!title) return '';
  const match = products.find(
    (p) => p.title?.toLowerCase() === title.toLowerCase() || title.toLowerCase().includes(p.title?.toLowerCase())
  );
  return match?.images?.[0] || '';
}

function findProductImage(products, title) {
  const path = findProductImagePath(products, title);
  return path ? productImage(path) : '';
}

function enrichOrderForItemsList(order, products) {
  const amountNum = parseFloat(String(order.amount).replace(/[^0-9.]/g, '')) || 0;
  const resolveItemImage = (item) => {
    if (item?.image) return item.image;
    if (item?.id) {
      const match = products.find((product) => Number(product.id) === Number(item.id));
      if (match?.images?.[0]) return match.images[0];
    }
    return findProductImagePath(products, item?.title || order.product);
  };

  const items =
    Array.isArray(order.items) && order.items.length > 0
      ? order.items.map((item) => ({
          ...item,
          image: resolveItemImage(item),
        }))
      : [
          {
            title: order.product,
            quantity: 1,
            price: amountNum,
            image: resolveItemImage({ title: order.product }),
          },
        ];

  return { ...order, items };
}

function OrderDetailModal({
  open,
  order,
  products,
  onClose,
  onTrack,
  onCancel,
  onRetry,
  onReview,
  cancellingId,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || !order || typeof document === 'undefined') return null;

  const payment = getPaymentBadge(order.paymentType, order.payment);
  const delivery = getDeliveryBadge(order.status);
  const amountNum = parseFloat(String(order.amount).replace(/[^0-9.]/g, '')) || 0;
  const itemCount = countOrderItems(order);
  const orderForList = enrichOrderForItemsList(order, products);
  const orderProduct = resolveOrderProduct(order, products);
  const showReview = canShowOrderReview(order) && orderProduct;
  const canCancel = canCustomerCancelOrder(order);
  const canRetry =
    payment.className === 'failed' && String(order.paymentMethod || '').toLowerCase().includes('evc');

  const handleDownloadPdf = () => {
    downloadInvoice({
      trackingCode: order.id,
      customer: order.customer,
      phone: order.phone,
      address: order.address,
      payment: order.payment,
      paymentMethod: order.paymentMethod,
      items: orderForList.items,
      total: amountNum,
      deliveryDate: order.deliveryDate,
      deliveryTime: order.deliveryTime,
    });
  };

  return createPortal(
    <div className={ADMIN_MODAL_OVERLAY} onClick={onClose} role="presentation">
      <div
        className={ADMIN_MODAL_PANEL}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="orderDetailTitle"
      >
        <button type="button" className={ADMIN_MODAL_CLOSE_BTN} onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="border-b border-gray-100 px-5 py-4">
          <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wide text-gray-400">Order products</p>
          <p id="orderDetailTitle" className="mb-0 font-mono text-[0.95rem] font-bold text-deepGreen">
            #{order.id}
          </p>
          <p className="mb-0 mt-1 text-[0.78rem] text-gray-500">
            {order.date}
            {itemCount > 0 ? ` · ${itemCount} item${itemCount === 1 ? '' : 's'}` : ''}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-bold ${STATUS_BADGE[payment.className] || STATUS_BADGE.pending}`}
            >
              {payment.label}
            </span>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-bold ${STATUS_BADGE[delivery.className] || STATUS_BADGE.pending}`}
            >
              {delivery.label}
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 [scrollbar-width:thin]">
          <OrderItemsList order={orderForList} />

          <div className="mt-4 flex items-center justify-between border-t border-black/[0.06] pt-3.5">
            <span className="text-[0.78rem] font-bold uppercase tracking-wide text-gray-400">Total</span>
            <span className="text-[1.05rem] font-bold text-deepGreen">
              {order.amount?.startsWith('$') ? order.amount : formatMoney(amountNum)}
            </span>
          </div>

          {(order.deliveryDate || order.deliveryTime || order.address) && (
            <div className="mt-3 rounded-[10px] border border-black/[0.06] bg-[#FCFAF7] px-3.5 py-3">
              <p className="mb-1 text-[0.72rem] font-extrabold uppercase tracking-[0.08em] text-[#7A6F62]">
                Delivery
              </p>
              <p className="m-0 text-[0.84rem] font-semibold text-[#333333]">
                {order.deliveryDate || order.deliveryTime
                  ? [order.deliveryDate, order.deliveryTime].filter(Boolean).join(' · ')
                  : 'Not scheduled'}
              </p>
              {order.address && (
                <p className="m-0 mt-1 text-[0.76rem] text-[#888888]">{order.address}</p>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2 border-t border-black/[0.06] pt-4">
            <button
              type="button"
              className={`${BTN_PRIMARY} !px-4 !py-2 text-[0.84rem]`}
              onClick={() => {
                onClose();
                onTrack?.(order.id);
              }}
            >
              <i className="fa-solid fa-location-dot" aria-hidden="true" />
              Track
            </button>
            <button
              type="button"
              className={`${BTN_GHOST} !px-4 !py-2 text-[0.84rem]`}
              onClick={handleDownloadPdf}
            >
              <i className="fa-regular fa-file-pdf" aria-hidden="true" />
              PDF
            </button>
            {showReview && (
              <button
                type="button"
                className={`${BTN_GHOST} !px-4 !py-2 text-[0.84rem] !text-gold`}
                onClick={() => {
                  onClose();
                  onReview?.({
                    productId: orderProduct.id,
                    productTitle: orderProduct.title,
                  });
                }}
              >
                <i className="fa-regular fa-star" aria-hidden="true" />
                Review
              </button>
            )}
            {canRetry && (
              <button
                type="button"
                className={`${BTN_GHOST} !px-4 !py-2 text-[0.84rem] !text-[#c0392b]`}
                onClick={() => {
                  onClose();
                  onRetry?.(order);
                }}
              >
                Retry payment
              </button>
            )}
            {canCancel && (
              <button
                type="button"
                className={`${BTN_GHOST} !px-4 !py-2 text-[0.84rem] !text-red-600`}
                disabled={cancellingId === order.id}
                onClick={() => onCancel?.(order)}
              >
                {cancellingId === order.id ? 'Cancelling…' : 'Cancel order'}
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-100 px-5 py-4">
          <button type="button" className={BTN_GHOST} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function countOrderItems(order) {
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0);
  }
  return 1;
}

function resolveOrderProduct(order, products) {
  const item = Array.isArray(order.items) ? order.items.find((i) => i?.id || i?.title) : null;
  if (item?.id) {
    return { id: Number(item.id), title: item.title || order.product || 'Product' };
  }
  const title = order.product || item?.title;
  if (!title) return null;
  const match = products.find(
    (p) => p.title?.toLowerCase() === title.toLowerCase() || title.toLowerCase().includes(p.title?.toLowerCase())
  );
  if (match?.id) return { id: match.id, title: match.title };
  return null;
}

function canShowOrderReview(order) {
  const status = resolveOrderStatus(order);
  const payment = getPaymentBadge(order.paymentType, order.payment);
  return status === 'delivered' && payment.className === 'paid';
}

const STATUS_BADGE = {
  paid: 'bg-[#E8F5EE] text-[#087443] ring-1 ring-[#087443]/12',
  pending: 'bg-[#FFF6E5] text-[#A07000] ring-1 ring-[#D8A128]/15',
  failed: 'bg-[#FCE8E6] text-[#c0392b] ring-1 ring-[#c0392b]/12',
  refunded: 'bg-[#FFF0E5] text-[#B45309] ring-1 ring-[#D8A128]/20',
  delivered: 'bg-[#E8F5EE] text-[#087443] ring-1 ring-[#087443]/12',
  processing: 'bg-[#FFF6E5] text-[#A07000] ring-1 ring-[#D8A128]/15',
  'out-for-delivery': 'bg-[#EEEAF8] text-[#2B59DB] ring-1 ring-[#2B59DB]/12',
  cancelled: 'bg-[#FCE8E6] text-[#c0392b] ring-1 ring-[#c0392b]/12',
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'out-for-delivery', label: 'Out for Delivery' },
  { value: 'processing', label: 'Processing' },
  { value: 'cancelled', label: 'Cancelled' },
];

function OrdersEmptyState({ hasOrders = false, loadError = '' }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <i className="fa-solid fa-bag-shopping mb-3 text-[2rem] text-gold/80" />
      <h3 className="mb-1 font-display text-[1.25rem] font-bold text-deepGreen">
        {hasOrders ? 'No matching orders' : 'No orders found'}
      </h3>
      <p className="mb-4 max-w-[300px] text-[0.88rem] leading-relaxed text-[#888888]">
        {hasOrders
          ? 'Try a different search or status filter.'
          : loadError
            ? 'Your orders could not be loaded right now.'
            : "You haven't placed any orders yet, or nothing matches your search."}
      </p>
      {!hasOrders && !loadError && (
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-[0.88rem] font-bold text-deepGreen no-underline transition hover:underline"
        >
          Start Shopping
          <i className="fa-solid fa-arrow-right text-[0.75rem]" />
        </Link>
      )}
    </div>
  );
}

function OrdersLoadingState() {
  return (
    <div className="space-y-2 py-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-4 border-b border-black/[0.04] py-4">
          <div className="h-10 w-10 rounded-lg bg-[#EAEAEA]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 rounded bg-[#EAEAEA]" />
            <div className="h-2.5 w-48 rounded bg-[#F0F0F0]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileOrdersTab({ onTrackOrder }) {
  const { user } = useAuth();
  const { products } = useProducts();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancellingId, setCancellingId] = useState('');
  const [retryOrder, setRetryOrder] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadError, setLoadError] = useState('');

  const loadOrders = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setLoadError('Please log in again to view your orders.');
      return;
    }

    setLoading(true);
    setLoadError('');

    try {
      const response = await fetch(apiUrl('/api/orders'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setOrders(
          (data.orders || []).map((order) => ({
            ...order,
            status: resolveOrderStatus(order),
          }))
        );
      } else {
        setOrders([]);
        setLoadError(data.message || 'Could not load your orders.');
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      setLoadError('Could not connect to the server. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadOrders();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const query = search.toLowerCase().trim();
    return orders.filter((order) => {
      const orderId = `#${order.id}`.toLowerCase();
      const delivery = getDeliveryBadge(order.status);
      const payment = getPaymentBadge(order.paymentType, order.payment);
      const deliveryKey = delivery.className;
      const paymentKey = payment.label.toLowerCase();

      const matchesSearch = !query || orderId.includes(query) || order.id.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' && paymentKey === 'paid') ||
        (statusFilter === 'pending' && paymentKey === 'pending') ||
        (statusFilter === 'failed' && paymentKey === 'failed') ||
        (statusFilter === 'refunded' && paymentKey === 'refunded') ||
        (statusFilter === 'cancelled' && (deliveryKey === 'cancelled' || order.status === 'cancelled')) ||
        deliveryKey === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const handleTrack = (id) => {
    if (onTrackOrder) {
      onTrackOrder(id);
      return;
    }
    localStorage.setItem('lastTrackingCode', id);
  };

  const handleCancel = async (order) => {
    if (!canCustomerCancelOrder(order)) {
      showTopFloatNotification('This order can no longer be cancelled.', 'danger');
      return;
    }

    const confirmed = window.confirm(
      `Cancel order ${order.id}? This can only be done before out for delivery.`
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
        loadOrders();
        showTopFloatNotification(data.message || 'Order cancelled successfully.');
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
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="mb-1 font-display text-[2.3rem] font-bold text-deepGreen">My Orders</h1>
          <p className="m-0 text-[0.92rem] text-[#666666]">View and track your order history</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:shrink-0">
          <div className="min-w-0 sm:w-[260px]">
            <AppSearchField
              variant="full"
              id="orderSearchInput"
              placeholder="Search by Order ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="relative w-full sm:w-[170px]">
            <i className="fa-solid fa-sliders pointer-events-none absolute left-3 top-1/2 z-[2] -translate-y-1/2 text-[0.8rem] text-[#7A6F62]" />
            <select
              className="w-full cursor-pointer appearance-none rounded-xl border border-black/[0.08] bg-white py-2.5 pl-9 pr-9 text-[0.86rem] font-semibold text-[#333333] outline-none transition focus:border-deepGreen focus:ring-2 focus:ring-deepGreen/10"
              id="orderStatusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[0.65rem] text-[#999999]" />
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 font-display text-[1.35rem] font-bold text-deepGreen">Order History</h2>
        {!loading && (
          <span className="text-[0.8rem] font-semibold text-[#888888]">
            {filteredOrders.length} result{filteredOrders.length !== 1 ? 's' : ''}
            {!loading && orders.length > 0 ? ` · ${orders.length} total` : ''}
          </span>
        )}
      </div>

      {loadError && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[0.84rem] text-red-700">
          <span>{loadError}</span>
          <button
            type="button"
            className="rounded-lg bg-white px-3 py-1.5 text-[0.8rem] font-bold text-red-700 shadow-sm"
            onClick={loadOrders}
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <OrdersLoadingState />
      ) : filteredOrders.length === 0 ? (
        <OrdersEmptyState hasOrders={orders.length > 0} loadError={loadError} />
      ) : (
        <div className="overflow-x-auto border-t border-black/[0.06]">
          <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-black/[0.06]">
                  {['Order ID', 'Date', 'Order', 'Total', 'Payment', 'Delivery'].map((label) => (
                    <th
                      key={label}
                      className="border-b border-black/[0.06] px-4 py-3.5 text-left text-[0.72rem] font-extrabold uppercase tracking-[0.08em] text-[#7A6F62]"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody id="ordersTableBody">
                {filteredOrders.map((order, index) => {
                  const imgSrc = findProductImage(products, order.product);
                  const payment = getPaymentBadge(order.paymentType, order.payment);
                  const delivery = getDeliveryBadge(order.status);
                  const amountNum = parseFloat(String(order.amount).replace(/[^0-9.]/g, '')) || 0;
                  const itemCount = countOrderItems(order);

                  return (
                    <tr
                      key={order.id}
                      className="cursor-pointer border-b border-black/[0.04] transition-colors duration-200 hover:bg-white/80"
                      style={{ animationDelay: `${index * 40}ms` }}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="px-4 py-4">
                        <span className="font-mono text-[0.86rem] font-extrabold text-deepGreen">#{order.id}</span>
                      </td>
                      <td className="px-4 py-4 text-[0.84rem] text-[#666666]">{order.date}</td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-[200px] items-center gap-3">
                          {imgSrc ? (
                            <img
                              src={imgSrc}
                              alt={order.product}
                              className="h-12 w-12 shrink-0 rounded-xl border border-black/[0.06] bg-[#FAF8F5] object-cover shadow-[0_2px_6px_rgba(0,0,0,0.04)]"
                            />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-black/[0.06] bg-[#FAF8F5] text-[#BBBBBB]">
                              <i className="fa-solid fa-couch" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="m-0 truncate text-[0.88rem] font-bold text-[#222222]">{order.product}</p>
                            <p className="m-0 mt-0.5 text-[0.76rem] font-semibold text-[#888888]">
                              {itemCount} item{itemCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[0.88rem] font-extrabold text-[#222222]">
                        {order.amount?.startsWith('$') ? order.amount : formatMoney(amountNum)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[0.76rem] font-bold ${STATUS_BADGE[payment.className] || STATUS_BADGE.pending}`}
                        >
                          {payment.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[0.76rem] font-bold ${STATUS_BADGE[delivery.className] || STATUS_BADGE.pending}`}
                        >
                          {delivery.label}
                        </span>
                        {(order.deliveryDate || order.deliveryTime) && (
                          <p className="m-0 mt-1 text-[0.72rem] text-[#999999]">
                            {order.deliveryDate}
                            {order.deliveryTime ? ` · ${order.deliveryTime}` : ''}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        </div>
      )}

      <OrderDetailModal
        open={Boolean(selectedOrder)}
        order={selectedOrder}
        products={products}
        onClose={() => setSelectedOrder(null)}
        onTrack={handleTrack}
        onCancel={handleCancel}
        cancellingId={cancellingId}
        onRetry={setRetryOrder}
        onReview={setReviewTarget}
      />

      {retryOrder && (
        <RetryPaymentModal
          order={retryOrder}
          userPhone={retryOrder.phone || user?.phone || ''}
          onClose={() => setRetryOrder(null)}
          onSuccess={() => {
            setOrders((prev) =>
              prev.map((entry) =>
                entry.id === retryOrder.id ? { ...entry, paymentType: 'paid', payment: 'Paid' } : entry
              )
            );
            setRetryOrder(null);
          }}
        />
      )}

      <WriteReviewModal
        open={Boolean(reviewTarget)}
        productId={reviewTarget?.productId}
        productTitle={reviewTarget?.productTitle}
        onClose={() => setReviewTarget(null)}
      />
    </div>
  );
}


/* ═══ SECTION: HELP TAB ═══ */

const FALLBACK_FAQS = [
  {
    icon: 'fa-solid fa-box',
    title: 'How can I track my order?',
    body: 'Open Track Order from the sidebar, enter your Order ID, and view status updates in your profile.',
  },
  {
    icon: 'fa-regular fa-credit-card',
    title: 'How do I retry failed payment?',
    body: 'You can retry a failed payment by clicking on the order in your Order History and selecting "Retry Payment", or contact our customer support for assistance.',
  },
  {
    icon: 'fa-solid fa-truck',
    title: 'How long does delivery take?',
    body: 'Deliveries within Mogadishu typically take 24 to 48 hours depending on your district and courier availability.',
  },
  {
    icon: 'fa-solid fa-location-dot',
    title: 'How can I change my address?',
    body: 'To change your shipping address, please contact our support team immediately before the order status updates to "Out for Delivery".',
  },
  {
    icon: 'fa-solid fa-rotate-left',
    title: 'How can I return a product?',
    body: 'We accept returns within 7 days of delivery for unused products in their original packaging. Please submit a support ticket to initiate the process.',
  },
];

function FaqAccordion({ items }) {
  const [openIndex, setOpenIndex] = useState(-1);
  const faqItems = items?.length ? items : FALLBACK_FAQS;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
      <div className="flex flex-col gap-3">
        {faqItems.map((item, index) => {
          const isOpen = openIndex === index;
          const title = item.question || item.title;
          const body = item.answer || item.body;
          return (
            <div
              key={item.id || `${title}-${index}`}
              className="overflow-hidden rounded-xl border-[1.5px] border-black/[0.06] bg-white"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 border-0 bg-white px-4 py-4 text-left transition hover:bg-[#fafaf8]"
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                aria-expanded={isOpen}
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center text-[1.05rem] text-deepGreen">
                    <i className={item.icon || 'fa-solid fa-circle-question'} />
                  </span>
                  <span className="text-[0.88rem] font-semibold text-[#1c3022]">{title}</span>
                </div>
                <i
                  className={`fa-solid shrink-0 text-[0.8rem] text-gray-400 ${
                    isOpen ? 'fa-chevron-down' : 'fa-chevron-right'
                  }`}
                />
              </button>
              {isOpen && (
                <div className="border-t border-black/[0.05] px-4 py-3.5 pl-[3.1rem] text-[0.84rem] leading-relaxed text-gray-600">
                  {body}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ProfileHelpTab({ supportChat }) {
  const [faqItems, setFaqItems] = useState(FALLBACK_FAQS);

  useEffect(() => {
    fetch(apiUrl('/api/cms'))
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.cms?.faqs?.length) {
          setFaqItems(data.cms.faqs.sort((a, b) => (a.order || 0) - (b.order || 0)));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <header className="mb-4">
        <h1 className="mb-1 font-display text-[1.75rem] font-extrabold text-deepGreen sm:text-[2rem]">
          Help & Support
        </h1>
        <p className="text-[0.85rem] font-medium text-gray-500">
          <Link to="/" className="font-semibold text-deepGreen no-underline hover:underline">
            Home
          </Link>
          <span className="mx-2 text-gray-400">&gt;</span>
          <span>Help & Support</span>
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr] lg:items-stretch">
        <ProfileSupportForm supportChat={supportChat} />

        <aside className="flex min-h-[480px] flex-col rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] sm:p-7">
          <h3 className="mb-5 shrink-0 text-[1.2rem] font-bold text-deepGreen">Quick Help / FAQ</h3>
          <FaqAccordion items={faqItems} />
          <Link
            to="/contact"
            className="mt-4 inline-flex shrink-0 items-center gap-1.5 text-[0.86rem] font-semibold text-deepGreen no-underline hover:underline"
          >
            View all FAQs
            <i className="fa-solid fa-chevron-right text-[0.72rem]" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
