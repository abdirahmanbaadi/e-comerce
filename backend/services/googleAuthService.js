const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

function getGoogleClientId() {
  return String(process.env.GOOGLE_CLIENT_ID || '').trim();
}

function getGoogleClient() {
  const clientId = getGoogleClientId();
  if (!clientId) return null;
  return new OAuth2Client(clientId);
}

async function verifyGoogleIdToken(credential) {
  const clientId = getGoogleClientId();
  const client = getGoogleClient();
  if (!client || !clientId) {
    return { ok: false, message: 'Google sign-in is not configured on the server.' };
  }
  const token = String(credential || '').trim();
  if (!token) {
    return { ok: false, message: 'Missing Google credential.' };
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload?.email) {
      return { ok: false, message: 'Google account data was incomplete.' };
    }
    if (payload.email_verified === false) {
      return { ok: false, message: 'Please verify your Google email, then try again.' };
    }
    return {
      ok: true,
      profile: {
        googleId: payload.sub,
        email: String(payload.email).toLowerCase().trim(),
        firstName: payload.given_name || String(payload.name || 'Google').split(' ')[0] || 'Google',
        lastName: payload.family_name || String(payload.name || '').split(' ').slice(1).join(' '),
        avatar: payload.picture || '',
      },
    };
  } catch (error) {
    console.error('Google ID token verify failed:', error.message);
    return { ok: false, message: 'Google sign-in failed. Please try again.' };
  }
}

async function verifyGoogleAccessToken(accessToken) {
  const token = String(accessToken || '').trim();
  if (!token) {
    return { ok: false, message: 'Missing Google access token.' };
  }

  const clientId = getGoogleClientId();
  if (!clientId) {
    return { ok: false, message: 'Google sign-in is not configured on the server.' };
  }

  try {
    const infoRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`
    );
    const info = await infoRes.json().catch(() => ({}));
    if (!infoRes.ok) {
      return { ok: false, message: 'Google sign-in expired. Please try again.' };
    }
    const aud = String(info.aud || info.azp || '');
    if (aud && aud !== clientId) {
      return { ok: false, message: 'Google client mismatch. Check GOOGLE_CLIENT_ID.' };
    }

    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.sub || !data.email) {
      return { ok: false, message: 'Could not read Google account details.' };
    }
    if (data.email_verified === false || data.verified_email === false) {
      return { ok: false, message: 'Please verify your Google email, then try again.' };
    }
    return {
      ok: true,
      profile: {
        googleId: data.sub,
        email: String(data.email).toLowerCase().trim(),
        firstName: data.given_name || String(data.name || 'Google').split(' ')[0] || 'Google',
        lastName: data.family_name || String(data.name || '').split(' ').slice(1).join(' '),
        avatar: data.picture || '',
      },
    };
  } catch (error) {
    console.error('Google access token verify failed:', error.message);
    return { ok: false, message: 'Google sign-in failed. Please try again.' };
  }
}

function buildGooglePlaceholderPhone(googleId) {
  const hash = crypto.createHash('sha256').update(String(googleId)).digest('hex');
  const digits = hash.replace(/[a-f]/gi, (c) => String(parseInt(c, 16) % 10)).slice(0, 7);
  return `+252600${digits}`;
}

function buildGoogleUsername(email, googleId) {
  const local = String(email || '')
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 20);
  const base = local.length >= 3 ? local : `user${String(googleId).slice(-6)}`;
  return base;
}

module.exports = {
  getGoogleClientId,
  verifyGoogleIdToken,
  verifyGoogleAccessToken,
  buildGooglePlaceholderPhone,
  buildGoogleUsername,
};
