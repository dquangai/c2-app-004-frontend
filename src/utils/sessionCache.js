/** In-memory cache for the current browser session (cleared on logout). */
const store = new Map();

export function sessionCacheGet(key) {
  return store.get(key);
}

export function sessionCacheHas(key) {
  return store.has(key);
}

export function sessionCacheSet(key, value) {
  store.set(key, value);
}

export function sessionCacheDelete(key) {
  store.delete(key);
}

export function sessionCacheClearPrefix(prefix) {
  for (const key of [...store.keys()]) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export function sessionCacheClear() {
  store.clear();
}

export async function sessionCacheFetch(key, fetcher, { force = false } = {}) {
  if (!force && store.has(key)) {
    return store.get(key);
  }
  const value = await fetcher();
  store.set(key, value);
  return value;
}
