import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../utils/data';
import { DEFAULT_NOTIFICATION_PREFERENCES, showTopFloatNotification } from '../../utils/notifications';
import {
  applyAppAppearance,
  appearanceScopeLabel,
  getAppAppearance,
  getAppAppearanceScope,
  getAppLanguage,
  setAppAppearanceScope,
  setAppLanguage,
} from '../../mobile/mmfPreferences';
import { PRIVACY_SECTIONS, TERMS_SECTIONS } from '../../utils/legalDocuments';

const APP_VERSION = '1.0.0';

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

function SettingsRow({ icon, title, desc, onClick, staticRow = false, danger = false, children }) {
  const titleClass = danger
    ? 'm-0 text-[0.92rem] font-bold text-[#c0392b]'
    : 'm-0 text-[0.92rem] font-bold text-[#111111]';
  const iconWrapClass = danger
    ? 'flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] bg-[#fff0ee] text-[1.15rem] text-[#c0392b] transition-all duration-200 group-hover:scale-[1.03]'
    : 'flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] bg-[#f0f5f2] text-[1.15rem] text-deepGreen transition-all duration-200 group-hover:scale-[1.03] group-hover:bg-[#e2ede7]';
  const inner = (
    <>
      <div className="flex items-center gap-4">
        <span className={iconWrapClass}>
          <i className={icon} />
        </span>
        <div className="flex flex-col gap-0.5">
          <h4 className={titleClass}>{title}</h4>
          <p className="m-0 text-[0.76rem] text-[#777777]">{desc}</p>
        </div>
      </div>
      {children ||
        (staticRow ? null : (
          <i className="fa-solid fa-chevron-right text-[0.76rem] text-[#888888] transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-deepGreen" />
        ))}
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
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [panel, setPanel] = useState('main');
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(
    user?.notificationPreferences?.emailAlerts ?? DEFAULT_NOTIFICATION_PREFERENCES.emailAlerts
  );
  const [smsAlerts, setSmsAlerts] = useState(
    user?.notificationPreferences?.smsAlerts ?? DEFAULT_NOTIFICATION_PREFERENCES.smsAlerts
  );
  const [pushAlerts, setPushAlerts] = useState(
    user?.notificationPreferences?.pushAlerts ?? DEFAULT_NOTIFICATION_PREFERENCES.pushAlerts
  );
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [language, setLanguage] = useState(getAppLanguage());
  const [appearance, setAppearance] = useState(getAppAppearance());
  const [appearanceScope, setAppearanceScopeState] = useState(getAppAppearanceScope());
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [rateStars, setRateStars] = useState(0);

  useEffect(() => {
    const prefs = user?.notificationPreferences;
    if (!prefs) return;
    setEmailAlerts(prefs.emailAlerts ?? DEFAULT_NOTIFICATION_PREFERENCES.emailAlerts);
    setSmsAlerts(prefs.smsAlerts ?? DEFAULT_NOTIFICATION_PREFERENCES.smsAlerts);
    setPushAlerts(prefs.pushAlerts ?? DEFAULT_NOTIFICATION_PREFERENCES.pushAlerts);
  }, [user?.notificationPreferences]);

  const panelTitles = {
    main: 'Settings',
    notifications: 'Notifications',
    language: 'Language',
    appearance: 'Appearance',
    privacy: 'Privacy Policy',
    terms: 'Terms & Conditions',
    about: 'About',
    rate: 'Rate Experience',
    delete: 'Delete Account',
  };
  const title = panelTitles[panel] || 'Settings';

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
        {sep} {title}
      </>
    );
  };

  const persistNotificationPreferences = async (nextPrefs) => {
    if (!user?.isLoggedIn) return false;
    setSavingPrefs(true);
    const data = await updateProfile({ notificationPreferences: nextPrefs });
    setSavingPrefs(false);
    if (!data.success) {
      showTopFloatNotification(`${data.message || 'Failed to save notification preferences'}`, 'danger');
      return false;
    }
    return true;
  };

  const handleSaveNotifications = async () => {
    const ok = await persistNotificationPreferences({
      emailAlerts,
      smsAlerts,
      pushAlerts,
      securityEmail: user?.notificationPreferences?.securityEmail ?? DEFAULT_NOTIFICATION_PREFERENCES.securityEmail,
      securitySms: user?.notificationPreferences?.securitySms ?? DEFAULT_NOTIFICATION_PREFERENCES.securitySms,
    });
    if (ok) {
      showTopFloatNotification('Notification preferences saved.');
      setPanel('main');
    }
  };

  const handleLanguage = (lang) => {
    setLanguage(setAppLanguage(lang));
    showTopFloatNotification(lang === 'so' ? 'Somali selected.' : 'English selected.');
  };

  const handleAppearance = (mode) => {
    const result = applyAppAppearance(mode, appearanceScope);
    setAppearance(result.mode);
    setAppearanceScopeState(result.scope);
  };

  const handleAppearanceScope = (scope) => {
    const result = setAppAppearanceScope(scope);
    setAppearance(result.mode);
    setAppearanceScopeState(result.scope);
  };

  const handleRate = () => {
    if (rateStars < 1) {
      showTopFloatNotification('Please select a star rating.', 'warning');
      return;
    }
    showTopFloatNotification('Thanks for your feedback!');
    setRateStars(0);
    setPanel('main');
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!deletePassword.trim()) {
      showTopFloatNotification('Enter your password to confirm.', 'danger');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    setDeleting(true);
    try {
      const res = await fetch(apiUrl('/api/auth/account'), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showTopFloatNotification('Account deleted.');
        logout();
        navigate('/', { replace: true });
      } else {
        showTopFloatNotification(data.message || 'Could not delete account.', 'danger');
      }
    } catch {
      showTopFloatNotification('Connection failed.', 'danger');
    } finally {
      setDeleting(false);
    }
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
        <div className="max-w-2xl space-y-5">
          <div>
            <SettingsSectionLabel>Notifications</SettingsSectionLabel>
            <div className={settingsCardClass}>
              <SettingsRow
                icon="fa-solid fa-bell"
                title="Notifications"
                desc="Email, SMS, and push alerts"
                onClick={() => setPanel('notifications')}
              />
            </div>
          </div>

          <div>
            <SettingsSectionLabel>Preferences</SettingsSectionLabel>
            <div className={settingsCardClass}>
              <SettingsRow
                icon="fa-solid fa-globe"
                title="Language"
                desc={language === 'so' ? 'Somali' : 'English'}
                onClick={() => setPanel('language')}
              />
              <SettingsDivider />
              <SettingsRow
                icon="fa-solid fa-moon"
                title="Appearance / Dark Mode"
                desc={
                  appearance === 'dark'
                    ? `Dark · ${appearanceScopeLabel(appearanceScope)}`
                    : 'Light'
                }
                onClick={() => setPanel('appearance')}
              />
            </div>
          </div>

          <div>
            <SettingsSectionLabel>Privacy & Legal</SettingsSectionLabel>
            <div className={settingsCardClass}>
              <SettingsRow
                icon="fa-solid fa-lock"
                title="Privacy Policy"
                desc="How we handle your data"
                onClick={() => setPanel('privacy')}
              />
              <SettingsDivider />
              <SettingsRow
                icon="fa-regular fa-file-lines"
                title="Terms & Conditions"
                desc="Rules for using MMF"
                onClick={() => setPanel('terms')}
              />
            </div>
          </div>

          <div>
            <SettingsSectionLabel>About</SettingsSectionLabel>
            <div className={settingsCardClass}>
              <SettingsRow
                icon="fa-solid fa-circle-info"
                title="About"
                desc="Mogadishu Modern Furniture"
                onClick={() => setPanel('about')}
              />
              <SettingsDivider />
              <SettingsRow
                icon="fa-solid fa-star"
                title="Rate Experience"
                desc="Tell us how shopping feels"
                onClick={() => setPanel('rate')}
              />
              <SettingsDivider />
              <SettingsRow
                icon="fa-solid fa-code-branch"
                title="Version"
                desc={`v${APP_VERSION}`}
                staticRow
              />
            </div>
          </div>

          <div>
            <SettingsSectionLabel>Account</SettingsSectionLabel>
            <div className={settingsCardClass}>
              <SettingsRow
                icon="fa-solid fa-key"
                title="Change Password"
                desc="Update your account password"
                onClick={() => setPasswordOpen(true)}
              />
              <SettingsDivider />
              <SettingsRow
                icon="fa-regular fa-trash-can"
                title="Delete Account"
                desc="Permanently remove your account"
                onClick={() => setPanel('delete')}
                danger
              />
            </div>
          </div>
        </div>
      )}

      {panel === 'notifications' && (
        <div className="max-w-2xl">
          <div className={settingsCardClass}>
            <SwitchRow
              icon="fa-solid fa-envelope"
              title="Email Alerts"
              desc="Orders and delivery updates"
              checked={emailAlerts}
              disabled={savingPrefs}
              onChange={async (value) => setEmailAlerts(value)}
            />
            <SettingsDivider />
            <SwitchRow
              icon="fa-solid fa-mobile-screen"
              title="SMS Alerts"
              desc="Important delivery messages"
              checked={smsAlerts}
              disabled={savingPrefs}
              onChange={async (value) => setSmsAlerts(value)}
            />
            <SettingsDivider />
            <SwitchRow
              icon="fa-solid fa-bell"
              title="Push Notifications"
              desc="Browser and in-app badges"
              checked={pushAlerts}
              disabled={savingPrefs}
              onChange={async (value) => setPushAlerts(value)}
            />
          </div>
          <button
            type="button"
            onClick={handleSaveNotifications}
            disabled={savingPrefs}
            className="mt-3 inline-flex min-h-[46px] items-center justify-center rounded-full border-0 bg-deepGreen px-6 text-[0.88rem] font-bold text-white disabled:opacity-60"
          >
            {savingPrefs ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}

      {panel === 'language' && (
        <div className="max-w-2xl">
          <div className={settingsCardClass}>
            <ChoiceRow label="English" selected={language === 'en'} onClick={() => handleLanguage('en')} />
            <SettingsDivider />
            <ChoiceRow label="Somali" selected={language === 'so'} onClick={() => handleLanguage('so')} />
          </div>
          <p className="m-0 mt-3 text-[0.78rem] font-medium leading-relaxed text-[#8b8178]">
            Somali language preference is saved. Full site translation will expand over time.
          </p>
        </div>
      )}

      {panel === 'appearance' && (
        <div className="max-w-2xl space-y-4">
          <div>
            <SettingsSectionLabel>Theme</SettingsSectionLabel>
            <div className={settingsCardClass}>
              <ChoiceRow label="Light" selected={appearance === 'light'} onClick={() => handleAppearance('light')} />
              <SettingsDivider />
              <ChoiceRow
                label="Dark Mode"
                selected={appearance === 'dark'}
                onClick={() => handleAppearance('dark')}
              />
            </div>
          </div>
          {appearance === 'dark' ? (
            <div>
              <SettingsSectionLabel>Apply dark to</SettingsSectionLabel>
              <div className={settingsCardClass}>
                <ChoiceRow
                  label="Profile only"
                  selected={appearanceScope === 'profile'}
                  onClick={() => handleAppearanceScope('profile')}
                />
                <SettingsDivider />
                <ChoiceRow
                  label="Customer app"
                  selected={appearanceScope === 'customer'}
                  onClick={() => handleAppearanceScope('customer')}
                />
                <SettingsDivider />
                <ChoiceRow
                  label="Everywhere (All)"
                  selected={appearanceScope === 'all'}
                  onClick={() => handleAppearanceScope('all')}
                />
              </div>
              <p className="m-0 mt-3 text-[0.78rem] font-medium leading-relaxed text-[#8b8178]">
                Profile only = Profile &amp; Settings. Customer app = /app screens. All = keep dark
                everywhere.
              </p>
            </div>
          ) : null}
        </div>
      )}

      {panel === 'privacy' && (
        <div className={`${settingsCardClass} max-w-3xl space-y-4 px-5 py-6`}>
          {PRIVACY_SECTIONS.map((section) => (
            <div key={section.heading}>
              <h2 className="mb-1.5 mt-0 text-[1rem] font-bold text-[#111111]">{section.heading}</h2>
              <p className="m-0 text-[0.9rem] leading-relaxed text-[#2a2a2a]">{section.body}</p>
            </div>
          ))}
        </div>
      )}

      {panel === 'terms' && (
        <div className={`${settingsCardClass} max-w-3xl space-y-4 px-5 py-6`}>
          {TERMS_SECTIONS.map((section) => (
            <div key={section.heading}>
              <h2 className="mb-1.5 mt-0 text-[1rem] font-bold text-[#111111]">{section.heading}</h2>
              <p className="m-0 text-[0.9rem] leading-relaxed text-[#2a2a2a]">{section.body}</p>
            </div>
          ))}
        </div>
      )}

      {panel === 'about' && (
        <div className={`${settingsCardClass} max-w-2xl px-5 py-5 text-[0.9rem] font-medium leading-relaxed text-[#4a4038]`}>
          <p className="mt-0 text-[1.05rem] font-bold text-[#1c140e]">Mogadishu Modern Furniture</p>
          <p>
            Premium furniture shopping and delivery for Mogadishu. Browse collections, pay with EVC
            Plus, track orders, and get support in one place.
          </p>
          <p className="mb-0">Version {APP_VERSION}</p>
        </div>
      )}

      {panel === 'rate' && (
        <div className={`${settingsCardClass} max-w-md px-5 py-6 text-center`}>
          <p className="mb-4 mt-0 text-[0.95rem] font-semibold text-[#1c140e]">How is your experience?</p>
          <div className="mb-5 flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRateStars(n)}
                className="border-0 bg-transparent p-1 text-[1.6rem] text-[#d4a017]"
                aria-label={`${n} stars`}
              >
                <i className={`fa-${rateStars >= n ? 'solid' : 'regular'} fa-star`} />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleRate}
            className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full border-0 bg-deepGreen text-[0.88rem] font-bold text-white"
          >
            Submit rating
          </button>
        </div>
      )}

      {panel === 'delete' && (
        <div className="max-w-md">
          <div className="mb-4 rounded-xl bg-[#fff5f4] px-4 py-3 text-[0.84rem] font-semibold leading-relaxed text-[#9b2c2c] ring-1 ring-[#f0d0cc]">
            This permanently deletes your account. Orders already placed are not removed from store
            records.
          </div>
          <form onSubmit={handleDelete} className={`${settingsCardClass} space-y-3 px-4 py-4`}>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter password to confirm"
              className={fieldClass}
              required
              autoComplete="current-password"
            />
            <button
              type="submit"
              disabled={deleting}
              className="flex min-h-[46px] w-full items-center justify-center rounded-full border-0 bg-[#c0392b] text-[0.86rem] font-bold text-white disabled:opacity-60"
            >
              {deleting ? 'Deleting…' : 'Delete my account'}
            </button>
          </form>
        </div>
      )}

      <ChangePasswordModal
        isOpen={passwordOpen}
        onClose={() => setPasswordOpen(false)}
      />
    </div>
  );
}

function SettingsSectionLabel({ children }) {
  return (
    <h2 className="mb-2 mt-0 px-0.5 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#8b8178]">
      {children}
    </h2>
  );
}

function ChoiceRow({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full cursor-pointer items-center justify-between border-0 bg-white px-5 py-4 text-left transition-colors duration-200 hover:bg-[#fcfbf9]"
    >
      <span className="text-[0.92rem] font-bold text-[#111111]">{label}</span>
      {selected ? <i className="fa-solid fa-check text-[0.9rem] text-deepGreen" /> : null}
    </button>
  );
}

function SwitchRow({ icon, title, desc, checked, onChange, disabled = false }) {
  const handleChange = async (e) => {
    await onChange(e.target.checked);
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
