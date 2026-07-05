const store = new Map();

function get(key) {
  const entry = store.get(key);
  if (!entry || Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function set(key, value, ttlMs = 60000) {
  store.set(key, { value, expires: Date.now() + ttlMs });
}

function del(key) {
  store.delete(key);
}

module.exports = { get, set, del };
