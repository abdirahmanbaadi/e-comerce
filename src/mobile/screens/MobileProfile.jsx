import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AppTopBar } from '../MobileUi';

const LINKS = [
  { to: '/profile?tab=orders', icon: 'fa-bag-shopping', label: 'My Orders (full)' },
  { to: '/track-order', icon: 'fa-location-dot', label: 'Track Order' },
  { to: '/profile?tab=notifications', icon: 'fa-bell', label: 'Notifications' },
  { to: '/profile?tab=help', icon: 'fa-headset', label: 'Help & Support' },
  { to: '/about', icon: 'fa-circle-info', label: 'About MMF' },
  { to: '/contact', icon: 'fa-envelope', label: 'Contact' },
  { to: '/apply-delivery', icon: 'fa-motorcycle', label: 'Apply as driver' },
];

export default function MobileProfile() {
  const { user, logout } = useAuth();
  const name = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Guest';

  return (
    <div className="animate-cardRise">
      <AppTopBar title="Profile" subtitle="Account & help" />
      <main className="space-y-4 px-4 pb-8 pt-4">
        <section className="rounded-[26px] bg-gradient-to-br from-deepGreen to-teal p-5 text-white shadow-lg">
          <p className="m-0 text-[0.72rem] font-bold uppercase tracking-wide text-white/70">Signed in as</p>
          <h2 className="mb-1 mt-1 font-display text-[1.8rem] font-bold">{user?.isLoggedIn ? name : 'Guest'}</h2>
          <p className="m-0 text-[0.84rem] font-semibold text-white/80">
            {user?.isLoggedIn ? user.email || user.phone : 'Login to sync orders & wishlist'}
          </p>
          {!user?.isLoggedIn ? (
            <div className="mt-4 flex gap-2">
              <Link to="/login" className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-2xl bg-white text-[0.86rem] font-extrabold text-deepGreen no-underline">
                Login
              </Link>
              <Link to="/register" className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-2xl bg-white/15 text-[0.86rem] font-extrabold text-white no-underline">
                Register
              </Link>
            </div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-[24px] border border-black/[0.04] bg-white shadow-sm">
          {LINKS.map((item, idx) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3.5 text-[0.9rem] font-bold text-[#1a2e28] no-underline ${
                idx < LINKS.length - 1 ? 'border-b border-black/[0.05]' : ''
              }`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F4EFE6] text-deepGreen">
                <i className={`fa-solid ${item.icon}`} />
              </span>
              <span className="flex-1">{item.label}</span>
              <i className="fa-solid fa-chevron-right text-[0.7rem] text-[#bbb]" />
            </Link>
          ))}
        </section>

        {user?.isLoggedIn ? (
          <button
            type="button"
            onClick={() => logout?.()}
            className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-red-200 bg-white text-[0.88rem] font-extrabold text-red-600"
          >
            Log out
          </button>
        ) : null}

        <p className="text-center text-[0.72rem] font-semibold text-[#9a9388]">
          Desktop site · <Link to="/?classic=1" className="text-deepGreen">Open classic view</Link>
        </p>
      </main>
    </div>
  );
}
