import { readNotificationPreferences } from './notifications';

export const AUTH_UPDATED_EVENT = 'auth-updated';

export function readAuthUser() {
  return {
    isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
    email: localStorage.getItem('userEmail') || '',
    fullName: localStorage.getItem('userFullName') || '',
    phone: localStorage.getItem('userPhone') || '',
    avatar: localStorage.getItem('userAvatar') || '',
    address: localStorage.getItem('userAddress') || '',
    role: localStorage.getItem('userRole') || 'user',
    driverApplicationStatus: localStorage.getItem('driverApplicationStatus') || 'none',
    token: localStorage.getItem('token') || '',
    notificationPreferences: readNotificationPreferences(),
  };
}

export function notifyAuthUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
  }
}
