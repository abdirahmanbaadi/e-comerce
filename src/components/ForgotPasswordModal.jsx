import { useEffect, useState } from 'react';
import { apiUrl } from '../utils/data';
import { showTopFloatNotification } from '../utils/notifications';
import PasswordField from './PasswordField';
import '../styles/forgot-password-modal.css';

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

export default function ForgotPasswordModal({ isOpen, onClose, onResetSuccess }) {
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
    <div className="forgot-password-overlay" onClick={onClose} role="presentation">
      <div
        className="forgot-password-dialog auth-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgotPasswordTitle"
      >
        <div className="fp-hero-band">
          <div className="fp-hero-icon" aria-hidden="true">
            <i className="fa-solid fa-shield-halved" />
          </div>
          <div className="fp-hero-text">
            <p className="fp-hero-eyebrow">Account recovery</p>
            <h5 id="forgotPasswordTitle" className="forgot-password-title">
              Reset Your Password
            </h5>
          </div>
          <button type="button" className="forgot-password-close" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="forgot-password-body">
          <div className="fp-steps-track" aria-label="Progress">
            {STEPS.map((item, index) => (
              <div
                key={item.label}
                className={`fp-step-node${step === index ? ' is-active' : ''}${step > index ? ' is-done' : ''}`}
              >
                <span className="fp-step-node-icon">
                  {step > index ? <i className="fa-solid fa-check" /> : <i className={`fa-solid ${item.icon}`} />}
                </span>
                <span className="fp-step-node-label">{item.label}</span>
              </div>
            ))}
          </div>

          {step === 0 && (
            <div className="fp-step active">
              <h6 className="fp-step-title">Enter your registered phone</h6>
              <p className="fp-step-desc">
                We verify your account by phone, then send a <strong>6-digit OTP</strong>. It usually arrives by{' '}
                <strong>SMS</strong>; if that fails, we send the same code to your <strong>Gmail</strong>.
              </p>

              <div className="fp-channel-hints">
                <span className="fp-channel-hint">
                  <i className="fa-solid fa-comment-sms" /> SMS first
                </span>
                <span className="fp-channel-hint fp-channel-hint--email">
                  <i className="fa-solid fa-envelope" /> Gmail backup
                </span>
              </div>

              <div className="auth-form-group">
                <label className="auth-label" htmlFor="fpPhone">
                  Phone Number
                </label>
                <div className="auth-input-wrapper">
                  <i className="fa-solid fa-phone auth-input-icon-left" />
                  <input
                    type="tel"
                    id="fpPhone"
                    className="auth-input auth-input-with-icon"
                    placeholder="0612345678"
                    value={fp.phone}
                    onChange={update('phone')}
                    autoComplete="tel"
                  />
                </div>
              </div>
              {stepError && <div className="fp-step-error">{stepError}</div>}
              <button
                type="button"
                className="auth-button auth-button-primary"
                onClick={handleSendOtp}
                disabled={busy}
              >
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
            <div className="fp-step active">
              <h6 className="fp-step-title">Enter verification code</h6>

              <div className={`fp-delivery-card${channelIsEmail ? ' fp-delivery-card--email' : ''}`}>
                <span className="fp-delivery-card-icon" aria-hidden="true">
                  <i
                    className={`fa-solid ${
                      channelIsEmail ? 'fa-envelope' : channelIsDev ? 'fa-flask' : 'fa-comment-sms'
                    }`}
                  />
                </span>
                <div>
                  <p className="fp-delivery-card-title">
                    {channelIsEmail
                      ? 'Code sent to Gmail'
                      : channelIsDev
                        ? 'Development test code'
                        : 'Code sent via SMS'}
                  </p>
                  <p className="fp-delivery-card-sub">
                    {channelIsEmail && maskedEmail
                      ? maskedEmail
                      : maskedPhone
                        ? maskedPhone
                        : 'Check your inbox or messages'}
                  </p>
                </div>
              </div>

              {codeMessage && <div className="fp-message">{codeMessage}</div>}

              <div className="auth-form-group">
                <label className="auth-label" htmlFor="fpCode">
                  6-digit OTP
                </label>
                <div className="auth-input-wrapper">
                  <i className="fa-solid fa-key auth-input-icon-left" />
                  <input
                    type="text"
                    id="fpCode"
                    className="auth-input auth-input-with-icon fp-otp-input"
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
                <p className="fp-otp-hint">Code expires in 10 minutes</p>
              </div>

              {stepError && <div className="fp-step-error">{stepError}</div>}

              <div className="fp-resend-row">
                <span>Didn&apos;t receive it?</span>
                <button
                  type="button"
                  className="fp-resend-btn"
                  onClick={handleResendOtp}
                  disabled={busy || resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>

              <div className="fp-button-group">
                <button type="button" className="auth-button auth-button-secondary" onClick={() => setStep(0)}>
                  Back
                </button>
                <button
                  type="button"
                  className="auth-button auth-button-primary"
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
            <div className="fp-step active">
              <div className="fp-success-chip">
                <i className="fa-solid fa-circle-check" /> Code verified
              </div>
              <h6 className="fp-step-title">Create new password</h6>
              <p className="fp-step-desc">Use at least 8 characters with a number for a stronger password.</p>

              <div className="auth-form-group">
                <label className="auth-label" htmlFor="fpNewPassword">
                  New Password
                </label>
                <PasswordField
                  id="fpNewPassword"
                  placeholder="Min 8 chars, include a number"
                  value={fp.newPassword}
                  onChange={update('newPassword')}
                />
              </div>
              <div className="auth-form-group">
                <label className="auth-label" htmlFor="fpConfirmPassword">
                  Confirm Password
                </label>
                <PasswordField
                  id="fpConfirmPassword"
                  placeholder="Repeat your password"
                  value={fp.confirmPassword}
                  onChange={update('confirmPassword')}
                />
              </div>
              {stepError && <div className="fp-step-error">{stepError}</div>}
              <div className="fp-button-group">
                <button type="button" className="auth-button auth-button-secondary" onClick={() => setStep(1)}>
                  Back
                </button>
                <button
                  type="button"
                  className="auth-button auth-button-primary"
                  onClick={handleResetPassword}
                  disabled={busy}
                >
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
