import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import StoreNavbar from '../features/nav/StoreNavbar';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../utils/data';
import { MOGADISHU_DISTRICTS, VEHICLE_TYPES, AVAILABILITY_OPTIONS } from '../utils/districts';
import { showTopFloatNotification } from '../utils/notifications';
import { notifyAuthUpdated } from '../utils/authStorage';
import ApplicationStepBar from '../features/driver-application/ApplicationStepBar';
import {
  DRIVER_BENEFITS,
  formatApplicationDate,
  getActiveApplicationStep,
  getApplicationSummary,
} from '../features/driver-application/applicationShared';

const EMPTY_FORM = {
  district: '',
  vehicleType: '',
  experience: '',
  availability: '',
};

const fieldClass =
  'w-full rounded-xl border-[1.5px] border-deepGreen/10 bg-[#FAFBFB] px-3.5 py-3 text-[0.9rem] font-semibold text-gray-900 outline-none transition focus:border-deepGreen focus:bg-white focus:shadow-[0_0_0_3px_rgba(7,61,53,0.08)]';

const btnPrimary =
  'inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-0 bg-gradient-to-br from-deepGreen via-[#0A5446] to-teal px-5 text-[0.92rem] font-extrabold text-white transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70';

const btnGhost =
  'inline-flex min-h-[44px] items-center justify-center rounded-xl border border-deepGreen/15 bg-white px-5 text-[0.88rem] font-extrabold text-deepGreen no-underline transition hover:bg-deepGreen/[0.04]';

function PageShell({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-softBg via-base to-[#EDE8DF]">
      <StoreNavbar />
      <div className="mx-auto max-w-lg px-4 pb-12 pt-5">{children}</div>
    </div>
  );
}

function SummaryCard({ application }) {
  const rows = getApplicationSummary(application);
  return (
    <div className="rounded-xl border border-deepGreen/[0.08] bg-white/80 p-4">
      <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-wide text-gray-400">Your submission</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label}>
            <p className="mb-0.5 text-[0.68rem] font-semibold text-gray-400">{row.label}</p>
            <p className="mb-0 text-[0.84rem] font-extrabold text-deepGreen">{row.value}</p>
          </div>
        ))}
      </div>
      {application.experience && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <p className="mb-1 text-[0.68rem] font-semibold text-gray-400">Experience</p>
          <p className="mb-0 text-[0.84rem] leading-relaxed text-gray-700">{application.experience}</p>
        </div>
      )}
    </div>
  );
}

