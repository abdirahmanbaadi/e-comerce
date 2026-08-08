/**
 * AUTH — Login, Register, Forgot Password (single file)
 * Tailwind only for auth UI.
 */
import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ContinueWithGoogleButton from '../features/auth/ContinueWithGoogleButton';
import ForgotPasswordModal from '../features/auth/ForgotPasswordModal';
import { parsePhoneForStorage } from '../utils/phone';

/* Shared Tailwind class strings (used across login / register / password field) */
const AUTH_SUBMIT_BTN_CLASS =
  'relative h-[50px] w-full overflow-hidden rounded-xl border-0 bg-gradient-to-br from-deepGreen via-[#0A5446] to-[#315C43] text-[0.95rem] font-black tracking-wide text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(7,61,53,0.28)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70';

const authTextInputClass = (invalid) =>
  [
    'w-full rounded-[11px] border-[1.5px] bg-[#FAFBFB] py-[13px] pl-11 pr-4 font-sans text-[0.9rem] font-medium text-[#111111] transition-all',
    'placeholder:font-medium placeholder:text-[#B0B8B8]',
    'focus:border-deepGreen focus:bg-white focus:outline-none focus:shadow-[0_0_0_3.5px_rgba(7,61,53,0.08)]',
    invalid
      ? 'border-[#B42318] focus:shadow-[0_0_0_3.5px_rgba(180,35,24,0.08)]'
      : 'border-black/10',
  ].join(' ');

const AUTH_REGISTER_INPUT_CLASS =
  'w-full rounded-[11px] border-[1.5px] border-black/10 bg-[#FAFBFB] py-[13px] pl-11 pr-4 font-sans text-[0.9rem] font-medium text-[#111111] transition-all placeholder:font-medium placeholder:text-[#B0B8B8] focus:border-deepGreen focus:bg-white focus:outline-none focus:shadow-[0_0_0_3.5px_rgba(7,61,53,0.08)]';

const passwordInputClass = (invalid) =>
  [
    'w-full rounded-[11px] border-[1.5px] bg-[#FAFBFB] py-[13px] pl-11 pr-11 font-sans text-[0.9rem] font-medium text-[#111111] transition-all',
    'placeholder:font-medium placeholder:text-[#B0B8B8]',
    'focus:border-deepGreen focus:bg-white focus:outline-none focus:shadow-[0_0_0_3.5px_rgba(7,61,53,0.08)]',
    invalid
      ? 'border-[#B42318] focus:shadow-[0_0_0_3.5px_rgba(180,35,24,0.08)]'
      : 'border-black/10',
  ].join(' ');

/* ═══════════════════════════════════════════════════
   SHARED — alerts, brand, password field
   ═══════════════════════════════════════════════════ */


function AuthAlert({
  message,
  type = 'danger',
  onDismiss,
  autoDismiss = true,
  duration = 3000,
}) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!message || !autoDismiss || !onDismiss) {
      setLeaving(false);
      return undefined;
    }

    setLeaving(false);
    const fadeAt = Math.max(duration - 320, 0);
    const fadeTimer = setTimeout(() => setLeaving(true), fadeAt);
    const hideTimer = setTimeout(() => {
      onDismiss();
      setLeaving(false);
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [message, autoDismiss, duration, onDismiss]);

  const typeStyles =
    type === 'success'
      ? 'border-deepGreen/14 bg-gradient-to-br from-[#f2faf6] via-[#f8fbf4] to-[#fef9f0] text-deepGreen shadow-[0_6px_20px_rgba(7,61,53,0.07),inset_0_1px_0_rgba(255,255,255,0.85)] before:bg-gradient-to-b before:from-deepGreen before:to-gold'
      : 'border-gold/22 bg-gradient-to-br from-[#fff6f4] via-[#fef9f0] to-[#fdf5eb] text-[#7a2e28] shadow-[0_6px_20px_rgba(122,46,40,0.07),inset_0_1px_0_rgba(255,255,255,0.85)] before:bg-gradient-to-b before:from-[#e07a6a] before:to-gold';

  // Keep the node mounted (hidden) so React never removeChilds a translated/mutated tree
  return (
    <div
      className={`relative mb-[18px] overflow-hidden rounded-xl border px-4 py-[13px] text-[0.88rem] font-semibold leading-normal tracking-[0.01em] before:absolute before:bottom-0 before:left-0 before:top-0 before:w-1 before:rounded-l-xl before:content-[''] ${typeStyles} ${leaving ? 'animate-authAlertOut' : 'animate-authAlertIn'} ${message ? '' : 'invisible mb-0 h-0 overflow-hidden border-0 p-0'}`}
      role="alert"
      aria-live="polite"
      aria-hidden={!message}
      translate="no"
    >
      <span className="block">{message || '\u00a0'}</span>
    </div>
  );
}


