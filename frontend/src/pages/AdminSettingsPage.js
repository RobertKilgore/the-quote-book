import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api, { clearRequestCache } from "../api/axios";
import getCookie from "../utils/getCookie";
import useAppContext from "../context/useAppContext";

const DAY_OPTIONS = [1, ...Array.from({ length: 29 }, (_, i) => i + 2)];
const SECOND_OPTIONS = [60, 120, 300, 600, 1800, 3600, 7200, 86400, 172800, 604800];

export default function AdminSettingsPage() {
  const { setError, setSuccess } = useAppContext();
  const location = useLocation();
  const [form, setForm] = useState({ initial_window_days: 14, reopen_window_days: 7, initial_window_seconds: 1209600, reopen_window_seconds: 604800 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/api/admin/settings/", { withCredentials: true, cache: false });
        setForm({
          initial_window_days: data.initial_window_days ?? 14,
          reopen_window_days: data.reopen_window_days ?? 7,
          initial_window_seconds: data.initial_window_seconds ?? 1209600,
          reopen_window_seconds: data.reopen_window_seconds ?? 604800,
        });
      } catch {
        setError("Failed to load admin settings.");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [location.key, setError]);

  const save = async () => {
    try {
      const { data } = await api.patch(
        "/api/admin/settings/",
        {
          initial_window_days: Number(form.initial_window_days),
          reopen_window_days: Number(form.reopen_window_days),
          initial_window_seconds: Number(form.initial_window_seconds),
          reopen_window_seconds: Number(form.reopen_window_seconds),
        },
        {
          withCredentials: true,
          headers: { "X-CSRFToken": getCookie("csrftoken") },
        }
      );

      setForm({
        initial_window_days: data.initial_window_days ?? 14,
        reopen_window_days: data.reopen_window_days ?? 7,
        initial_window_seconds: data.initial_window_seconds ?? 1209600,
        reopen_window_seconds: data.reopen_window_seconds ?? 604800,
      });
      clearRequestCache("/api/admin/settings/");
      setSuccess("Admin settings saved.");
      setError("");
    } catch {
      setError("Failed to save admin settings.");
    }
  };

  if (loading) return null;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-xl shadow space-y-6">
      <div>
        <h1 className="text-xl font-bold">Admin Settings</h1>
        <p className="text-sm text-gray-600">Set the default signature windows for quotes.</p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Time to sign
          <select
            className="mt-1 w-full border rounded px-3 py-2"
            value={form.initial_window_seconds}
            onChange={(e) => setForm({ ...form, initial_window_seconds: Number(e.target.value), initial_window_days: Number(e.target.value) / 86400 })}
          >
            {DAY_OPTIONS.map((day) => (
              <option key={day} value={day * 86400}>{day} day{day === 1 ? "" : "s"}</option>
            ))}
            {SECOND_OPTIONS.map((seconds) => (
              <option key={`sec-${seconds}`} value={seconds}>{seconds === 60 ? "1 minute" : `${seconds} seconds`}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Time to sign after reopen
          <select
            className="mt-1 w-full border rounded px-3 py-2"
            value={form.reopen_window_seconds}
            onChange={(e) => setForm({ ...form, reopen_window_seconds: Number(e.target.value), reopen_window_days: Number(e.target.value) / 86400 })}
          >
            {DAY_OPTIONS.map((day) => (
              <option key={day} value={day * 86400}>{day} day{day === 1 ? "" : "s"}</option>
            ))}
            {SECOND_OPTIONS.map((seconds) => (
              <option key={`sec-${seconds}`} value={seconds}>{seconds === 60 ? "1 minute" : `${seconds} seconds`}</option>
            ))}
          </select>
        </label>
      </div>

      <button
        onClick={save}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Save
      </button>
    </div>
  );
}
