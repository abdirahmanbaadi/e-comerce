import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import MainNavbar from '../components/MainNavbar';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../utils/data';
import { MOGADISHU_DISTRICTS, VEHICLE_TYPES, AVAILABILITY_OPTIONS } from '../utils/districts';
import { showTopFloatNotification } from '../utils/notifications';
import '../styles/pages/ApplyDelivery.css';

const EMPTY_FORM = {
  district: '',
  vehicleType: '',
  experience: '',
  availability: '',
};

export default function ApplyDelivery() {
  const { user, syncFromStorage } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState({ status: 'none' });

  useEffect(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  useEffect(() => {
    if (!user?.isLoggedIn) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(apiUrl('/api/drivers/my-application'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setApplication(data.driverApplication || { status: 'none' });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.isLoggedIn]);

  if (!user?.isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: '/apply-delivery' }} />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (user.role === 'delivery' || application.status === 'approved') {
    return <Navigate to="/delivery" replace />;
  }

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('/api/drivers/apply'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setApplication(data.driverApplication);
        showTopFloatNotification('✅ Codsigaaga waa la diray!');
      } else {
        showTopFloatNotification(`❌ ${data.message}`, 'danger');
        if (data.driverApplication) setApplication(data.driverApplication);
      }
    } catch {
      showTopFloatNotification('❌ Khalad xiriirka server-ka!', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="apply-delivery-page">
        <MainNavbar />
        <div className="apply-delivery-shell">
          <p className="text-center text-secondary py-5">Loading...</p>
        </div>
      </div>
    );
  }

  if (application.status === 'rejected') {
    return (
      <div className="apply-delivery-page">
        <MainNavbar />
        <div className="apply-delivery-shell">
          <div className="apply-status-card apply-status-card--rejected">
            <i className="fa-solid fa-circle-xmark" />
            <h1>Codsiga waa la diiday</h1>
            <p>Ma codsan kartid mar labaad delivery driver ahaan.</p>
            {application.rejectReason && <blockquote>{application.rejectReason}</blockquote>}
            <Link to="/profile" className="apply-btn apply-btn--ghost">
              Ku noqo Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (application.status === 'pending') {
    return (
      <div className="apply-delivery-page">
        <MainNavbar />
        <div className="apply-delivery-shell">
          <div className="apply-status-card apply-status-card--pending">
            <i className="fa-solid fa-hourglass-half" />
            <h1>Codsiga waa la eegayaa</h1>
            <p>Admin ayaa dib u eegi doona codsigaaga. Waad ogeysiin doontaa marka la go&apos;aamiyo.</p>
            <Link to="/profile" className="apply-btn apply-btn--ghost">
              Ku noqo Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="apply-delivery-page">
      <MainNavbar />
      <div className="apply-delivery-shell">
        <div className="apply-form-card">
          <div className="apply-form-header">
            <span className="apply-icon-wrap">
              <i className="fa-solid fa-truck-fast" />
            </span>
            <div>
              <h1>Apply as Delivery Driver</h1>
              <p>Buuxi foomkan si aad u codsato shaqada delivery. Admin ayaa aqbalaya ama diidaya.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="apply-form">
            <div className="apply-field">
              <label htmlFor="district">Degmada aad ka shaqeyso *</label>
              <select id="district" value={form.district} onChange={update('district')} required>
                <option value="">Dooro degmo</option>
                {MOGADISHU_DISTRICTS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div className="apply-field">
              <label htmlFor="vehicleType">Nooca gaadhiga *</label>
              <select id="vehicleType" value={form.vehicleType} onChange={update('vehicleType')} required>
                <option value="">Dooro nooca gaadhiga</option>
                {VEHICLE_TYPES.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>

            <div className="apply-field">
              <label htmlFor="availability">Waqtiga la heli karo *</label>
              <select id="availability" value={form.availability} onChange={update('availability')} required>
                <option value="">Dooro waqtiga</option>
                {AVAILABILITY_OPTIONS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>

            <div className="apply-field">
              <label htmlFor="experience">Khibrad (optional)</label>
              <textarea
                id="experience"
                rows={4}
                placeholder="Tusaale: 1 sano delivery ah Mogadishu..."
                value={form.experience}
                onChange={update('experience')}
              />
            </div>

            <div className="apply-user-preview">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=073D35&color=fff`}
                alt=""
              />
              <div>
                <strong>{user.fullName}</strong>
                <span>{user.email}</span>
                <span>{user.phone}</span>
              </div>
            </div>

            <button type="submit" className="apply-btn apply-btn--primary" disabled={submitting}>
              {submitting ? 'Sending...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
