export const DEFAULT_NOTIFICATION_PREFERENCES = {
  emailAlerts: true,
  smsAlerts: false,
  pushAlerts: false,
  securityEmail: true,
  securitySms: true,
};

export function readNotificationPreferences() {
  try {
    const raw = localStorage.getItem('userNotificationPrefs');
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

export function storeNotificationPreferences(prefs) {
  const merged = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...prefs };
  localStorage.setItem('userNotificationPrefs', JSON.stringify(merged));
  return merged;
}
