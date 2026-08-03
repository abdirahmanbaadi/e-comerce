import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function effectiveRole(user) {
  if (user?.isLoggedIn) return user.role || localStorage.getItem('userRole') || 'user';
  if (localStorage.getItem('isLoggedIn') === 'true') {
    return localStorage.getItem('userRole') || 'user';
  }
  return null;
}

export default function ProtectedRoute({ children, roles = [] }) {
  const { user } = useAuth();
  const location = useLocation();
  const loggedIn = user?.isLoggedIn || localStorage.getItem('isLoggedIn') === 'true';
  const role = effectiveRole(user);

  if (!loggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles.length > 0 && !roles.includes(role)) {
    if (role === 'admin' || role === 'staff') return <Navigate to="/admin" replace />;
    if (role === 'delivery') return <Navigate to="/delivery" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
