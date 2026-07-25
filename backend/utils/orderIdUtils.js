function normalizeOrderId(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';

  const upper = trimmed.toUpperCase();
  if (upper.startsWith('#')) return upper;
  if (upper.startsWith('MF-')) return `#${upper}`;
  return trimmed;
}

module.exports = { normalizeOrderId };
