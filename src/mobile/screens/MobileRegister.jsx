import { useCallback, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ContinueWithGoogleButton from '../../features/auth/ContinueWithGoogleButton';
import { parsePhoneForStorage } from '../../utils/phone';
import MobileAuthBrand from '../MobileAuthBrand';

const COUNTRY_CODES = [
  { value: '+252', label: '+252' },
  { value: '+254', label: '+254' },
  { value: '+251', label: '+251' },
  { value: '+253', label: '+253' },
];

const inputClass =
  'h-12 w-full rounded-2xl border border-[#e8e0d6] bg-[#faf8f5] py-3 pl-11 pr-4 text-[0.88rem] font-semibold text-[#1c140e] outline-none placeholder:font-medium placeholder:text-[#b0a498] focus:border-deepGreen focus:bg-white';

export default function MobileRegister() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, loginWithGoogle } = useAuth();
  const from = location.state?.from || '/app/checkout';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [alert, setAlert] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const finish = useCallback(() => {
    navigate(from, { replace: true });
  }, [from, navigate]);

  const handleGoogle = useCallback(
    async (payload) => {
      setAlert('');
      setSubmitting(true);
      try {
        const data = await loginWithGoogle(payload);
        if (data.success) finish();
        else setAlert(data.message || 'Google sign-in failed');
      } catch {
        setAlert('Network error. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [finish, loginWithGoogle]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert('');

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setAlert('Enter your first and last name.');
      return;
    }
    if (form.password.length < 8) {
      setAlert('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setAlert('Passwords do not match.');
      return;
    }
    if (!form.terms) {
      setAlert('Agree to the Terms & Conditions to continue.');
      return;
    }

    setSubmitting(true);
    try {
      const phoneParsed = parsePhoneForStorage(form.phone.trim(), form.countryCode);
      if (!phoneParsed.ok) {
        setAlert(phoneParsed.message);
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

      if (data.success) finish();
      else setAlert(data.message || 'Registration failed');
    } catch {
      setAlert('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mmf-pwa min-h-[100dvh] bg-white font-sans text-[#111111]">
      <header className="flex items-center px-4 py-3 pt-[max(0.7rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-[#f5f0ea] text-[#2f241a]"
          aria-label="Back"
        >
          <i className="fa-solid fa-arrow-left text-[0.9rem]" />
        </button>
      </header>

      <main className="mx-auto max-w-md px-5 pb-12">
        <MobileAuthBrand className="mb-5" />

        <div className="mb-5 text-center">
          <h1 className="m-0 font-display text-[1.75rem] font-bold text-deepGreen">Create Account</h1>
          <p className="mb-0 mt-1.5 text-[0.84rem] font-semibold text-[#7A8585]">Register your new account</p>
        </div>

        {alert ? (
          <div className="mb-4 rounded-2xl border border-[#f0cfc8] bg-[#fff5f3] px-4 py-3 text-[0.82rem] font-bold text-[#9b3b32]">
            {alert}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-3" noValidate autoComplete="off">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="group relative">
              <i className="fa-regular fa-user pointer-events-none absolute left-[13px] top-1/2 z-[3] -translate-y-1/2 text-[0.85rem] text-[#A0ACAC] transition-colors group-focus-within:text-deepGreen" />
              <input
                value={form.firstName}
                onChange={update('firstName')}
                placeholder="First Name"
                className={inputClass}
                required
                autoComplete="given-name"
              />
            </div>
            <div className="group relative">
              <i className="fa-regular fa-user pointer-events-none absolute left-[13px] top-1/2 z-[3] -translate-y-1/2 text-[0.85rem] text-[#A0ACAC] transition-colors group-focus-within:text-deepGreen" />
              <input
                value={form.lastName}
                onChange={update('lastName')}
                placeholder="Last Name"
                className={inputClass}
                required
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="group relative">
            <i className="fa-regular fa-envelope pointer-events-none absolute left-[15px] top-1/2 z-[3] -translate-y-1/2 text-[0.9rem] text-[#A0ACAC] transition-colors group-focus-within:text-deepGreen" />
            <input
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="Email Address"
              className={inputClass}
              required
              autoComplete="email"
            />
          </div>

          <div className="group flex gap-2">
            <select
              value={form.countryCode}
              onChange={update('countryCode')}
              className="h-12 w-[5.5rem] shrink-0 rounded-2xl border border-[#e8e0d6] bg-[#faf8f5] px-2 text-[0.82rem] font-bold text-[#1c140e] outline-none focus:border-deepGreen"
              aria-label="Country code"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <div className="relative min-w-0 flex-1">
              <i className="fa-solid fa-phone pointer-events-none absolute left-[15px] top-1/2 z-[3] -translate-y-1/2 text-[0.82rem] text-[#A0ACAC] transition-colors group-focus-within:text-deepGreen" />
              <input
                type="tel"
                value={form.phone}
                onChange={update('phone')}
                placeholder="Phone Number"
                className={inputClass}
                required
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="group relative">
            <i className="fa-solid fa-lock pointer-events-none absolute left-[15px] top-1/2 z-[3] -translate-y-1/2 text-[0.9rem] text-[#A0ACAC] transition-colors group-focus-within:text-deepGreen" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={update('password')}
              placeholder="Password"
              className={`${inputClass} pr-11`}
              required
              autoComplete="new-password"
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

          <div className="group relative">
            <i className="fa-solid fa-lock pointer-events-none absolute left-[15px] top-1/2 z-[3] -translate-y-1/2 text-[0.9rem] text-[#A0ACAC] transition-colors group-focus-within:text-deepGreen" />
            <input
              type={showConfirm ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              placeholder="Confirm Password"
              className={`${inputClass} pr-11`}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 z-[4] -translate-y-1/2 border-0 bg-transparent p-1 text-[#8b8178]"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              <i className={`fa-solid ${showConfirm ? 'fa-eye-slash' : 'fa-eye'} text-[0.9rem]`} />
            </button>
          </div>

          <label className="flex items-start gap-2.5 px-0.5 pt-1 text-[0.78rem] font-semibold text-[#6b5a4c]">
            <input
              type="checkbox"
              checked={form.terms}
              onChange={update('terms')}
              className="mt-0.5 h-4 w-4 accent-deepGreen"
            />
            <span>I agree to the Terms & Conditions and Privacy Policy</span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 flex min-h-[50px] w-full items-center justify-center rounded-2xl border-0 bg-deepGreen text-[0.95rem] font-black text-white disabled:opacity-60"
          >
            {submitting ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-[#eadfce]" />
          <span className="text-[0.72rem] font-bold text-[#9a8d82]">Or continue with</span>
          <span className="h-px flex-1 bg-[#eadfce]" />
        </div>

        <ContinueWithGoogleButton onCredential={handleGoogle} disabled={submitting} />

        <p className="mb-0 mt-5 text-center text-[0.84rem] font-bold text-[#8b8178]">
          Already have an account?{' '}
          <Link to="/app/login" state={{ from }} className="font-black text-deepGreen no-underline">
            Login
          </Link>
        </p>
      </main>
    </div>
  );
}
