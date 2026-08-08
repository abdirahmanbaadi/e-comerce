import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../utils/data';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  showTopFloatNotification,
  storeNotificationPreferences,
} from '../../utils/notifications';
import MobileProfileSubpage from '../MobileProfileSubpage';
import {
  applyAppAppearance,
  appearanceScopeLabel,
  getAppAppearance,
  getAppAppearanceScope,
  getAppLanguage,
  setAppAppearanceScope,
  setAppLanguage,
} from '../mmfPreferences';
import { PRIVACY_SECTIONS, TERMS_SECTIONS } from '../../utils/legalDocuments';

const APP_VERSION = '1.0.0';

const inputClass =
  'h-12 w-full rounded-2xl border border-[#e8e0d6] bg-white px-4 text-[0.88rem] font-semibold text-[#1c140e] outline-none placeholder:text-[#b0a498] focus:border-[#6b4228]';

function SectionLabel({ children }) {
  return (
    <h2 className="mb-2 mt-0 px-1 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#8b8178]">
      {children}
    </h2>
  );
}

function SettingsCard({ children }) {
  return (
    <div className="mb-5 overflow-hidden rounded-[20px] bg-white shadow-sm ring-1 ring-[#eee7df]">
      {children}
    </div>
  );
}

function SettingsRow({
  icon,
  iconStyle = 'fa-solid',
  label,
  value = null,
  onClick = null,
  danger = false,
  last = false,
  chevron = true,
}) {
  const className = `flex w-full items-center gap-3.5 border-0 bg-transparent px-4 py-[14px] text-left ${
    last ? '' : 'border-b border-[#f0ebe4]'
  }`;

  const content = (
    <>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f6f1ea] text-[0.95rem] ${
          danger ? 'text-[#c0392b]' : 'text-[#3d2a1c]'
        }`}
      >
        <i className={`${iconStyle} ${icon}`} />
      </span>
      <span className={`min-w-0 flex-1 text-[0.92rem] font-semibold ${danger ? 'text-[#c0392b]' : 'text-[#1c140e]'}`}>
        {label}
      </span>
      {value ? (
        <span className="shrink-0 text-[0.8rem] font-semibold text-[#8b8178]">{value}</span>
      ) : null}
      {chevron && onClick ? (
        <i className={`fa-solid fa-chevron-right text-[0.7rem] ${danger ? 'text-[#e0a8a0]' : 'text-[#c4b8ab]'}`} />
      ) : null}
    </>
  );

  if (!onClick) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function ToggleRow({ label, desc, checked, onChange, last = false }) {
  return (
    <label
      className={`flex items-center justify-between gap-3 px-4 py-3.5 ${
        last ? '' : 'border-b border-[#f0ebe4]'
      }`}
    >
      <span className="min-w-0">
        <span className="block text-[0.9rem] font-bold text-[#1c140e]">{label}</span>
        {desc ? <span className="mt-0.5 block text-[0.74rem] font-semibold text-[#8b8178]">{desc}</span> : null}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="h-5 w-5 accent-[#6b4228]" />
    </label>
  );
}

function ChoiceRow({ label, selected, onClick, last = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 border-0 bg-transparent px-4 py-3.5 text-left ${
        last ? '' : 'border-b border-[#f0ebe4]'
      }`}
    >
      <span className="text-[0.9rem] font-semibold text-[#1c140e]">{label}</span>
      {selected ? <i className="fa-solid fa-check text-[0.9rem] text-[#6b4228]" /> : null}
    </button>
  );
}

