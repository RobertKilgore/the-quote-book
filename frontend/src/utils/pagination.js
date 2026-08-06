export function normalizePageUrl(value) {
  if (!value) return null;

  try {
    const url = new URL(value, window.location.origin);
    return `${url.pathname}${url.search}`;
  } catch {
    return value;
  }
}
