import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainNavbar from '../components/MainNavbar';
import OrderConfirmModal from '../components/OrderConfirmModal';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { validateCartItems } from '../utils/cartApi';
import { apiUrl, DELIVERY_DISTRICTS, fetchDeliveryDistricts, findDistrictByDeliveryFee, getDistrictFee, normalizePhoneNumber } from '../utils/data';
import { formatMoney, productImage } from '../utils/format';
import { showTopFloatNotification } from '../utils/notifications';
import '../styles/pages/Checkout.css';

const DEFAULT_DISTRICTS = DELIVERY_DISTRICTS.map((d) => ({
  ...d,
  label: `${d.value} - ${formatMoney(d.fee)}`,
}));

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
  const [districts, setDistricts] = useState(DEFAULT_DISTRICTS);
  const [waafiConfigured, setWaafiConfigured] = useState(true);

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
          if (!data.waafiConfigured) {
            setPaymentMethod('Cash on Delivery');
          }
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
    const savedDistrict = localStorage.getItem('cartDistrict');
    const savedFee = Number(localStorage.getItem('cartDeliveryFee')) || 0;
    const legacyFee = savedFee >= 1;
    const district =
      savedDistrict && savedDistrict !== '0'
        ? savedDistrict
        : findDistrictByDeliveryFee(savedFee);
    const fee = legacyFee && district ? getDistrictFee(district, districts) : savedFee;

    setForm((prev) => ({
      ...prev,
      name: prev.name || (user.isLoggedIn ? user.fullName : '') || '',
      phone: prev.phone || (user.isLoggedIn ? user.phone : '') || '',
      email: prev.email || (user.isLoggedIn ? user.email : '') || '',
      address: prev.address || (user.isLoggedIn ? user.address : '') || '',
      district: prev.district || district,
    }));
    setDeliveryFee(fee > 0 ? fee : 0);
    if (legacyFee && district) {
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

  const handleDistrictChange = (e) => {
    const value = e.target.value;
    const district = districts.find((d) => d.value === value);
    setForm((prev) => ({ ...prev, district: value }));
    setDeliveryFee(district?.fee || 0);
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

    if (paymentMethod === 'EVC Plus') {
      const phoneDigits = normalizePhoneNumber(form.phone);
      if (!phoneDigits || phoneDigits.length < 9) {
        showTopFloatNotification('Enter a valid Somali mobile number for EVC Plus (e.g. 61XXXXXXX).', 'danger');
        setErrors((prev) => ({ ...prev, phone: true }));
        return false;
      }
    }

    return !Object.values(nextErrors).some(Boolean);
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;

    setSubmitting(true);
    const paymentLabel =
      paymentMethod === 'EVC Plus' ? 'EVC Plus - Pending Confirmation' : 'Cash on Delivery';

    try {
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
      const freshTotal = Math.max(freshSubtotal + deliveryFee - discount, 0);

      const orderPayload = {
        phone: form.phone.trim(),
        customer: form.name.trim(),
        email: form.email.trim(),
        amount: formatMoney(freshTotal),
        subtotal: freshSubtotal,
        deliveryFee,
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
        paymentMethod,
        paymentType: 'pending',
        paymentReference: paymentMethod === 'EVC Plus' ? paymentReference : '',
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
      let paymentStatus = paymentMethod === 'EVC Plus' ? 'Pending' : 'Pending';
      let paymentLabelFinal = paymentLabel;

      let paymentTransactionId = '';

      if (paymentMethod === 'EVC Plus') {
        setEvcAwaitingPin(true);
        showTopFloatNotification(
          `Check phone ${form.phone.trim()} — EVC Plus will ask you to approve and enter your PIN.`
        );

        const payResponse = await fetch(apiUrl('/api/payments/waafi'), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            orderId: trackingCode,
            accountNo: form.phone.trim(),
            amount: freshTotal,
            paymentReference,
            description: `Mogadishu Modern Furniture ${trackingCode}`,
          }),
        });
        const payData = await payResponse.json();
        setEvcAwaitingPin(false);

        if (payData.success) {
          paymentStatus = 'Paid';
          paymentLabelFinal = 'EVC Plus - Paid via Waafi';
          paymentTransactionId = payData.transactionId || '';
          showTopFloatNotification('Payment approved on your phone. Order confirmed!');
        } else {
          paymentStatus = 'Failed';
          paymentLabelFinal = 'EVC Plus - Payment Failed';
          showTopFloatNotification(
            payData.message ||
              'Payment not completed. Approve the EVC prompt on your phone and enter your PIN, then try again.',
            'danger'
          );
        }
      }

      localStorage.setItem('lastTrackingCode', trackingCode);
      localStorage.setItem('lastOrderTotal', String(freshTotal));
      localStorage.setItem('lastPaymentMethod', paymentMethod);
      localStorage.setItem('lastPaymentReference', paymentReference);
      localStorage.setItem(
        'lastOrderDetails',
        JSON.stringify({
          orderId: trackingCode,
          customerName: form.name.trim(),
          customerPhone: form.phone.trim(),
          customerEmail: form.email.trim(),
          district: form.district,
          deliveryAddress: `${form.address.trim()}, ${form.district} District, Mogadishu`,
          paymentMethod,
          paymentStatus,
          orderStatus: 'Confirmed',
          total: freshTotal,
          subtotal: freshSubtotal,
          discount,
          deliveryFee,
          items: freshItems,
        })
      );

      const ordersList = JSON.parse(localStorage.getItem('orders') || '[]');
      ordersList.unshift(data.order);
      localStorage.setItem('orders', JSON.stringify(ordersList));

      clearCart();
      localStorage.removeItem('cartDiscount');
      localStorage.removeItem('cartCouponCode');
      localStorage.setItem('cartDeliveryFee', '0');

      setConfirmOrder({
        trackingCode,
        customer: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: `${form.address.trim()}, ${form.district} District, Mogadishu`,
        payment: paymentLabelFinal,
        paymentMethod,
        paymentStatus,
        paymentReference: paymentMethod === 'EVC Plus' ? paymentReference : '',
        transactionId: paymentTransactionId,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        items: freshItems.map((item) => ({ ...item })),
        subtotal: freshSubtotal,
        discount,
        deliveryFee,
        total: formatMoney(freshTotal),
      });
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

  const showError = (field) => errors[field];

  return (
    <div className="checkout-page">
      <MainNavbar />

      <section className="checkout-hero">
        <div className="container">
          <span className="checkout-label">Secure Checkout</span>
          <h1 className="checkout-title">Complete Your Furniture Order</h1>
          <p className="checkout-desc">
            Confirm your delivery details, choose EVC Plus or Cash on Delivery, and place your order.
            {user.isLoggedIn ? ' Your profile details are pre-filled below.' : ' Guest checkout is available — create an account anytime to save order history.'}
          </p>
        </div>
      </section>

      <section className="checkout-section checkout-section--visible">
          <div className="container">
            <div className="checkout-layout">
              <div>
                <div className="checkout-card">
                  <h2 className="card-title-main">Customer & Delivery Information</h2>
                  <div className="login-note">
                    {user.isLoggedIn ? (
                      <>
                        <strong>Logged-in checkout:</strong> Please confirm your delivery details before
                        placing your order.
                      </>
                    ) : (
                      <>
                        <strong>Guest checkout:</strong> You can complete your order without an account.
                        <Link to="/login" state={{ from: '/checkout' }}> Login</Link> or{' '}
                        <Link to="/register"> register</Link> to save order history and notifications.
                      </>
                    )}
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
                      <input
                        type="text"
                        className="form-control"
                        id="customerPhone"
                        placeholder="Example: 0612345678"
                        value={form.phone}
                        onChange={update('phone')}
                      />
                      {showError('phone') && (
                        <div className="error-text error-text--visible">
                          Phone number is required.
                        </div>
                      )}
                      {paymentMethod === 'EVC Plus' && (
                        <div style={{ fontSize: '0.78rem', color: '#666', marginTop: 6 }}>
                          Waafi will deduct the order total from this EVC Plus number when you place the order.
                        </div>
                      )}
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
                        className="form-control"
                        id="deliveryDate"
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
                    <div className="login-note" style={{ marginBottom: 16, borderColor: '#f59e0b' }}>
                      <strong>EVC Plus unavailable:</strong> Waafi is not configured on the server. Use Cash on Delivery or ask admin to add WAAFI credentials.
                    </div>
                  )}

                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="EVC Plus"
                      checked={paymentMethod === 'EVC Plus'}
                      disabled={!waafiConfigured}
                      onChange={() => setPaymentMethod('EVC Plus')}
                    />
                    <div>
                      <div className="payment-title">
                        <i className="fa-solid fa-mobile-screen-button me-2" />
                        EVC Plus Mobile Money
                      </div>
                      <p className="payment-desc">
                        Waafi API sends a payment request to the <strong>same phone number</strong> you enter
                        in Contact Details above. Your phone will show an EVC Plus prompt — approve it and
                        enter your mobile money PIN to pay.
                      </p>
                      {paymentMethod === 'EVC Plus' && form.phone.trim() && (
                        <div className="login-note evc-phone-note">
                          <i className="fa-solid fa-mobile-screen me-1" />
                          Charge target: <strong>{form.phone.trim()}</strong>
                          <div className="small text-muted mt-1 mb-0">
                            1. Place order → 2. Check this phone → 3. Approve EVC → 4. Enter PIN
                          </div>
                        </div>
                      )}
                      {paymentMethod === 'EVC Plus' && (
                        <div className="payment-ref-box">
                          <div className="payment-ref-label">Payment Reference</div>
                          <div className="payment-ref-value">{paymentReference}</div>
                        </div>
                      )}
                    </div>
                  </label>

                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="Cash on Delivery"
                      checked={paymentMethod === 'Cash on Delivery'}
                      onChange={() => setPaymentMethod('Cash on Delivery')}
                    />
                    <div>
                      <div className="payment-title">
                        <i className="fa-solid fa-money-bill-wave me-2" />
                        Cash on Delivery
                      </div>
                      <p className="payment-desc">
                        Pay when your furniture order is delivered to your address.
                      </p>
                    </div>
                  </label>
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
                  disabled={submitting || evcAwaitingPin || cartItems.length === 0}
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
              EVC Plus is contacting <strong>{form.phone.trim()}</strong>. When the prompt appears on that
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

      <OrderConfirmModal
        isOpen={!!confirmOrder}
        order={confirmOrder}
        onClose={() => setConfirmOrder(null)}
      />
    </div>
  );
}
