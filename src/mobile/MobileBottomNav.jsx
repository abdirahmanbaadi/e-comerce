import { NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const navItems = [
  { to: '/app/home', label: 'Home', icon: 'fa-house', solid: true },
  { to: '/app/shop', label: 'Shop', icon: 'fa-store', solid: true },
  { to: '/app/cart', label: 'Cart', icon: 'fa-cart-shopping', solid: true, badge: 'cart' },
  { to: '/app/profile', label: 'Profile', icon: 'fa-user', solid: false },
];

export default function MobileBottomNav() {
  const { cartCount } = useCart();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#eadfce] bg-[#fffaf3]/95 px-2 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_30px_rgba(87,58,31,0.08)] backdrop-blur-xl">
      <ul className="mx-auto flex max-w-md items-end justify-between">
        {navItems.map((item) => (
          <li key={item.to} className="min-w-0 flex-1">
            <NavLink to={item.to} className="flex flex-col items-center gap-1 no-underline">
              {({ isActive }) => {
                const badgeCount = item.badge === 'cart' ? cartCount : 0;
                const iconClass = item.solid
                  ? `fa-solid ${item.icon}`
                  : isActive
                    ? `fa-solid ${item.icon}`
                    : `fa-regular ${item.icon}`;

                return (
                  <>
                    <span className="relative inline-flex h-6 items-center justify-center">
                      <i
                        className={`${iconClass} text-[1.28rem] leading-none ${
                          isActive ? 'text-[#7b4a28]' : 'text-[#77716a]'
                        }`}
                        aria-hidden="true"
                      />
                      {badgeCount > 0 ? (
                        <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#7b4a28] px-1 text-[0.58rem] font-black text-white">
                          {badgeCount > 9 ? '9+' : badgeCount}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={`text-[0.72rem] font-semibold ${
                        isActive ? 'text-[#7b4a28]' : 'text-[#77716a]'
                      }`}
                    >
                      {item.label}
                    </span>
                  </>
                );
              }}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
