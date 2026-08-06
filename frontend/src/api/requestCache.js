export function getRequestCacheKey(config = {}) {
  const method = (config.method || "get").toLowerCase();
  const url = config.url || "";
  const params = config.params ? JSON.stringify(config.params) : "";
  return `${method}:${url}:${params}`;
}

export function invalidateRequestCacheEntries(cache, prefix = null) {
  if (!cache || !(cache instanceof Map)) {
    return;
  }

  if (!prefix) {
    cache.clear();
    return;
  }

  for (const key of Array.from(cache.keys())) {
    if (key.includes(prefix)) {
      cache.delete(key);
    }
  }
}
