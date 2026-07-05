import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../utils/data';
import { showTopFloatNotification } from '../../utils/notifications';

export default function ProfileInfoTab() {
  const { user, updateProfile } = useAuth();
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    avatar: '',
  });

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(apiUrl('/api/auth/profile'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!cancelled && data.success) {
          const u = data.user;
          setForm({
            fullName: `${u.firstName} ${u.lastName || ''}`.trim(),
            email: u.email || '',
            phone: u.phone || '',
            address: u.address || '',
            avatar: u.avatar || '',
          });
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loading && user) {
      setForm((prev) => ({
        ...prev,
        fullName: user.fullName || prev.fullName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        address: user.address || prev.address,
        avatar: user.avatar || prev.avatar,
      }));
    }
  }, [user, loading]);

  const updateField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64 = evt.target?.result;
      if (!base64) return;

      const data = await updateProfile({ avatar: base64 });
      if (data.success) {
        setForm((prev) => ({ ...prev, avatar: base64 }));
        showTopFloatNotification('✅ Profile picture updated successfully!');
      } else {
        showTopFloatNotification(`❌ ${data.message || 'Failed to update avatar'}`, 'danger');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await updateProfile({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      });
      if (data.success) {
        showTopFloatNotification('✅ Your profile has been updated successfully!');
      } else {
        showTopFloatNotification(`❌ ${data.message || 'Failed to update profile'}`, 'danger');
      }
    } finally {
      setSaving(false);
    }
  };

  const displayName = form.fullName || 'User Name';

  return (
    <div className="pf-tab active">
      <h1 className="pf-main-title">My Profile</h1>
      <p className="pf-main-sub">Manage your personal information</p>

      <div className="pf-profile-grid">
        <div className="pf-card">
          <div className="pf-avatar-wrap">
            <div
              className="pf-avatar-circle"
              id="avatarClickContainer"
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              {form.avatar ? (
                <img src={form.avatar} alt="Profile Photo" id="profilePageAvatar" />
              ) : (
                <div className="pf-avatar-initials" id="avatarInitials">
                  <i className="fa-regular fa-image" style={{ fontSize: '3rem', color: '#a3a29d' }} />
                </div>
              )}
            </div>
            <div
              className="pf-camera-btn"
              id="avatarCameraOverlay"
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <i className="fa-solid fa-camera" />
            </div>
            <input
              ref={fileRef}
              type="file"
              id="profileImageInput"
              accept="image/*"
              onChange={handleAvatarChange}
              hidden
            />
          </div>

          <div className="pf-card-name" id="profileCardName">
            {displayName}
          </div>

          <div className="pf-card-details-list">
            <div className="pf-card-detail-item">
              <div className="pf-detail-icon">
                <i className="fa-regular fa-envelope" />
              </div>
              <span id="profileCardEmail">{form.email || '—'}</span>
            </div>
            <div className="pf-card-detail-item">
              <div className="pf-detail-icon">
                <i className="fa-solid fa-phone" />
              </div>
              <span id="profileCardPhone">{form.phone || '—'}</span>
            </div>
          </div>
        </div>

        <div className="pf-form-card">
          <div className="pf-form-title">Personal Information</div>

          <form id="profileForm" onSubmit={handleSubmit} noValidate>
            <div className="pf-field">
              <label htmlFor="profileNameInput">Full Name</label>
              <div className="pf-input-wrap">
                <i className="fa-regular fa-user" />
                <input
                  type="text"
                  id="profileNameInput"
                  className="pf-input"
                  placeholder="Magacaaga oo dhamaystiran"
                  value={form.fullName}
                  onChange={updateField('fullName')}
                />
                <span
                  className="pf-change-link"
                  onClick={() => document.getElementById('profileNameInput')?.focus()}
                  onKeyDown={() => {}}
                  role="button"
                  tabIndex={0}
                >
                  Change
                </span>
              </div>
            </div>

            <div className="pf-field">
              <label htmlFor="profileEmailInput">Email Address</label>
              <div className="pf-input-wrap readOnly-field">
                <i className="fa-regular fa-envelope" />
                <input
                  type="email"
                  id="profileEmailInput"
                  className="pf-input"
                  placeholder="email@example.com"
                  value={form.email}
                  readOnly
                />
              </div>
            </div>

            <div className="pf-field">
              <label htmlFor="profilePhoneInput">Phone Number</label>
              <div className="pf-input-wrap readOnly-field">
                <i className="fa-solid fa-phone" />
                <input
                  type="tel"
                  id="profilePhoneInput"
                  className="pf-input"
                  placeholder="+252 61 0000000"
                  value={form.phone}
                  readOnly
                />
              </div>
            </div>

            <div className="pf-field">
              <label htmlFor="profileAddressInput">Address</label>
              <div className="pf-input-wrap">
                <i className="fa-solid fa-location-dot" />
                <input
                  type="text"
                  id="profileAddressInput"
                  className="pf-input"
                  placeholder="Mogadishu, Somalia"
                  value={form.address}
                  onChange={updateField('address')}
                />
                <span
                  className="pf-change-link"
                  onClick={() => document.getElementById('profileAddressInput')?.focus()}
                  onKeyDown={() => {}}
                  role="button"
                  tabIndex={0}
                >
                  Change
                </span>
              </div>
            </div>

            <button type="submit" className="pf-btn-save" disabled={saving || loading}>
              <i className="fa-regular fa-floppy-disk" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

