import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl, initializeLocalStorage } from '../utils/data';
import { AUTH_UPDATED_EVENT, notifyAuthUpdated, readAuthUser } from '../utils/authStorage';
import { storeNotificationPreferences } from '../utils/notificationPrefs';
import { showTopFloatNotification } from '../utils/notifications';

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
      return data;
    } catch {
      return {
        success: false,
        message: 'Cannot connect to server. Run: npm run dev (backend must be on port 5000)',
      };
    }
  }, []);

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
    () => ({ user, login, register, logout, updateProfile, setUser, syncFromStorage }),
    [user, login, register, logout, updateProfile, syncFromStorage]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
