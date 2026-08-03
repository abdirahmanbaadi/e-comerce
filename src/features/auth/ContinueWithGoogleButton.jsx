import { useCallback, useEffect, useRef, useState } from 'react';

const GSI_SRC = 'https://accounts.google.com/gsi/client';
const CLIENT_ID = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

function loadGoogleScript() {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.google?.accounts?.id) return Promise.resolve();

  const existing = document.querySelector(`script[src="${GSI_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Sign-In')));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Sign-In'));
    document.head.appendChild(script);
  });
}

/**
 * Opens Google account picker (all signed-in Gmail accounts on the device).
 * Uses GIS One Tap / OAuth token client with prompt: 'select_account'.
 */
export default function ContinueWithGoogleButton({ onCredential, disabled = false, label = 'Continue with Google' }) {
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const tokenClientRef = useRef(null);
  const onCredentialRef = useRef(onCredential);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!CLIENT_ID) {
      setError('Google Sign-In is not configured.');
      return undefined;
    }

    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google?.accounts) return;

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (response) => {
            if (!response?.credential) {
              setBusy(false);
              setError('Google sign-in was cancelled.');
              return;
            }
            try {
              await onCredentialRef.current?.({ credential: response.credential });
            } finally {
              setBusy(false);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (window.google.accounts.oauth2?.initTokenClient) {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: 'openid email profile',
            prompt: 'select_account',
            callback: async (tokenResponse) => {
              if (tokenResponse?.error) {
                setBusy(false);
                setError(tokenResponse.error_description || 'Google sign-in failed.');
                return;
              }
              if (!tokenResponse?.access_token) {
                setBusy(false);
                setError('Google sign-in was cancelled.');
                return;
              }
              try {
                await onCredentialRef.current?.({ accessToken: tokenResponse.access_token });
              } finally {
                setBusy(false);
              }
            },
          });
        }

        setReady(true);
        setError('');
      })
      .catch(() => {
        if (!cancelled) setError('Could not load Google Sign-In.');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleClick = useCallback(() => {
    setError('');
    if (!CLIENT_ID) {
      setError('Add VITE_GOOGLE_CLIENT_ID to your .env file.');
      return;
    }
    if (!ready) {
      setError('Google Sign-In is still loading…');
      return;
    }

    setBusy(true);

    // Prefer OAuth token client — always shows account chooser (all Gmail on device).
    if (tokenClientRef.current?.requestAccessToken) {
      tokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
      return;
    }

    // Fallback: GIS prompt with FedCM / One Tap style picker
    if (window.google?.accounts?.id?.prompt) {
      window.google.accounts.id.prompt((notification) => {
        if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
          setBusy(false);
          setError('Google account picker could not open. Check pop-up blockers.');
        }
      });
      return;
    }

    setBusy(false);
    setError('Google Sign-In is unavailable in this browser.');
  }, [ready]);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || busy}
        className="flex h-[50px] w-full items-center justify-center gap-3 rounded-xl border-[1.5px] border-black/10 bg-white text-[0.9rem] font-bold text-[#3c4043] transition-all hover:bg-[#f8f9fa] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
          <path fill="none" d="M0 0h48v48H0z" />
        </svg>
        <span>{busy ? 'Connecting…' : label}</span>
      </button>
      {error ? (
        <p className="mt-2 text-center text-[0.75rem] font-semibold text-[#7a2e28]" role="status">
          {error}
        </p>
      ) : null}
    </div>
  );
}