function AuthSocialDivider() {
  return (
    <div className="my-5 flex w-full items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-black/10" />
      <span className="text-[0.75rem] font-bold uppercase tracking-[0.06em] text-[#9aa3a3]">
        or continue with
      </span>
      <span className="h-px flex-1 bg-black/10" />
    </div>
  );
}

function AuthBrandHeader() {
  return (
    <div className="mx-auto mb-5 flex w-fit max-w-full items-center justify-center gap-3">
      <div className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center">
        <span className="absolute inset-0 rotate-45 rounded-[11px] border-2 border-gold" />
        <span className="relative z-[2] font-display text-[1.55rem] font-bold tracking-tight text-gold">
          MF
        </span>
      </div>
      <div className="h-11 w-px bg-gold opacity-85" />
      <div className="leading-tight">
        <span className="block font-display text-[2.1rem] font-bold tracking-wide text-deepGreen max-[540px]:text-[1.3rem]">
          Mogadishu
        </span>
        <span className="mt-0.5 block font-sans text-xs font-extrabold uppercase tracking-[2px] text-deepGreen opacity-90 max-[540px]:tracking-[2.5px]">
          Modern Furniture
        </span>
      </div>
    </div>
  );
}


function PasswordField({
  id,
  placeholder,
  value,
  onChange,
  required = true,
  invalid = false,
  autoComplete = 'current-password',
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="group relative mb-4">
      <i className="fa-solid fa-lock pointer-events-none absolute left-[15px] top-1/2 z-[3] -translate-y-1/2 text-[0.9rem] text-[#A0ACAC] transition-colors group-focus-within:text-deepGreen" />
      <input
        type={visible ? 'text' : 'password'}
        id={id}
        name={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        className={passwordInputClass(invalid)}
      />
      <button
        type="button"
        className="absolute right-[15px] top-1/2 z-[3] flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent transition-all hover:scale-110 hover:text-gold"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        <i
          className={`fa-solid ${visible ? 'fa-eye' : 'fa-eye-slash'} text-[0.92rem] text-[#A0ACAC] transition-colors hover:text-gold`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   LOGIN PAGE
   ═══════════════════════════════════════════════════ */


const REMEMBER_KEY = 'rememberedLogin';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, user } = useAuth();
  const [alert, setAlert] = useState({ message: '', type: 'danger' });
  const [submitting, setSubmitting] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [form, setForm] = useState({
    login: '',
    password: '',
    remember: false,
  });

  const closeForgotModal = useCallback(() => setForgotOpen(false), []);
  const handleResetSuccess = useCallback(
    () => setAlert({ message: 'Your password has been changed. Please login.', type: 'success' }),
    []
  );

  const finishAuthRedirect = useCallback(
    (authUser) => {
      if (authUser?.role === 'admin' || authUser?.role === 'staff') {
        window.location.replace('/admin');
        return;
      }
      if (authUser?.role === 'delivery') {
        window.location.replace('/delivery');
        return;
      }
      setAlert({ message: 'Login successful. Redirecting...', type: 'success' });
      const redirectTo = location.state?.from;
      setTimeout(() => {
        navigate(redirectTo || '/', { replace: true });
      }, 600);
    },
    [location.state?.from, navigate]
  );

  const handleGoogleCredential = useCallback(
    async (payload) => {
      setAlert({ message: '', type: 'danger' });
      setInvalid(false);
      setSubmitting(true);
      try {
        const data = await loginWithGoogle(payload);
        if (data.success) {
          finishAuthRedirect(data.user);
        } else {
          setAlert({ message: data.message || 'Google sign-in failed', type: 'danger' });
        }
      } catch {
        setAlert({
          message: 'Cannot reach server. Wait until backend is ready, then try again.',
          type: 'danger',
        });
      } finally {
        setSubmitting(false);
      }
    },
    [finishAuthRedirect, loginWithGoogle]
  );

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setForm((prev) => ({ ...prev, login: saved, remember: true }));
    }
  }, []);

  // Already logged in as dashboard/driver → leave login page
  useEffect(() => {
    const role = user?.role || localStorage.getItem('userRole') || '';
    if (!user?.isLoggedIn && localStorage.getItem('isLoggedIn') !== 'true') return;
    if (role === 'admin' || role === 'staff') {
      window.location.replace('/admin');
      return;
    }
    if (role === 'delivery') {
      window.location.replace('/delivery');
    }
  }, [user?.isLoggedIn, user?.role]);

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ message: '', type: 'danger' });
    setInvalid(false);
    setSubmitting(true);

    try {
      const data = await login(form.login.trim(), form.password);

      if (data.success) {
        if (form.remember) {
          localStorage.setItem(REMEMBER_KEY, form.login.trim());
        } else {
          localStorage.removeItem(REMEMBER_KEY);
        }

        if (data.user?.role === 'admin' || data.user?.role === 'staff') {
          // Hard redirect so ProtectedRoute reads fresh role from localStorage
          // (React state may still hold the previous role for one render).
          window.location.replace('/admin');
          return;
        }
        if (data.user?.role === 'delivery') {
          window.location.replace('/delivery');
          return;
        }

        setAlert({ message: 'Login successful. Redirecting...', type: 'success' });
        const redirectTo = location.state?.from;
        setTimeout(() => {
          navigate(redirectTo || '/', { replace: true });
        }, 600);
      } else {
        setAlert({ message: data.message || 'Login failed', type: 'danger' });
        setInvalid(true);
        setForm((prev) => ({ ...prev, password: '' }));
      }
    } catch {
      setAlert({
        message: 'Cannot reach server. Wait until backend is ready, then try again.',
        type: 'danger',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="auth-page-bg flex min-h-screen w-full min-w-full items-center justify-center p-6 font-sans"
      translate="no"
    >
      <div className="animate-cardRise flex w-full max-w-[520px] flex-col items-center overflow-hidden rounded-[20px] bg-white px-8 pb-8 pt-9 max-[540px]:rounded-2xl max-[540px]:px-5 max-[540px]:pb-6 max-[540px]:pt-7 max-[380px]:px-[18px]">
        <header className="mb-2 flex w-full items-center justify-center">
          <AuthBrandHeader />
        </header>

        <div className="mx-auto w-full max-w-[440px] max-[540px]:max-w-full">
          <h1 className="mb-1 text-center font-display text-[1.9rem] font-bold text-deepGreen max-[540px]:text-[2.1rem]">
            Welcome Back
          </h1>
          <p className="mb-7 text-center text-[0.88rem] font-semibold text-[#7A8585]">
            Login with email or phone
          </p>

          <AuthAlert
            message={alert.message}
            type={alert.type}
            onDismiss={() => setAlert({ message: '', type: 'danger' })}
            autoDismiss
            duration={3000}
          />

          <form onSubmit={handleSubmit} noValidate>
            <div className="group relative mb-4">
              <i className="fa-solid fa-user pointer-events-none absolute left-[15px] top-1/2 z-[3] -translate-y-1/2 text-[0.9rem] text-[#A0ACAC] transition-colors group-focus-within:text-deepGreen" />
              <input
                type="text"
                id="loginIdentifier"
                placeholder="Email or phone number"
                value={form.login}
                onChange={update('login')}
                className={authTextInputClass(invalid)}
                required
              />
            </div>

            <PasswordField
              id="loginPassword"
              placeholder="Password"
              value={form.password}
              onChange={update('password')}
              invalid={invalid}
            />

            <div className="mb-5 mt-1.5 flex items-center justify-between text-[0.8rem] font-bold">
              <label className="flex cursor-pointer items-center gap-1.5 text-[#5d6868]">
                <input
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer accent-deepGreen"
                  checked={form.remember}
                  onChange={update('remember')}
                />
                <span>Remember password</span>
              </label>
              <button
                type="button"
                className="cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[0.8rem] font-black text-deepGreen hover:text-gold hover:underline"
                onClick={() => setForgotOpen(true)}
              >
                Forgot Password?
              </button>
            </div>

            <button type="submit" className={AUTH_SUBMIT_BTN_CLASS} disabled={submitting}>
              {submitting ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <AuthSocialDivider />
          <ContinueWithGoogleButton onCredential={handleGoogleCredential} disabled={submitting} />

          <div className="mt-[22px] text-center text-[0.84rem] font-bold text-[#7A8585]">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-black text-deepGreen no-underline hover:text-gold hover:underline">
              Create one now
            </Link>
          </div>
        </div>
      </div>

      {forgotOpen ? (
        <ForgotPasswordModal onClose={closeForgotModal} onResetSuccess={handleResetSuccess} />
      ) : null}
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   REGISTER PAGE
   ═══════════════════════════════════════════════════ */


const COUNTRY_CODES = [
  { value: '+252', label: '🇸🇴 +252' },
  { value: '+254', label: '🇰🇪 +254' },
  { value: '+251', label: '🇪🇹 +251' },
  { value: '+253', label: '🇩🇯 +253' },
  { value: '+1', label: '🇺🇸 +1' },
  { value: '+44', label: '🇬🇧 +44' },
  { value: '+90', label: '🇹🇷 +90' },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, loginWithGoogle } = useAuth();
  const [alert, setAlert] = useState({ message: '', type: 'danger' });
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    countryCode: '+252',
    phone: '',
    password: '',
    confirmPassword: '',
    terms: false,
  });

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGoogleCredential = useCallback(
    async (payload) => {
      setAlert({ message: '', type: 'danger' });
      setSubmitting(true);
      try {
        const data = await loginWithGoogle(payload);
        if (data.success) {
          setAlert({
            message: 'Account ready. Welcome to Mogadishu Modern Furniture.',
            type: 'success',
          });
          setTimeout(() => {
            const redirectTo = location.state?.from;
            navigate(redirectTo || '/', { replace: true });
          }, 600);
        } else {
          setAlert({ message: data.message || 'Google sign-in failed', type: 'danger' });
        }
      } catch {
        setAlert({ message: 'Network error. Please try again.', type: 'danger' });
      } finally {
        setSubmitting(false);
      }
    },
    [location.state?.from, loginWithGoogle, navigate]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ message: '', type: 'danger' });

    if (form.password.length < 8) {
      setAlert({ message: 'Password must be at least 8 characters long.', type: 'danger' });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setAlert({ message: 'Passwords do not match.', type: 'danger' });
      return;
    }
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setAlert({ message: 'Please enter your first and last name.', type: 'danger' });
      return;
    }
    if (!form.terms) {
      setAlert({ message: 'You must agree to the Terms & Conditions.', type: 'danger' });
      return;
    }

    setSubmitting(true);
    try {
      const phoneParsed = parsePhoneForStorage(form.phone.trim(), form.countryCode);
      if (!phoneParsed.ok) {
        setAlert({ message: phoneParsed.message, type: 'danger' });
        setSubmitting(false);
        return;
      }

      const data = await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: phoneParsed.e164,
        password: form.password,
      });

      if (data.success) {
        setAlert({
          message: 'Account created. Welcome to Mogadishu Modern Furniture.',
          type: 'success',
        });
        setTimeout(() => {
          const redirectTo = location.state?.from;
          navigate(redirectTo || '/', { replace: true });
        }, 600);
      } else {
        setAlert({ message: data.message || 'Registration failed', type: 'danger' });
      }
    } catch {
      setAlert({ message: 'Network error. Please try again.', type: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="auth-page-bg flex min-h-screen w-full min-w-full items-center justify-center p-6 font-sans"
      translate="no"
    >
      <div className="animate-cardRise flex w-full max-w-[520px] flex-col items-center overflow-hidden rounded-[20px] bg-white px-8 pb-8 pt-9 max-[540px]:rounded-2xl max-[540px]:px-5 max-[540px]:pb-6 max-[540px]:pt-7 max-[380px]:px-[18px]">
        <header className="mb-2 flex w-full items-center justify-center">
          <AuthBrandHeader />
        </header>

        <div className="mx-auto w-full max-w-[440px] max-[540px]:max-w-full">
          <h1 className="mb-1 text-center font-display text-[1.9rem] font-bold text-deepGreen max-[540px]:text-[2.1rem]">
            Create Account
          </h1>
          <p className="mb-7 text-center text-[0.88rem] font-semibold text-[#7A8585]">
            Register your new account
          </p>

          <AuthAlert
            message={alert.message}
            type={alert.type}
            onDismiss={() => setAlert({ message: '', type: 'danger' })}
            autoDismiss
            duration={3000}
          />

          <form onSubmit={handleSubmit} noValidate autoComplete="off">
            <div className="mb-4 grid grid-cols-2 gap-3 max-[420px]:grid-cols-1">
              <div className="group relative">
                <i className="fa-regular fa-user pointer-events-none absolute left-[15px] top-1/2 z-[3] -translate-y-1/2 text-[0.9rem] text-[#A0ACAC] transition-colors group-focus-within:text-deepGreen" />
                <input
                  type="text"
                  name="regFirstName"
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={update('firstName')}
                  className={AUTH_REGISTER_INPUT_CLASS}
                  autoComplete="given-name"
                  required
                />
              </div>

              <div className="group relative">
                <i className="fa-regular fa-user pointer-events-none absolute left-[15px] top-1/2 z-[3] -translate-y-1/2 text-[0.9rem] text-[#A0ACAC] transition-colors group-focus-within:text-deepGreen" />
                <input
                  type="text"
                  name="regLastName"
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={update('lastName')}
                  className={AUTH_REGISTER_INPUT_CLASS}
                  autoComplete="family-name"
                  required
                />
              </div>
            </div>

            <div className="group relative mb-4">
              <i className="fa-regular fa-envelope pointer-events-none absolute left-[15px] top-1/2 z-[3] -translate-y-1/2 text-[0.9rem] text-[#A0ACAC] transition-colors group-focus-within:text-deepGreen" />
              <input
                type="email"
                name="regEmail"
                placeholder="Email Address"
                value={form.email}
                onChange={update('email')}
                className={AUTH_REGISTER_INPUT_CLASS}
                autoComplete="email"
                required
              />
            </div>

            <div className="group mb-4">
              <div className="flex w-full items-stretch">
                <select
                  className="auth-country-select w-[110px] cursor-pointer rounded-l-[11px] border-[1.5px] border-r-0 border-black/10 bg-[#FAFBFB] py-3 pl-2.5 pr-6 font-sans text-[0.9rem] font-semibold text-[#111111] outline-none transition-all group-focus-within:border-deepGreen group-focus-within:bg-white group-focus-within:shadow-[0_0_0_3.5px_rgba(7,61,53,0.08)]"
                  value={form.countryCode}
                  onChange={update('countryCode')}
                  autoComplete="tel-country-code"
                >
                  {COUNTRY_CODES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  name="regPhone"
                  className="flex-1 rounded-r-[11px] border-[1.5px] border-black/10 bg-[#FAFBFB] px-[15px] py-3 font-sans text-[0.9rem] font-medium text-[#111111] outline-none transition-all group-focus-within:border-deepGreen group-focus-within:bg-white group-focus-within:shadow-[0_0_0_3.5px_rgba(7,61,53,0.08)]"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={update('phone')}
                  autoComplete="tel-national"
                  required
                />
              </div>
            </div>

            <PasswordField
              id="regPassword"
              placeholder="Password"
              value={form.password}
              onChange={update('password')}
              autoComplete="new-password"
            />

            <PasswordField
              id="regConfirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              autoComplete="new-password"
            />

            <label className="mb-5 mt-1.5 flex cursor-pointer items-center gap-2.5 text-[0.8rem] font-bold text-[#5d6868]">
              <input
                type="checkbox"
                className="h-4 w-4 cursor-pointer accent-deepGreen"
                checked={form.terms}
                onChange={update('terms')}
                required
              />
              <span>
                I agree to the{' '}
                <a href="#" className="font-black text-deepGreen no-underline hover:text-gold hover:underline">
                  Terms & Conditions
                </a>
              </span>
            </label>

            <button type="submit" className={AUTH_SUBMIT_BTN_CLASS} disabled={submitting}>
              {submitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2" aria-hidden="true" />
                  Creating account...
                </>
              ) : (
                'Register'
              )}
            </button>
          </form>

          <AuthSocialDivider />
          <ContinueWithGoogleButton onCredential={handleGoogleCredential} disabled={submitting} />

          <div className="mt-[22px] text-center text-[0.84rem] font-bold text-[#7A8585]">
            Already have an account?{' '}
            <Link to="/login" className="font-black text-deepGreen no-underline hover:text-gold hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


