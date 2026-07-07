/**
 * AUTH — Login, Register, Forgot Password (single file)
 * Tailwind only for auth UI.
 */
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../utils/data';
import { showTopFloatNotification } from '../utils/notifications';

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

  if (!message) return null;

  const typeStyles =
    type === 'success'
      ? 'border-deepGreen/14 bg-gradient-to-br from-[#f2faf6] via-[#f8fbf4] to-[#fef9f0] text-deepGreen shadow-[0_6px_20px_rgba(7,61,53,0.07),inset_0_1px_0_rgba(255,255,255,0.85)] before:bg-gradient-to-b before:from-deepGreen before:to-gold'
      : 'border-gold/22 bg-gradient-to-br from-[#fff6f4] via-[#fef9f0] to-[#fdf5eb] text-[#7a2e28] shadow-[0_6px_20px_rgba(122,46,40,0.07),inset_0_1px_0_rgba(255,255,255,0.85)] before:bg-gradient-to-b before:from-[#e07a6a] before:to-gold';

  return (
    <div
      className={`relative mb-[18px] overflow-hidden rounded-xl border px-4 py-[13px] text-[0.88rem] font-semibold leading-normal tracking-[0.01em] before:absolute before:bottom-0 before:left-0 before:top-0 before:w-1 before:rounded-l-xl before:content-[''] ${typeStyles} ${leaving ? 'animate-authAlertOut' : 'animate-authAlertIn'}`}
      role="alert"
      aria-live="polite"
    >
      <span className="block">{message}</span>
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
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="group relative mb-4">
      <i className="fa-solid fa-lock pointer-events-none absolute left-[15px] top-1/2 z-[3] -translate-y-1/2 text-[0.9rem] text-[#A0ACAC] transition-colors group-focus-within:text-deepGreen" />
      <input
        type={visible ? 'text' : 'password'}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={passwordInputClass(invalid)}
      />
      <i
        className={`fa-solid ${visible ? 'fa-eye' : 'fa-eye-slash'} absolute right-[15px] top-1/2 z-[3] -translate-y-1/2 cursor-pointer text-[0.92rem] text-[#A0ACAC] transition-all hover:scale-110 hover:text-gold`}
        onClick={() => setVisible((v) => !v)}
        role="button"
        tabIndex={0}
        aria-label={visible ? 'Hide password' : 'Show password'}
        onKeyDown={(e) => e.key === 'Enter' && setVisible((v) => !v)}
      />
    </div>
  );
}


/* ═══════════════════════════════════════════════════
   FORGOT PASSWORD MODAL
   ═══════════════════════════════════════════════════ */


const INITIAL_FP = {
  phone: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
};

const STEPS = [
  { label: 'Phone', icon: 'fa-mobile-screen-button' },
  { label: 'Verify', icon: 'fa-envelope-circle-check' },
  { label: 'Password', icon: 'fa-lock' },
];

const FP_LABEL_CLASS = 'mb-[7px] block text-[0.82rem] font-black text-gray-800';
const FP_INPUT_CLASS =
  'w-full rounded-xl border-[1.5px] border-black/10 bg-white py-3 pl-[42px] pr-3.5 font-sans text-[0.9rem] font-medium text-[#111111] transition-all focus:border-deepGreen focus:outline-none focus:shadow-[0_0_0_3.5px_rgba(7,61,53,0.08)]';
const FP_BTN_PRIMARY =
  'mt-2 flex h-12 w-full items-center justify-center rounded-xl border-0 bg-gradient-to-br from-deepGreen via-[#0A5446] to-[#315C43] font-sans text-[0.9rem] font-extrabold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(7,61,53,0.25)] disabled:cursor-not-allowed disabled:opacity-55';
const FP_BTN_SECONDARY =
  'flex h-12 w-full items-center justify-center rounded-xl border-0 bg-deepGreen/10 font-sans text-[0.9rem] font-extrabold text-deepGreen transition-all hover:bg-deepGreen/15 disabled:cursor-not-allowed disabled:opacity-55';

