import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ContinueWithGoogleButton from '../../features/auth/ContinueWithGoogleButton';
import ForgotPasswordModal from '../../features/auth/ForgotPasswordModal';

const REMEMBER_KEY = 'mmf_remember_login';
const SPLASH_SRC = '/app/mmf-splash-hero.jpg?v=6';

const inputClass =
  'h-12 w-full rounded-2xl border border-[#e8e0d6] bg-[#faf8f5] py-3 pl-11 pr-4 text-[0.88rem] font-semibold text-[#1c140e] outline-none placeholder:font-medium placeholder:text-[#b0a498] focus:border-[#6b4228] focus:bg-white';

function redirectAfterAuth(user, navigate, from) {
  const role = user?.role || localStorage.getItem('userRole') || 'user';
  if (role === 'admin' || role === 'staff') {
    window.location.replace('/admin');
    return;
  }
  if (role === 'delivery') {
    window.location.replace('/delivery');
    return;
  }
  navigate(from || '/app/home', { replace: true });
}

export default function MobileLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, loginWithGoogle } = useAuth();
  const from = location.state?.from || '/app/checkout';

  const [form, setForm] = useState({ login: '', password: '', remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [sheetIn, setSheetIn] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) setForm((prev) => ({ ...prev, login: saved, remember: true }));
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => setSheetIn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (user?.isLoggedIn) redirectAfterAuth(user, navigate, from);
  }, [user, navigate, from]);

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGoogle = useCallback(
    async (payload) => {
      setAlert('');
      setSubmitting(true);
      try {
        const data = await loginWithGoogle(payload);
        if (data.success) redirectAfterAuth(data.user, navigate, from);
        else setAlert(data.message || 'Google sign-in failed');
      } catch {
        setAlert('Cannot reach server. Start backend and try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [from, loginWithGoogle, navigate]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert('');
    setSubmitting(true);
    try {
      const data = await login(form.login.trim(), form.password);
      if (data.success) {
        if (form.remember) localStorage.setItem(REMEMBER_KEY, form.login.trim());
        else localStorage.removeItem(REMEMBER_KEY);
        redirectAfterAuth(data.user, navigate, from);
      } else {
        setAlert(data.message || 'Login failed');
        setForm((prev) => ({ ...prev, password: '' }));
      }
    } catch {
      setAlert('Cannot reach server. Start backend and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mmf-pwa relative min-h-[100dvh] overflow-hidden bg-[#f3eee6] font-sans text-[#111111]">
      <div className="absolute inset-0">
        <img
          src={SPLASH_SRC}
          alt=""
          className="h-full w-full object-cover object-[50%_28%]"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/25" />
      </div>

      <div
        className={`absolute inset-x-0 bottom-0 z-[2] mx-auto max-w-md transition-transform duration-500 ease-out ${
          sheetIn ? 'translate-y-0' : 'translate-y-[110%]'
        }`}
      >
        <aside className="max-h-[min(78dvh,640px)] overflow-y-auto rounded-t-[32px] bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_50px_rgba(0,0,0,0.22)]">
          <div className="mx-auto mb-3 h-1 w-11 rounded-full bg-[#e4d8ca]" />

          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="m-0 text-[1.45rem] font-black text-[#1c140e]">Welcome Back 👋</h1>
              <p className="mb-0 mt-1 text-[0.84rem] font-semibold text-[#8b8178]">Login to your account.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-[#f5f0ea] text-[#6b5a4c]"
              aria-label="Close"
            >
              <i className="fa-solid fa-xmark text-[0.9rem]" />
            </button>
          </div>

          {alert ? (
            <div className="mb-3 rounded-2xl border border-[#f0cfc8] bg-[#fff5f3] px-4 py-3 text-[0.82rem] font-bold text-[#9b3b32]">
              {alert}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <div className="group relative">
              <i className="fa-solid fa-user pointer-events-none absolute left-[15px] top-1/2 z-[3] -translate-y-1/2 text-[0.9rem] text-[#A0ACAC] transition-colors group-focus-within:text-[#6b4228]" />
              <input
                type="text"
                value={form.login}
                onChange={update('login')}
                placeholder="Email Address"
                className={inputClass}
                required
                autoComplete="username"
              />
            </div>
            <div className="group relative">
              <i className="fa-solid fa-lock pointer-events-none absolute left-[15px] top-1/2 z-[3] -translate-y-1/2 text-[0.9rem] text-[#A0ACAC] transition-colors group-focus-within:text-[#6b4228]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={update('password')}
                placeholder="Password"
                className={`${inputClass} pr-11`}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 z-[4] -translate-y-1/2 border-0 bg-transparent p-1 text-[#8b8178]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-[0.9rem]`} />
              </button>
            </div>

            <div className="flex items-center justify-between px-0.5 pt-0.5 text-[0.78rem] font-bold">
              <label className="flex items-center gap-2 text-[#6b5a4c]">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={update('remember')}
                  className="h-4 w-4 accent-[#6b4228]"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="border-0 bg-transparent p-0 font-black text-[#6b4228]"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 flex min-h-[50px] w-full items-center justify-center rounded-2xl border-0 bg-[#6b4228] text-[0.95rem] font-black text-white disabled:opacity-60"
            >
              {submitting ? 'Logging in…' : 'Login'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-[#eadfce]" />
            <span className="text-[0.72rem] font-bold text-[#9a8d82]">Or continue with</span>
            <span className="h-px flex-1 bg-[#eadfce]" />
          </div>

          <ContinueWithGoogleButton onCredential={handleGoogle} disabled={submitting} />

          <p className="mb-1 mt-5 text-center text-[0.84rem] font-bold text-[#8b8178]">
            Don&apos;t have an account?{' '}
            <Link to="/app/register" state={{ from }} className="font-black text-[#6b4228] no-underline">
              Sign up
            </Link>
          </p>
        </aside>
      </div>

      {forgotOpen ? (
        <ForgotPasswordModal
          onClose={() => setForgotOpen(false)}
          onResetSuccess={() => {
            setForgotOpen(false);
            setAlert('');
          }}
        />
      ) : null}
    </div>
  );
}
