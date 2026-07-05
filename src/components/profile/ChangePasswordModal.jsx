import { useEffect, useState } from 'react';
import { apiUrl } from '../../utils/data';
import { showTopFloatNotification } from '../../utils/notifications';
import ProfileOverlayModal from './ProfileOverlayModal';

export default function ChangePasswordModal({ isOpen, onClose, onPasswordChanged }) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setSaving(false);
  }, [isOpen]);

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword.length < 8) {
      showTopFloatNotification('❌ New password must be at least 8 characters long!', 'danger');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      showTopFloatNotification('❌ New passwords do not match!', 'danger');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    setSaving(true);
    try {
      const response = await fetch(apiUrl('/api/auth/change-password'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await response.json();
      if (data.success) {
        showTopFloatNotification('✅ Your password has been changed successfully!');
        onPasswordChanged?.();
        onClose();
      } else {
        showTopFloatNotification(`❌ ${data.message || 'Failed to change password'}`, 'danger');
      }
    } catch {
      showTopFloatNotification('❌ Connection failed!', 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileOverlayModal
      isOpen={isOpen}
      onClose={onClose}
      title="Security Settings"
      icon={<i className="fa-solid fa-user-lock" />}
      footer={
        <>
          <button
            type="submit"
            form="changePasswordForm"
            className="oc-btn-view-details"
            style={{ backgroundColor: '#073D35', borderColor: '#073D35' }}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" className="od-btn-close-footer" onClick={onClose}>
            Cancel
          </button>
        </>
      }
    >
      <form id="changePasswordForm" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label fw-bold text-dark" style={{ fontSize: '0.8rem' }}>
            Current Password
          </label>
          <input
            type="password"
            className="form-control support-textarea"
            style={{ minHeight: '40px', padding: '0 10px' }}
            id="currentPasswordInput"
            placeholder="Enter current password"
            required
            value={form.currentPassword}
            onChange={update('currentPassword')}
          />
        </div>
        <div className="mb-3">
          <label className="form-label fw-bold text-dark" style={{ fontSize: '0.8rem' }}>
            New Password
          </label>
          <input
            type="password"
            className="form-control support-textarea"
            style={{ minHeight: '40px', padding: '0 10px' }}
            id="newPasswordInput"
            placeholder="Enter new password"
            required
            value={form.newPassword}
            onChange={update('newPassword')}
          />
        </div>
        <div className="mb-4">
          <label className="form-label fw-bold text-dark" style={{ fontSize: '0.8rem' }}>
            Confirm New Password
          </label>
          <input
            type="password"
            className="form-control support-textarea"
            style={{ minHeight: '40px', padding: '0 10px' }}
            id="confirmPasswordInput"
            placeholder="Confirm new password"
            required
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
          />
        </div>

        <div className="alert alert-light border small mb-0 mt-3" role="note">
          <strong>Account security:</strong> Passwords are hashed with bcrypt on the server. Two-factor authentication (2FA) is planned for a future release.
        </div>
      </form>
    </ProfileOverlayModal>
  );
}
