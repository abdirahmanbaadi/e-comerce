import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../utils/data';
import { productImage } from '../../utils/format';
import { showTopFloatNotification } from '../../utils/notifications';
import {
  getProfileHeaderColor,
  HEADER_COLOR_PRESETS,
  setProfileHeaderColor,
} from '../profileHeaderColor';

const inputClass =
  'h-12 w-full rounded-xl border border-[#e5e0d8] bg-white px-4 text-[0.9rem] font-semibold text-[#1c140e] outline-none placeholder:text-[#b0a498] focus:border-[#6b4228]';

const readOnlyClass = `${inputClass} cursor-default bg-[#f7f4ef] text-[#8b8178]`;

function InfoRow({ label, value, hint }) {
  return (
    <div className="border-b border-[#f0ebe4] py-3.5 last:border-0">
      <p className="mb-1 mt-0 text-[0.7rem] font-black uppercase tracking-wide text-[#8b8178]">{label}</p>
      <p className="mb-0 mt-0 break-words text-[0.92rem] font-bold text-[#1c140e]">{value || '—'}</p>
      {hint ? <p className="mb-0 mt-1 text-[0.72rem] font-semibold text-[#9a8d82]">{hint}</p> : null}
    </div>
  );
}

async function fileToAvatarDataUrl(file) {
  const readAsDataUrl = () =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('read failed'));
      reader.readAsDataURL(file);
    });

  const drawToSquare = (source, width, height) => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas unavailable');
    const scale = Math.max(size / width, size / height);
    const w = width * scale;
    const h = height * scale;
    ctx.drawImage(source, (size - w) / 2, (size - h) / 2, w, h);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  try {
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(file);
      try {
        return drawToSquare(bitmap, bitmap.width, bitmap.height);
      } finally {
        bitmap.close?.();
      }
    }
  } catch {
    // Fall through — some gallery formats need Image()/FileReader.
  }

  const dataUrl = await readAsDataUrl();
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        resolve(drawToSquare(img, img.naturalWidth || img.width, img.naturalHeight || img.height));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('decode failed'));
    img.src = dataUrl;
  });
}

