// src/utils/api.js
import axios from "axios";

export function getApiBaseUrl() {
  return process.env.REACT_APP_API_BASE_URL || "/";
}

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

// Helper to read cookie by name
function getCookie(name) {
  const cookieValue = document.cookie
    .split("; ")
    .find(row => row.startsWith(name + "="));
  return cookieValue ? decodeURIComponent(cookieValue.split("=")[1]) : null;
}

export default api;