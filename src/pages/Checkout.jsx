import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StoreNavbar from '../features/nav/StoreNavbar';
import OrderConfirmModal, { PaymentFailedCompactModal } from '../features/checkout/CheckoutModals';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { validateCartItems } from '../utils/cartApi';
import { apiUrl, DELIVERY_DISTRICTS, fetchDeliveryDistricts, findDistrictByDeliveryFee, getDistrictFee } from '../utils/data';
import {
  buildCheckoutPhone,
  CHECKOUT_PHONE_PREFIX,
  CHECKOUT_PHONE_SUFFIX_KEY,
  isValidSomaliMobile,
  readCheckoutPhoneSuffix,
} from '../utils/phone';
import { formatMoney, productImage } from '../utils/format';
import { showTopFloatNotification } from '../utils/notifications';
import { submitWaafiPayment } from '../utils/waafiPayment';

const DEFAULT_DISTRICTS = DELIVERY_DISTRICTS.map((d) => ({
  ...d,
  label: `${d.value} - ${formatMoney(d.fee)}`,
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
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return `EVC-MMF-${randomNumber}`;
}

export default function Checkout() {
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
  const [paymentMethod, setPaymentMethod] = useState('EVC Plus');
  const [paymentReference] = useState(generatePaymentReference);
  const [deliveryFee, setDeliveryFee] = useState(
    () => Number(localStorage.getItem('cartDeliveryFee')) || 0
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
  const minDeliveryDate = useMemo(() => getMinDeliveryDate(), []);

  const discount = useMemo(
    () => (cartItems.length > 0 ? Number(localStorage.getItem('cartDiscount')) || 0 : 0),
    [cartItems.length]
  );

  const couponCode = useMemo(
    () => localStorage.getItem('cartCouponCode') || '',
    [cartItems.length]
  );

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
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
      navigate('/cart', { replace: true, state: { showCheckoutAuth: true } });
    }
  }, [user.isLoggedIn, cartItems.length, navigate]);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [cartItems.length, navigate]);

  useEffect(() => {
    fetch(apiUrl('/api/payments/config'))
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setWaafiConfigured(data.waafiConfigured);
          setPaymentMethod('EVC Plus');
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchDeliveryDistricts().then((list) => {
      setDistricts(
        list.map((d) => ({
          ...d,
          label: `${d.value} - ${formatMoney(d.fee)}`,
        }))
      );
    });

    const refreshDistricts = () => {
      fetchDeliveryDistricts(true).then((list) => {
        setDistricts(
          list.map((d) => ({
            ...d,
            label: `${d.value} - ${formatMoney(d.fee)}`,
          }))
        );
      });
    };
    window.addEventListener('delivery-fees-updated', refreshDistricts);
    return () => window.removeEventListener('delivery-fees-updated', refreshDistricts);
  }, []);

  useEffect(() => {
    const savedDistrict = localStorage.getItem(CHECKOUT_DISTRICT_KEY);
    const savedFee = Number(localStorage.getItem('cartDeliveryFee')) || 0;
    const legacyFee = savedFee >= 1;
    const district =
      savedDistrict && savedDistrict !== '0'
        ? savedDistrict
        : findDistrictByDeliveryFee(savedFee);
    const fee = legacyFee && district ? getDistrictFee(district, districts) : savedFee;
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
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
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

  const validate = () => {
    const nextErrors = {
      name: !form.name.trim(),
      phone: !form.phone.trim(),
      district: !form.district.trim(),
      address: !form.address.trim(),
    };
    setErrors(nextErrors);

    if (cartItems.length === 0) {
      showTopFloatNotification('Cart is empty. Please add items before checkout.', 'danger');
      return false;
    }

    if (!waafiConfigured) {
      showTopFloatNotification(
        'EVC Plus is temporarily unavailable. Please try again later.',
        'danger'
      );
      return false;
    }

    const fullPhone = buildCheckoutPhone(form.phone);
    if (!isValidSomaliMobile(fullPhone)) {
      showTopFloatNotification('Enter a valid Somali mobile number after +25261 (e.g. 2345678).', 'danger');
      setErrors((prev) => ({ ...prev, phone: true }));
      return false;
    }

    return !Object.values(nextErrors).some(Boolean);
  };

  const buildOrderSnapshot = (fields) => ({
    trackingCode: fields.trackingCode,
    customer: fields.customer,
    phone: fields.phone,
    email: fields.email,
    address: fields.address,
    payment: fields.payment,
    paymentMethod: fields.paymentMethod,
    paymentStatus: fields.paymentStatus,
    paymentFailureMessage: fields.paymentFailureMessage || '',
    paymentReference: fields.paymentReference,
    transactionId: fields.transactionId || '',
    date: fields.date,
    items: fields.items,
    subtotal: fields.subtotal,
    discount: fields.discount,
    deliveryFee: fields.deliveryFee,
    total: fields.total,
    deliveryDate: fields.deliveryDate,
    deliveryTime: fields.deliveryTime,
  });

  const handlePlaceOrder = async () => {
    if (!validate()) return;

    const fullPhone = buildCheckoutPhone(form.phone);
    localStorage.setItem(CHECKOUT_PHONE_SUFFIX_KEY, form.phone.replace(/\D/g, ''));

    setSubmitting(true);
    setEvcAwaitingPin(true);
    suppressFailModalRef.current = false;
    const paymentLabel = 'EVC Plus - Pending Confirmation';

    try {
      const resolvedDeliveryFee = form.district
        ? getDistrictFee(form.district, districts)
        : deliveryFee;

      const validation = await validateCartItems(cartItems);
      if (!validation.success || !validation.valid) {
        showTopFloatNotification(validation.message || 'Cart validation failed. Return to cart.', 'danger');
        if (validation.items?.length) {
          setCartItems(validation.items.map(({ maxStock, stockOk, priceChanged, ...item }) => item));
        }
        navigate('/cart');
        return;
      }

      const freshItems = (validation.items || cartItems).map(
        ({ maxStock, stockOk, priceChanged, ...item }) => item
      );
      if (freshItems.length !== cartItems.length) {
        setCartItems(freshItems);
      }

      const freshSubtotal = freshItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
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
      let paymentLabelFinal = paymentLabel;
      let paymentTransactionId = '';
      let paymentFailureMessage = '';

      showTopFloatNotification(
        `Check phone ${fullPhone} — approve EVC Plus and enter your PIN.`
      );

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
        paymentStatus = 'Paid';
        paymentLabelFinal = 'EVC Plus - Paid via Waafi';
        paymentTransactionId = payData.transactionId || '';
        snapshot.paymentStatus = 'Paid';
        snapshot.payment = paymentLabelFinal;
        snapshot.transactionId = paymentTransactionId;
        showTopFloatNotification('Payment approved on your phone. Order confirmed!');

        clearCart();
        localStorage.removeItem('cartDiscount');
        localStorage.removeItem('cartCouponCode');
        localStorage.setItem('cartDeliveryFee', '0');

        setFailedOrder(null);
        setConfirmOrder(snapshot);
      } else {
        paymentStatus = 'Failed';
        paymentLabelFinal = 'EVC Plus - Payment Failed';
        paymentFailureMessage = payData.message || '';
        snapshot.paymentStatus = 'Failed';
        snapshot.payment = paymentLabelFinal;
        snapshot.paymentFailureMessage = paymentFailureMessage;
        setConfirmOrder(null);

        if (!suppressFailModalRef.current) {
          setFailedOrder(snapshot);
        } else {
          showTopFloatNotification(
            paymentFailureMessage ||
              'Payment not completed. Approve the EVC prompt on your phone and enter your PIN.',
            'danger'
          );
        }
        pendingRetryOrderRef.current = snapshot;
      }

      localStorage.setItem('lastTrackingCode', trackingCode);
      localStorage.setItem('lastOrderTotal', String(freshTotal));
      localStorage.setItem('lastPaymentMethod', 'EVC Plus');
      localStorage.setItem('lastPaymentReference', paymentReference);
      localStorage.setItem(
        'lastOrderDetails',
        JSON.stringify({
          orderId: trackingCode,
          customerName: form.name.trim(),
          customerPhone: fullPhone,
          customerEmail: form.email.trim(),
          district: form.district,
          deliveryAddress: `${form.address.trim()}, ${form.district} District, Mogadishu`,
          paymentMethod: 'EVC Plus',
          paymentStatus,
          orderStatus: paymentStatus === 'Paid' ? 'Confirmed' : 'Payment Pending',
          total: freshTotal,
          subtotal: freshSubtotal,
          discount,
          deliveryFee: resolvedDeliveryFee,
          items: freshItems,
        })
      );

      const ordersList = JSON.parse(localStorage.getItem('orders') || '[]');
      ordersList.unshift(data.order);
      localStorage.setItem('orders', JSON.stringify(ordersList));
    } catch {
      showTopFloatNotification(
        'Could not connect to the backend server! Please ensure it is running.',
        'danger'
      );
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
        const paidOrder = {
          ...order,
          paymentStatus: 'Paid',
          payment: 'EVC Plus - Paid via Waafi',
          transactionId: data.transactionId || order.transactionId,
          paymentFailureMessage: '',
        };
        pendingRetryOrderRef.current = null;
        setConfirmOrder(paidOrder);
        clearCart();
        localStorage.removeItem('cartDiscount');
        localStorage.removeItem('cartCouponCode');
        localStorage.setItem('cartDeliveryFee', '0');
        showTopFloatNotification('Payment approved on your phone. Order confirmed!');
      } else {
        pendingRetryOrderRef.current = {
          ...order,
          paymentFailureMessage: data.message || order.paymentFailureMessage,
        };
        showTopFloatNotification(data.message || 'Payment failed. Please try again.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not connect to the payment server.', 'danger');
    } finally {
      setRetryingPayment(false);
      setEvcAwaitingPin(false);
    }
  };

  const handleCancelFailedOrder = async () => {
    const order = failedOrder || pendingRetryOrderRef.current;
    if (!order?.trackingCode) return;

    if (!window.confirm('Cancel this order? You can place a new one anytime.')) return;

    setCancellingOrder(true);
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const response = await fetch(
        apiUrl(`/api/orders/cancel/${encodeURIComponent(order.trackingCode)}`),
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ phone: order.phone }),
        }
      );
      const data = await response.json();

      if (data.success) {
        pendingRetryOrderRef.current = null;
        setFailedOrder(null);
        showTopFloatNotification(data.message || 'Order cancelled.');
        navigate('/profile?tab=orders');
      } else {
        showTopFloatNotification(data.message || 'Could not cancel this order.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not connect to the server.', 'danger');
    } finally {
      setCancellingOrder(false);
    }
  };

  const showError = (field) => errors[field];

  if (!user.isLoggedIn || cartItems.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base font-sans">
        <div className="flex items-center gap-3 rounded-2xl border border-deepGreen/10 bg-white px-5 py-4 text-[0.88rem] font-bold text-deepGreen shadow-sm">
          <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
          Redirecting…
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page min-h-screen bg-base font-sans text-[#111]">
      <StoreNavbar />

      <section className="border-b border-black/[0.06] bg-[radial-gradient(circle_at_top_left,rgba(216,161,40,0.13),transparent_34%),linear-gradient(135deg,#FAF8F2_0%,#F4EFE6_100%)] py-16 pb-10 text-center max-sm:py-11 max-sm:pb-8">
        <div className="container">
          <span className="mb-2.5 inline-block text-[0.76rem] font-extrabold uppercase tracking-[3px] text-gold">
            Secure Checkout
          </span>
          <h1 className="mb-2.5 font-display text-[2.4rem] font-bold text-deepGreen md:text-[3.15rem]">
            Complete Your Furniture Order
          </h1>
          <p className="mx-auto mb-0 max-w-[760px] text-base font-medium leading-[1.85] text-[#5f5f5f]">
            Confirm your delivery details, pay with EVC Plus, and place your order.
            {user.isLoggedIn ? ' Your profile details are pre-filled below.' : ''}
          </p>
        </div>
      </section>

      <section className="checkout-section checkout-section--visible py-12 pb-20 max-sm:py-8 max-sm:pb-14">
          <div className="container">
            <div className="checkout-layout">
              <div>
                <div className="checkout-card">
                  <h2 className="card-title-main">Customer & Delivery Information</h2>
                  <div className="login-note">
                    <strong>Logged-in checkout:</strong> Please confirm your delivery details before
                    placing your order.
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="customerName">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="customerName"
                        placeholder="Enter full name"
                        value={form.name}
                        onChange={update('name')}
                      />
                      {showError('name') && (
                        <div className="error-text error-text--visible">Full name is required.</div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="customerPhone">
                        Phone Number *
                      </label>
                      <div className="checkout-phone-group">
                        <span className="checkout-phone-prefix" aria-hidden="true">
                          {CHECKOUT_PHONE_PREFIX}
                        </span>
                        <input
                          type="tel"
                          inputMode="numeric"
                          className="form-control checkout-phone-input"
                          id="customerPhone"
                          placeholder="2345678"
                          value={form.phone}
                          onChange={handlePhoneChange}
                          autoComplete="tel-national"
                        />
                      </div>
                      {showError('phone') && (
                        <div className="error-text error-text--visible">
                          Phone number is required.
                        </div>
                      )}
                      <div style={{ fontSize: '0.78rem', color: '#666', marginTop: 6 }}>
                        Geli lambarkaaga ka dambeeya +25261. Waafi wuxuu lacagta ka jarayaa lambarkan markaad dalbato.
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="customerEmail">
                        Email Address Optional
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="customerEmail"
                        placeholder="example@email.com"
                        value={form.email}
                        onChange={update('email')}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="districtSelect">
                        Delivery District *
                      </label>
                      <select
                        className="form-select"
                        id="districtSelect"
                        value={form.district}
                        onChange={handleDistrictChange}
                      >
                        <option value="">Select district</option>
                        {districts.map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      {showError('district') && (
                        <div className="error-text error-text--visible">
                          Please select delivery district.
                        </div>
                      )}
                    </div>

                    <div className="col-md-12">
                      <label className="form-label" htmlFor="customerAddress">
                        Full Delivery Address *
                      </label>
                      <textarea
                        className="form-control"
                        id="customerAddress"
                        rows={3}
                        placeholder="Example: Hodan, Taleex area, near main road"
                        value={form.address}
                        onChange={update('address')}
                      />
                      {showError('address') && (
                        <div className="error-text error-text--visible">
                          Delivery address is required.
                        </div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="deliveryDate">
                        Preferred Delivery Date
                      </label>
                      <input
                        type="date"
                        className="form-control checkout-date-input"
                        id="deliveryDate"
                        min={minDeliveryDate}
                        value={form.deliveryDate}
                        onChange={update('deliveryDate')}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label" htmlFor="deliveryTime">
                        Preferred Delivery Time
                      </label>
                      <select
                        className="form-select"
                        id="deliveryTime"
                        value={form.deliveryTime}
                        onChange={update('deliveryTime')}
                      >
                        <option value="Morning">Morning 8:00 AM - 12:00 PM</option>
                        <option value="Afternoon">Afternoon 12:00 PM - 4:00 PM</option>
                        <option value="Evening">Evening 4:00 PM - 8:00 PM</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="checkout-card">
                  <h2 className="card-title-main">Payment Method</h2>

                  {!waafiConfigured && (
                    <div className="login-note mb-4 border-[#f59e0b]">
                      <strong>EVC Plus unavailable:</strong> Waafi is not configured on the server.
                      Checkout cannot continue until EVC Plus is available.
                    </div>
                  )}

                  <div className="flex min-h-[118px] flex-col items-start rounded-xl border-2 border-deepGreen bg-deepGreen/[0.04] p-4 shadow-[0_4px_14px_rgba(7,61,53,0.1)]">
                    <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-deepGreen/10 text-deepGreen">
                      <i className="fa-solid fa-mobile-screen-button" />
                    </span>
                    <span className="text-[0.95rem] font-extrabold text-[#111]">EVC Plus</span>
                    <span className="mt-1 text-[0.78rem] font-semibold leading-snug text-[#666]">
                      Pay with mobile money via Waafi
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl border border-gold/35 bg-gold/[0.08] px-4 py-3 text-[0.82rem] leading-relaxed text-[#555]">
                    <p className="mb-2 font-bold text-[#333]">
                      <i className="fa-solid fa-circle-info me-1 text-gold" />
                      EVC Plus will charge the phone number above.
                    </p>
                    {form.phone.trim() ? (
                      <p className="mb-1">
                        Target: <strong>{buildCheckoutPhone(form.phone)}</strong> · Ref:{' '}
                        <strong>{paymentReference}</strong>
                      </p>
                    ) : (
                      <p className="mb-1">Enter your phone number in the form above.</p>
                    )}
                    <p className="mb-0">
                      Approve the prompt on your phone and enter your PIN after placing the order.
                    </p>
                  </div>
                </div>
              </div>

              <aside className="summary-card">
                <h2 className="summary-title">Order Summary</h2>

                <div id="orderItemsBox">
                  {cartItems.length === 0 ? (
                    <p style={{ color: '#777', fontWeight: 800 }}>
                      No cart items found. Please go back to shop.
                    </p>
                  ) : (
                    cartItems.map((item) => (
                      <div key={item.id} className="order-item">
                        <div className="order-img">
                          <img src={productImage(item.image)} alt={item.title} />
                        </div>
                        <div>
                          <div className="order-name">{item.title}</div>
                          <div className="order-meta">
                            {item.category} • Qty: {item.quantity}
                          </div>
                          <div className="order-price">
                            {formatMoney(item.price * item.quantity)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Discount</span>
                  <span>-{formatMoney(discount)}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery Fee</span>
                  <span>{formatMoney(deliveryFee)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-total">Total</span>
                  <span className="summary-total">{formatMoney(total)}</span>
                </div>

                <button
                  type="button"
                  className="place-btn"
                  onClick={handlePlaceOrder}
                  disabled={submitting || evcAwaitingPin || cartItems.length === 0 || !waafiConfigured}
                >
                  <i className={`fa-solid ${evcAwaitingPin ? 'fa-spinner fa-spin' : 'fa-circle-check'} me-2`} />
                  {evcAwaitingPin
                    ? 'Waiting for PIN on your phone…'
                    : submitting
                      ? 'Placing Order…'
                      : 'Place Order'}
                </button>

                <Link to="/cart" className="back-cart-btn">
                  <i className="fa-solid fa-arrow-left" />
                  Back to Cart
                </Link>

                <div className="security-note">
                  <i className="fa-solid fa-shield-halved me-1" />
                  Your payment and personal details are protected with secure checkout and order tracking.
                </div>
              </aside>
            </div>
          </div>
        </section>

      {evcAwaitingPin && (
        <div className="evc-pin-overlay" role="alertdialog" aria-live="assertive">
          <div className="evc-pin-card">
            <i className="fa-solid fa-mobile-screen-button fa-2x mb-3" />
            <h3>Approve payment on your phone</h3>
            <p>
              EVC Plus is contacting <strong>{buildCheckoutPhone(form.phone)}</strong>. When the prompt appears on that
              SIM, tap <strong>Approve</strong> and enter your <strong>PIN</strong>.
            </p>
            <p className="small text-muted mb-0">
              Do not close this page until payment completes (usually within 1–2 minutes).
            </p>
            <div className="evc-pin-spinner mt-3">
              <i className="fa-solid fa-spinner fa-spin me-2" />
              Waiting for Waafi…
            </div>
          </div>
        </div>
      )}

      <PaymentFailedCompactModal
        isOpen={!!failedOrder}
        order={failedOrder}
        onClose={() => setFailedOrder(null)}
        onRetryPayment={handleRetryPayment}
        onCancelOrder={handleCancelFailedOrder}
        retryingPayment={retryingPayment}
        cancellingOrder={cancellingOrder}
      />

      <OrderConfirmModal
        isOpen={!!confirmOrder}
        order={confirmOrder}
        onClose={() => setConfirmOrder(null)}
      />
    </div>
  );
}