export default function MobilePersonalInfo() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const fileRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [form, setForm] = useState({ fullName: '', address: '', avatar: '' });
  const [headerColor, setHeaderColor] = useState('#6b4228');

  useEffect(() => {
    if (!user?.isLoggedIn) {
      navigate('/app/login', { replace: true, state: { from: '/app/profile/personal' } });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user?.isLoggedIn) return undefined;
    let cancelled = false;
    const token = localStorage.getItem('token');

    const load = async () => {
      setLoading(true);
      try {
        const profileRes = await fetch(apiUrl('/api/auth/profile'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const profileData = await profileRes.json().catch(() => ({}));
        if (cancelled) return;

        const nextProfile =
          profileData.success && profileData.user
            ? profileData.user
            : {
                firstName: user.fullName?.split(' ')[0] || '',
                lastName: user.fullName?.split(' ').slice(1).join(' ') || '',
                email: user.email,
                phone: user.phone,
                address: user.address,
                avatar: user.avatar,
              };
        setProfile(nextProfile);
        const name =
          `${nextProfile.firstName || ''} ${nextProfile.lastName || ''}`.trim() || user.fullName || '';
        setForm({
          fullName: name,
          address: nextProfile.address || '',
          avatar: nextProfile.avatar || '',
        });
        setAvatarBroken(false);
        setHeaderColor(getProfileHeaderColor(user.email));
      } catch {
        if (!cancelled) {
          setProfile({
            firstName: user.fullName?.split(' ')[0] || '',
            lastName: user.fullName?.split(' ').slice(1).join(' ') || '',
            email: user.email,
            phone: user.phone,
            address: user.address,
            avatar: user.avatar,
          });
          setForm({
            fullName: user.fullName || '',
            address: user.address || '',
            avatar: user.avatar || '',
          });
          setAvatarBroken(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // Load once per account — do not re-fetch on every AuthContext user update (that wiped new avatars).
  }, [user?.isLoggedIn, user?.email]);

  const fullName = useMemo(() => {
    if (editing) return form.fullName || 'Customer';
    if (!profile) return user?.fullName || 'Customer';
    return `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || user?.fullName || 'Customer';
  }, [editing, form.fullName, profile, user]);

  const displayAvatar = editing ? form.avatar : profile?.avatar || user?.avatar;
  const avatarSrc = displayAvatar && !avatarBroken ? productImage(displayAvatar) : '';

  useEffect(() => {
    setAvatarBroken(false);
  }, [displayAvatar]);

  const startEdit = () => {
    const name =
      `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || user?.fullName || '';
    setForm({
      fullName: name,
      address: profile?.address || user?.address || '',
      avatar: profile?.avatar || user?.avatar || '',
    });
    setHeaderColor(getProfileHeaderColor(user.email));
    setAvatarBroken(false);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setAvatarBroken(false);
    setForm({
      fullName:
        `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || user?.fullName || '',
      address: profile?.address || user?.address || '',
      avatar: profile?.avatar || user?.avatar || '',
    });
  };

  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showTopFloatNotification('Please choose an image file.', 'danger');
      return;
    }
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      if (!dataUrl) {
        showTopFloatNotification('Could not read image.', 'danger');
        return;
      }
      setForm((prev) => ({ ...prev, avatar: dataUrl }));
      setAvatarBroken(false);
    } catch {
      showTopFloatNotification('Could not use that image. Try a JPG or PNG photo.', 'danger');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      showTopFloatNotification('Full name is required.', 'danger');
      return;
    }
    setSaving(true);
    try {
      setProfileHeaderColor(user.email, headerColor);
      const previousAvatar = profile?.avatar || user?.avatar || '';
      const payload = {
        fullName: form.fullName.trim(),
        address: form.address.trim(),
      };
      if (form.avatar && form.avatar !== previousAvatar) {
        payload.avatar = form.avatar;
      }
      const data = await updateProfile(payload);
      if (data.success) {
        const u = data.user || {};
        const nextAvatar = u.avatar || (payload.avatar ? payload.avatar : previousAvatar) || '';
        setProfile((prev) => ({
          ...prev,
          ...u,
          firstName: u.firstName,
          lastName: u.lastName,
          address: u.address,
          avatar: nextAvatar,
        }));
        setForm((prev) => ({ ...prev, avatar: nextAvatar }));
        setAvatarBroken(false);
        showTopFloatNotification('Profile updated.');
        setEditing(false);
      } else {
        showTopFloatNotification(data.message || 'Could not update profile.', 'danger');
      }
    } catch {
      showTopFloatNotification('Connection failed.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mmf-pwa flex min-h-[100dvh] items-center justify-center bg-[#f3eee6] font-sans">
        <p className="m-0 text-[0.86rem] font-semibold text-[#8b8178]">Loading…</p>
      </div>
    );
  }

  /* ── Edit Profile (clean card layout) ── */
  if (editing) {
    return (
      <div className="mmf-pwa min-h-[100dvh] bg-[#f3eee6] font-sans text-[#111111]">
        <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.85rem,env(safe-area-inset-top))]">
          <header className="mb-3 flex items-center">
            <button
              type="button"
              onClick={cancelEdit}
              className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white text-[#2f241a] shadow-sm"
              aria-label="Back"
            >
              <i className="fa-solid fa-chevron-left text-[0.85rem]" />
            </button>
            <h1 className="m-0 flex-1 text-center text-[1.1rem] font-black text-[#1c140e]">Edit Profile</h1>
            <span className="h-10 w-10" aria-hidden="true" />
          </header>

          <section className="mx-auto w-full rounded-[28px] bg-white px-5 pb-6 pt-6 shadow-[0_12px_40px_rgba(59,40,24,0.1)]">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="mb-2 flex justify-center">
                <div className="relative">
                  <span className="flex h-[110px] w-[110px] overflow-hidden rounded-full bg-[#efe7dc] ring-4 ring-[#f5f0ea]">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={() => setAvatarBroken(true)}
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[1.5rem] font-black text-[#6b4228]">
                        {(form.fullName || 'U')
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((p) => p[0]?.toUpperCase())
                          .join('') || 'U'}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-[#6b4228] text-white shadow-md"
                    aria-label="Change profile picture"
                  >
                    <i className="fa-solid fa-camera text-[0.78rem]" />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPickAvatar}
                  />
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-[0.8rem] font-semibold text-[#8b8178]">Full Name</span>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  className={inputClass}
                  required
                  autoComplete="name"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[0.8rem] font-semibold text-[#8b8178]">Email</span>
                <input
                  value={profile?.email || user?.email || ''}
                  className={readOnlyClass}
                  disabled
                  readOnly
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[0.8rem] font-semibold text-[#8b8178]">Phone</span>
                <input
                  value={profile?.phone || user?.phone || ''}
                  className={readOnlyClass}
                  disabled
                  readOnly
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[0.8rem] font-semibold text-[#8b8178]">Address</span>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  className="min-h-[88px] w-full resize-none rounded-xl border border-[#e5e0d8] bg-white px-4 py-3 text-[0.9rem] font-semibold outline-none focus:border-[#6b4228]"
                  placeholder="District, street, landmark…"
                />
              </label>

              <div>
                <span className="mb-2 block text-[0.8rem] font-semibold text-[#8b8178]">Header background</span>
                <div className="flex flex-wrap gap-2.5">
                  {HEADER_COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setHeaderColor(color)}
                      className={`h-8 w-8 rounded-full border-2 shadow-sm ${
                        headerColor === color ? 'scale-110 border-[#1c140e]' : 'border-white'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Color ${color}`}
                    />
                  ))}
                  <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-[#eadfce] bg-[#f7f4ef]">
                    <i className="fa-solid fa-plus text-[0.7rem] text-[#8b8178]" />
                    <input
                      type="color"
                      value={headerColor}
                      onChange={(e) => setHeaderColor(e.target.value)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                      aria-label="Custom color"
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-2 flex min-h-[50px] w-full items-center justify-center rounded-2xl border-0 bg-[#6b4228] text-[0.95rem] font-black text-white disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </section>
        </div>
      </div>
    );
  }

  /* ── Personal information (view) — one connected layout ── */
  return (
    <div
      className="mmf-pwa flex min-h-[100dvh] flex-col font-sans text-[#111111]"
      style={{ backgroundColor: headerColor }}
    >
      <header
        className="relative shrink-0 px-4 pb-16 pt-[max(0.7rem,env(safe-area-inset-top))]"
        style={{ backgroundColor: headerColor }}
      >
        <div className="mx-auto max-w-md">
          <div className="mb-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/app/profile')}
              className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white/15 text-white"
              aria-label="Back"
            >
              <i className="fa-solid fa-chevron-left text-[0.85rem]" />
            </button>
            <h1 className="m-0 text-[1rem] font-black text-white">Personal information</h1>
            <button
              type="button"
              onClick={startEdit}
              className="rounded-full border-0 bg-transparent px-1 text-[0.84rem] font-black text-white"
            >
              Edit
            </button>
          </div>

          <div className="flex flex-col items-center text-center text-white">
            <span className="mb-3 flex h-[92px] w-[92px] overflow-hidden rounded-full bg-white/20 ring-[3px] ring-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => setAvatarBroken(true)}
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[1.4rem] font-black text-white">
                  {fullName
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase())
                    .join('') || 'U'}
                </span>
              )}
            </span>
            <h2 className="m-0 max-w-[90%] truncate text-[1.2rem] font-black tracking-tight">{fullName}</h2>
            <p className="mb-0 mt-1 max-w-[92%] truncate text-[0.8rem] font-medium text-white/85">
              {profile?.email || user?.email}
            </p>
          </div>
        </div>
      </header>

      <section className="relative z-[1] -mt-8 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-8px_30px_rgba(59,40,24,0.12)]">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
          <div className="mx-auto mb-2 mt-1.5 h-1 w-10 shrink-0 rounded-full bg-[#eadfce]" />

          <div className="min-h-0 flex-1 overflow-y-auto pb-4">
            <InfoRow label="Full name" value={fullName} />
            <InfoRow label="Email" value={profile?.email || user?.email} hint="Used for login" />
            <InfoRow label="Phone" value={profile?.phone || user?.phone} hint="Used for login" />
            <InfoRow label="Address" value={profile?.address || user?.address || 'No address saved'} />

            <button
              type="button"
              onClick={startEdit}
              className="mt-5 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full border-0 bg-[#6b4228] text-[0.92rem] font-black text-white"
            >
              <i className="fa-solid fa-pen text-[0.8rem]" />
              Edit Profile
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
