import { useCallback, useEffect, useReducer, useRef } from 'react';
import { createPortal } from 'react-dom';
import { apiUrl } from '../../utils/data';

const AUTH_SUBMIT_BTN_CLASS =
  'relative h-[50px] w-full overflow-hidden rounded-xl border-0 bg-gradient-to-br from-deepGreen via-[#0A5446] to-[#315C43] text-[0.95rem] font-black tracking-wide text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(7,61,53,0.28)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70';

const FP_STEPS = ['Phone', 'Verify', 'Password'];

const initialState = {
  step: 0,
  phone: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
  stepError: '',
  codeMessage: '',
  maskedEmail: '',
  otpChannel: 'email',
  devCode: '',
  busy: false,
  resendCooldown: 0,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_BUSY':
      return { ...state, busy: action.value };
    case 'SET_ERROR':
      return { ...state, stepError: action.value };
    case 'CLEAR_ERROR':
      return { ...state, stepError: '' };
    case 'TICK_COOLDOWN':
      return { ...state, resendCooldown: Math.max(0, state.resendCooldown - 1) };
    case 'PHONE_VERIFIED':
      return {
        ...state,
        step: 1,
        phone: action.phone,
        maskedEmail: action.maskedEmail,
        codeMessage: action.codeMessage,
        otpChannel: action.otpChannel || 'email',
        devCode: action.devCode || '',
        code: action.devCode || '',
        resendCooldown: 30,
        stepError: '',
        busy: false,
      };
    case 'CODE_VERIFIED':
      return { ...state, step: 2, stepError: '', busy: false };
    case 'GO_STEP':
      return { ...state, step: action.step, stepError: '' };
    default:
      return state;
  }
}

function getModalRoot() {
  let root = document.getElementById('modal-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'modal-root';
    document.body.appendChild(root);
  }
  return root;
}

async function fetchJsonWithRetry(url, options, retries = 1) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      return { response, data };
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

