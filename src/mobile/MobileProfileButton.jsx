import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { productImage } from '../utils/format';

/** Header avatar display only — not clickable; updates when profile photo changes. */
export default function MobileProfileButton({ className = '' }) {
  const { user } = useAuth();
  const [broken, setBroken] = useState(false);
  const loggedIn = Boolean(user?.isLoggedIn);
  const avatar = loggedIn ? user?.avatar : '';
  const src = avatar && !broken ? productImage(avatar) : '';

  useEffect(() => {
    setBroken(false);
  }, [avatar]);

  return (
    <span
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-[#5f4630] shadow-sm ring-1 ring-[#eadfce] ${className}`}
      aria-hidden="true"
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
      ) : (
        <i className={`fa-user text-[1.05rem] ${loggedIn ? 'fa-solid' : 'fa-regular'}`} />
      )}
    </span>
  );
}
