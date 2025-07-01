import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000", // adjust if needed
  withCredentials: true,           // allows cookies/session auth
});

export default api;