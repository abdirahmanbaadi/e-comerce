import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  isAdminBlockedCustomerPath,
  isAdminUser,
  isDriverAllowedPath,
  isDriverUser,
} from '../utils/roleAccess';

export default function StaffRouteGuard({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  if (isDriverUser(user) && !isDriverAllowedPath(path)) {
    return <Navigate to="/delivery" replace />;
  }

  if (isAdminUser(user)) {
    if (path === '/login' || path === '/register') {
      return <Navigate to="/admin" replace />;
    }
    if (isAdminBlockedCustomerPath(path)) {
      return <Navigate to="/admin" replace state={{ storePreviewBlocked: true }} />;
    }
  }

  return children;
}
