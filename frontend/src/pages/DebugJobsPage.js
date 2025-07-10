import React, { useState } from "react";
import api from "../api/axios";
import getCookie from "../utils/getCookie";

export default function DebugJobsPage({ user }) {
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleTriggerJob = async () => {
    try {
      const res = await api.post("/debug/refuse/", {}, {
        withCredentials: true,
        headers: { "X-CSRFToken": getCookie("csrftoken") }
      });
      setMessage(res.data.success || "Triggered!");
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to trigger job.");
      setMessage(null);
    }
  };

  if (!user?.isSuperuser) {
    return <p className="text-red-600 text-center mt-8">You do not have permission to view this page.</p>;
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Debug Job Runner</h2>
      <p className="mb-4 text-gray-700">
        Click the button below to manually trigger the auto-refuse signature job.
      </p>
      <button
        onClick={handleTriggerJob}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Run Auto-Refuse Job
      </button>

      {message && <p className="mt-4 text-green-600">{message}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
}
