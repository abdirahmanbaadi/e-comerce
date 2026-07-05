import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '../../utils/data';
import { AVAILABILITY_OPTIONS, VEHICLE_TYPES } from '../../utils/districts';
import { showTopFloatNotification } from '../../utils/notifications';

const FILTERS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
];

function labelFor(value, options) {
  return options.find((o) => o.value === value)?.label || value || '—';
}

export default function DriverApplicationsTab() {
  const [filter, setFilter] = useState('pending');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(false);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/drivers/applications?status=${filter}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications || []);
      } else {
        setLoadError(data.message || 'Could not load driver applications.');
      }
    } catch (err) {
      console.error(err);
      setLoadError('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const approve = async (userId) => {
    setActing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/drivers/applications/${userId}/approve`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('✅ Driver approved!');
        setSelected(null);
        loadApplications();
      } else {
        showTopFloatNotification(`❌ ${data.message}`, 'danger');
      }
    } catch {
      showTopFloatNotification('❌ Action failed', 'danger');
    } finally {
      setActing(false);
    }
  };

  const reject = async (userId) => {
    setActing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/drivers/applications/${userId}/reject`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason || 'Application not accepted.' }),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('Application rejected.');
        setSelected(null);
        setRejectReason('');
        loadApplications();
      } else {
        showTopFloatNotification(`❌ ${data.message}`, 'danger');
      }
    } catch {
      showTopFloatNotification('❌ Action failed', 'danger');
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="driver-apps-tab">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1" style={{ fontSize: '1.45rem' }}>Driver Applications</h2>
          <p className="text-secondary mb-0" style={{ fontSize: '0.86rem' }}>
            Review and approve delivery driver requests.
          </p>
        </div>
        <div className="driver-apps-filters">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`driver-apps-filter ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loadError && (
        <div className="admin-tab-error" role="alert">
          <i className="fa-solid fa-circle-exclamation me-2" />
          {loadError}
        </div>
      )}

      <div className="table-card" style={{ padding: '16px 20px' }}>
        {loading ? (
          <div className="admin-empty-state">
            <i className="fa-solid fa-spinner fa-spin d-block" />
            <h4>Loading applications…</h4>
          </div>
        ) : applications.length === 0 ? (
          <div className="admin-empty-state">
            <i className="fa-solid fa-id-card d-block" />
            <h4>No applications here</h4>
            <p>Try another filter or check back later.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Phone</th>
                  <th>District</th>
                  <th>Vehicle</th>
                  <th>Applied</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const da = app.driverApplication || {};
                  const status = da.status || 'none';
                  return (
                    <tr key={app.id}>
                      <td className="fw-bold">{app.firstName} {app.lastName}</td>
                      <td>{app.phone}</td>
                      <td>{da.district || '—'}</td>
                      <td>{labelFor(da.vehicleType, VEHICLE_TYPES)}</td>
                      <td>{da.appliedAt ? new Date(da.appliedAt).toLocaleDateString() : '—'}</td>
                      <td>
                        <span className={`driver-apps-status driver-apps-status--${status}`}>{status}</span>
                      </td>
                      <td>
                        <button type="button" className="btn btn-sm btn-outline-success fw-bold" onClick={() => setSelected(app)}>
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="driver-apps-modal-backdrop" onClick={() => setSelected(null)} role="presentation">
          <div className="driver-apps-modal" onClick={(e) => e.stopPropagation()} role="dialog">
            <button type="button" className="driver-apps-modal-close" onClick={() => setSelected(null)} aria-label="Close">
              <i className="fa-solid fa-xmark" />
            </button>
            <div className="driver-apps-modal-head">
              <img
                src={selected.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selected.firstName)}&background=073D35&color=fff`}
                alt=""
              />
              <div>
                <h3>{selected.firstName} {selected.lastName}</h3>
                <p>{selected.email}</p>
                <p>{selected.phone}</p>
              </div>
            </div>

            <div className="driver-apps-detail-grid">
              <div><strong>District</strong><span>{selected.driverApplication?.district || '—'}</span></div>
              <div><strong>Vehicle</strong><span>{labelFor(selected.driverApplication?.vehicleType, VEHICLE_TYPES)}</span></div>
              <div><strong>Availability</strong><span>{labelFor(selected.driverApplication?.availability, AVAILABILITY_OPTIONS)}</span></div>
              <div><strong>Address</strong><span>{selected.address || '—'}</span></div>
            </div>

            {selected.driverApplication?.experience && (
              <div className="driver-apps-experience">
                <strong>Experience</strong>
                <p>{selected.driverApplication.experience}</p>
              </div>
            )}

            {selected.driverApplication?.status === 'pending' && (
              <div className="driver-apps-modal-actions">
                <div className="mb-3">
                  <label className="admin-form-label" htmlFor="rejectReason">Reject reason (optional)</label>
                  <input
                    id="rejectReason"
                    className="admin-form-control"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason shown to applicant..."
                  />
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <button type="button" className="btn-admin-submit" disabled={acting} onClick={() => approve(selected.id)}>
                    Approve Driver
                  </button>
                  <button type="button" className="btn btn-outline-danger fw-bold" disabled={acting} onClick={() => reject(selected.id)}>
                    Reject Permanently
                  </button>
                </div>
              </div>
            )}

            {selected.driverApplication?.status === 'rejected' && selected.driverApplication.rejectReason && (
              <div className="driver-apps-reject-note">
                <strong>Reject reason:</strong> {selected.driverApplication.rejectReason}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
