import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl, initializeLocalStorage } from '../utils/data';
import { showTopFloatNotification } from '../utils/notifications';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => ({
    isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
    email: localStorage.getItem('userEmail') || '',
    fullName: localStorage.getItem('userFullName') || '',
    phone: localStorage.getItem('userPhone') || '',
    avatar: localStorage.getItem('userAvatar') || '',
    address: localStorage.getItem('userAddress') || '',
    role: localStorage.getItem('userRole') || 'user',
    token: localStorage.getItem('token') || '',
  }));

  useEffect(() => {
    initializeLocalStorage();
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
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
      setUser({
        isLoggedIn: true,
        email: data.user.email,
        fullName: data.user.firstName + ' ' + (data.user.lastName || ''),
        phone: data.user.phone || '',
        avatar: data.user.avatar || '',
        address: data.user.address || '',
        role: data.user.role || 'user',
        token: data.token,
      });
    }
    return data;
  }, []);

  const register = useCallback(async (formData) => {
    const response = await fetch(apiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    return response.json();
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
    setUser({
      isLoggedIn: false,
      email: '',
      fullName: '',
      phone: '',
      avatar: '',
      address: '',
      role: 'user',
      token: '',
    });
    showTopFloatNotification('✅ Logout completed!');
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
      setUser(prev => ({ ...prev, fullName, phone: u.phone, avatar: u.avatar || '', address: u.address || '' }));
    }
    return data;
  }, []);

  const value = useMemo(() => ({ user, login, register, logout, updateProfile, setUser }), [user, login, register, logout, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
