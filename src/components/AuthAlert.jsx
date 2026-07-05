import { useEffect, useState } from 'react';
import '../styles/auth-alert.css';

export default function AuthAlert({
  message,
  type = 'danger',
  onDismiss,
  autoDismiss = true,
  duration = 3000,
}) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!message || !autoDismiss || !onDismiss) {
      setLeaving(false);
      return undefined;
    }

    setLeaving(false);
    const fadeAt = Math.max(duration - 320, 0);
    const fadeTimer = setTimeout(() => setLeaving(true), fadeAt);
    const hideTimer = setTimeout(() => {
      onDismiss();
      setLeaving(false);
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [message, autoDismiss, duration, onDismiss]);

  if (!message) return null;

  return (
    <div
      className={`auth-alert auth-alert--${type}${leaving ? ' auth-alert--leaving' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <span className="auth-alert__text">{message}</span>
    </div>
  );
}
