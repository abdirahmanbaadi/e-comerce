const DEFAULT_HEADER_COLOR = '#6b4228';

const HEADER_COLOR_PRESETS = [
  '#6b4228',
  '#5a3722',
  '#073D35',
  '#1e3a5f',
  '#4a3728',
  '#8b4557',
  '#3d4a3a',
  '#2c2c2c',
];

function storageKey(email) {
  const id = String(email || 'guest').toLowerCase().trim();
  return `mmf_profile_header_color:${id}`;
}

export function getProfileHeaderColor(email) {
  try {
    const saved = localStorage.getItem(storageKey(email));
    if (saved && /^#[0-9a-fA-F]{6}$/.test(saved)) return saved;
  } catch {
    /* ignore */
  }
  return DEFAULT_HEADER_COLOR;
}

export function setProfileHeaderColor(email, color) {
  const next = /^#[0-9a-fA-F]{6}$/.test(color) ? color : DEFAULT_HEADER_COLOR;
  try {
    localStorage.setItem(storageKey(email), next);
    window.dispatchEvent(
      new CustomEvent('mmf-profile-header-color', { detail: { email, color: next } })
    );
  } catch {
    /* ignore */
  }
  return next;
}

export { DEFAULT_HEADER_COLOR, HEADER_COLOR_PRESETS };
