// src/utils/api.js
import axios from "axios";
import { getRequestCacheKey, invalidateRequestCacheEntries } from "./requestCache";

export function getApiBaseUrl() {
  return process.env.REACT_APP_API_BASE_URL || "/";
}

export const requestCache = new Map();
const pendingRequests = new Map();

// Create Axios instance
const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true, // ✅ send cookies/session automatically
});

// Automatically attach CSRF token for POST, PUT, DELETE, PATCH
api.interceptors.request.use(config => {
  const csrfToken = getCookie("csrftoken"); // helper below
  if (csrfToken && ["post","put","patch","delete"].includes(config.method)) {
    config.headers["X-CSRFToken"] = csrfToken;
  }
  return config;
});

const originalGet = api.get.bind(api);
api.get = function getWithCache(url, config = {}) {
  const shouldUseCache = !shouldBypassCache(url, config);

  if (!shouldUseCache) {
    return originalGet(url, config);
  }

  const cacheKey = getRequestCacheKey({ method: "get", url, params: config.params });
  const cached = requestCache.get(cacheKey);
  if (cached) {
    return Promise.resolve(cached);
  }

  const pending = pendingRequests.get(cacheKey);
  if (pending) {
    return pending;
  }

  const request = originalGet(url, config)
    .then(response => {
      requestCache.set(cacheKey, response);
      pendingRequests.delete(cacheKey);
      return response;
    })
    .catch(error => {
      pendingRequests.delete(cacheKey);
      throw error;
    });

  pendingRequests.set(cacheKey, request);
  return request;
};

export function clearRequestCache(prefix = null) {
  invalidateRequestCacheEntries(requestCache, prefix);
}

export function shouldBypassCache(url, config = {}) {
  const normalizedUrl = (url || "").startsWith("/") ? (url || "") : `/${url || ""}`;
  const isAuthRoute = normalizedUrl.includes("/api/test-auth/") || normalizedUrl.includes("/auth/login/") || normalizedUrl.includes("/auth/logout/");
  return Boolean(config.cache === false || config.skipCache === true || isAuthRoute);
}

// Helper to read cookie by name
function getCookie(name) {
  const cookieValue = document.cookie
    .split("; ")
    .find(row => row.startsWith(name + "="));
  return cookieValue ? decodeURIComponent(cookieValue.split("=")[1]) : null;
}

export default api;