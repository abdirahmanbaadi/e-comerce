import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../utils/data';
import { DEFAULT_NOTIFICATION_PREFERENCES, showTopFloatNotification } from '../../utils/notifications';

/* ═══ SECTION: MODAL SHELL (ACCOUNT) ═══ */
export function ModalBackdrop({ children, onClose, maxWidth = 'max-w-lg', className = '' }) {
  useEffect(() => {
    if (!onClose) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div className={`w-full ${maxWidth} ${className}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

export function CloseAbsoluteBtn({ onClose }) {
  return (
    <button
      type="button"
      className="absolute right-4 top-4 z-10 flex items-center justify-center border-0 bg-transparent p-1 text-[1.2rem] text-[#888888] transition-colors hover:text-[#333333]"
      onClick={onClose}
      aria-label="Close"
    >
      <i className="fa-solid fa-xmark" />
    </button>
  );
}

function LeafLeft() {
  return (
    <span className="pointer-events-none absolute bottom-0 -left-7 inline-flex">
      <svg width="32" height="26" viewBox="0 0 32 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M26 21C18 19 9 12 13.5 5C19 5 23 10 26 21Z" fill="#A7C1AE" />
        <path d="M28 23C19.5 24 12 19 13 13C18 13.5 23.5 17.5 28 23Z" fill="#A7C1AE" opacity="0.85" />
      </svg>
    </span>
  );
}

function LeafRight() {
  return (
    <span className="pointer-events-none absolute bottom-0 -right-7 inline-flex">
      <svg width="32" height="26" viewBox="0 0 32 26" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'scaleX(-1)' }}>
        <path d="M26 21C18 19 9 12 13.5 5C19 5 23 10 26 21Z" fill="#A7C1AE" />
        <path d="M28 23C19.5 24 12 19 13 13C18 13.5 23.5 17.5 28 23Z" fill="#A7C1AE" opacity="0.85" />
      </svg>
    </span>
  );
}

function Sparkle({ className }) {
  return (
    <span className={`pointer-events-none absolute inline-flex ${className}`}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 0L10.2 5.8L16 8L10.2 10.2L8 16L5.8 10.2L0 8L5.8 5.8L8 0Z" fill="#D8A128" />
      </svg>
    </span>
  );
}

export function GoldStarSeparator({ lineClass = 'bg-[#e5dfd3]' }) {
  return (
    <div className="my-2 flex items-center justify-center gap-4">
      <span className={`h-px w-11 ${lineClass}`} />
      <span className="text-[0.85rem] text-[#c4b9a3]">✦</span>
      <span className={`h-px w-11 ${lineClass}`} />
    </div>
  );
}

export function PremiumDeco({ children, className = 'mb-6' }) {
  return (
    <div className={`relative inline-block ${className}`}>
      {children}
      <LeafLeft />
      <LeafRight />
      <Sparkle className="-left-3 -top-3" />
      <Sparkle className="-right-3 -top-3" />
    </div>
  );
}

export const premiumCardClass =
  'relative rounded-3xl border-0 bg-base px-9 py-10 text-center font-sans shadow-[0_15px_45px_rgba(0,0,0,0.08)]';

export const formCardClass =
  'relative rounded-[20px] border-0 bg-softBg p-8 font-sans shadow-[0_15px_45px_rgba(0,0,0,0.12)]';

export function BtnPrimary({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`flex-1 rounded-lg border-0 bg-[#4a5d4e] px-[18px] py-3 text-[0.9rem] font-bold text-white transition hover:-translate-y-px hover:bg-[#39483c] disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function BtnDeepGreen({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`rounded-[10px] border-0 bg-deepGreen px-6 py-3 text-[0.95rem] font-bold text-white transition hover:bg-[#052a24] disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function BtnSecondary({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`flex-1 rounded-lg border border-[#d4cebc] bg-white px-[18px] py-3 text-[0.9rem] font-bold text-[#4a3e35] transition hover:border-[#c0b9a6] hover:bg-[#FAF8F5] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function BtnOutlineGreen({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`rounded-[10px] border-[1.5px] border-deepGreen bg-white px-6 py-3 text-[0.95rem] font-bold text-deepGreen transition hover:bg-[#f7f9f7] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function BtnCloseFooter({ children = 'Close', className = '', ...props }) {
  return (
    <button
      type="button"
      className={`max-w-[160px] flex-1 rounded-[10px] border border-[#d4cebc] bg-[#fcfbf9] px-6 py-3 text-[0.95rem] font-bold text-[#4a3e35] transition hover:border-gold hover:bg-[#faf6f0] hover:text-deepGreen ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function InfoBox({ children }) {
  return (
    <div className="mb-6 rounded-[14px] border border-[#f0eee8] bg-[#FAF8F5] px-5 py-4 text-left">{children}</div>
  );
}

export function InfoRow({ icon, label, value, badge }) {
  return (
    <div className="flex items-center justify-between border-b border-[#f2ece1] py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#f2ece1] text-[0.88rem] text-[#8c7a6b]">
          <i className={icon} />
        </span>
        <span className="text-[0.88rem] font-semibold text-[#666666]">{label}</span>
      </div>
      {badge || <span className="text-[0.88rem] font-bold text-[#333333]">{value}</span>}
    </div>
  );
}

export const fieldClass =
  'w-full rounded-lg border border-black/[0.12] bg-white px-3 py-2.5 text-[0.88rem] font-semibold text-[#333333] outline-none transition focus:border-deepGreen focus:shadow-[0_0_0_3px_rgba(7,61,53,0.1)]';

export const fieldLabelClass = 'mb-1.5 block text-[0.8rem] font-bold text-[#111111]';


/* ═══ SECTION: PROFILE OVERLAY MODAL ═══ */

function ProfileOverlayModal({ isOpen, onClose, title, icon, children, footer }) {
  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose} maxWidth="max-w-[620px]">
      <div className={formCardClass}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {icon && (
              <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#e5ebe4] text-[1.25rem] text-[#4a6454]">
                {icon}
              </div>
            )}
            <h2 className="m-0 font-display text-[1.9rem] font-bold text-[#2b3a30]" id="pf-modal-title">
              {title}
            </h2>
          </div>
          <button
            type="button"
            className="flex items-center justify-center border-0 bg-transparent p-1 text-[1.2rem] text-[#888888] transition hover:text-[#333333]"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-6 flex justify-center gap-3">{footer}</div>}
      </div>
    </ModalBackdrop>
  );
}


/* ═══ SECTION: CHANGE PASSWORD MODAL ═══ */

function ChangePasswordModal({ isOpen, onClose, onPasswordChanged }) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setSaving(false);
  }, [isOpen]);

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword.length < 8) {
      showTopFloatNotification('❌ New password must be at least 8 characters long!', 'danger');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      showTopFloatNotification('❌ New passwords do not match!', 'danger');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    setSaving(true);
    try {
      const response = await fetch(apiUrl('/api/auth/change-password'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await response.json();
      if (data.success) {
        showTopFloatNotification('✅ Your password has been changed successfully!');
        onPasswordChanged?.();
        onClose();
      } else {
        showTopFloatNotification(`❌ ${data.message || 'Failed to change password'}`, 'danger');
      }
    } catch {
      showTopFloatNotification('❌ Connection failed!', 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileOverlayModal
      isOpen={isOpen}
      onClose={onClose}
      title="Security Settings"
      icon={<i className="fa-solid fa-user-lock" />}
      footer={
        <>
          <BtnDeepGreen type="submit" form="changePasswordForm" className="flex-1" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </BtnDeepGreen>
          <BtnSecondary type="button" onClick={onClose}>
            Cancel
          </BtnSecondary>
        </>
      }
    >
      <form id="changePasswordForm" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="currentPasswordInput" className="mb-1.5 block text-[0.8rem] font-bold text-[#111111]">
            Current Password
          </label>
          <input
            type="password"
            className={fieldClass}
            id="currentPasswordInput"
            placeholder="Enter current password"
            required
            value={form.currentPassword}
            onChange={update('currentPassword')}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="newPasswordInput" className="mb-1.5 block text-[0.8rem] font-bold text-[#111111]">
            New Password
          </label>
          <input
            type="password"
            className={fieldClass}
            id="newPasswordInput"
            placeholder="Enter new password"
            required
            value={form.newPassword}
            onChange={update('newPassword')}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="confirmPasswordInput" className="mb-1.5 block text-[0.8rem] font-bold text-[#111111]">
            Confirm New Password
          </label>
          <input
            type="password"
            className={fieldClass}
            id="confirmPasswordInput"
            placeholder="Confirm new password"
            required
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
          />
        </div>

        <div className="mt-3 rounded-lg border border-black/[0.08] bg-gray-50 p-3 text-sm" role="note">
          <strong>Account security:</strong> Passwords are hashed with bcrypt on the server. Two-factor authentication (2FA) is planned for a future release.
        </div>
      </form>
    </ProfileOverlayModal>
  );
}


/* ═══ SECTION: SETTINGS TAB ═══ */

const settingsCardClass =
  'mb-5 overflow-hidden rounded-xl border border-black/[0.04] bg-white shadow-[0_10px_30px_rgba(7,61,53,0.03)]';

function SettingsRow({ icon, title, desc, onClick, staticRow = false, children }) {
  const inner = (
    <>
      <div className="flex items-center gap-4">
        <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] bg-[#f0f5f2] text-[1.15rem] text-deepGreen transition-all duration-200 group-hover:scale-[1.03] group-hover:bg-[#e2ede7]">
          <i className={icon} />
        </span>
        <div className="flex flex-col gap-0.5">
          <h4 className="m-0 text-[0.92rem] font-bold text-[#111111]">{title}</h4>
          <p className="m-0 text-[0.76rem] text-[#777777]">{desc}</p>
        </div>
      </div>
      {children || (
        <i className="fa-solid fa-chevron-right text-[0.76rem] text-[#888888] transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-deepGreen" />
      )}
    </>
  );

  if (staticRow || !onClick) {
    return (
      <div className="group flex cursor-default items-center justify-between bg-white px-5 py-4 transition-colors duration-200 hover:bg-[#fcfbf9]">
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="group flex w-full cursor-pointer items-center justify-between border-0 bg-white px-5 py-4 text-left transition-colors duration-200 hover:bg-[#fcfbf9]"
      onClick={onClick}
    >
      {inner}
    </button>
  );
}

function SettingsDivider() {
  return <div className="h-px bg-black/[0.05]" />;
}

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
    const linkClass = 'font-semibold text-deepGreen no-underline hover:underline';
    const sep = <span className="mx-1.5 text-[#ccc]">&gt;</span>;

    if (panel === 'main') {
      return (
        <>
          <Link to="/" className={linkClass}>
            Home
          </Link>
          {sep} Settings
        </>
      );
    }

    const panelLabel = panel === 'security' ? 'Security' : 'Notification Preferences';
    return (
      <>
        <Link to="/" className={linkClass}>
          Home
        </Link>
        {sep}
        <button
          type="button"
          onClick={() => setPanel('main')}
          className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-deepGreen hover:underline"
        >
          Settings
        </button>
        {sep} {panelLabel}
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
    <div>
      <div id="settingsHeader">
        <h1 className="mb-0.5 font-display text-[2.3rem] font-extrabold text-[#111111]" id="settingsTitle">
          {title}
        </h1>
        <p className="mb-4 text-[0.85rem] text-[#888888]" id="settingsBreadcrumbs">
          {breadcrumbs()}
        </p>
      </div>

      {panel === 'main' && (
        <div id="settingsMainMenu">
          <div className={settingsCardClass}>
            <SettingsRow
              icon="fa-solid fa-user-lock"
              title="Security"
              desc="Change your password and manage security settings"
              onClick={() => setPanel('security')}
            />
            <SettingsDivider />
            <SettingsRow
              icon="fa-solid fa-bell"
              title="Notification Preferences"
              desc="Choose what you want to be notified about"
              onClick={() => setPanel('notifications')}
            />
          </div>
        </div>
      )}

      {panel === 'security' && (
        <div id="settingsSecurityPanel">
          <div className={settingsCardClass}>
            <SettingsRow
              icon="fa-solid fa-lock"
              title="Change Password"
              desc="Update your account password securely"
              onClick={() => setPasswordOpen(true)}
            />
            <SettingsDivider />
            <SettingsRow
              icon="fa-solid fa-bell"
              title="Notifications"
              desc="Manage your security-related alerts"
              onClick={() => setSecurityNotifOpen(true)}
            />
            <SettingsDivider />
            <SettingsRow
              icon="fa-solid fa-mobile-screen-button"
              title="Change Verification Number"
              desc="Update the phone number used for verification"
              onClick={() => setVerificationOpen(true)}
            />
            <SettingsDivider />
            <SettingsRow
              icon="fa-solid fa-shield-halved"
              title="Password Last Changed"
              desc={passwordChangedLabel}
              staticRow
            />
          </div>
        </div>
      )}

      {panel === 'notifications' && (
        <div id="settingsNotificationsPanel">
          <div className={settingsCardClass}>
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
            <SettingsDivider />
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
            <SettingsDivider />
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
            <BtnDeepGreen type="submit" form="verificationNumberForm" className="flex-1">
              Save Changes
            </BtnDeepGreen>
            <BtnSecondary type="button" onClick={() => setVerificationOpen(false)}>
              Cancel
            </BtnSecondary>
          </>
        }
      >
        <form id="verificationNumberForm" onSubmit={handleVerificationSave}>
          <div className="mb-3">
            <label className="mb-1.5 block text-[0.8rem] font-bold text-[#111111]" htmlFor="verificationNumberInput">
              Phone Number
            </label>
            <input
              type="tel"
              className={fieldClass}
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
            <BtnDeepGreen type="submit" form="securityNotificationsForm" className="flex-1">
              Save Changes
            </BtnDeepGreen>
            <BtnSecondary type="button" onClick={() => setSecurityNotifOpen(false)}>
              Cancel
            </BtnSecondary>
          </>
        }
      >
        <form id="securityNotificationsForm" onSubmit={handleSecurityNotifSave}>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[0.85rem] font-bold text-[#111111]">Email Security Alerts</span>
            <input type="checkbox" checked={securityEmail} onChange={(e) => setSecurityEmail(e.target.checked)} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[0.85rem] font-bold text-[#111111]">SMS Security Alerts</span>
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
    <div className="group flex cursor-default items-center justify-between bg-white px-5 py-4 transition-colors duration-200 hover:bg-[#fcfbf9]">
      <div className="flex items-center gap-4">
        <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] bg-[#f0f5f2] text-[1.15rem] text-deepGreen">
          <i className={icon} />
        </span>
        <div className="flex flex-col gap-0.5">
          <h4 className="m-0 text-[0.92rem] font-bold text-[#111111]">{title}</h4>
          <p className="m-0 text-[0.76rem] text-[#777777]">{desc}</p>
        </div>
      </div>
      <label className="relative inline-flex h-[22px] w-[46px] shrink-0 cursor-pointer items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
        />
        <span className="absolute inset-0 rounded-full bg-gray-300 transition-colors duration-200 peer-checked:bg-deepGreen peer-disabled:opacity-50" />
        <span className="absolute left-0.5 top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-6" />
      </label>
    </div>
  );
}
