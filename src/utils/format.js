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
  if (/^(https?:)?\/\//i.test(src) || /^data:/i.test(src) || /^blob:/i.test(src)) {
    return src;
  }

  const clean = String(src).trim().replace(/^\/+/, '');
  if (!clean) return '';

  if (clean === 'hero1.jpeg') return '/product-images/hero1.jpeg';

  // Backward compatibility for old product image folders after migration.
  if (/^(bedroom|chair|dining-room|living-room|office|outdoor)\//.test(clean)) {
    const fileName = clean.split('/').pop();
    return `/product-images/${fileName}`;
  }

  // Keep uploaded admin images working.
  if (clean.startsWith('uploads/')) return `/${clean}`;

  // Product images can be stored either as "product-images/..." or just file name.
  if (clean.startsWith('product-images/')) return `/${clean}`;
  if (/\.(png|jpe?g|gif|webp|svg)$/i.test(clean) && !clean.includes('/')) {
    return `/product-images/${clean}`;
  }

  return `/${clean}`;
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
