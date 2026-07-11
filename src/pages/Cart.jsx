import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StoreNavbar from '../features/nav/StoreNavbar';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { validateCartItems, validateCouponCode } from '../utils/cartApi';
import { formatMoney, productImage } from '../utils/format';
import { showTopFloatNotification } from '../utils/notifications';

export default function Cart() {
  const navigate = useNavigate();
  const { user, syncFromStorage: syncAuth } = useAuth();
  const {
    cartItems,
    savedItems,
    changeQuantity,
    removeFromCart,
    saveForLater,
    moveToCart,
    clearCart,
    setCartItems,
    syncFromStorage,
  } = useCart();

  const [couponInput, setCouponInput] = useState(
    () => localStorage.getItem('cartCouponCode') || ''
  );
  const [discountAmount, setDiscountAmount] = useState(
    () => Number(localStorage.getItem('cartDiscount')) || 0
  );
  const [validating, setValidating] = useState(false);
  const [stockHints, setStockHints] = useState({});

  useEffect(() => {
    syncFromStorage();
    syncAuth();
  }, [syncFromStorage, syncAuth]);

  useEffect(() => {
    if (cartItems.length === 0) {
      setStockHints({});
      return;
    }

    let cancelled = false;
    validateCartItems(cartItems).then((data) => {
      if (cancelled || !data.success) return;

      const hints = {};
      (data.items || []).forEach((item) => {
        hints[item.id] = {
          maxStock: item.maxStock,
          stockOk: item.stockOk,
          priceChanged: item.priceChanged,
        };
      });
      setStockHints(hints);

      if (data.items?.some((item) => item.priceChanged)) {
        setCartItems((prev) =>
          prev.map((item) => {
            const fresh = data.items.find((row) => row.id === item.id);
            return fresh ? { ...item, price: fresh.price, quantity: fresh.quantity } : item;
          })
        );
        showTopFloatNotification('Cart prices updated to latest catalog values.');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [cartItems.length, setCartItems]);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const discount = cartItems.length > 0 ? discountAmount : 0;
  const total = Math.max(subtotal - discount, 0);

  useEffect(() => {
    localStorage.setItem('cartSubtotal', String(subtotal));
    localStorage.setItem('cartDiscount', String(discount));
    localStorage.setItem('cartTotal', String(total));
  }, [subtotal, discount, total]);

  const applyCoupon = async () => {
    const couponValue = couponInput.trim();
    if (!couponValue) {
      setDiscountAmount(0);
      localStorage.setItem('cartDiscount', '0');
      localStorage.removeItem('cartCouponCode');
      showTopFloatNotification('Enter coupon code');
      return;
    }

    try {
      const data = await validateCouponCode(couponValue, subtotal);
      if (data.success) {
        setDiscountAmount(data.discount);
        localStorage.setItem('cartDiscount', String(data.discount));
        localStorage.setItem('cartCouponCode', data.code);
        showTopFloatNotification(data.message || 'Coupon applied');
      } else {
        setDiscountAmount(0);
        localStorage.setItem('cartDiscount', '0');
        localStorage.removeItem('cartCouponCode');
        showTopFloatNotification(data.message || 'Invalid coupon code', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not validate coupon. Check backend connection.', 'danger');
    }
  };

  const handleClearCart = () => {
    clearCart();
    setDiscountAmount(0);
    setCouponInput('');
    localStorage.setItem('cartDiscount', '0');
    localStorage.removeItem('cartCouponCode');
    showTopFloatNotification('Shopping cart cleared');
  };

  const handleQuantityChange = (id, delta) => {
    const item = cartItems.find((row) => row.id === id);
    const hint = stockHints[id];
    const maxStock = hint?.maxStock;

    if (delta > 0 && maxStock && item && item.quantity >= maxStock) {
      showTopFloatNotification(`Only ${maxStock} units available for "${item.title}".`, 'danger');
      return;
    }

    changeQuantity(id, delta);
    showTopFloatNotification('Cart quantity updated');
  };

  const handleRemove = (id) => {
    removeFromCart(id);
    showTopFloatNotification('Item removed from cart');
  };

  const handleSaveForLater = (id) => {
    saveForLater(id);
    showTopFloatNotification('Item saved for later');
  };

  const handleMoveToCart = (id) => {
    moveToCart(id);
    showTopFloatNotification('Item added back to cart');
  };

  const handleProceedToCheckout = async () => {
    setValidating(true);
    try {
      const data = await validateCartItems(cartItems);
      if (!data.success || !data.valid) {
        showTopFloatNotification(data.message || 'Cart validation failed.', 'danger');
        if (data.items?.length) {
          setCartItems(data.items.map(({ maxStock, stockOk, priceChanged, ...item }) => item));
        }
        return;
      }

      if (data.items?.length) {
        setCartItems(data.items.map(({ maxStock, stockOk, priceChanged, ...item }) => item));
      }

      navigate('/checkout');
    } catch {
      showTopFloatNotification('Could not validate cart. Check backend connection.', 'danger');
    } finally {
      setValidating(false);
    }
  };

  const isEmpty = cartItems.length === 0;

  return (
    <div className="min-h-screen overflow-x-hidden bg-base font-sans text-[#111]">
      <StoreNavbar cartActive />

      <section className="border-b border-black/[0.06] bg-[radial-gradient(circle_at_top_left,rgba(216,161,40,0.13),transparent_34%),linear-gradient(135deg,#FAF8F2_0%,#F4EFE6_100%)] py-7 pb-[22px] text-center">
        <div className="container">
          <span className="mb-1.5 inline-block text-[0.76rem] font-extrabold uppercase tracking-[3px] text-gold">
            Shopping Cart
          </span>
          <h1 className="m-0 font-display text-[2rem] font-bold leading-[1.15] text-deepGreen md:text-[2.5rem]">
            Review Your Furniture Cart
          </h1>
        </div>
      </section>

      <section className="py-7 pb-16">
        <div className="container">
          {!isEmpty && (
            <div className="cart-layout">
              <div>
                <div className="cart-box">
                  <div className="cart-table-head">
                    <div>Product</div>
                    <div>Price</div>
                    <div>Quantity</div>
                    <div>Subtotal</div>
                    <div />
                  </div>

                  {cartItems.map((item) => {
                    const hint = stockHints[item.id];
                    return (
                      <div key={item.id} className="cart-item">
                        <div className="product-cell">
                          <div className="cart-img">
                            <img src={productImage(item.image)} alt={item.title} />
                          </div>
                          <div>
                            <div className="cart-name">{item.title}</div>
                            <div className="cart-meta">{item.category}</div>
                            {hint && !hint.stockOk && (
                              <div className="cart-stock-warning">Low or out of stock — update quantity</div>
                            )}
                            {hint?.maxStock > 0 && hint?.maxStock <= 5 && (
                              <div className="cart-stock-warning">Only {hint.maxStock} left</div>
                            )}
                            <button
                              type="button"
                              className="save-btn mt-2"
                              onClick={() => handleSaveForLater(item.id)}
                            >
                              <i className="fa-regular fa-bookmark me-1" />
                              Save for Later
                            </button>
                          </div>
                        </div>

                        <div className="cart-col-price">
                          <span className="price-text">{formatMoney(item.price)}</span>
                        </div>

                        <div className="cart-col-qty">
                          <div className="qty-box">
                            <button type="button" onClick={() => handleQuantityChange(item.id, -1)}>
                              −
                            </button>
                            <span>{item.quantity}</span>
                            <button type="button" onClick={() => handleQuantityChange(item.id, 1)}>
                              +
                            </button>
                          </div>
                        </div>

                        <div className="cart-col-subtotal">
                          <span className="subtotal-text">
                            {formatMoney(item.price * item.quantity)}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => handleRemove(item.id)}
                          aria-label="Remove item"
                        >
                          <i className="fa-solid fa-xmark" />
                        </button>
                      </div>
                    );
                  })}

                  <div className="cart-actions">
                    <div className="coupon-wrap">
                      <input
                        type="text"
                        className="coupon-input"
                        placeholder="Coupon Code (e.g. MMF10)"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                      />
                      <button type="button" className="coupon-btn" onClick={applyCoupon}>
                        Apply Coupon
                      </button>
                    </div>
                    <button type="button" className="clear-btn" onClick={handleClearCart}>
                      Clear Shopping Cart
                    </button>
                  </div>
                </div>

                <div className="saved-box">
                  <h2 className="saved-title">Saved for Later</h2>
                  {savedItems.length === 0 ? (
                    <p style={{ color: '#777', fontWeight: 700, margin: 0 }}>
                      No saved items yet.
                    </p>
                  ) : (
                    savedItems.map((item) => (
                      <div key={item.id} className="saved-item">
                        <div className="saved-left">
                          <div className="saved-img">
                            <img src={productImage(item.image)} alt={item.title} />
                          </div>
                          <div>
                            <div className="saved-name">{item.title}</div>
                            <div className="saved-price">{formatMoney(item.price)}</div>
                          </div>
                        </div>
                        <div className="saved-actions">
                          <button
                            type="button"
                            className="add-cart-btn"
                            onClick={() => handleMoveToCart(item.id)}
                          >
                            <i className="fa-solid fa-cart-plus me-1" />
                            Add to Cart
                          </button>
                          <Link to="/products" className="shop-small-btn">
                            <i className="fa-solid fa-bag-shopping me-1" />
                            Shop More
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <aside className="summary-box">
                <h2 className="summary-title">Order Summary</h2>

                <div className="summary-row">
                  <span>Items</span>
                  <span>{itemCount}</span>
                </div>
                <div className="summary-row">
                  <span>Sub Total</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span className="text-[0.88rem] font-bold text-[#888]">At checkout</span>
                </div>
                <div className="summary-row">
                  <span>Coupon Discount</span>
                  <span>-{formatMoney(discount)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-total">Total</span>
                  <span className="summary-total">{formatMoney(total)}</span>
                </div>

                <button
                  type="button"
                  className="checkout-btn"
                  onClick={handleProceedToCheckout}
                  disabled={validating}
                >
                  {validating ? 'Validating Cart...' : 'Proceed to Checkout'}
                  <i className="fa-solid fa-arrow-right" />
                </button>

                <Link to="/products" className="continue-btn">
                  <i className="fa-solid fa-bag-shopping" />
                  Continue Shopping
                </Link>

                {!user.isLoggedIn && (
                  <div className="note-box">
                    Guest checkout available — you can complete your order without an account.
                  </div>
                )}
              </aside>
            </div>
          )}

          {isEmpty && (
            <div className="empty-box">
              <i className="fa-solid fa-cart-shopping" />
              <h3>Your cart is empty</h3>
              <p>Add furniture items from the shop page to continue.</p>
              <Link to="/products" className="checkout-btn" style={{ maxWidth: '240px', margin: 'auto' }}>
                Go to Shop
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
