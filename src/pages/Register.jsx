import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthAlert from '../components/AuthAlert';
import PasswordField from '../components/PasswordField';
import '../styles/pages/Register.css';

const COUNTRY_CODES = [
  { value: '+252', label: '🇸🇴 +252' },
  { value: '+254', label: '🇰🇪 +254' },
  { value: '+251', label: '🇪🇹 +251' },
  { value: '+253', label: '🇩🇯 +253' },
  { value: '+1', label: '🇺🇸 +1' },
  { value: '+44', label: '🇬🇧 +44' },
  { value: '+90', label: '🇹🇷 +90' },
];

export default function Register() {
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
    <div className="register-page">
      <div className="register-card">
        <header className="register-card-header">
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

        <div className="register-card-inner">
          <h1 className="page-title">Create Account</h1>
          <p className="page-subtitle">Register your new account</p>

          <AuthAlert
            message={alert.message}
            type={alert.type}
            onDismiss={() => setAlert({ message: '', type: 'danger' })}
            autoDismiss
            duration={3000}
          />

          <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <i className="fa-regular fa-user field-icon" />
            <input
              type="text"
              placeholder="First Name"
              value={form.firstName}
              onChange={update('firstName')}
              required
            />
          </div>

          <div className="form-field">
            <i className="fa-regular fa-user field-icon" />
            <input
              type="text"
              placeholder="Last Name"
              value={form.lastName}
              onChange={update('lastName')}
              required
            />
          </div>

          <div className="form-field">
            <i className="fa-regular fa-envelope field-icon" />
            <input
              type="email"
              placeholder="Gmail"
              value={form.email}
              onChange={update('email')}
              required
            />
          </div>

          <div className="form-field">
            <div className="phone-input-wrapper">
              <select
                className="country-select"
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
                className="phone-input"
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

          <label className="terms-row">
            <input type="checkbox" checked={form.terms} onChange={update('terms')} required />
            <span>
              I agree to the <a href="#">Terms & Conditions</a>
            </span>
          </label>

          <button type="submit" className="register-btn" disabled={submitting}>
            {submitting ? 'Registering...' : 'Register'}
          </button>
        </form>

          <div className="login-link">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
