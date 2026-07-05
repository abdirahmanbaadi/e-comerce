export function formatMoney(value) {
  const num = Number(value);
  const useThreeDecimals = num > 0 && num < 0.1;
  return `$${num.toLocaleString('en-US', {
    minimumFractionDigits: useThreeDecimals ? 3 : 2,
    maximumFractionDigits: useThreeDecimals ? 3 : 2,
  })}`;
}

export function productImage(src) {
  if (!src) return '';
  return src.startsWith('/') ? src : `/${src}`;
}

export function formatChatTime(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function formatPastChatTime(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
