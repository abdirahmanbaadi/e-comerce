import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OrderConfirmModal, { PaymentFailedCompactModal } from '../../features/checkout/CheckoutModals';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { validateCartItems, validateCouponCode } from '../../utils/cartApi';
import {
  apiUrl,
  DELIVERY_DISTRICTS,
  fetchDeliveryDistricts,
  findDistrictByDeliveryFee,
  getDistrictFee,
} from '../../utils/data';
import {
  buildCheckoutPhone,
  CHECKOUT_PHONE_PREFIX,
  CHECKOUT_PHONE_SUFFIX_KEY,
  isValidSomaliMobile,
  readCheckoutPhoneSuffix,
} from '../../utils/phone';
import { formatMoney, productImage } from '../../utils/format';
import { showTopFloatNotification } from '../../utils/notifications';
import { submitWaafiPayment } from '../../utils/waafiPayment';

const DEFAULT_DISTRICTS = DELIVERY_DISTRICTS.map((d) => ({
  ...d,
  label: `${d.value} — ${formatMoney(d.fee)}`,
}));

const CHECKOUT_DISTRICT_KEY = 'cartDistrict';

function getMinDeliveryDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function generatePaymentReference() {
  return `EVC-MMF-${Math.floor(100000 + Math.random() * 900000)}`;
}

function fieldClass(hasError) {
  return `h-12 w-full rounded-2xl border px-4 text-[0.86rem] font-semibold outline-none ${
    hasError
      ? 'border-[#e07a6a] bg-[#fff5f3]'
      : 'border-[#eadfce] bg-white focus:border-[#6b4228]'
  }`;
}

