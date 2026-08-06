import React, { useEffect, useState } from "react";
import api from "../api/axios";
import getCookie from "../utils/getCookie";
import useAppContext from "../context/useAppContext";

export default function UserSettingsPage() {
  const { setError, setSuccess } = useAppContext();
  const [form, setForm] = useState({ username: "", first_name: "", last_name: "", email: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/me/", { withCredentials: true })
      .then((res) => setForm(res.data))
      .catch(() => setError("Failed to load settings."))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    try {
      const res = await api.patch("/api/me/", {
        username: form.username,
        first_name: form.first_name,
        last_name: form.last_name,
      }, {
        withCredentials: true,
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });

      setForm(res.data);
      setSuccess("Settings saved.");
      setError("");
    } catch (err) {
      // keep user-friendly message; you can whitelist if you want
      const msg = err?.response?.data?.username?.[0] || err?.response?.data?.detail || "Failed to save settings.";
      setError(msg);
    }
  };

  if (loading) return null;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-xl shadow space-y-4">
      <h1 className="text-xl font-bold">Account Settings</h1>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Username</label>
        <input
          className="w-full border rounded px-3 py-2"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="block text-sm font-medium">First name</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.first_name || ""}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Last name</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.last_name || ""}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Email</label>
        <input className="w-full border rounded px-3 py-2 bg-gray-50" value={form.email || ""} disabled />
        <div className="text-xs text-gray-500">Email preferences coming soon.</div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={save}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  );
}