function StatusCard({ icon, iconClass, title, children, actions }) {
  return (
    <div className="overflow-hidden rounded-[20px] border border-deepGreen/[0.06] bg-white shadow-[0_16px_40px_rgba(7,61,53,0.08)]">
      <div className="bg-gradient-to-r from-gold/20 via-gold/10 to-transparent px-5 py-4">
        <ApplicationStepBar activeStep={getActiveApplicationStep('pending')} />
      </div>
      <div className="px-5 py-6 text-center">
        <span className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-softBg text-3xl ${iconClass}`}>
          <i className={icon} aria-hidden="true" />
        </span>
        <h1 className="mb-2 text-[1.3rem] font-extrabold text-deepGreen">{title}</h1>
        <div className="text-[0.88rem] leading-relaxed text-gray-600">{children}</div>
        {actions && <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">{actions}</div>}
      </div>
    </div>
  );
}

export default function ApplyDelivery() {
  const { user, syncFromStorage } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [application, setApplication] = useState({ status: 'none' });
  const [userRole, setUserRole] = useState(user?.role || 'user');

  const loadApplication = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const res = await fetch(apiUrl('/api/drivers/my-application'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setApplication(data.driverApplication || { status: 'none' });
        if (data.role) setUserRole(data.role);
        if (data.role === 'delivery') {
          localStorage.setItem('userRole', 'delivery');
          localStorage.setItem('driverApplicationStatus', 'approved');
          notifyAuthUpdated();
        }
        return data;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  }, []);

  useEffect(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  useEffect(() => {
    if (!user?.isLoggedIn) {
      setLoading(false);
      return;
    }
    loadApplication().finally(() => setLoading(false));
  }, [user?.isLoggedIn, loadApplication]);

  useEffect(() => {
    if (!user?.isLoggedIn || application.status !== 'pending') return undefined;
    const id = setInterval(() => {
      loadApplication();
    }, 15000);
    return () => clearInterval(id);
  }, [user?.isLoggedIn, application.status, loadApplication]);

  useEffect(() => {
    if (userRole === 'delivery' || application.status === 'approved') {
      navigate('/delivery', { replace: true });
    }
  }, [userRole, application.status, navigate]);

  if (!user?.isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: '/apply-delivery' }} />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (userRole === 'delivery' || application.status === 'approved') {
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
        localStorage.setItem('driverApplicationStatus', 'pending');
        notifyAuthUpdated();
        syncFromStorage();
        showTopFloatNotification('Application submitted successfully!');
      } else {
        showTopFloatNotification(data.message || 'Could not submit application.', 'danger');
        if (data.driverApplication) setApplication(data.driverApplication);
      }
    } catch {
      showTopFloatNotification('Could not reach server. Try again.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="rounded-[20px] bg-white px-5 py-14 text-center shadow-sm">
          <i className="fa-solid fa-spinner fa-spin mb-3 text-2xl text-deepGreen" aria-hidden="true" />
          <p className="mb-0 text-[0.88rem] font-semibold text-gray-500">Loading your application…</p>
        </div>
      </PageShell>
    );
  }

  if (application.status === 'rejected') {
    return (
      <PageShell>
        <StatusCard
          icon="fa-solid fa-circle-xmark"
          iconClass="text-red-500"
          title="Application not accepted"
          actions={
            <>
              <Link to="/profile" className={btnGhost}>
                Back to profile
              </Link>
              <Link to="/contact" className={btnGhost}>
                Contact support
              </Link>
            </>
          }
        >
          <p className="mb-4">
            Your driver application was reviewed and cannot be submitted again with this account.
          </p>
          {application.rejectReason && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left">
              <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-wide text-red-600">Admin reason</p>
              <p className="mb-0 text-[0.86rem] font-semibold leading-relaxed text-red-800">{application.rejectReason}</p>
            </div>
          )}
          {application.reviewedAt && (
            <p className="mb-0 mt-4 text-[0.76rem] text-gray-400">
              Reviewed on {formatApplicationDate(application.reviewedAt)}
            </p>
          )}
        </StatusCard>
      </PageShell>
    );
  }

  if (application.status === 'pending') {
    return (
      <PageShell>
        <StatusCard
          icon="fa-solid fa-hourglass-half"
          iconClass="text-amber-600"
          title="Application under review"
          actions={
            <>
              <button type="button" className={btnGhost} onClick={() => loadApplication()}>
                <i className="fa-solid fa-rotate-right me-1.5" aria-hidden="true" />
                Refresh status
              </button>
              <Link to="/profile" className={btnGhost}>
                Back to profile
              </Link>
            </>
          }
        >
          <p className="mb-4">
            Admin will review your details. This page checks for updates every 15 seconds. You will be redirected
            automatically when approved.
          </p>
          <SummaryCard application={application} />
        </StatusCard>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="mb-4 overflow-hidden rounded-[20px] bg-gradient-to-br from-deepGreen via-[#0A5446] to-teal p-5 text-white shadow-[0_16px_40px_rgba(7,61,53,0.22)]">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl">
            <i className="fa-solid fa-truck-fast" aria-hidden="true" />
          </span>
          <div>
            <p className="mb-1 text-[0.68rem] font-bold uppercase tracking-wide text-white/70">Join our team</p>
            <h1 className="mb-1 text-[1.35rem] font-extrabold leading-tight">Become a Delivery Driver</h1>
            <p className="mb-0 text-[0.82rem] leading-relaxed text-white/85">
              Deliver Mogadishu Modern Furniture orders and manage deliveries from your phone.
            </p>
          </div>
        </div>
        <ApplicationStepBar activeStep={0} />
      </section>

      <section className="mb-4 grid gap-2">
        {DRIVER_BENEFITS.map((benefit) => (
          <div
            key={benefit.title}
            className="flex items-start gap-3 rounded-xl border border-deepGreen/[0.06] bg-white px-3.5 py-3 shadow-sm"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
              <i className={`fa-solid ${benefit.icon} text-[0.85rem]`} aria-hidden="true" />
            </span>
            <div>
              <p className="mb-0.5 text-[0.84rem] font-extrabold text-deepGreen">{benefit.title}</p>
              <p className="mb-0 text-[0.76rem] leading-relaxed text-gray-500">{benefit.text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-[20px] border border-deepGreen/[0.06] bg-white p-5 shadow-[0_16px_40px_rgba(7,61,53,0.08)]">
        <h2 className="mb-1 text-[1.05rem] font-extrabold text-deepGreen">Application form</h2>
        <p className="mb-5 text-[0.82rem] text-gray-500">All fields marked * are required.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="district" className="mb-1.5 block text-[0.8rem] font-extrabold text-gray-700">
              Primary district *
            </label>
            <select id="district" className={fieldClass} value={form.district} onChange={update('district')} required>
              <option value="">Select district</option>
              {MOGADISHU_DISTRICTS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="vehicleType" className="mb-1.5 block text-[0.8rem] font-extrabold text-gray-700">
              Vehicle type *
            </label>
            <select
              id="vehicleType"
              className={fieldClass}
              value={form.vehicleType}
              onChange={update('vehicleType')}
              required
            >
              <option value="">Select vehicle</option>
              {VEHICLE_TYPES.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="availability" className="mb-1.5 block text-[0.8rem] font-extrabold text-gray-700">
              Availability *
            </label>
            <select
              id="availability"
              className={fieldClass}
              value={form.availability}
              onChange={update('availability')}
              required
            >
              <option value="">Select availability</option>
              {AVAILABILITY_OPTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="experience" className="mb-1.5 block text-[0.8rem] font-extrabold text-gray-700">
              Delivery experience <span className="font-semibold text-gray-400">(optional)</span>
            </label>
            <textarea
              id="experience"
              rows={4}
              className={fieldClass}
              placeholder="Example: 1 year furniture delivery in Hodan and Wadajir…"
              value={form.experience}
              onChange={update('experience')}
            />
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-deepGreen/[0.06] bg-softBg/80 p-3.5">
            <img
              className="h-12 w-12 rounded-full border-2 border-gold object-cover"
              src={
                user.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=073D35&color=D8A128`
              }
              alt=""
            />
            <div className="min-w-0">
              <p className="mb-0 truncate text-[0.9rem] font-extrabold text-deepGreen">{user.fullName}</p>
              <p className="mb-0 truncate text-[0.76rem] text-gray-500">{user.email}</p>
              <p className="mb-0 truncate text-[0.76rem] text-gray-500">{user.phone || 'No phone on profile'}</p>
            </div>
          </div>

          <button type="submit" className={btnPrimary} disabled={submitting}>
            {submitting ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
                Submitting…
              </>
            ) : (
              <>
                <i className="fa-solid fa-paper-plane" aria-hidden="true" />
                Submit application
              </>
            )}
          </button>
        </form>
      </section>
    </PageShell>
  );
}