export default function MobileCheckout() {
  const navigate = useNavigate();
  const { user, syncFromStorage: syncAuth } = useAuth();
  const { cartItems, clearCart, setCartItems, syncFromStorage } = useCart();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    district: '',
    address: '',
    deliveryDate: '',
    deliveryTime: 'Morning',
  });
  const [errors, setErrors] = useState({});
  const [paymentReference] = useState(generatePaymentReference);
  const [deliveryFee, setDeliveryFee] = useState(
    () => Number(localStorage.getItem('cartDeliveryFee')) || 0
  );
  const [discount, setDiscount] = useState(() => Number(localStorage.getItem('cartDiscount')) || 0);
  const [couponInput, setCouponInput] = useState(
    () => localStorage.getItem('cartCouponCode') || localStorage.getItem('mmf_mobile_coupon') || ''
  );
  const [couponCode, setCouponCode] = useState(
    () => localStorage.getItem('cartCouponCode') || ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [evcAwaitingPin, setEvcAwaitingPin] = useState(false);
  const [confirmOrder, setConfirmOrder] = useState(null);
  const [failedOrder, setFailedOrder] = useState(null);
  const suppressFailModalRef = useRef(false);
  const pendingRetryOrderRef = useRef(null);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [districts, setDistricts] = useState(DEFAULT_DISTRICTS);
  const [waafiConfigured, setWaafiConfigured] = useState(true);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const minDeliveryDate = useMemo(() => getMinDeliveryDate(), []);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0),
    [cartItems]
  );
  const total = useMemo(
    () => Math.max(subtotal + deliveryFee - discount, 0),
    [subtotal, deliveryFee, discount]
  );

  useEffect(() => {
    syncFromStorage();
    syncAuth();
  }, [syncFromStorage, syncAuth]);

  useEffect(() => {
    if (!user.isLoggedIn && cartItems.length > 0) {
      showTopFloatNotification('Sign in to complete checkout.', 'danger');
      navigate('/app/login', { replace: true, state: { from: '/app/checkout' } });
    }
  }, [user.isLoggedIn, cartItems.length, navigate]);

  useEffect(() => {
    if (cartItems.length === 0 && !confirmOrder && !failedOrder) {
      navigate('/app/cart', { replace: true });
    }
  }, [cartItems.length, confirmOrder, failedOrder, navigate]);

  useEffect(() => {
    fetch(apiUrl('/api/payments/config'))
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setWaafiConfigured(data.waafiConfigured);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchDeliveryDistricts().then((list) => {
      setDistricts(list.map((d) => ({ ...d, label: `${d.value} — ${formatMoney(d.fee)}` })));
    });
  }, []);

  useEffect(() => {
    const savedDistrict = localStorage.getItem(CHECKOUT_DISTRICT_KEY);
    const savedFee = Number(localStorage.getItem('cartDeliveryFee')) || 0;
    const district =
      savedDistrict && savedDistrict !== '0' ? savedDistrict : findDistrictByDeliveryFee(savedFee);
    const fee = district ? getDistrictFee(district, districts) : savedFee;
    const savedPhoneSuffix = readCheckoutPhoneSuffix();

    setForm((prev) => ({
      ...prev,
      name: prev.name || (user.isLoggedIn ? user.fullName : '') || '',
      phone: prev.phone || savedPhoneSuffix,
      email: prev.email || (user.isLoggedIn ? user.email : '') || '',
      address: prev.address || (user.isLoggedIn ? user.address : '') || '',
      district: prev.district || district || '',
    }));
    setDeliveryFee(fee > 0 ? fee : savedFee);
    if (district) {
      localStorage.setItem(CHECKOUT_DISTRICT_KEY, district);
      localStorage.setItem('cartDeliveryFee', String(getDistrictFee(district, districts)));
    }
  }, [user, districts]);

  useEffect(() => {
    localStorage.setItem('cartDeliveryFee', String(deliveryFee));
  }, [deliveryFee]);

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: false }));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 7);
    setForm((prev) => ({ ...prev, phone: value }));
    localStorage.setItem(CHECKOUT_PHONE_SUFFIX_KEY, value);
    setErrors((prev) => ({ ...prev, phone: false }));
  };

  const handleDistrictChange = (e) => {
    const value = e.target.value;
    const district = districts.find((d) => d.value === value);
    setForm((prev) => ({ ...prev, district: value }));
    setDeliveryFee(district?.fee || 0);
    localStorage.setItem(CHECKOUT_DISTRICT_KEY, value);
    localStorage.setItem('cartDeliveryFee', String(district?.fee || 0));
    setErrors((prev) => ({ ...prev, district: false }));
  };

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) {
      setDiscount(0);
      setCouponCode('');
      localStorage.setItem('cartDiscount', '0');
      localStorage.removeItem('cartCouponCode');
      showTopFloatNotification('Enter coupon code');
      return;
    }
    setApplyingCoupon(true);
    try {
      const data = await validateCouponCode(code, subtotal, cartItems);
      if (data.success) {
        setDiscount(data.discount);
        setCouponCode(data.code);
        localStorage.setItem('cartDiscount', String(data.discount));
        localStorage.setItem('cartCouponCode', data.code);
        localStorage.setItem('mmf_mobile_coupon', data.code);
        showTopFloatNotification(data.message || 'Coupon applied');
      } else {
        setDiscount(0);
        setCouponCode('');
        localStorage.setItem('cartDiscount', '0');
        localStorage.removeItem('cartCouponCode');
        showTopFloatNotification(data.message || 'Invalid coupon code', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not validate coupon.', 'danger');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const validate = () => {
    const nextErrors = {
      name: !form.name.trim(),
      phone: !form.phone.trim(),
      district: !form.district.trim(),
      address: !form.address.trim(),
    };
    setErrors(nextErrors);

    if (cartItems.length === 0) {
      showTopFloatNotification('Cart is empty.', 'danger');
      return false;
    }
    if (!waafiConfigured) {
      showTopFloatNotification('EVC Plus is temporarily unavailable.', 'danger');
      return false;
    }
    const fullPhone = buildCheckoutPhone(form.phone);
    if (!isValidSomaliMobile(fullPhone)) {
      showTopFloatNotification('Enter a valid number after +25261 (e.g. 2345678).', 'danger');
      setErrors((prev) => ({ ...prev, phone: true }));
      return false;
    }
    return !Object.values(nextErrors).some(Boolean);
  };

  const buildOrderSnapshot = (fields) => ({ ...fields });

  const handlePlaceOrder = async () => {
    if (!validate()) return;

    const fullPhone = buildCheckoutPhone(form.phone);
    localStorage.setItem(CHECKOUT_PHONE_SUFFIX_KEY, form.phone.replace(/\D/g, ''));
    setSubmitting(true);
    setEvcAwaitingPin(true);
    suppressFailModalRef.current = false;

    try {
      const resolvedDeliveryFee = form.district
        ? getDistrictFee(form.district, districts)
        : deliveryFee;

      const validation = await validateCartItems(cartItems);
      if (!validation.success || !validation.valid) {
        showTopFloatNotification(validation.message || 'Cart validation failed.', 'danger');
        if (validation.items?.length) {
          setCartItems(validation.items.map(({ maxStock, stockOk, priceChanged, ...item }) => item));
        }
        navigate('/app/cart');
        return;
      }

      const freshItems = (validation.items || cartItems).map(
        ({ maxStock, stockOk, priceChanged, ...item }) => item
      );
      if (freshItems.length !== cartItems.length) setCartItems(freshItems);

      const freshSubtotal = freshItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const freshTotal = Math.max(freshSubtotal + resolvedDeliveryFee - discount, 0);

      const orderPayload = {
        phone: fullPhone,
        customer: form.name.trim(),
        email: form.email.trim(),
        amount: formatMoney(freshTotal),
        subtotal: freshSubtotal,
        deliveryFee: resolvedDeliveryFee,
        discount,
        couponCode,
        address: `${form.address.trim()}, ${form.district} District, Mogadishu`,
        district: form.district,
        product: freshItems.map((item) => item.title).join(', '),
        items: freshItems.map((item) => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          category: item.category,
          image: item.image,
        })),
        deliveryDate: form.deliveryDate,
        deliveryTime: form.deliveryTime,
        paymentMethod: 'EVC Plus',
        paymentType: 'pending',
        paymentReference,
      };

      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(apiUrl('/api/orders'), {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload),
      });
      const data = await response.json();
      if (!data.success) {
        showTopFloatNotification(data.message || 'Order failed', 'danger');
        return;
      }

      const trackingCode = data.order.id;
      let paymentStatus = 'Pending';
      let paymentLabelFinal = 'EVC Plus - Pending Confirmation';
      let paymentTransactionId = '';
      let paymentFailureMessage = '';

      showTopFloatNotification(`Check phone ${fullPhone} — approve EVC Plus and enter your PIN.`);

      const payResponse = await fetch(apiUrl('/api/payments/waafi'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          orderId: trackingCode,
          accountNo: fullPhone,
          amount: freshTotal,
          paymentReference,
          description: `Mogadishu Modern Furniture ${trackingCode}`,
        }),
      });
      const payData = await payResponse.json();

      const orderDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      const snapshot = buildOrderSnapshot({
        trackingCode,
        customer: form.name.trim(),
        phone: fullPhone,
        email: form.email.trim(),
        address: `${form.address.trim()}, ${form.district} District, Mogadishu`,
        payment: paymentLabelFinal,
        paymentMethod: 'EVC Plus',
        paymentStatus,
        paymentFailureMessage,
        paymentReference,
        transactionId: paymentTransactionId,
        date: orderDate,
        items: freshItems.map((item) => ({ ...item })),
        subtotal: freshSubtotal,
        discount,
        deliveryFee: resolvedDeliveryFee,
        total: formatMoney(freshTotal),
        deliveryDate: form.deliveryDate,
        deliveryTime: form.deliveryTime,
      });

      if (payData.success) {
        snapshot.paymentStatus = 'Paid';
        snapshot.payment = 'EVC Plus - Paid via Waafi';
        snapshot.transactionId = payData.transactionId || '';
        showTopFloatNotification('Payment approved. Order confirmed!');
        clearCart();
        localStorage.removeItem('cartDiscount');
        localStorage.removeItem('cartCouponCode');
        localStorage.removeItem('mmf_mobile_coupon');
        localStorage.setItem('cartDeliveryFee', '0');
        setFailedOrder(null);
        setConfirmOrder(snapshot);
      } else {
        snapshot.paymentStatus = 'Failed';
        snapshot.payment = 'EVC Plus - Payment Failed';
        snapshot.paymentFailureMessage = payData.message || '';
        setConfirmOrder(null);
        if (!suppressFailModalRef.current) setFailedOrder(snapshot);
        else {
          showTopFloatNotification(
            payData.message || 'Payment not completed. Approve the EVC prompt on your phone.',
            'danger'
          );
        }
        pendingRetryOrderRef.current = snapshot;
      }

      localStorage.setItem('lastTrackingCode', trackingCode);
      const ordersList = JSON.parse(localStorage.getItem('orders') || '[]');
      ordersList.unshift(data.order);
      localStorage.setItem('orders', JSON.stringify(ordersList));
    } catch {
      showTopFloatNotification('Could not connect to the server.', 'danger');
    } finally {
      setEvcAwaitingPin(false);
      setSubmitting(false);
    }
  };

  const handleRetryPayment = async () => {
    const order = failedOrder || pendingRetryOrderRef.current;
    if (!order || order.paymentStatus === 'Paid') return;
    suppressFailModalRef.current = true;
    setFailedOrder(null);
    setRetryingPayment(true);
    setEvcAwaitingPin(true);
    try {
      const amount = Number(String(order.total).replace(/[^0-9.]/g, '')) || 0;
      const { data } = await submitWaafiPayment({
        orderId: order.trackingCode,
        accountNo: order.phone,
        amount,
        paymentReference: order.paymentReference,
        description: `Retry payment for ${order.trackingCode}`,
      });
      if (data.success) {
        setConfirmOrder({
          ...order,
          paymentStatus: 'Paid',
          payment: 'EVC Plus - Paid via Waafi',
          transactionId: data.transactionId || order.transactionId,
          paymentFailureMessage: '',
        });
        pendingRetryOrderRef.current = null;
        clearCart();
        localStorage.removeItem('cartDiscount');
        localStorage.removeItem('cartCouponCode');
        localStorage.removeItem('mmf_mobile_coupon');
        localStorage.setItem('cartDeliveryFee', '0');
        showTopFloatNotification('Payment approved. Order confirmed!');
      } else {
        pendingRetryOrderRef.current = {
          ...order,
          paymentFailureMessage: data.message || order.paymentFailureMessage,
        };
        showTopFloatNotification(data.message || 'Payment failed.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not connect to payment server.', 'danger');
    } finally {
      setRetryingPayment(false);
      setEvcAwaitingPin(false);
    }
  };

  const handleCancelFailedOrder = async () => {
    const order = failedOrder || pendingRetryOrderRef.current;
    if (!order?.trackingCode) return;
    if (!window.confirm('Cancel this order?')) return;
    setCancellingOrder(true);
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      const response = await fetch(
        apiUrl(`/api/orders/cancel/${encodeURIComponent(order.trackingCode)}`),
        { method: 'PATCH', headers, body: JSON.stringify({ phone: order.phone }) }
      );
      const data = await response.json();
      if (data.success) {
        pendingRetryOrderRef.current = null;
        setFailedOrder(null);
        showTopFloatNotification(data.message || 'Order cancelled.');
        navigate('/app/profile/orders');
      } else {
        showTopFloatNotification(data.message || 'Could not cancel.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not connect to the server.', 'danger');
    } finally {
      setCancellingOrder(false);
    }
  };

  if (!user.isLoggedIn || (cartItems.length === 0 && !confirmOrder && !failedOrder)) {
    return (
      <div className="mmf-pwa flex min-h-[100dvh] items-center justify-center bg-[#fff7ed] font-sans">
        <p className="m-0 text-[0.88rem] font-bold text-[#6b4228]">
          <i className="fa-solid fa-spinner fa-spin mr-2" />
          Redirecting…
        </p>
      </div>
    );
  }

  return (
    <div className="mmf-pwa min-h-[100dvh] bg-[#fff7ed] font-sans text-[#111111]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#f0e9df] bg-[#fff7ed] px-4 py-3 pt-[max(0.7rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => navigate('/app/cart')}
          className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white text-[#2f241a] shadow-sm"
          aria-label="Back to cart"
        >
          <i className="fa-solid fa-chevron-left text-[0.85rem]" />
        </button>
        <h1 className="m-0 text-[0.98rem] font-black text-[#2f241a]">Checkout</h1>
        <span className="h-10 w-10" aria-hidden="true" />
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-4">
        <section className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-[#f0e9df]">
          <h2 className="mb-3 mt-0 text-[0.92rem] font-black text-[#1c140e]">Delivery details</h2>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[0.74rem] font-bold text-[#8b8178]">Full name *</span>
              <input
                value={form.name}
                onChange={update('name')}
                placeholder="Your name"
                className={fieldClass(errors.name)}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[0.74rem] font-bold text-[#8b8178]">Phone *</span>
              <div
                className={`flex overflow-hidden rounded-2xl border ${
                  errors.phone ? 'border-[#e07a6a] bg-[#fff5f3]' : 'border-[#eadfce] bg-white'
                }`}
              >
                <span className="flex items-center border-r border-[#eadfce] bg-[#faf7f2] px-3 text-[0.82rem] font-black text-[#6b4228]">
                  {CHECKOUT_PHONE_PREFIX}
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={form.phone}
                  onChange={handlePhoneChange}
                  placeholder="2345678"
                  className="h-12 min-w-0 flex-1 border-0 bg-transparent px-3 text-[0.86rem] font-semibold outline-none"
                />
              </div>
              <span className="mt-1 block text-[0.68rem] font-semibold text-[#9a8d82]">
                EVC Plus lacagta ka jarayaa lambarkan.
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[0.74rem] font-bold text-[#8b8178]">Email (optional)</span>
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="you@email.com"
                className={fieldClass(false)}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[0.74rem] font-bold text-[#8b8178]">District *</span>
              <select
                value={form.district}
                onChange={handleDistrictChange}
                className={fieldClass(errors.district)}
              >
                <option value="">Select district</option>
                {districts.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[0.74rem] font-bold text-[#8b8178]">Address *</span>
              <textarea
                value={form.address}
                onChange={update('address')}
                rows={2}
                placeholder="Street, landmark…"
                className={`${fieldClass(errors.address)} h-auto py-3`}
              />
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <label className="block">
                <span className="mb-1.5 block text-[0.74rem] font-bold text-[#8b8178]">Date</span>
                <input
                  type="date"
                  min={minDeliveryDate}
                  value={form.deliveryDate}
                  onChange={update('deliveryDate')}
                  className={fieldClass(false)}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[0.74rem] font-bold text-[#8b8178]">Time</span>
                <select value={form.deliveryTime} onChange={update('deliveryTime')} className={fieldClass(false)}>
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                </select>
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-[#f0e9df]">
          <h2 className="mb-3 mt-0 text-[0.92rem] font-black text-[#1c140e]">
            Items ({cartItems.reduce((n, i) => n + Number(i.quantity || 1), 0)})
          </h2>
          <div className="space-y-2.5">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#efe7dc]">
                  {item.image ? (
                    <img src={productImage(item.image)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#cbbba8]">
                      <i className="fa-solid fa-couch" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-[0.82rem] font-black text-[#1c140e]">{item.title}</p>
                  <p className="mb-0 mt-0.5 text-[0.7rem] font-semibold text-[#8b8178]">Qty: {item.quantity}</p>
                </div>
                <p className="m-0 text-[0.82rem] font-black text-[#1c140e]">
                  {formatMoney(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-[#f0e9df]">
          <h2 className="mb-3 mt-0 text-[0.92rem] font-black text-[#1c140e]">Coupon</h2>
          <div className="flex gap-2">
            <input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="Enter code"
              className="h-11 min-w-0 flex-1 rounded-2xl border border-[#eadfce] bg-[#faf7f2] px-4 text-[0.82rem] font-semibold outline-none focus:border-[#6b4228]"
            />
            <button
              type="button"
              onClick={applyCoupon}
              disabled={applyingCoupon}
              className="rounded-2xl border-0 bg-[#2f241a] px-4 text-[0.78rem] font-black text-white disabled:opacity-60"
            >
              {applyingCoupon ? '…' : 'Apply'}
            </button>
          </div>
        </section>

        <section className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-[#f0e9df]">
          <div className="flex items-center justify-between text-[0.82rem] font-semibold text-[#7d6d60]">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[0.82rem] font-semibold text-[#7d6d60]">
            <span>Delivery Fee</span>
            <span>{form.district ? formatMoney(deliveryFee) : 'Select district'}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[0.82rem] font-semibold text-[#7d6d60]">
            <span>Discount</span>
            <span>{discount > 0 ? `-${formatMoney(discount)}` : formatMoney(0)}</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#eadfce] pt-3">
            <span className="text-[1.05rem] font-black text-[#6b4228]">Total</span>
            <span className="text-[1.05rem] font-black text-[#6b4228]">{formatMoney(total)}</span>
          </div>
          <p className="mb-0 mt-3 flex items-center gap-2 text-[0.74rem] font-semibold text-[#8b8178]">
            <i className="fa-solid fa-mobile-screen-button text-[#6b4228]" />
            Pay with EVC Plus (Waafi)
          </p>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-[#f0e9df] bg-[#fff7ed] px-4 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={submitting || evcAwaitingPin}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border-0 bg-[#6b4228] text-[0.92rem] font-black text-white disabled:opacity-60"
        >
          {submitting || evcAwaitingPin ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" />
              {evcAwaitingPin ? 'Approve on phone…' : 'Placing order…'}
            </>
          ) : (
            <>
              Place order · {formatMoney(total)}
            </>
          )}
        </button>
      </div>

      <OrderConfirmModal
        isOpen={Boolean(confirmOrder)}
        order={confirmOrder}
        onClose={() => {
          setConfirmOrder(null);
          navigate('/app/profile/orders');
        }}
      />
      <PaymentFailedCompactModal
        isOpen={Boolean(failedOrder)}
        order={failedOrder}
        onClose={() => setFailedOrder(null)}
        onRetryPayment={handleRetryPayment}
        onCancelOrder={handleCancelFailedOrder}
        retryingPayment={retryingPayment}
        cancellingOrder={cancellingOrder}
      />
    </div>
  );
}
