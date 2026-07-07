import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import StoreNavbar from '../features/nav/StoreNavbar';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../utils/data';
import { MOGADISHU_DISTRICTS, VEHICLE_TYPES, AVAILABILITY_OPTIONS } from '../utils/districts';
import { showTopFloatNotification } from '../utils/notifications';

const EMPTY_FORM = {
  district: '',
  vehicleType: '',
  experience: '',
  availability: '',
};

const fieldClass =
  'w-full rounded-xl border-[1.5px] border-deepGreen/10 bg-white px-3.5 py-3 text-[0.9rem] font-semibold outline-none focus:border-deepGreen focus:shadow-[0_0_0_3px_rgba(7,61,53,0.06)]';

const btnBase =
  'inline-flex items-center justify-center rounded-xl border-0 px-5 py-3.5 text-[0.92rem] font-extrabold no-underline transition-transform hover:-translate-y-px';

function StatusView({ icon, iconClass, title, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-base to-softBg">
      <StoreNavbar />
      <div className="mx-auto max-w-[560px] px-4 pb-12 pt-6">
        <div className="rounded-[20px] border border-deepGreen/[0.06] bg-white px-6 py-7 text-center shadow-[0_16px_40px_rgba(7,61,53,0.08)]">
          <i className={`${icon} mb-4 text-5xl ${iconClass}`} />
          <h1 className="mb-2 text-[1.4rem] font-extrabold">{title}</h1>
          {children}
          <Link to="/profile" className={`${btnBase} mt-5 bg-gray-100 text-deepGreen`}>
            Ku noqo Profile
          </Link>
        </div>
      </div>
    </div>
  );
}

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
      <div className="min-h-screen bg-gradient-to-b from-base to-softBg">
        <StoreNavbar />
        <div className="mx-auto max-w-[560px] px-4 pb-12 pt-6">
          <p className="py-12 text-center text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (application.status === 'rejected') {
    return (
      <StatusView icon="fa-solid fa-circle-xmark" iconClass="text-red-500" title="Codsiga waa la diiday">
        <p className="mb-4 text-gray-500">Ma codsan kartid mar labaad delivery driver ahaan.</p>
        {application.rejectReason && (
          <blockquote className="mb-5 rounded-r-[10px] border-l-4 border-red-500 bg-red-50 px-4 py-3 text-left text-[0.88rem] text-[#444]">
            {application.rejectReason}
          </blockquote>
        )}
      </StatusView>
    );
  }

  if (application.status === 'pending') {
    return (
      <StatusView icon="fa-solid fa-hourglass-half" iconClass="text-amber-600" title="Codsiga waa la eegayaa">
        <p className="text-gray-500">
          Admin ayaa dib u eegi doona codsigaaga. Waad ogeysiin doontaa marka la go&apos;aamiyo.
        </p>
      </StatusView>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-base to-softBg">
      <StoreNavbar />
      <div className="mx-auto max-w-[560px] px-4 pb-12 pt-6">
        <div className="rounded-[20px] border border-deepGreen/[0.06] bg-white px-6 py-7 shadow-[0_16px_40px_rgba(7,61,53,0.08)]">
          <div className="mb-6 flex gap-4">
            <span className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] bg-deepGreen/[0.08] text-[1.4rem] text-deepGreen">
              <i className="fa-solid fa-truck-fast" />
            </span>
            <div>
              <h1 className="mb-1.5 text-[1.45rem] font-extrabold text-[#111]">
                Apply as Delivery Driver
              </h1>
              <p className="m-0 text-[0.88rem] leading-relaxed text-gray-500">
                Buuxi foomkan si aad u codsato shaqada delivery. Admin ayaa aqbalaya ama diidaya.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="district" className="mb-1.5 block text-[0.82rem] font-extrabold text-gray-700">
                Degmada aad ka shaqeyso *
              </label>
              <select id="district" className={fieldClass} value={form.district} onChange={update('district')} required>
                <option value="">Dooro degmo</option>
                {MOGADISHU_DISTRICTS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="vehicleType" className="mb-1.5 block text-[0.82rem] font-extrabold text-gray-700">
                Nooca gaadhiga *
              </label>
              <select id="vehicleType" className={fieldClass} value={form.vehicleType} onChange={update('vehicleType')} required>
                <option value="">Dooro nooca gaadhiga</option>
                {VEHICLE_TYPES.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="availability" className="mb-1.5 block text-[0.82rem] font-extrabold text-gray-700">
                Waqtiga la heli karo *
              </label>
              <select id="availability" className={fieldClass} value={form.availability} onChange={update('availability')} required>
                <option value="">Dooro waqtiga</option>
                {AVAILABILITY_OPTIONS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="experience" className="mb-1.5 block text-[0.82rem] font-extrabold text-gray-700">
                Khibrad (optional)
              </label>
              <textarea
                id="experience"
                rows={4}
                className={fieldClass}
                placeholder="Tusaale: 1 sano delivery ah Mogadishu..."
                value={form.experience}
                onChange={update('experience')}
              />
            </div>

            <div className="flex items-center gap-3 rounded-[14px] bg-base p-3.5">
              <img
                className="h-12 w-12 rounded-full border-2 border-gold object-cover"
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=073D35&color=fff`}
                alt=""
              />
              <div>
                <strong className="block text-[0.92rem]">{user.fullName}</strong>
                <span className="block text-[0.78rem] text-gray-500">{user.email}</span>
                <span className="block text-[0.78rem] text-gray-500">{user.phone}</span>
              </div>
            </div>

            <button
              type="submit"
              className={`${btnBase} bg-gradient-to-br from-deepGreen to-[#0a5446] text-white disabled:opacity-70`}
              disabled={submitting}
            >
              {submitting ? 'Sending...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
