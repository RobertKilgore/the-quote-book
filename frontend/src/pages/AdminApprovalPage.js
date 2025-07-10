import { useEffect, useState } from "react";
import api from "../api/axios";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";
import getCookie from "../utils/getCookie";
import LoadingPage from "./LoadingPage";
import { useUnapprovedUserCount } from "../context/UnapprovedUserContext";

export default function AdminApprovalPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fadingIds, setFadingIds] = useState([]);
  const { refreshUnapprovedUserCount } = useUnapprovedUserCount();

  const fetchRequests = async () => {
    try {
      const res = await api.get("/api/account-requests/", {
        withCredentials: true,
      });
      setRequests(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load account requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const fadeOutThenRemove = (id) => {
    setFadingIds((prev) => [...prev, id]);
    setTimeout(() => {
      setRequests((prev) => prev.filter((r) => r.id !== id));
    }, 500);
  };

  const handleApprove = async (id) => {
    try {
      await api.post(
        `/api/account-requests/${id}/approve/`,
        {},
        {
          withCredentials: true,
          headers: { "X-CSRFToken": getCookie("csrftoken") },
        }
      );
      refreshUnapprovedUserCount();
      fadeOutThenRemove(id);
    } catch {
      setError("Could not approve account.");
    }
  };

  const handleReject = async (id) => {
    try {
      await api.delete(`/api/account-requests/${id}/`, {
        withCredentials: true,
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });
      refreshUnapprovedUserCount();
      fadeOutThenRemove(id);
    } catch {
      setError("Could not reject account.");
    }
  };

  return (
    <>
      {/* Error banner appears at the top */}
      <ErrorBanner message={error} />

      <div className="max-w-4xl mx-auto mt-8 space-y-4">
        <h2 className="text-2xl font-bold mb-4">Pending Account Requests</h2>

        {loading ? (
          <LoadingPage />
        ) : requests.length === 0 ? (
          <EmptyState
            title="All clear!"
            message="No pending account requests at the moment."
          />
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className={`relative bg-white p-4 pr-12 shadow rounded hover:bg-gray-50 transition cursor-pointer duration-300 ${
                  fadingIds.includes(req.id) ? "opacity-0" : "opacity-100"
                }`}
              >
                <div>
                  <p>
                    <span className="font-medium">Username:</span> {req.username}
                  </p>
                  <p>
                    <span className="font-medium">Name:</span> {req.first_name}{" "}
                    {req.last_name}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {req.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    Requested at: {new Date(req.submitted_at).toLocaleString()}
                  </p>
                </div>

                {/* Buttons placed directly under the "Requested at" section */}
                <div className="mt-2 gap-4 flex flex-col sm:flex-row sm:gap-4">
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="w-full sm:w-auto px-4 py-1.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-full transition-colors duration-200"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="w-full sm:w-auto px-4 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-full transition-colors duration-200"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