function LegalDocumentScreen({ title, onBack, children }) {
  return (
    <div className="mmf-pwa mmf-legal-screen min-h-[100dvh] bg-gradient-to-b from-[#fff4e8] to-[#ffe8d4] font-sans text-[#111111]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onBack}
          className="mb-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-[#e07a3a]"
          aria-label="Back"
        >
          <i className="fa-solid fa-chevron-left text-[1.15rem]" />
        </button>

        <h1 className="mb-5 mt-0 text-[2rem] font-black leading-tight tracking-tight text-[#111111]">
          {title}
        </h1>

        <div className="mmf-legal-card flex-1 overflow-y-auto rounded-[22px] bg-white px-5 py-6 shadow-[0_8px_28px_rgba(0,0,0,0.06)] [scrollbar-width:thin]">
          <div className="mmf-legal-body space-y-4 text-[0.92rem] font-normal leading-[1.65] text-[#2a2a2a]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MobileSettings() {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuth();
  const [panel, setPanel] = useState('hub');
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPass, setSavingPass] = useState(false);
  const [prefs, setPrefs] = useState({
    emailAlerts: DEFAULT_NOTIFICATION_PREFERENCES.emailAlerts,
    smsAlerts: DEFAULT_NOTIFICATION_PREFERENCES.smsAlerts,
    pushAlerts: DEFAULT_NOTIFICATION_PREFERENCES.pushAlerts,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [language, setLanguage] = useState(getAppLanguage());
  const [appearance, setAppearance] = useState(getAppAppearance());
  const [appearanceScope, setAppearanceScopeState] = useState(getAppAppearanceScope());
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [rateStars, setRateStars] = useState(0);
  const [passwordStep, setPasswordStep] = useState(1);
  const [showPass, setShowPass] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  useEffect(() => {
    if (!user?.isLoggedIn) {
      navigate('/app/login', { replace: true, state: { from: '/app/profile/settings' } });
      return;
    }
    const p = user.notificationPreferences || {};
    setPrefs({
      emailAlerts: p.emailAlerts ?? DEFAULT_NOTIFICATION_PREFERENCES.emailAlerts,
      smsAlerts: p.smsAlerts ?? DEFAULT_NOTIFICATION_PREFERENCES.smsAlerts,
      pushAlerts: p.pushAlerts ?? DEFAULT_NOTIFICATION_PREFERENCES.pushAlerts,
    });
  }, [user, navigate]);

  const backToHub = () => {
    setPanel('hub');
    setPasswordStep(1);
    setShowPass({ current: false, next: false, confirm: false });
  };
  const updatePass = (field) => (e) => setPassword((prev) => ({ ...prev, [field]: e.target.value }));

  const openPasswordPanel = () => {
    setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordStep(1);
    setShowPass({ current: false, next: false, confirm: false });
    setPanel('password');
  };

  const handlePasswordContinue = (e) => {
    e.preventDefault();
    if (!password.currentPassword.trim()) {
      showTopFloatNotification('Enter your current password.', 'warning');
      return;
    }
    setPasswordStep(2);
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (password.newPassword.length < 8) {
      showTopFloatNotification('New password must be at least 8 characters.', 'danger');
      return;
    }
    if (password.newPassword !== password.confirmPassword) {
      showTopFloatNotification('Passwords do not match.', 'danger');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    setSavingPass(true);
    try {
      const res = await fetch(apiUrl('/api/auth/change-password'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: password.currentPassword,
          newPassword: password.newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('Password changed.');
        setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordStep(1);
        setPanel('hub');
      } else {
        showTopFloatNotification(data.message || 'Could not change password.', 'danger');
      }
    } catch {
      showTopFloatNotification('Connection failed.', 'danger');
    } finally {
      setSavingPass(false);
    }
  };

  const handlePrefs = async () => {
    setSavingPrefs(true);
    try {
      const data = await updateProfile({ notificationPreferences: prefs });
      if (data.success) {
        storeNotificationPreferences(prefs);
        showTopFloatNotification('Notification preferences saved.');
        setPanel('hub');
      } else {
        showTopFloatNotification(data.message || 'Could not save preferences.', 'danger');
      }
    } catch {
      showTopFloatNotification('Connection failed.', 'danger');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleLanguage = (lang) => {
    const next = setAppLanguage(lang);
    setLanguage(next);
    showTopFloatNotification(next === 'so' ? 'Language set to Somali.' : 'Language set to English.');
  };

  const handleAppearance = (mode) => {
    const result = applyAppAppearance(mode, appearanceScope);
    setAppearance(result.mode);
    setAppearanceScopeState(result.scope);
    showTopFloatNotification(result.mode === 'dark' ? 'Dark mode on.' : 'Light mode on.');
  };

  const handleAppearanceScope = (scope) => {
    const result = setAppAppearanceScope(scope);
    setAppearanceScopeState(result.scope);
    if (appearance === 'dark') {
      showTopFloatNotification(`Dark applies to: ${appearanceScopeLabel(result.scope)}.`);
    }
  };

  const handleRate = () => {
    if (rateStars < 1) {
      showTopFloatNotification('Tap a star rating first.', 'warning');
      return;
    }
    showTopFloatNotification('Thank you for rating MMF!');
    setPanel('hub');
    setRateStars(0);
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
        navigate('/app/home', { replace: true });
      } else {
        showTopFloatNotification(data.message || 'Could not delete account.', 'danger');
      }
    } catch {
      showTopFloatNotification('Connection failed.', 'danger');
    } finally {
      setDeleting(false);
    }
  };

  if (panel === 'notifications') {
    return (
      <MobileProfileSubpage title="Notifications" onBack={backToHub}>
        <SettingsCard>
          <ToggleRow
            label="Email alerts"
            desc="Orders and delivery updates"
            checked={Boolean(prefs.emailAlerts)}
            onChange={(e) => setPrefs((p) => ({ ...p, emailAlerts: e.target.checked }))}
          />
          <ToggleRow
            label="SMS alerts"
            desc="Important delivery messages"
            checked={Boolean(prefs.smsAlerts)}
            onChange={(e) => setPrefs((p) => ({ ...p, smsAlerts: e.target.checked }))}
          />
          <ToggleRow
            label="Push alerts"
            desc="In-app notification badges"
            checked={Boolean(prefs.pushAlerts)}
            onChange={(e) => setPrefs((p) => ({ ...p, pushAlerts: e.target.checked }))}
            last
          />
        </SettingsCard>
        <button
          type="button"
          onClick={handlePrefs}
          disabled={savingPrefs}
          className="flex min-h-[48px] w-full items-center justify-center rounded-full border-0 bg-[#6b4228] text-[0.88rem] font-black text-white disabled:opacity-60"
        >
          {savingPrefs ? 'Saving…' : 'Save'}
        </button>
      </MobileProfileSubpage>
    );
  }

  if (panel === 'language') {
    return (
      <MobileProfileSubpage title="Language" onBack={backToHub}>
        <SettingsCard>
          <ChoiceRow label="English" selected={language === 'en'} onClick={() => handleLanguage('en')} />
          <ChoiceRow label="Somali" selected={language === 'so'} onClick={() => handleLanguage('so')} last />
        </SettingsCard>
        <p className="m-0 px-1 text-[0.78rem] font-medium leading-relaxed text-[#8b8178]">
          Somali language preference is saved. Full app translation will expand over time.
        </p>
      </MobileProfileSubpage>
    );
  }

  if (panel === 'appearance') {
    return (
      <MobileProfileSubpage title="Appearance" onBack={backToHub}>
        <SectionLabel>Theme</SectionLabel>
        <SettingsCard>
          <ChoiceRow
            label="Light"
            selected={appearance === 'light'}
            onClick={() => handleAppearance('light')}
          />
          <ChoiceRow
            label="Dark Mode"
            selected={appearance === 'dark'}
            onClick={() => handleAppearance('dark')}
            last
          />
        </SettingsCard>

        {appearance === 'dark' ? (
          <>
            <SectionLabel>Apply dark to</SectionLabel>
            <SettingsCard>
              <ChoiceRow
                label="Profile only"
                selected={appearanceScope === 'profile'}
                onClick={() => handleAppearanceScope('profile')}
              />
              <ChoiceRow
                label="Customer app"
                selected={appearanceScope === 'customer'}
                onClick={() => handleAppearanceScope('customer')}
              />
              <ChoiceRow
                label="Everywhere (All)"
                selected={appearanceScope === 'all'}
                onClick={() => handleAppearanceScope('all')}
                last
              />
            </SettingsCard>
            <p className="m-0 px-1 text-[0.78rem] font-medium leading-relaxed text-[#8b8178]">
              Profile only = Profile &amp; Settings pages. Customer app = all /app screens. All =
              keep dark on every page (current default).
            </p>
          </>
        ) : null}
      </MobileProfileSubpage>
    );
  }

  if (panel === 'privacy') {
    return (
      <LegalDocumentScreen title="Privacy Policy" onBack={backToHub}>
        {PRIVACY_SECTIONS.map((section) => (
          <div key={section.heading}>
            <h2 className="mb-1.5 mt-0 text-[1rem] font-bold text-[#111111]">{section.heading}</h2>
            <p className="m-0">{section.body}</p>
          </div>
        ))}
      </LegalDocumentScreen>
    );
  }

  if (panel === 'terms') {
    return (
      <LegalDocumentScreen title="Terms & Conditions" onBack={backToHub}>
        {TERMS_SECTIONS.map((section) => (
          <div key={section.heading}>
            <h2 className="mb-1.5 mt-0 text-[1rem] font-bold text-[#111111]">{section.heading}</h2>
            <p className="m-0">{section.body}</p>
          </div>
        ))}
      </LegalDocumentScreen>
    );
  }

  if (panel === 'about') {
    return (
      <MobileProfileSubpage title="About App" onBack={backToHub}>
        <div className="rounded-[20px] bg-white px-4 py-4 text-[0.88rem] font-medium leading-relaxed text-[#4a4038] shadow-sm ring-1 ring-[#eee7df]">
          <p className="mt-0 text-[1rem] font-bold text-[#1c140e]">Mogadishu Modern Furniture</p>
          <p>
            Premium furniture shopping and delivery for Mogadishu. Browse collections, pay with EVC
            Plus, track orders, and get support in one place.
          </p>
          <p className="mb-0">App version {APP_VERSION}</p>
        </div>
      </MobileProfileSubpage>
    );
  }

  if (panel === 'rate') {
    return (
      <MobileProfileSubpage title="Rate App" onBack={backToHub}>
        <div className="rounded-[20px] bg-white px-4 py-6 text-center shadow-sm ring-1 ring-[#eee7df]">
          <p className="mb-4 mt-0 text-[0.95rem] font-semibold text-[#1c140e]">How is your experience?</p>
          <div className="mb-5 flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRateStars(n)}
                className="flex h-11 w-11 items-center justify-center rounded-full border-0 bg-transparent text-[1.45rem]"
                aria-label={`${n} stars`}
              >
                <i
                  className={`${rateStars >= n ? 'fa-solid text-[#d4a017]' : 'fa-regular text-[#c4b8ab]'} fa-star`}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleRate}
            className="flex min-h-[48px] w-full items-center justify-center rounded-full border-0 bg-[#6b4228] text-[0.88rem] font-black text-white"
          >
            Submit rating
          </button>
        </div>
      </MobileProfileSubpage>
    );
  }

  if (panel === 'password') {
    const passwordBack = () => {
      if (passwordStep === 2) {
        setPasswordStep(1);
        setPassword((p) => ({ ...p, newPassword: '', confirmPassword: '' }));
        setShowPass((s) => ({ ...s, next: false, confirm: false }));
        return;
      }
      backToHub();
    };

    return (
      <MobileProfileSubpage title="Change Password" onBack={passwordBack}>
        <div className="mb-4 flex items-center gap-2 px-1">
          <span
            className={`h-1.5 flex-1 rounded-full ${passwordStep === 1 ? 'bg-[#6b4228]' : 'bg-[#6b4228]/35'}`}
          />
          <span
            className={`h-1.5 flex-1 rounded-full ${passwordStep === 2 ? 'bg-[#6b4228]' : 'bg-[#e8e0d6]'}`}
          />
        </div>

        {passwordStep === 1 ? (
          <form
            onSubmit={handlePasswordContinue}
            className="rounded-[22px] bg-white px-4 py-5 shadow-sm ring-1 ring-[#eee7df]"
          >
            <p className="mb-5 mt-0 text-[0.88rem] font-medium leading-relaxed text-[#8b8178]">
              Enter your current password to continue.
            </p>
            <label className="mb-1.5 block text-[0.8rem] font-bold text-[#1c140e]">Current password</label>
            <div className="relative mb-5">
              <input
                type={showPass.current ? 'text' : 'password'}
                value={password.currentPassword}
                onChange={updatePass('currentPassword')}
                placeholder="Current password"
                className={`${inputClass} pr-12`}
                required
                autoComplete="current-password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => ({ ...s, current: !s.current }))}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-transparent text-[#8b8178]"
                aria-label={showPass.current ? 'Hide password' : 'Show password'}
              >
                <i className={`fa-solid ${showPass.current ? 'fa-eye-slash' : 'fa-eye'} text-[0.9rem]`} />
              </button>
            </div>
            <button
              type="submit"
              className="flex min-h-[50px] w-full items-center justify-center rounded-full border-0 bg-[#6b4228] text-[0.9rem] font-black text-white"
            >
              Continue
            </button>
          </form>
        ) : (
          <form
            onSubmit={handlePassword}
            className="rounded-[22px] bg-white px-4 py-5 shadow-sm ring-1 ring-[#eee7df]"
          >
            <p className="mb-5 mt-0 text-[0.88rem] font-medium leading-relaxed text-[#8b8178]">
              Choose a new password (at least 8 characters).
            </p>

            <label className="mb-1.5 block text-[0.8rem] font-bold text-[#1c140e]">New password</label>
            <div className="relative mb-3.5">
              <input
                type={showPass.next ? 'text' : 'password'}
                value={password.newPassword}
                onChange={updatePass('newPassword')}
                placeholder="New password"
                className={`${inputClass} pr-12`}
                required
                autoComplete="new-password"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => ({ ...s, next: !s.next }))}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-transparent text-[#8b8178]"
                aria-label={showPass.next ? 'Hide password' : 'Show password'}
              >
                <i className={`fa-solid ${showPass.next ? 'fa-eye-slash' : 'fa-eye'} text-[0.9rem]`} />
              </button>
            </div>

            <label className="mb-1.5 block text-[0.8rem] font-bold text-[#1c140e]">Confirm password</label>
            <div className="relative mb-5">
              <input
                type={showPass.confirm ? 'text' : 'password'}
                value={password.confirmPassword}
                onChange={updatePass('confirmPassword')}
                placeholder="Confirm new password"
                className={`${inputClass} pr-12`}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => ({ ...s, confirm: !s.confirm }))}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-transparent text-[#8b8178]"
                aria-label={showPass.confirm ? 'Hide password' : 'Show password'}
              >
                <i className={`fa-solid ${showPass.confirm ? 'fa-eye-slash' : 'fa-eye'} text-[0.9rem]`} />
              </button>
            </div>

            <button
              type="submit"
              disabled={savingPass}
              className="flex min-h-[50px] w-full items-center justify-center rounded-full border-0 bg-[#6b4228] text-[0.9rem] font-black text-white disabled:opacity-60"
            >
              {savingPass ? 'Saving…' : 'Update password'}
            </button>
          </form>
        )}
      </MobileProfileSubpage>
    );
  }

  if (panel === 'delete') {
    return (
      <MobileProfileSubpage title="Delete Account" onBack={backToHub}>
        <div className="mb-4 rounded-[20px] bg-[#fff5f4] px-4 py-3 text-[0.84rem] font-semibold leading-relaxed text-[#9b2c2c] ring-1 ring-[#f0d0cc]">
          This permanently deletes your account. Orders already placed are not removed from store
          records.
        </div>
        <form onSubmit={handleDelete} className="space-y-2.5 rounded-[20px] bg-white px-4 py-4 shadow-sm ring-1 ring-[#eee7df]">
          <input
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Enter password to confirm"
            className={inputClass}
            required
            autoComplete="current-password"
          />
          <button
            type="submit"
            disabled={deleting}
            className="mt-1 flex min-h-[48px] w-full items-center justify-center rounded-full border-0 bg-[#c0392b] text-[0.86rem] font-black text-white disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Delete my account'}
          </button>
        </form>
      </MobileProfileSubpage>
    );
  }

  return (
    <MobileProfileSubpage title="Settings">
      <SectionLabel>Notifications</SectionLabel>
      <SettingsCard>
        <SettingsRow
          icon="fa-bell"
          label="Notifications"
          onClick={() => setPanel('notifications')}
          last
        />
      </SettingsCard>

      <SectionLabel>Preferences</SectionLabel>
      <SettingsCard>
        <SettingsRow
          icon="fa-globe"
          label="Language"
          value={language === 'so' ? 'Somali' : 'English'}
          onClick={() => setPanel('language')}
        />
        <SettingsRow
          icon="fa-moon"
          label="Appearance / Dark Mode"
          value={
            appearance === 'dark'
              ? `Dark · ${appearanceScopeLabel(appearanceScope)}`
              : 'Light'
          }
          onClick={() => setPanel('appearance')}
          last
        />
      </SettingsCard>

      <SectionLabel>Privacy & Legal</SectionLabel>
      <SettingsCard>
        <SettingsRow icon="fa-lock" label="Privacy Policy" onClick={() => setPanel('privacy')} />
        <SettingsRow
          icon="fa-file-lines"
          iconStyle="fa-regular"
          label="Terms & Conditions"
          onClick={() => setPanel('terms')}
          last
        />
      </SettingsCard>

      <SectionLabel>About</SectionLabel>
      <SettingsCard>
        <SettingsRow icon="fa-circle-info" label="About App" onClick={() => setPanel('about')} />
        <SettingsRow icon="fa-star" label="Rate App" onClick={() => setPanel('rate')} />
        <SettingsRow
          icon="fa-code-branch"
          label="App Version"
          value={`v${APP_VERSION}`}
          chevron={false}
          last
        />
      </SettingsCard>

      <SectionLabel>Account</SectionLabel>
      <SettingsCard>
        <SettingsRow icon="fa-key" label="Change Password" onClick={openPasswordPanel} />
        <SettingsRow
          icon="fa-trash-can"
          iconStyle="fa-regular"
          label="Delete Account"
          onClick={() => setPanel('delete')}
          danger
          last
        />
      </SettingsCard>
    </MobileProfileSubpage>
  );
}
