import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatMoney, productImage } from '../../utils/format';
import { AppTopBar } from '../MobileUi';

export default function MobileCart() {
  const { cartItems, changeQuantity, removeFromCart, cartCount } = useCart();

  const subtotal = (cartItems || []).reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  return (
    <div className="animate-cardRise">
      <AppTopBar title="Cart" subtitle={`${cartCount} item${cartCount === 1 ? '' : 's'}`} />
      <main className="space-y-3 px-4 pb-8 pt-4">
        {(cartItems || []).length === 0 ? (
          <div className="rounded-[24px] bg-white px-5 py-12 text-center shadow-sm">
            <i className="fa-solid fa-bag-shopping mb-3 text-3xl text-[#cfc7bb]" />
            <p className="m-0 text-[1rem] font-extrabold text-deepGreen">Your cart is empty</p>
            <Link to="/app/shop" className="mt-4 inline-flex min-h-[44px] items-center rounded-2xl bg-deepGreen px-5 text-[0.86rem] font-extrabold text-white no-underline">
              Browse shop
            </Link>
          </div>
        ) : (
          <>
            {(cartItems || []).map((item) => (
              <article key={item.id} className="flex gap-3 rounded-[22px] border border-black/[0.04] bg-white p-3 shadow-sm">
                <img
                  src={productImage(item.image || item.images?.[0])}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-2xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="m-0 truncate text-[0.9rem] font-extrabold text-[#1a2e28]">{item.title}</h3>
                  <p className="mb-2 mt-1 text-[0.88rem] font-black text-deepGreen">{formatMoney(item.price)}</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full border-0 bg-[#F4EFE6] font-bold text-deepGreen"
                      onClick={() => changeQuantity(item.id, -1)}
                    >
                      −
                    </button>
                    <span className="min-w-[1.5rem] text-center text-[0.88rem] font-extrabold">{item.quantity || 1}</span>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full border-0 bg-[#F4EFE6] font-bold text-deepGreen"
                      onClick={() => changeQuantity(item.id, 1)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="ml-auto border-0 bg-transparent text-[0.78rem] font-bold text-red-600"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}

            <div className="sticky bottom-[5.75rem] rounded-[24px] border border-deepGreen/10 bg-white p-4 shadow-[0_12px_40px_rgba(7,61,53,0.12)]">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[0.86rem] font-bold text-[#777]">Subtotal</span>
                <span className="text-[1.15rem] font-black text-deepGreen">{formatMoney(subtotal)}</span>
              </div>
              <Link
                to="/checkout"
                className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-deepGreen to-teal text-[0.95rem] font-extrabold text-white no-underline"
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
