import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../utils/data';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../../utils/notificationPrefs';
import { showTopFloatNotification } from '../../utils/notifications';
import ChangePasswordModal from './ChangePasswordModal';
import ProfileOverlayModal from './ProfileOverlayModal';

export default function ProfileSettingsTab() {
  const { user, updateProfile } = useAuth();
  const [panel, setPanel] = useState('main');
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [securityNotifOpen, setSecurityNotifOpen] = useState(false);
  const [verificationPhone, setVerificationPhone] = useState(user?.phone || '+252 61 2345678');
  const [emailAlerts, setEmailAlerts] = useState(
    user?.notificationPreferences?.emailAlerts ?? DEFAULT_NOTIFICATION_PREFERENCES.emailAlerts
  );
  const [smsAlerts, setSmsAlerts] = useState(
    user?.notificationPreferences?.smsAlerts ?? DEFAULT_NOTIFICATION_PREFERENCES.smsAlerts
  );
  const [pushAlerts, setPushAlerts] = useState(
    user?.notificationPreferences?.pushAlerts ?? DEFAULT_NOTIFICATION_PREFERENCES.pushAlerts
  );
  const [securityEmail, setSecurityEmail] = useState(
    user?.notificationPreferences?.securityEmail ?? DEFAULT_NOTIFICATION_PREFERENCES.securityEmail
  );
  const [securitySms, setSecuritySms] = useState(
    user?.notificationPreferences?.securitySms ?? DEFAULT_NOTIFICATION_PREFERENCES.securitySms
  );
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [passwordChangedAt, setPasswordChangedAt] = useState(null);

  const passwordChangedLabel = useMemo(() => {
    if (!passwordChangedAt) return 'Not recorded yet';
    const date = new Date(passwordChangedAt);
    if (Number.isNaN(date.getTime())) return 'Not recorded yet';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }, [passwordChangedAt]);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('token');
    if (!token) return undefined;

    fetch(apiUrl('/api/auth/security-info'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) {
          setPasswordChangedAt(data.security?.passwordChangedAt || null);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user?.isLoggedIn]);

  useEffect(() => {
    const prefs = user?.notificationPreferences;
    if (!prefs) return;
    setEmailAlerts(prefs.emailAlerts);
    setSmsAlerts(prefs.smsAlerts);
    setPushAlerts(prefs.pushAlerts);
    setSecurityEmail(prefs.securityEmail);
    setSecuritySms(prefs.securitySms);
  }, [user?.notificationPreferences]);

  const title =
    panel === 'security' ? 'Security' : panel === 'notifications' ? 'Notification Preferences' : 'Settings';

  const breadcrumbs = () => {
    if (panel === 'main') {
      return (
        <>
          <Link to="/" style={{ textDecoration: 'none', color: '#073D35', fontWeight: 600 }}>
            Home
          </Link>{' '}
          <span style={{ margin: '0 5px', color: '#ccc' }}>&gt;</span> Settings
        </>
      );
    }

    const panelLabel = panel === 'security' ? 'Security' : 'Notification Preferences';
    return (
      <>
        <Link to="/" style={{ textDecoration: 'none', color: '#073D35', fontWeight: 600 }}>
          Home
        </Link>{' '}
        <span style={{ margin: '0 5px', color: '#ccc' }}>&gt;</span>{' '}
        <button
          type="button"
          onClick={() => setPanel('main')}
          style={{ border: 'none', background: 'transparent', padding: 0, color: '#073D35', fontWeight: 600, cursor: 'pointer' }}
        >
          Settings
        </button>{' '}
        <span style={{ margin: '0 5px', color: '#ccc' }}>&gt;</span> {panelLabel}
      </>
    );
  };

  const handleVerificationSave = async (e) => {
    e.preventDefault();
    const data = await updateProfile({ phone: verificationPhone.trim() });
    if (data.success) {
      showTopFloatNotification(`✅ Verification phone number changed successfully to: ${verificationPhone}`);
      setVerificationOpen(false);
    } else {
      showTopFloatNotification(`❌ ${data.message || 'Failed to update phone'}`, 'danger');
    }
  };

  const persistNotificationPreferences = async (nextPrefs) => {
    if (!user?.isLoggedIn) return;
    setSavingPrefs(true);
    const data = await updateProfile({ notificationPreferences: nextPrefs });
    setSavingPrefs(false);
    if (!data.success) {
      showTopFloatNotification(`❌ ${data.message || 'Failed to save notification preferences'}`, 'danger');
    }
  };

  const handleSecurityNotifSave = async (e) => {
    e.preventDefault();
    await persistNotificationPreferences({
      emailAlerts,
      smsAlerts,
      pushAlerts,
      securityEmail,
      securitySms,
    });
    showTopFloatNotification('✅ Security notification settings saved!');
    setSecurityNotifOpen(false);
  };

  return (
    <div className="pf-tab active">
      <div id="settingsHeader">
        <h1 className="pf-main-title" id="settingsTitle" style={{ fontWeight: 800, color: '#111', marginBottom: '2px' }}>
          {title}
        </h1>
        <p className="pf-main-sub" id="settingsBreadcrumbs" style={{ fontSize: '0.85rem', color: '#888', marginBottom: '15px' }}>
          {breadcrumbs()}
        </p>
      </div>

      {panel === 'main' && (
        <div id="settingsMainMenu" className="settings-panel">
          <div className="support-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', marginBottom: '20px' }}>
            <button type="button" className="settings-row" id="rowOpenSecurity" onClick={() => setPanel('security')} style={{ width: '100%', border: 'none', background: 'transparent' }}>
              <div className="settings-row-left">
                <span className="settings-icon-badge">
                  <i className="fa-solid fa-user-lock" />
                </span>
                <div className="settings-text-col">
                  <h4 className="settings-row-title">Security</h4>
                  <p className="settings-row-desc">Change your password and manage security settings</p>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right settings-chevron" />
            </button>
            <div className="settings-divider" />
            <button type="button" className="settings-row" id="rowOpenNotifications" onClick={() => setPanel('notifications')} style={{ width: '100%', border: 'none', background: 'transparent' }}>
              <div className="settings-row-left">
                <span className="settings-icon-badge">
                  <i className="fa-solid fa-bell" />
                </span>
                <div className="settings-text-col">
                  <h4 className="settings-row-title">Notification Preferences</h4>
                  <p className="settings-row-desc">Choose what you want to be notified about</p>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right settings-chevron" />
            </button>
          </div>
        </div>
      )}

      {panel === 'security' && (
        <div id="settingsSecurityPanel" className="settings-panel">
          <div className="support-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', marginBottom: '20px' }}>
            <button type="button" className="settings-row" id="rowChangePassword" onClick={() => setPasswordOpen(true)} style={{ width: '100%', border: 'none', background: 'transparent' }}>
              <div className="settings-row-left">
                <span className="settings-icon-badge">
                  <i className="fa-solid fa-lock" />
                </span>
                <div className="settings-text-col">
                  <h4 className="settings-row-title">Change Password</h4>
                  <p className="settings-row-desc">Update your account password securely</p>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right settings-chevron" />
            </button>
            <div className="settings-divider" />
            <button type="button" className="settings-row" id="rowSecurityNotifications" onClick={() => setSecurityNotifOpen(true)} style={{ width: '100%', border: 'none', background: 'transparent' }}>
              <div className="settings-row-left">
                <span className="settings-icon-badge">
                  <i className="fa-solid fa-bell" />
                </span>
                <div className="settings-text-col">
                  <h4 className="settings-row-title">Notifications</h4>
                  <p className="settings-row-desc">Manage your security-related alerts</p>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right settings-chevron" />
            </button>
            <div className="settings-divider" />
            <button type="button" className="settings-row" id="rowVerificationNumber" onClick={() => setVerificationOpen(true)} style={{ width: '100%', border: 'none', background: 'transparent' }}>
              <div className="settings-row-left">
                <span className="settings-icon-badge">
                  <i className="fa-solid fa-mobile-screen-button" />
                </span>
                <div className="settings-text-col">
                  <h4 className="settings-row-title">Change Verification Number</h4>
                  <p className="settings-row-desc">Update the phone number used for verification</p>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right settings-chevron" />
            </button>
            <div className="settings-divider" />
            <div className="settings-row" id="rowPasswordLastChanged" style={{ cursor: 'default' }}>
              <div className="settings-row-left">
                <span className="settings-icon-badge">
                  <i className="fa-solid fa-shield-halved" />
                </span>
                <div className="settings-text-col">
                  <h4 className="settings-row-title">Password Last Changed</h4>
                  <p className="settings-row-desc">{passwordChangedLabel}</p>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right settings-chevron" />
            </div>
          </div>
        </div>
      )}

      {panel === 'notifications' && (
        <div id="settingsNotificationsPanel" className="settings-panel">
          <div className="support-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', marginBottom: '20px' }}>
            <SwitchRow
              icon="fa-solid fa-envelope"
              title="Email Alerts"
              desc="Receive notifications for new orders and promotions"
              checked={emailAlerts}
              disabled={savingPrefs}
              onChange={async (value) => {
                setEmailAlerts(value);
                await persistNotificationPreferences({
                  emailAlerts: value,
                  smsAlerts,
                  pushAlerts,
                  securityEmail,
                  securitySms,
                });
              }}
            />
            <div className="settings-divider" />
            <SwitchRow
              icon="fa-solid fa-mobile-screen"
              title="SMS Alerts"
              desc="Get updates on delivery status directly to your phone"
              checked={smsAlerts}
              disabled={savingPrefs}
              onChange={async (value) => {
                setSmsAlerts(value);
                await persistNotificationPreferences({
                  emailAlerts,
                  smsAlerts: value,
                  pushAlerts,
                  securityEmail,
                  securitySms,
                });
              }}
            />
            <div className="settings-divider" />
            <SwitchRow
              icon="fa-solid fa-bell"
              title="Push Notifications"
              desc="Allow browser notifications when you are online"
              checked={pushAlerts}
              disabled={savingPrefs}
              onChange={async (value) => {
                setPushAlerts(value);
                await persistNotificationPreferences({
                  emailAlerts,
                  smsAlerts,
                  pushAlerts: value,
                  securityEmail,
                  securitySms,
                });
              }}
            />
          </div>
        </div>
      )}

      <ChangePasswordModal
        isOpen={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        onPasswordChanged={() => setPasswordChangedAt(new Date().toISOString())}
      />

      <ProfileOverlayModal
        isOpen={verificationOpen}
        onClose={() => setVerificationOpen(false)}
        title="Verification Number"
        icon={<i className="fa-solid fa-mobile-screen-button" />}
        footer={
          <>
            <button type="submit" form="verificationNumberForm" className="oc-btn-view-details" style={{ backgroundColor: '#073D35', borderColor: '#073D35' }}>
              Save Changes
            </button>
            <button type="button" className="od-btn-close-footer" onClick={() => setVerificationOpen(false)}>
              Cancel
            </button>
          </>
        }
      >
        <form id="verificationNumberForm" onSubmit={handleVerificationSave}>
          <div className="mb-3">
            <label className="form-label fw-bold text-dark" style={{ fontSize: '0.8rem' }}>
              Phone Number
            </label>
            <input
              type="tel"
              className="form-control support-textarea"
              style={{ minHeight: '40px', padding: '0 10px' }}
              id="verificationNumberInput"
              value={verificationPhone}
              onChange={(e) => setVerificationPhone(e.target.value)}
              required
            />
          </div>
        </form>
      </ProfileOverlayModal>

      <ProfileOverlayModal
        isOpen={securityNotifOpen}
        onClose={() => setSecurityNotifOpen(false)}
        title="Security Notifications"
        icon={<i className="fa-solid fa-bell" />}
        footer={
          <>
            <button type="submit" form="securityNotificationsForm" className="oc-btn-view-details" style={{ backgroundColor: '#073D35', borderColor: '#073D35' }}>
              Save Changes
            </button>
            <button type="button" className="od-btn-close-footer" onClick={() => setSecurityNotifOpen(false)}>
              Cancel
            </button>
          </>
        }
      >
        <form id="securityNotificationsForm" onSubmit={handleSecurityNotifSave}>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
              Email Security Alerts
            </span>
            <input type="checkbox" checked={securityEmail} onChange={(e) => setSecurityEmail(e.target.checked)} />
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
              SMS Security Alerts
            </span>
            <input type="checkbox" checked={securitySms} onChange={(e) => setSecuritySms(e.target.checked)} />
          </div>
        </form>
      </ProfileOverlayModal>
    </div>
  );
}

function SwitchRow({ icon, title, desc, checked, onChange, disabled = false }) {
  const handleChange = async (e) => {
    const value = e.target.checked;
    await onChange(value);
    showTopFloatNotification(
      value ? `✅ ${title} enabled!` : `⚠️ ${title} disabled!`
    );
  };

  return (
    <div className="settings-row" style={{ cursor: 'default' }}>
      <div className="settings-row-left">
        <span className="settings-icon-badge">
          <i className={icon} />
        </span>
        <div className="settings-text-col">
          <h4 className="settings-row-title">{title}</h4>
          <p className="settings-row-desc">{desc}</p>
        </div>
      </div>
      <div className="form-check form-switch mb-0">
        <input
          className="form-check-input"
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          style={{ width: '46px', height: '22px', cursor: disabled ? 'not-allowed' : 'pointer' }}
        />
      </div>
    </div>
  );
}
