import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductsContext';
import { apiUrl } from '../../utils/data';
import { formatChatTime, formatMoney, productImage } from '../../utils/format';
import { downloadInvoice } from '../../utils/invoiceActions';
import { getDeliveryBadge, getPaymentBadge, resolveOrderStatus } from '../../utils/orderStatus';
import { showTopFloatNotification } from '../../utils/notifications';
import { AppSearchField } from '../nav/StoreNavbar';

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
      const data = await updateProfile({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
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

function findProductImage(products, title) {
  if (!title) return '';
  const match = products.find(
    (p) => p.title?.toLowerCase() === title.toLowerCase() || title.toLowerCase().includes(p.title?.toLowerCase())
  );
  return match?.images?.[0] ? productImage(match.images[0]) : '';
}

function countOrderItems(order) {
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items.reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0);
  }
  return 1;
}

const STATUS_BADGE = {
  paid: 'bg-[rgba(8,116,67,0.08)] text-[#087443]',
  pending: 'bg-[rgba(216,161,40,0.08)] text-[#A07000]',
  delivered: 'bg-[rgba(8,116,67,0.08)] text-[#087443]',
  processing: 'bg-[rgba(216,161,40,0.08)] text-[#A07000]',
  'out-for-delivery': 'bg-[rgba(43,89,219,0.08)] text-[#2B59DB]',
};

const actionLinkClass =
  'cursor-pointer border-0 bg-transparent p-0 text-[0.85rem] font-bold text-blue-600 hover:underline';

