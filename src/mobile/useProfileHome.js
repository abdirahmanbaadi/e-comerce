import { useLocation } from 'react-router-dom';

/** Customer hub `/app/profile` or driver hub `/app/driver/profile`. */
export function useProfileHome() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/app/driver')) return '/app/driver/profile';
  return '/app/profile';
}
