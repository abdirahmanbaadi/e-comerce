import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthAlert from '../components/AuthAlert';
import PasswordField from '../components/PasswordField';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import '../styles/pages/Login.css';

const REMEMBER_KEY = 'rememberedLogin';

export default function Login() {
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

  const inputClass = (extra = '') => (invalid ? `is-invalid ${extra}`.trim() : extra);

  return (
    <div className="login-page">
      <div className="login-card">
        <header className="login-card-header">
          <div className="brand-logo">
            <div className="brand-logo-mark">
              <span className="brand-logo-frame" />
              <span className="brand-logo-inner">MF</span>
            </div>
            <div className="brand-divider" />
            <div className="brand-text">
              <span className="brand-title">Mogadishu</span>
              <span className="brand-subtitle">Modern Furniture</span>
            </div>
          </div>
        </header>

        <div className="login-card-inner">
          <h1 className="page-title">Welcome Back</h1>
          <p className="page-subtitle">Login to your account</p>

          <AuthAlert
            message={alert.message}
            type={alert.type}
            onDismiss={() => setAlert({ message: '', type: 'danger' })}
            autoDismiss
            duration={3000}
          />

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <i className="fa-solid fa-user field-icon" />
              <input
                type="text"
                id="loginIdentifier"
                placeholder="Email or Phone Number"
                value={form.login}
                onChange={update('login')}
                className={inputClass()}
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

            <div className="login-options-row">
              <label className="remember-password-check">
                <input type="checkbox" checked={form.remember} onChange={update('remember')} />
                <span>Remember password</span>
              </label>
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => setForgotOpen(true)}
              >
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="login-btn" disabled={submitting}>
              {submitting ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="register-link">
            Don&apos;t have an account? <Link to="/register">Create one now</Link>
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