export function ProfileOrdersTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { products } = useProducts();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancellingId, setCancellingId] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(apiUrl('/api/orders'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!cancelled && data.success) {
          setOrders(
            (data.orders || []).map((order) => ({
              ...order,
              status: resolveOrderStatus(order),
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOrders();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.toLowerCase().trim();
    return orders.filter((order) => {
      const orderId = `#${order.id}`.toLowerCase();
      const delivery = getDeliveryBadge(order.status);
      const payment = getPaymentBadge(order.paymentType);
      const deliveryKey = delivery.className;
      const paymentKey = payment.label.toLowerCase();

      const matchesSearch = !query || orderId.includes(query) || order.id.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'paid' && paymentKey === 'paid') ||
        (statusFilter === 'pending' && paymentKey === 'pending') ||
        deliveryKey === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const handleTrack = (orderId) => {
    localStorage.setItem('lastTrackingCode', orderId);
    navigate('/track-order');
  };

  const handleCancel = async (order) => {
    if (resolveOrderStatus(order) !== 'processing') {
      showTopFloatNotification('This order can no longer be cancelled.', 'danger');
      return;
    }

    const confirmed = window.confirm(
      `Cancel order ${order.id}? This can only be done before shipment.`
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
        showTopFloatNotification('Order cancelled successfully.');
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
      <h1 className="mb-0.5 font-display text-[2.3rem] font-bold text-deepGreen">My Orders</h1>
      <p className="mb-2 text-[0.92rem] text-[#666666]">View and track your order history</p>

      <div className="rounded-2xl border border-black/[0.04] bg-white px-9 py-10 shadow-[0_10px_30px_rgba(7,61,53,0.03)] max-sm:px-6">
        <div className="relative mb-5 font-display text-[1.45rem] font-bold text-deepGreen">Order History</div>

        <div className="mb-5 flex flex-wrap items-center gap-4">
          <AppSearchField
            variant="full"
            id="orderSearchInput"
            placeholder="Search by Order ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="relative flex items-center">
            <i className="fa-solid fa-filter pointer-events-none absolute left-3.5 z-[2] text-[#7A6F62]" />
            <select
              className="cursor-pointer appearance-none rounded-[10px] border-[1.5px] border-black/[0.08] bg-white py-2.5 pl-9 pr-9 text-[0.9rem] font-semibold text-[#111111] outline-none transition-all duration-[250ms] focus:border-deepGreen"
              id="orderStatusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="delivered">Delivered</option>
              <option value="out-for-delivery">Out for Delivery</option>
              <option value="processing">Processing</option>
            </select>
          </div>
        </div>

        <div className="max-h-[290px] w-full overflow-x-auto overflow-y-auto rounded-xl border border-black/[0.04]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b-2 border-black/[0.06] px-3 py-2.5 text-left text-[0.8rem] font-extrabold uppercase tracking-wide text-[#7A6F62]">
                  Order ID
                </th>
                <th className="border-b-2 border-black/[0.06] px-3 py-2.5 text-left text-[0.8rem] font-extrabold uppercase tracking-wide text-[#7A6F62]">
                  Date
                </th>
                <th className="border-b-2 border-black/[0.06] px-3 py-2.5 text-left text-[0.8rem] font-extrabold uppercase tracking-wide text-[#7A6F62]">
                  Product
                </th>
                <th className="border-b-2 border-black/[0.06] px-3 py-2.5 text-left text-[0.8rem] font-extrabold uppercase tracking-wide text-[#7A6F62]">
                  Items
                </th>
                <th className="border-b-2 border-black/[0.06] px-3 py-2.5 text-left text-[0.8rem] font-extrabold uppercase tracking-wide text-[#7A6F62]">
                  Total
                </th>
                <th className="border-b-2 border-black/[0.06] px-3 py-2.5 text-left text-[0.8rem] font-extrabold uppercase tracking-wide text-[#7A6F62]">
                  Payment Status
                </th>
                <th className="border-b-2 border-black/[0.06] px-3 py-2.5 text-left text-[0.8rem] font-extrabold uppercase tracking-wide text-[#7A6F62]">
                  Delivery Status
                </th>
                <th className="border-b-2 border-black/[0.06] px-3 py-2.5 text-left text-[0.8rem] font-extrabold uppercase tracking-wide text-[#7A6F62]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody id="ordersTableBody">
              {loading && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px' }}>
                    Loading orders...
                  </td>
                </tr>
              )}
              {!loading && filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#888' }}>
                    No orders found. <Link to="/products">Start shopping</Link>
                  </td>
                </tr>
              )}
              {!loading &&
                filteredOrders.map((order) => {
                  const imgSrc = findProductImage(products, order.product);
                  const payment = getPaymentBadge(order.paymentType);
                  const delivery = getDeliveryBadge(order.status);
                  const amountNum = parseFloat(String(order.amount).replace(/[^0-9.]/g, '')) || 0;
                  const itemCount = countOrderItems(order);
                  const canCancel = resolveOrderStatus(order) === 'processing';

                  return (
                    <tr key={order.id} className="border-b border-black/[0.05]">
                      <td className="px-3 py-2.5 text-[0.88rem] font-extrabold text-deepGreen">#{order.id}</td>
                      <td className="px-3 py-2.5 text-[0.88rem] text-[#666666]">{order.date}</td>
                      <td className="px-3 py-2.5">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={order.product}
                            className="h-10 w-10 rounded-md border border-black/[0.04] bg-[#FAF8F5] object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-black/[0.04] bg-gray-100 text-gray-400">
                            <i className="fa-solid fa-couch" />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[0.88rem] font-bold text-[#111111]">{order.product}</span>
                          <span className="text-[0.78rem] font-semibold text-[#777777]">Qty: {itemCount}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[0.88rem] font-bold text-[#111111]">
                        {order.amount?.startsWith('$') ? order.amount : formatMoney(amountNum)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-block rounded-lg px-3 py-1.5 text-center text-[0.82rem] font-bold ${STATUS_BADGE[payment.className] || STATUS_BADGE.pending}`}
                        >
                          {payment.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-block rounded-lg px-3 py-1.5 text-center text-[0.82rem] font-bold ${STATUS_BADGE[delivery.className] || STATUS_BADGE.pending}`}
                        >
                          {delivery.label}
                        </span>
                        {(order.deliveryDate || order.deliveryTime) && (
                          <div className="mt-1 text-xs text-gray-500">
                            {order.deliveryDate}
                            {order.deliveryTime ? ` ${order.deliveryTime}` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col items-start gap-1">
                          <button type="button" className={actionLinkClass} onClick={() => handleTrack(order.id)}>
                            Track
                          </button>
                          <button
                            type="button"
                            className={actionLinkClass}
                            onClick={() =>
                              downloadInvoice({
                                trackingCode: order.id,
                                customer: order.customer,
                                phone: order.phone,
                                address: order.address,
                                payment: order.payment,
                                paymentMethod: order.paymentMethod,
                                items: order.items || [{ title: order.product, quantity: 1, price: amountNum }],
                                total: amountNum,
                                deliveryDate: order.deliveryDate,
                                deliveryTime: order.deliveryTime,
                              })
                            }
                          >
                            PDF
                          </button>
                          {canCancel && (
                            <button
                              type="button"
                              className={`${actionLinkClass} text-red-600`}
                              disabled={cancellingId === order.id}
                              onClick={() => handleCancel(order)}
                            >
                              {cancellingId === order.id ? 'Cancelling…' : 'Cancel'}
                            </button>
                          )}
                        </div>
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


/* ═══ SECTION: HELP TAB ═══ */

const FALLBACK_FAQS = [
  {
    icon: 'fa-solid fa-box',
    title: 'How can I track my order?',
    body: 'You can track your order from the Track Order page. Enter your Order ID to view your order status and latest updates.',
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
  const [openIndex, setOpenIndex] = useState(0);
  const faqItems = items?.length ? items : FALLBACK_FAQS;

  return (
    <div className="flex flex-grow flex-col gap-3 overflow-y-auto pr-1">
      {faqItems.map((item, index) => {
        const isOpen = openIndex === index;
        const title = item.question || item.title;
        const body = item.answer || item.body;
        return (
          <div
            key={title}
            className={`shrink-0 overflow-hidden rounded-xl border-[1.5px] bg-white transition-all duration-300 ${
              isOpen ? 'border-deepGreen shadow-[0_4px_15px_rgba(7,61,53,0.04)]' : 'border-black/[0.06]'
            }`}
          >
            <button
              type="button"
              className={`flex w-full items-center justify-between border-0 px-5 py-4 text-left transition-colors duration-300 ${
                isOpen ? 'bg-[#f4f7f5]' : 'bg-white hover:bg-[#fbfaf8]'
              }`}
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
            >
              <div className="flex items-center gap-4">
                <span className="flex h-6 w-6 items-center justify-center text-[1.15rem] text-deepGreen">
                  <i className={item.icon || 'fa-solid fa-circle-question'} />
                </span>
                <span className="text-[0.88rem] font-semibold text-[#1c3022]">{title}</span>
              </div>
              <i className={`fa-solid ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-[0.85rem] text-gray-500`} />
            </button>
            {isOpen && (
              <div className="border-t-[1.5px] border-black/[0.06] bg-white px-5 py-4 text-[0.84rem] leading-relaxed text-gray-600">
                {body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const cardClass =
  'flex h-[560px] flex-col rounded-2xl border border-black/[0.06] bg-white p-[30px] shadow-[0_4px_20px_rgba(0,0,0,0.015)]';

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

  const {
    tickets,
    activeTicket,
    messages,
    view,
    sending,
    createConversation,
    sendMessage,
    openTicket,
    backToForm,
    formatPastChatTime,
  } = supportChat;

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [chatInput, setChatInput] = useState('');
  const messagesRef = useRef(null);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, view]);

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !message.trim()) return;
    const ok = await createConversation(subject, message.trim());
    if (ok) {
      setSubject('');
      setMessage('');
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const ok = await sendMessage(chatInput);
    if (ok) setChatInput('');
  };

  const statusBadgeClass =
    activeTicket?.status === 'Open'
      ? 'bg-amber-400 text-gray-900'
      : activeTicket?.status === 'Replied'
        ? 'bg-green-600 text-white'
        : 'bg-gray-500 text-white';

  return (
    <div>
      <h1 className="mb-1.5 font-display text-[2.2rem] font-extrabold text-deepGreen">Help & Support</h1>
      <p className="mb-6 text-[0.88rem] font-medium text-gray-500">
        <Link to="/" className="font-semibold text-deepGreen no-underline hover:underline">
          Home
        </Link>
        <span className="mx-2 text-gray-400">&gt;</span>
        <span>Help & Support</span>
      </p>

      <div className="mb-3 grid gap-3 lg:grid-cols-2">
        <div className={cardClass} id="customerSupportCard">
          {view === 'form' ? (
            <div className="flex h-full flex-col overflow-hidden">
              <h3 className="mb-6 text-[1.25rem] font-bold text-deepGreen">Submit a Support Request</h3>
              <form className="shrink-0" onSubmit={handleSupportSubmit}>
                <label htmlFor="customerSupportSubject" className="mb-2 block text-[0.82rem] font-bold text-[#1c3022]">
                  Subject
                </label>
                <div className="relative mb-5">
                  <select
                    id="customerSupportSubject"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-[10px] border-[1.5px] border-black/[0.08] bg-white px-4 py-3 text-[0.88rem] text-gray-600 outline-none transition-all duration-300 focus:border-deepGreen focus:shadow-[0_0_0_3px_rgba(7,61,53,0.08)]"
                  >
                    <option value="" disabled>
                      Select a subject
                    </option>
                    <option value="Payment Issue">Payment Issue</option>
                    <option value="Delivery Delay">Delivery Delay</option>
                    <option value="Product Damage">Product Damage</option>
                    <option value="Account Issue">Account Issue</option>
                  </select>
                  <i className="fa-solid fa-chevron-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[0.8rem] text-gray-500" />
                </div>

                <label htmlFor="customerSupportMessage" className="mb-2 block text-[0.82rem] font-bold text-[#1c3022]">
                  Message
                </label>
                <div className="relative w-full">
                  <textarea
                    id="customerSupportMessage"
                    placeholder="Write your problem here..."
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[180px] w-full resize-none rounded-xl border-[1.5px] border-black/[0.08] px-4 py-4 pr-12 text-[0.88rem] outline-none transition-all duration-300 focus:border-deepGreen focus:shadow-[0_0_0_3px_rgba(7,61,53,0.08)]"
                  />
                  <button
                    type="submit"
                    className="absolute bottom-5 right-5 flex items-center justify-center border-0 bg-transparent p-0 text-[1.3rem] text-deepGreen transition-all duration-200 hover:scale-110 hover:text-[#0b5e52] active:scale-95 disabled:opacity-50"
                    title="Submit Request"
                    disabled={sending}
                  >
                    <i className="fa-regular fa-paper-plane" />
                  </button>
                </div>
              </form>

              {tickets.length > 0 && (
                <div className="mt-3 overflow-y-auto">
                  <h4 className="mb-2.5 text-[0.85rem] font-bold">Past Conversations</h4>
                  <div id="customerPastChatsList">
                    {tickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        type="button"
                        className="mb-1.5 flex w-full cursor-pointer items-center justify-between rounded-lg border border-deepGreen/[0.05] bg-base px-3 py-2.5 text-left transition-all duration-200 hover:translate-x-0.5 hover:bg-deepGreen/[0.03]"
                        onClick={() => openTicket(ticket.id)}
                      >
                        <div className="mr-2 min-w-0 flex-1">
                          <div className="text-[0.8rem] font-bold text-deepGreen">{ticket.subject}</div>
                          <div className="max-w-[180px] truncate text-[0.72rem] text-[#666666]">
                            {ticket.lastMessageText || ticket.subject || 'No messages'}
                          </div>
                        </div>
                        <div className="shrink-0 text-[0.68rem] text-[#888888]">
                          {formatPastChatTime(ticket.lastMessageAt)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="mb-2 flex shrink-0 items-center justify-between border-b border-gray-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-deepGreen text-[0.8rem] font-bold text-white">
                    {(activeTicket?.subject || 'S').slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <span className="block max-w-[140px] truncate text-[0.85rem] font-bold text-[#111111]">
                      {activeTicket?.subject || 'Subject'}
                    </span>
                    <span className={`inline-block rounded px-1.5 py-0.5 text-[0.6rem] ${statusBadgeClass}`}>
                      {activeTicket?.status || 'Open'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-md border border-gray-300 px-2 py-1 text-[0.75rem] text-gray-600 transition-colors hover:bg-gray-50"
                  onClick={backToForm}
                >
                  <i className="fa-solid fa-arrow-left mr-1" /> Back
                </button>
              </div>

              <div
                ref={messagesRef}
                className="mb-2 flex max-h-80 flex-grow flex-col overflow-y-auto rounded-xl border border-black/[0.03] bg-[#f9f9f9] p-2"
                id="customerChatMessagesList"
              >
                {messages.map((msg) => {
                  const isSent = msg.senderRole === 'user';
                  return (
                    <div
                      key={msg.id || `${msg.createdAt}-${msg.messageText}`}
                      className={`mb-2 flex w-full ${isSent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`relative max-w-[80%] rounded-xl px-3.5 py-2.5 text-[0.82rem] leading-snug ${
                          isSent
                            ? 'rounded-br-sm bg-deepGreen text-white'
                            : 'rounded-bl-sm border border-black/[0.05] bg-gray-200 text-gray-800'
                        }`}
                      >
                        <div className="mb-0.5 text-[0.65rem] font-bold opacity-85">
                          {isSent ? 'Aniga' : 'Support Team'}
                        </div>
                        {msg.messageText}
                        <span className="mt-1 block text-right text-[0.6rem] opacity-70">
                          {formatChatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form className="flex shrink-0 gap-2" onSubmit={handleChatSubmit}>
                <input
                  type="text"
                  id="customerChatMessageInput"
                  placeholder="Write your message here..."
                  className="flex-grow rounded-lg border border-gray-200 px-3 py-2 text-[0.85rem] outline-none focus:border-deepGreen focus:shadow-[0_0_0_3px_rgba(7,61,53,0.08)]"
                  required
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={sending}
                />
                <button
                  type="submit"
                  className="rounded-lg border-0 bg-deepGreen px-4 py-2 text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  disabled={sending}
                >
                  <i className="fa-regular fa-paper-plane" />
                </button>
              </form>
            </div>
          )}
        </div>

        <div className={cardClass}>
          <h3 className="mb-6 text-[1.25rem] font-bold text-deepGreen">Quick Help / FAQ</h3>
          <FaqAccordion items={faqItems} />
        </div>
      </div>
    </div>
  );
}
