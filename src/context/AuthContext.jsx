import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl, initializeLocalStorage } from '../utils/data';
import { AUTH_UPDATED_EVENT, notifyAuthUpdated, readAuthUser } from '../utils/authStorage';
import { storeNotificationPreferences, showTopFloatNotification } from '../utils/notifications';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(readAuthUser);

  const syncFromStorage = useCallback(() => {
    setUser(readAuthUser());
  }, []);

  useEffect(() => {
    initializeLocalStorage();
    syncFromStorage();

    const onAuthUpdated = () => syncFromStorage();
    window.addEventListener(AUTH_UPDATED_EVENT, onAuthUpdated);
    window.addEventListener('focus', onAuthUpdated);

    return () => {
      window.removeEventListener(AUTH_UPDATED_EVENT, onAuthUpdated);
      window.removeEventListener('focus', onAuthUpdated);
    };
  }, [syncFromStorage]);

  /** Keep role in sync with server (e.g. after admin promotes user to staff). */
  const refreshSession = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token || localStorage.getItem('isLoggedIn') !== 'true') return null;

    try {
      const response = await fetch(apiUrl('/api/auth/profile'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!data.success || !data.user) return null;

      const role = data.user.role || 'user';
      localStorage.setItem('userEmail', data.user.email || '');
      localStorage.setItem(
        'userFullName',
        `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim()
      );
      localStorage.setItem('userPhone', data.user.phone || '');
      localStorage.setItem('userAvatar', data.user.avatar || '');
      localStorage.setItem('userAddress', data.user.address || '');
      localStorage.setItem('userRole', role);
      if (data.user.driverApplication?.status) {
        localStorage.setItem('driverApplicationStatus', data.user.driverApplication.status);
      }
      if (data.user.notificationPreferences) {
        storeNotificationPreferences(data.user.notificationPreferences);
      }

      setUser((prev) => ({
        ...prev,
        isLoggedIn: true,
        email: data.user.email || prev.email,
        fullName: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || prev.fullName,
        phone: data.user.phone || '',
        avatar: data.user.avatar || '',
        address: data.user.address || '',
        role,
        driverApplicationStatus: data.user.driverApplication?.status || 'none',
        token,
        notificationPreferences:
          data.user.notificationPreferences || prev.notificationPreferences,
      }));
      notifyAuthUpdated();
      return data.user;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (loginId, password) => {
    try {
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: loginId.trim(), password }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('token', data.token);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userFullName', data.user.firstName + ' ' + (data.user.lastName || ''));
        localStorage.setItem('userPhone', data.user.phone || '');
        localStorage.setItem('userAvatar', data.user.avatar || '');
        localStorage.setItem('userAddress', data.user.address || '');
        localStorage.setItem('userRole', data.user.role || 'user');
        if (data.user.driverApplication?.status) {
          localStorage.setItem('driverApplicationStatus', data.user.driverApplication.status);
        } else {
          localStorage.removeItem('driverApplicationStatus');
        }
        if (data.user.notificationPreferences) {
          storeNotificationPreferences(data.user.notificationPreferences);
        }
        setUser({
          isLoggedIn: true,
          email: data.user.email,
          fullName: data.user.firstName + ' ' + (data.user.lastName || ''),
          phone: data.user.phone || '',
          avatar: data.user.avatar || '',
          address: data.user.address || '',
          role: data.user.role || 'user',
          driverApplicationStatus: data.user.driverApplication?.status || 'none',
          token: data.token,
          notificationPreferences: data.user.notificationPreferences || storeNotificationPreferences({}),
        });
        notifyAuthUpdated();
        window.dispatchEvent(new CustomEvent('user-logged-in'));
      }
      return data;
    } catch {
      return { success: false, message: 'Cannot reach server. Start backend with npm run dev.' };
    }
  }, []);

  const register = useCallback(async (formData) => {
    try {
      const response = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok && data.message) {
        return { success: false, message: data.message };
      }
      if (!response.ok) {
        return { success: false, message: `Server error (${response.status}). Check backend is running.` };
      }
      if (data.success && data.token && data.user) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('token', data.token);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userFullName', `${data.user.firstName} ${data.user.lastName || ''}`.trim());
        localStorage.setItem('userPhone', data.user.phone || '');
        localStorage.setItem('userAvatar', data.user.avatar || '');
        localStorage.setItem('userAddress', data.user.address || '');
        localStorage.setItem('userRole', data.user.role || 'user');
        localStorage.removeItem('driverApplicationStatus');
        if (data.user.notificationPreferences) {
          storeNotificationPreferences(data.user.notificationPreferences);
        }
        setUser({
          isLoggedIn: true,
          email: data.user.email,
          fullName: `${data.user.firstName} ${data.user.lastName || ''}`.trim(),
          phone: data.user.phone || '',
          avatar: data.user.avatar || '',
          address: data.user.address || '',
          role: data.user.role || 'user',
          driverApplicationStatus: 'none',
          token: data.token,
          notificationPreferences: data.user.notificationPreferences || storeNotificationPreferences({}),
        });
        notifyAuthUpdated();
        window.dispatchEvent(new CustomEvent('user-logged-in'));
      }
      return data;
    } catch {
      return {
        success: false,
        message: 'Cannot connect to server. Run: npm run dev (backend must be on port 5000)',
      };
    }
  }, []);

  const applyAuthSession = useCallback((data) => {
    if (!data?.success || !data.token || !data.user) return;
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('token', data.token);
    localStorage.setItem('userEmail', data.user.email);
    localStorage.setItem('userFullName', `${data.user.firstName} ${data.user.lastName || ''}`.trim());
    localStorage.setItem('userPhone', data.user.phone || '');
    localStorage.setItem('userAvatar', data.user.avatar || '');
    localStorage.setItem('userAddress', data.user.address || '');
    localStorage.setItem('userRole', data.user.role || 'user');
    if (data.user.driverApplication?.status) {
      localStorage.setItem('driverApplicationStatus', data.user.driverApplication.status);
    } else {
      localStorage.removeItem('driverApplicationStatus');
    }
    if (data.user.notificationPreferences) {
      storeNotificationPreferences(data.user.notificationPreferences);
    }
    setUser({
      isLoggedIn: true,
      email: data.user.email,
      fullName: `${data.user.firstName} ${data.user.lastName || ''}`.trim(),
      phone: data.user.phone || '',
      avatar: data.user.avatar || '',
      address: data.user.address || '',
      role: data.user.role || 'user',
      driverApplicationStatus: data.user.driverApplication?.status || 'none',
      token: data.token,
      notificationPreferences: data.user.notificationPreferences || storeNotificationPreferences({}),
    });
    notifyAuthUpdated();
    window.dispatchEvent(new CustomEvent('user-logged-in'));
  }, []);

  const loginWithGoogle = useCallback(
    async ({ credential, accessToken } = {}) => {
      try {
        const response = await fetch(apiUrl('/api/auth/google'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential, accessToken }),
        });
        const data = await response.json();
        if (!response.ok && data.message) {
          return { success: false, message: data.message };
        }
        if (!response.ok) {
          return { success: false, message: `Server error (${response.status}). Check backend is running.` };
        }
        if (data.success) {
          applyAuthSession(data);
        }
        return data;
      } catch {
        return {
          success: false,
          message: 'Cannot reach server. Start backend with npm run dev.',
        };
      }
    },
    [applyAuthSession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFullName');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userAvatar');
    localStorage.removeItem('userAddress');
    localStorage.removeItem('userRole');
    localStorage.removeItem('driverApplicationStatus');
    localStorage.removeItem('userNotificationPrefs');
    setUser({
      isLoggedIn: false,
      email: '',
      fullName: '',
      phone: '',
      avatar: '',
      address: '',
      role: 'user',
      driverApplicationStatus: 'none',
      token: '',
      notificationPreferences: storeNotificationPreferences({}),
    });
    showTopFloatNotification('✅ Logout completed!');
    notifyAuthUpdated();
    navigate('/');
  }, [navigate]);

  const updateProfile = useCallback(async (payload) => {
    const token = localStorage.getItem('token');
    const response = await fetch(apiUrl('/api/auth/profile'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (data.success) {
      const u = data.user;
      const fullName = u.firstName + ' ' + (u.lastName || '');
      localStorage.setItem('userFullName', fullName);
      localStorage.setItem('userPhone', u.phone);
      localStorage.setItem('userAvatar', u.avatar || '');
      localStorage.setItem('userAddress', u.address || '');
      const prefs = u.notificationPreferences ? storeNotificationPreferences(u.notificationPreferences) : undefined;
      setUser(prev => ({
        ...prev,
        fullName,
        phone: u.phone,
        avatar: u.avatar || '',
        address: u.address || '',
        notificationPreferences: prefs || prev.notificationPreferences,
      }));
      notifyAuthUpdated();
    }
    return data;
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      register,
      loginWithGoogle,
      logout,
      updateProfile,
      setUser,
      syncFromStorage,
      refreshSession,
    }),
    [user, login, register, loginWithGoogle, logout, updateProfile, syncFromStorage, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
