import { showTopFloatNotification } from './notifications';

/** Copy text on HTTPS, localhost, and LAN HTTP (clipboard API often blocked on http://IP). */
export async function copyToClipboard(value, successMessage = 'Copied.') {
  const text = String(value || '').trim();
  if (!text) return false;

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      if (successMessage) showTopFloatNotification(successMessage);
      return true;
    }
  } catch {
    /* fall through to legacy copy */
  }

  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:none;opacity:0;';
    document.body.appendChild(el);
    el.focus();
    el.select();
    el.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(el);
    if (!ok) throw new Error('execCommand copy failed');
    if (successMessage) showTopFloatNotification(successMessage);
    return true;
  } catch {
    showTopFloatNotification('Could not copy.', 'danger');
    return false;
  }
}
