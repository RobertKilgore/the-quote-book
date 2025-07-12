import { useEffect, useState } from "react";
import api from "../api/axios";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";
import getCookie from "../utils/getCookie";
import LoadingPage from "./LoadingPage";
import { useUnapprovedUserCount } from "../context/UnapprovedUserContext";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";

export default function AdminApprovalPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fadingIds, setFadingIds] = useState([]);
  const { refreshUnapprovedUserCount } = useUnapprovedUserCount();
  const [users, setUsers] = useState([]);
  const [userFadingIds, setUserFadingIds] = useState([]);

  useEffect(() => {
    fetchRequests();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users/", {
        withCredentials: true,
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load active users.");
    }
  };

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
      await fetchUsers(); 
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

  const confirmDeleteUser = (id, username) => {
    confirmAlert({
      title: "Confirm Delete",
      message: `Are you sure you want to delete user "${username}"? This action cannot be undone.`,
      buttons: [
        {
          label: "Cancel",
          className: "cancel-button",
          onClick: () => {},
        },
        {
          label: "Yes, Delete",
          className: "delete-button",
          onClick: () => handleDeleteUser(id),
        },
      ],
      closeOnEscape: true,
      closeOnClickOutside: true,
    });
  };

  const handleDeleteUser = async (id) => {
    try {
      await api.delete(`/admin/users/${id}/`, {
        withCredentials: true,
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });
      setUserFadingIds((prev) => [...prev, id]);
      setTimeout(() => {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      }, 500);
    } catch {
      setError("Could not delete user.");
    }
  };

  return (
    <>
      <ErrorBanner message={error} />

      <div className="max-w-4xl mx-auto mt-8 space-y-8">

        <div>
          <h2 className="text-2xl font-bold mb-4">All Users</h2>
          {users.length === 0 ? (
            <EmptyState
              title="No users found."
              message="There are no active users right now."
            />
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`relative bg-white p-4 pr-12 shadow rounded hover:bg-gray-50 transition duration-300 ${
                    userFadingIds.includes(user.id) ? "opacity-0" : "opacity-100"
                  }`}
                >
                  <p><span className="font-medium">Username:</span> {user.username}</p>
                  <p><span className="font-medium">Name:</span> {user.name}</p>
                  <p><span className="font-medium">Email:</span> {user.email}</p>
                  <p><span className="font-medium">Active:</span> {user.is_active ? "Yes" : "No"}</p>
                  <p><span className="font-medium">Admin:</span> {user.is_superuser ? "Yes" : "No"}</p>

                  <div className="mt-2 flex flex-col sm:flex-row sm:gap-4">
                    <button
                      onClick={() => confirmDeleteUser(user.id, user.username)}
                      className="px-4 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-full mb-2 sm:mb-0"
                    >
                      Delete User
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          const newStatus = !user.is_active;
                          await api.patch(`/api/admin/users/${user.id}/`, {
                            is_active: newStatus
                          }, {
                            withCredentials: true,
                            headers: { "X-CSRFToken": getCookie("csrftoken") },
                          });

                          // Update local state immediately
                          setUsers(prev =>
                            prev.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u)
                          );
                        } catch {
                          setError("Failed to update user status.");
                        }
                      }}
                      className={`px-4 py-1.5 text-sm font-medium text-white ${
                        user.is_active ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-600 hover:bg-blue-700"
                      } rounded-full`}
                    >
                      {user.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
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
                      <span className="font-medium">Name:</span> {req.first_name} {req.last_name}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span> {req.email}
                    </p>
                    <p className="text-sm text-gray-500">
                      Requested at: {new Date(req.submitted_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="mt-2 gap-4 flex flex-col sm:flex-row sm:gap-4">
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="w-full sm:w-auto px-4 py-1.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-full"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="w-full sm:w-auto px-4 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-full"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