function FpStepBar({ step }) {
  const pct = FP_STEPS.length <= 1 ? 100 : Math.round((step / (FP_STEPS.length - 1)) * 100);
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between text-[0.72rem] font-bold uppercase tracking-wide text-gray-400">
        <span>
          Step {step + 1} of {FP_STEPS.length}
        </span>
        <span>{FP_STEPS[step]}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-deepGreen to-gold transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FpError({ message }) {
  return (
    <div
      className={`mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[0.82rem] font-semibold text-red-700 ${message ? '' : 'hidden'}`}
      role="alert"
    >
      <span className="mt-0.5 shrink-0" aria-hidden="true">
        ⚠
      </span>
      <span>{message || ' '}</span>
    </div>
  );
}

function ModalPasswordField({ id, placeholder, value, onChange }) {
  return (
    <div className="relative mb-4">
      <input
        type="password"
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-gray-200 bg-[#fafafa] py-3 pl-3.5 pr-3.5 text-[0.9rem] font-medium outline-none transition focus:border-deepGreen focus:bg-white focus:shadow-[0_0_0_3px_rgba(7,61,53,0.08)]"
        autoComplete="new-password"
      />
    </div>
  );
}

export default function ForgotPasswordModal({ onClose, onResetSuccess }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!state.stepError) return undefined;
    const timer = setTimeout(() => dispatch({ type: 'CLEAR_ERROR' }), 4500);
    return () => clearTimeout(timer);
  }, [state.stepError]);

  useEffect(() => {
    if (state.resendCooldown <= 0) return undefined;
    const timer = setTimeout(() => dispatch({ type: 'TICK_COOLDOWN' }), 1000);
    return () => clearTimeout(timer);
  }, [state.resendCooldown]);

  const handleVerifyPhone = useCallback(async () => {
    const phoneVal = state.phone.trim();
    if (!phoneVal) {
      dispatch({ type: 'SET_ERROR', value: 'Please enter the phone number you used when registering.' });
      return;
    }

    dispatch({ type: 'SET_BUSY', value: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const { data } = await fetchJsonWithRetry(apiUrl('/api/auth/verify-phone'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneVal }),
      });

      if (!mountedRef.current) return;

      if (data.success) {
        dispatch({
          type: 'PHONE_VERIFIED',
          phone: phoneVal,
          maskedEmail: data.maskedEmail || '',
          codeMessage: data.message || 'A verification code was sent to your Gmail.',
          otpChannel: data.channel || 'email',
          devCode: data.devCode || '',
        });
      } else {
        dispatch({ type: 'SET_ERROR', value: data.message || 'This phone number is not registered.' });
        dispatch({ type: 'SET_BUSY', value: false });
      }
    } catch {
      if (!mountedRef.current) return;
      dispatch({
        type: 'SET_ERROR',
        value: 'Could not connect to the server. Wait for backend on port 5000, then try again.',
      });
      dispatch({ type: 'SET_BUSY', value: false });
    }
  }, [state.phone]);

  const handleVerifyCode = useCallback(async () => {
    const codeVal = state.code.trim();
    if (!codeVal || codeVal.length !== 6) {
      dispatch({ type: 'SET_ERROR', value: 'Please enter the 6-digit verification code.' });
      return;
    }

    dispatch({ type: 'SET_BUSY', value: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const { data } = await fetchJsonWithRetry(apiUrl('/api/auth/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: state.phone.trim(), code: codeVal }),
      });

      if (!mountedRef.current) return;

      if (data.success) {
        dispatch({ type: 'CODE_VERIFIED' });
      } else {
        dispatch({ type: 'SET_ERROR', value: data.message || 'Invalid verification code.' });
        dispatch({ type: 'SET_BUSY', value: false });
      }
    } catch {
      if (!mountedRef.current) return;
      dispatch({
        type: 'SET_ERROR',
        value: 'Could not connect to the server. Wait for backend on port 5000, then try again.',
      });
      dispatch({ type: 'SET_BUSY', value: false });
    }
  }, [state.code, state.phone]);

  const handleResetPassword = useCallback(async () => {
    if (state.newPassword.length < 8) {
      dispatch({ type: 'SET_ERROR', value: 'Password must be at least 8 characters long.' });
      return;
    }
    if (state.newPassword !== state.confirmPassword) {
      dispatch({ type: 'SET_ERROR', value: 'Passwords do not match.' });
      return;
    }

    dispatch({ type: 'SET_BUSY', value: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const { data } = await fetchJsonWithRetry(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: state.phone.trim(),
          code: state.code.trim(),
          newPassword: state.newPassword,
        }),
      });

      if (!mountedRef.current) return;

      if (data.success) {
        onResetSuccess?.();
        onClose();
      } else {
        dispatch({ type: 'SET_ERROR', value: data.message || 'Failed to reset password.' });
        dispatch({ type: 'SET_BUSY', value: false });
      }
    } catch {
      if (!mountedRef.current) return;
      dispatch({
        type: 'SET_ERROR',
        value: 'Could not connect to the server. Wait for backend on port 5000, then try again.',
      });
      dispatch({ type: 'SET_BUSY', value: false });
    }
  }, [state.confirmPassword, state.code, state.newPassword, state.phone, onClose, onResetSuccess]);

  const stepHidden = (index) => (state.step === index ? 'block' : 'hidden');

  return createPortal(
    <div
      className="fixed inset-0 z-[1050] flex items-center justify-center overflow-y-auto bg-deepGreen/40 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className="my-auto w-full max-w-[420px] overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_24px_60px_rgba(7,61,53,0.18)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgotPasswordTitle"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <p className="mb-0 text-[0.65rem] font-bold uppercase tracking-wider text-gray-400">Account recovery</p>
            <h2 id="forgotPasswordTitle" className="m-0 font-display text-[1.2rem] font-bold text-deepGreen">
              Reset password
            </h2>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-5">
          <FpStepBar step={state.step} />

          <div className={stepHidden(0)}>
            <h3 className="mb-1 text-[0.95rem] font-bold text-gray-900">Registered phone number</h3>
            <p className="mb-4 text-[0.82rem] leading-relaxed text-gray-500">
              Enter the phone number you used when creating your account. We will verify it and send a code to your
              Gmail.
            </p>

            <label className="mb-1.5 block text-[0.78rem] font-bold text-gray-700" htmlFor="fpPhone">
              Phone number
            </label>
            <input
              type="tel"
              id="fpPhone"
              className="mb-4 w-full rounded-xl border border-gray-200 bg-[#fafafa] py-3 px-3.5 text-[0.9rem] font-medium outline-none transition focus:border-deepGreen focus:bg-white focus:shadow-[0_0_0_3px_rgba(7,61,53,0.08)]"
              placeholder="0612345678"
              value={state.phone}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'phone', value: e.target.value })}
              autoComplete="tel"
            />

            <FpError message={state.stepError} />

            <button type="button" className={AUTH_SUBMIT_BTN_CLASS} onClick={handleVerifyPhone} disabled={state.busy}>
              {state.busy ? 'Verifying…' : 'Continue'}
            </button>
          </div>

          <div className={stepHidden(1)}>
            <div
              className={`mb-4 rounded-xl border p-4 ${
                state.otpChannel === 'dev' ? 'border-amber-200 bg-amber-50' : 'border-blue-100 bg-blue-50'
              }`}
            >
              {state.otpChannel === 'dev' ? (
                <>
                  <p className="mb-1 text-[0.82rem] font-bold text-amber-800">Email not delivered — use this code</p>
                  <p className="mb-2 text-[0.82rem] text-gray-600">
                    Account email: <span className="font-mono font-bold text-deepGreen">{state.maskedEmail || '—'}</span>
                  </p>
                  <p className="m-0 rounded-lg bg-white px-3 py-2 text-center font-mono text-[1.35rem] font-bold tracking-[0.35em] text-deepGreen">
                    {state.devCode || '------'}
                  </p>
                  <p className="mb-0 mt-2 text-[0.72rem] text-gray-500">
                    Fix Gmail App Password in backend/.env (SMTP_PASS) so codes go to email next time.
                  </p>
                </>
              ) : (
                <>
                  <p className="mb-1 text-[0.82rem] font-bold text-blue-700">Verification code sent</p>
                  <p className="mb-1 text-[0.82rem] text-gray-600">A 6-digit code was sent to your registered Gmail:</p>
                  <p className="m-0 font-mono text-[0.95rem] font-bold tracking-wide text-deepGreen">
                    {state.maskedEmail || 'your email'}
                  </p>
                  {state.codeMessage ? (
                    <p className="mb-0 mt-2 text-[0.75rem] leading-relaxed text-gray-500">{state.codeMessage}</p>
                  ) : null}
                </>
              )}
            </div>

            <label className="mb-1.5 block text-[0.78rem] font-bold text-gray-700" htmlFor="fpCode">
              Enter verification code
            </label>
            <input
              type="text"
              id="fpCode"
              className="mb-1 w-full rounded-xl border border-gray-200 bg-[#fafafa] py-3 text-center text-[1.25rem] font-bold tracking-[0.35em] text-deepGreen outline-none transition focus:border-deepGreen focus:bg-white focus:shadow-[0_0_0_3px_rgba(7,61,53,0.08)]"
              placeholder="000000"
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={state.code}
              onChange={(e) =>
                dispatch({
                  type: 'SET_FIELD',
                  field: 'code',
                  value: e.target.value.replace(/\D/g, '').slice(0, 6),
                })
              }
            />
            <p className="mb-4 text-center text-[0.72rem] text-gray-400">Code expires in 10 minutes</p>

            <FpError message={state.stepError} />

            <div className="mb-4 text-center text-[0.78rem] text-gray-500">
              Didn&apos;t receive it?{' '}
              <button
                type="button"
                className="border-0 bg-transparent p-0 font-bold text-deepGreen underline underline-offset-2 disabled:text-gray-400 disabled:no-underline"
                onClick={handleVerifyPhone}
                disabled={state.busy || state.resendCooldown > 0}
              >
                {state.resendCooldown > 0 ? `Resend in ${state.resendCooldown}s` : 'Resend code'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                className="h-12 rounded-xl border border-gray-200 bg-white text-[0.88rem] font-bold text-gray-700 transition hover:bg-gray-50"
                onClick={() => dispatch({ type: 'GO_STEP', step: 0 })}
                disabled={state.busy}
              >
                Back
              </button>
              <button
                type="button"
                className={AUTH_SUBMIT_BTN_CLASS}
                onClick={handleVerifyCode}
                disabled={state.busy || state.code.length !== 6}
              >
                {state.busy ? 'Checking…' : 'Verify code'}
              </button>
            </div>
          </div>

          <div className={stepHidden(2)}>
            <p className="mb-3 inline-block rounded-full bg-emerald-50 px-3 py-1 text-[0.75rem] font-bold text-emerald-700">
              Code verified
            </p>
            <h3 className="mb-1 text-[0.95rem] font-bold text-gray-900">Create new password</h3>
            <p className="mb-4 text-[0.82rem] text-gray-500">Choose a strong password with at least 8 characters.</p>

            <label className="mb-1.5 block text-[0.78rem] font-bold text-gray-700" htmlFor="fpNewPassword">
              New password
            </label>
            <ModalPasswordField
              id="fpNewPassword"
              placeholder="Min. 8 characters"
              value={state.newPassword}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'newPassword', value: e.target.value })}
            />

            <label className="mb-1.5 block text-[0.78rem] font-bold text-gray-700" htmlFor="fpConfirmPassword">
              Confirm password
            </label>
            <ModalPasswordField
              id="fpConfirmPassword"
              placeholder="Repeat your password"
              value={state.confirmPassword}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'confirmPassword', value: e.target.value })}
            />

            <FpError message={state.stepError} />

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                className="h-12 rounded-xl border border-gray-200 bg-white text-[0.88rem] font-bold text-gray-700 transition hover:bg-gray-50"
                onClick={() => dispatch({ type: 'GO_STEP', step: 1 })}
                disabled={state.busy}
              >
                Back
              </button>
              <button
                type="button"
                className={AUTH_SUBMIT_BTN_CLASS}
                onClick={handleResetPassword}
                disabled={state.busy}
              >
                {state.busy ? 'Saving…' : 'Reset password'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    getModalRoot()
  );
}
