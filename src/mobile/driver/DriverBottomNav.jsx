import { NavLink } from 'react-router-dom';

/* Home · Deliveries · Profile */
const items = [
  { to: '/app/driver', label: 'Home', icon: 'fa-house', end: true },
  { to: '/app/driver/jobs', label: 'Deliveries', icon: 'fa-box', end: false, badge: 'jobs' },
  { to: '/app/driver/profile', label: 'Profile', icon: 'fa-user', end: false },
];

export default function DriverBottomNav({ badgeJobs = 0 }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#ebe6df] bg-white px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5">
      <ul className="mx-auto flex max-w-md items-end justify-between">
        {items.map((item) => (
          <li key={`${item.to}-${item.label}`} className="min-w-0 flex-1">
            <NavLink to={item.to} end={item.end} className="flex flex-col items-center gap-0.5 no-underline">
              {({ isActive }) => (
                <>
                  <span className="relative inline-flex h-5 items-center justify-center">
                    <i
                      className={`fa-solid ${item.icon} text-[1.1rem] leading-none ${
                        isActive ? 'text-[#2f6b45]' : 'text-[#b0bab7]'
                      }`}
                      aria-hidden="true"
                    />
                    {item.badge === 'jobs' && badgeJobs > 0 ? (
                      <span className="absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#e53935] px-0.5 text-[0.52rem] font-black text-white">
                        {badgeJobs > 9 ? '9+' : badgeJobs}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={`text-[0.68rem] font-medium ${
                      isActive ? 'font-semibold text-[#2f6b45]' : 'text-[#b0bab7]'
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
