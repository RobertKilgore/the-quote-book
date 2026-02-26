// src/utils/api.js
import axios from "axios";

// Detect current host dynamically (localhost, 127.0.0.1, or LAN IP)
const host = window.location.hostname; // 'localhost' or '127.0.0.1' or LAN IP
const port = "8000";                    // Django backend port

// Base URL automatically adapts to current host
const baseURL = `http://${host}:${port}`;

// Create Axios instance
const api = axios.create({
  baseURL,
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