function ForgotPasswordModal({ isOpen, onClose, onResetSuccess }) {
  const [step, setStep] = useState(0);
  const [fp, setFp] = useState(INITIAL_FP);
  const [stepError, setStepError] = useState('');
  const [codeMessage, setCodeMessage] = useState('');
  const [otpChannel, setOtpChannel] = useState('sms');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    setFp(INITIAL_FP);
    setStepError('');
    setCodeMessage('');
    setOtpChannel('sms');
    setMaskedEmail('');
    setMaskedPhone('');
    setBusy(false);
    setResendCooldown(0);
  }, [isOpen]);

  useEffect(() => {
    if (!stepError) return undefined;
    const timer = setTimeout(() => setStepError(''), 4500);
    return () => clearTimeout(timer);
  }, [stepError]);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const update = (field) => (e) => setFp((prev) => ({ ...prev, [field]: e.target.value }));

  const applyOtpResponse = (data, phoneVal) => {
    setFp((prev) => ({ ...prev, phone: phoneVal }));
    setOtpChannel(data.channel || 'sms');
    setMaskedEmail(data.maskedEmail || '');
    setMaskedPhone(data.maskedPhone || '');
    setCodeMessage(data.message || 'A 6-digit verification code was sent.');
    setResendCooldown(30);
    setStep(1);
  };

  const handleSendOtp = async () => {
    const phoneVal = fp.phone.trim();
    if (!phoneVal) {
      setStepError('Please enter the phone number you used when registering!');
      return;
    }

    setBusy(true);
    setStepError('');
    try {
      const response = await fetch(apiUrl('/api/auth/verify-phone'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneVal }),
      });
      const data = await response.json();

      if (data.success) {
        applyOtpResponse(data, phoneVal);
      } else {
        setStepError(data.message || 'Could not send verification code.');
      }
    } catch {
      setStepError('Connection to server failed!');
    } finally {
      setBusy(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || busy) return;
    await handleSendOtp();
  };

  const handleVerifyCode = async () => {
    const codeVal = fp.code.trim();
    if (!codeVal || codeVal.length !== 6) {
      setStepError('Please enter the 6-digit verification code!');
      return;
    }

    setBusy(true);
    setStepError('');
    try {
      const response = await fetch(apiUrl('/api/auth/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fp.phone.trim(), code: codeVal }),
      });
      const data = await response.json();

      if (data.success) {
        setStep(2);
      } else {
        setStepError(data.message || 'Invalid verification code.');
      }
    } catch {
      setStepError('Connection to server failed!');
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async () => {
    if (fp.newPassword.length < 8) {
      setStepError('Password must be at least 8 characters long!');
      return;
    }
    if (fp.newPassword !== fp.confirmPassword) {
      setStepError('Passwords do not match!');
      return;
    }

    setBusy(true);
    setStepError('');
    try {
      const response = await fetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fp.phone.trim(),
          code: fp.code.trim(),
          newPassword: fp.newPassword,
        }),
      });
      const data = await response.json();

      if (data.success) {
        showTopFloatNotification('Your password has been changed! You can log in now.');
        onClose();
        onResetSuccess?.();
      } else {
        setStepError(data.message || 'Failed to reset password.');
      }
    } catch {
      setStepError('Connection to server failed!');
    } finally {
      setBusy(false);
    }
  };

  const channelIsEmail = otpChannel === 'email';
  const channelIsDev = otpChannel === 'dev';

  return (
    <div
      className="fixed inset-0 z-[1050] flex items-center justify-center bg-[rgba(7,61,53,0.48)] p-6 px-4 backdrop-blur-lg"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-cardRise w-full max-w-[460px] overflow-hidden rounded-3xl border border-deepGreen/8 bg-white shadow-[0_4px_6px_rgba(0,0,0,0.04),0_28px_80px_rgba(7,61,53,0.22)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgotPasswordTitle"
      >
        <div className="relative flex items-start gap-3.5 bg-gradient-to-br from-deepGreen via-[#0A5446] to-[#1A6B5C] px-[22px] pb-[18px] pt-[22px] text-white max-[480px]:px-[18px] max-[480px]:pb-4 max-[480px]:pt-[18px]">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] border border-white/18 bg-white/12 text-xl text-gold"
            aria-hidden="true"
          >
            <i className="fa-solid fa-shield-halved" />
          </div>
          <div className="min-w-0 flex-1 pr-9">
            <p className="mb-1 text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-white/70">
              Account recovery
            </p>
            <h5 id="forgotPasswordTitle" className="m-0 font-display text-[1.55rem] font-bold leading-tight text-white">
              Reset Your Password
            </h5>
          </div>
          <button
            type="button"
            className="absolute right-4 top-[18px] inline-flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border-0 bg-white/12 text-[0.95rem] text-white transition-all hover:scale-105 hover:bg-white/20"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="bg-gradient-to-b from-[#f8faf9] to-white px-6 pb-[26px] pt-5 max-[480px]:px-[18px] max-[480px]:pb-[22px]">
          <div className="mb-[22px] grid grid-cols-3 gap-2" aria-label="Progress">
            {STEPS.map((item, index) => {
              const isActive = step === index;
              const isDone = step > index;
              return (
                <div key={item.label} className="flex flex-col items-center gap-1.5 text-center">
                  <span
                    className={[
                      'inline-flex h-9 w-9 items-center justify-center rounded-full border-2 text-[0.82rem] transition-all',
                      isDone
                        ? 'border-transparent bg-deepGreen text-gold'
                        : isActive
                          ? 'border-gold bg-gold/20 text-deepGreen shadow-[0_0_0_4px_rgba(216,161,40,0.12)]'
                          : 'border-transparent bg-deepGreen/10 text-gray-500',
                    ].join(' ')}
                  >
                    {isDone ? (
                      <i className="fa-solid fa-check" />
                    ) : (
                      <i className={`fa-solid ${item.icon}`} />
                    )}
                  </span>
                  <span
                    className={`text-[0.68rem] font-extrabold uppercase tracking-wide ${isActive || isDone ? 'text-deepGreen' : 'text-gray-400'}`}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          {step === 0 && (
            <div className="animate-fpStepIn">
              <h6 className="mb-2 text-[1.05rem] font-extrabold text-deepGreen">Enter your registered phone</h6>
              <p className="mb-3.5 text-[0.84rem] leading-relaxed text-gray-500">
                We verify your account by phone, then send a <strong>6-digit OTP</strong>. It usually arrives by{' '}
                <strong>SMS</strong>; if that fails, we send the same code to your <strong>Gmail</strong>.
              </p>

              <div className="mb-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-[0.72rem] font-extrabold text-emerald-600">
                  <i className="fa-solid fa-comment-sms" /> SMS first
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1.5 text-[0.72rem] font-extrabold text-blue-600">
                  <i className="fa-solid fa-envelope" /> Gmail backup
                </span>
              </div>

              <div className="mb-3.5">
                <label className={FP_LABEL_CLASS} htmlFor="fpPhone">
                  Phone Number
                </label>
                <div className="relative">
                  <i className="fa-solid fa-phone pointer-events-none absolute left-3.5 top-1/2 z-[2] -translate-y-1/2 text-[0.88rem] text-[#A0ACAC]" />
                  <input
                    type="tel"
                    id="fpPhone"
                    className={FP_INPUT_CLASS}
                    placeholder="0612345678"
                    value={fp.phone}
                    onChange={update('phone')}
                    autoComplete="tel"
                  />
                </div>
              </div>
              {stepError && (
                <div className="my-3 flex items-start gap-2 rounded-[10px] border border-red-500/20 bg-red-500/10 px-3.5 py-[11px] text-[0.82rem] font-semibold text-red-800">
                  <i className="fa-solid fa-circle-exclamation mt-px shrink-0" />
                  <span>{stepError}</span>
                </div>
              )}
              <button type="button" className={FP_BTN_PRIMARY} onClick={handleSendOtp} disabled={busy}>
                {busy ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin me-2" /> Sending code…
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane me-2" /> Send verification code
                  </>
                )}
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="animate-fpStepIn">
              <h6 className="mb-2 text-[1.05rem] font-extrabold text-deepGreen">Enter verification code</h6>

              <div
                className={`mb-3.5 flex items-center gap-3.5 rounded-[14px] border p-3.5 px-4 ${
                  channelIsEmail
                    ? 'border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-red-500/5'
                    : 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-deepGreen/5'
                }`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[1.1rem] shadow-[0_4px_12px_rgba(7,61,53,0.08)] ${channelIsEmail ? 'text-red-600' : 'text-emerald-600'}`}
                  aria-hidden="true"
                >
                  <i
                    className={`fa-solid ${
                      channelIsEmail ? 'fa-envelope' : channelIsDev ? 'fa-flask' : 'fa-comment-sms'
                    }`}
                  />
                </span>
                <div>
                  <p className="mb-0.5 text-[0.88rem] font-extrabold text-deepGreen">
                    {channelIsEmail
                      ? 'Code sent to Gmail'
                      : channelIsDev
                        ? 'Development test code'
                        : 'Code sent via SMS'}
                  </p>
                  <p className="m-0 text-[0.8rem] font-semibold text-gray-500">
                    {channelIsEmail && maskedEmail
                      ? maskedEmail
                      : maskedPhone
                        ? maskedPhone
                        : 'Check your inbox or messages'}
                  </p>
                </div>
              </div>

              {codeMessage && (
                <div className="mb-3.5 rounded-xl border border-dashed border-gold/45 bg-gold/10 p-3 px-3.5 text-[0.82rem] font-semibold leading-snug text-deepGreen">
                  {codeMessage}
                </div>
              )}

              <div className="mb-3.5">
                <label className={FP_LABEL_CLASS} htmlFor="fpCode">
                  6-digit OTP
                </label>
                <div className="relative">
                  <i className="fa-solid fa-key pointer-events-none absolute left-3.5 top-1/2 z-[2] -translate-y-1/2 text-[0.88rem] text-[#A0ACAC]" />
                  <input
                    type="text"
                    id="fpCode"
                    className={`${FP_INPUT_CLASS} !pl-3.5 text-center text-[1.35rem] font-extrabold tracking-[0.35em] text-deepGreen max-[480px]:text-[1.15rem] max-[480px]:tracking-[0.28em]`}
                    placeholder="• • • • • •"
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    value={fp.code}
                    onChange={(e) =>
                      setFp((prev) => ({ ...prev, code: e.target.value.replace(/\D/g, '').slice(0, 6) }))
                    }
                  />
                </div>
                <p className="mt-2 text-center text-[0.72rem] font-semibold text-gray-400">Code expires in 10 minutes</p>
              </div>

              {stepError && (
                <div className="my-3 flex items-start gap-2 rounded-[10px] border border-red-500/20 bg-red-500/10 px-3.5 py-[11px] text-[0.82rem] font-semibold text-red-800">
                  <i className="fa-solid fa-circle-exclamation mt-px shrink-0" />
                  <span>{stepError}</span>
                </div>
              )}

              <div className="my-1 mb-3.5 flex items-center justify-center gap-1.5 text-[0.8rem] text-gray-500">
                <span>Didn&apos;t receive it?</span>
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent p-0 font-extrabold text-deepGreen underline underline-offset-2 disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
                  onClick={handleResendOtp}
                  disabled={busy || resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>

              <div className="mt-1 grid grid-cols-[1fr_1.5fr] gap-3">
                <button type="button" className={FP_BTN_SECONDARY} onClick={() => setStep(0)}>
                  Back
                </button>
                <button
                  type="button"
                  className={`${FP_BTN_PRIMARY} !mt-0`}
                  onClick={handleVerifyCode}
                  disabled={busy || fp.code.length !== 6}
                >
                  {busy ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin me-2" /> Verifying…
                    </>
                  ) : (
                    'Verify code'
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fpStepIn">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-[7px] text-[0.78rem] font-extrabold text-emerald-600">
                <i className="fa-solid fa-circle-check" /> Code verified
              </div>
              <h6 className="mb-2 text-[1.05rem] font-extrabold text-deepGreen">Create new password</h6>
              <p className="mb-3.5 text-[0.84rem] leading-relaxed text-gray-500">
                Use at least 8 characters with a number for a stronger password.
              </p>

              <div className="mb-3.5">
                <label className={FP_LABEL_CLASS} htmlFor="fpNewPassword">
                  New Password
                </label>
                <PasswordField
                  id="fpNewPassword"
                  placeholder="Min 8 chars, include a number"
                  value={fp.newPassword}
                  onChange={update('newPassword')}
                />
              </div>
              <div className="mb-3.5">
                <label className={FP_LABEL_CLASS} htmlFor="fpConfirmPassword">
                  Confirm Password
                </label>
                <PasswordField
                  id="fpConfirmPassword"
                  placeholder="Repeat your password"
                  value={fp.confirmPassword}
                  onChange={update('confirmPassword')}
                />
              </div>
              {stepError && (
                <div className="my-3 flex items-start gap-2 rounded-[10px] border border-red-500/20 bg-red-500/10 px-3.5 py-[11px] text-[0.82rem] font-semibold text-red-800">
                  <i className="fa-solid fa-circle-exclamation mt-px shrink-0" />
                  <span>{stepError}</span>
                </div>
              )}
              <div className="mt-1 grid grid-cols-[1fr_1.5fr] gap-3">
                <button type="button" className={FP_BTN_SECONDARY} onClick={() => setStep(1)}>
                  Back
                </button>
                <button type="button" className={`${FP_BTN_PRIMARY} !mt-0`} onClick={handleResetPassword} disabled={busy}>
                  {busy ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin me-2" /> Saving…
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-lock me-2" /> Reset password
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
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
  const { login } = useAuth();
  const [alert, setAlert] = useState({ message: '', type: 'danger' });
  const [submitting, setSubmitting] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [form, setForm] = useState({
    login: '',
    password: '',
    remember: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setForm((prev) => ({ ...prev, login: saved, remember: true }));
    }
  }, []);

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

        setAlert({ message: '✅ Login successful! Redirecting...', type: 'success' });
        const redirectTo = location.state?.from;
        setTimeout(() => {
          if (data.user?.role === 'admin') {
            navigate('/admin');
          } else if (data.user?.role === 'delivery') {
            navigate('/delivery');
          } else if (redirectTo) {
            navigate(redirectTo, { replace: true });
          } else {
            navigate('/');
          }
        }, 1200);
      } else {
        setAlert({ message: `❌ ${data.message || 'Login failed'}`, type: 'danger' });
        setInvalid(true);
        setForm((prev) => ({ ...prev, password: '' }));
      }
    } catch {
      setAlert({ message: '❌ Connection to backend failed! Please try again.', type: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page-bg flex min-h-screen w-full min-w-full items-center justify-center p-6 font-sans">
      <div className="animate-cardRise flex w-full max-w-[520px] flex-col items-center overflow-hidden rounded-[20px] bg-white px-8 pb-8 pt-9 max-[540px]:rounded-2xl max-[540px]:px-5 max-[540px]:pb-6 max-[540px]:pt-7 max-[380px]:px-[18px]">
        <header className="mb-2 flex w-full items-center justify-center">
          <AuthBrandHeader />
        </header>

        <div className="mx-auto w-full max-w-[440px] max-[540px]:max-w-full">
          <h1 className="mb-1 text-center font-display text-[1.9rem] font-bold text-deepGreen max-[540px]:text-[2.1rem]">
            Welcome Back
          </h1>
          <p className="mb-7 text-center text-[0.88rem] font-semibold text-[#7A8585]">
            Login to your account
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
                placeholder="Email or Phone Number"
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

          <div className="mt-[22px] text-center text-[0.84rem] font-bold text-[#7A8585]">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-black text-deepGreen no-underline hover:text-gold hover:underline">
              Create one now
            </Link>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={forgotOpen}
        onClose={() => setForgotOpen(false)}
        onResetSuccess={() =>
          setAlert({ message: '✅ Your password has been changed! Please login.', type: 'success' })
        }
      />
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
  const { register } = useAuth();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ message: '', type: 'danger' });

    if (form.password.length < 8) {
      setAlert({ message: '❌ Password must be at least 8 characters long!', type: 'danger' });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setAlert({ message: '❌ Passwords do not match!', type: 'danger' });
      return;
    }
    if (!form.terms) {
      setAlert({ message: '❌ You must agree to the Terms & Conditions!', type: 'danger' });
      return;
    }

    setSubmitting(true);
    try {
      const data = await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.countryCode + form.phone.trim(),
        password: form.password,
      });

      if (data.success) {
        setAlert({
          message: '✅ Registration successful! Please login to enter the website.',
          type: 'success',
        });
        setTimeout(() => navigate('/login'), 1800);
      } else {
        setAlert({ message: `❌ ${data.message || 'Registration failed'}`, type: 'danger' });
      }
    } catch {
      setAlert({ message: '❌ Network error. Please try again.', type: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page-bg flex min-h-screen w-full min-w-full items-center justify-center p-6 font-sans">
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

          <form onSubmit={handleSubmit} noValidate>
            <div className="group relative mb-4">
              <i className="fa-regular fa-user pointer-events-none absolute left-[15px] top-1/2 z-[3] -translate-y-1/2 text-[0.9rem] text-[#A0ACAC] transition-colors group-focus-within:text-deepGreen" />
              <input
                type="text"
                placeholder="First Name"
                value={form.firstName}
                onChange={update('firstName')}
                className={AUTH_REGISTER_INPUT_CLASS}
                required
              />
            </div>

            <div className="group relative mb-4">
              <i className="fa-regular fa-user pointer-events-none absolute left-[15px] top-1/2 z-[3] -translate-y-1/2 text-[0.9rem] text-[#A0ACAC] transition-colors group-focus-within:text-deepGreen" />
              <input
                type="text"
                placeholder="Last Name"
                value={form.lastName}
                onChange={update('lastName')}
                className={AUTH_REGISTER_INPUT_CLASS}
                required
              />
            </div>

            <div className="group relative mb-4">
              <i className="fa-regular fa-envelope pointer-events-none absolute left-[15px] top-1/2 z-[3] -translate-y-1/2 text-[0.9rem] text-[#A0ACAC] transition-colors group-focus-within:text-deepGreen" />
              <input
                type="email"
                placeholder="Gmail"
                value={form.email}
                onChange={update('email')}
                className={AUTH_REGISTER_INPUT_CLASS}
                required
              />
            </div>

            <div className="group mb-4">
              <div className="flex w-full items-stretch">
                <select
                  className="auth-country-select w-[110px] cursor-pointer rounded-l-[11px] border-[1.5px] border-r-0 border-black/10 bg-[#FAFBFB] py-3 pl-2.5 pr-6 font-sans text-[0.9rem] font-semibold text-[#111111] outline-none transition-all group-focus-within:border-deepGreen group-focus-within:bg-white group-focus-within:shadow-[0_0_0_3.5px_rgba(7,61,53,0.08)]"
                  value={form.countryCode}
                  onChange={update('countryCode')}
                >
                  {COUNTRY_CODES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  className="flex-1 rounded-r-[11px] border-[1.5px] border-black/10 bg-[#FAFBFB] px-[15px] py-3 font-sans text-[0.9rem] font-medium text-[#111111] outline-none transition-all group-focus-within:border-deepGreen group-focus-within:bg-white group-focus-within:shadow-[0_0_0_3.5px_rgba(7,61,53,0.08)]"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={update('phone')}
                  required
                />
              </div>
            </div>

            <PasswordField
              id="regPassword"
              placeholder="Password"
              value={form.password}
              onChange={update('password')}
            />

            <PasswordField
              id="regConfirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
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
              {submitting ? 'Registering...' : 'Register'}
            </button>
          </form>

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


