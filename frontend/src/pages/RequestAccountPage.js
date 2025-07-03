import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import ErrorBanner from "../components/ErrorBanner"; // ✅ Reused shared component

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const RequestAccountPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg("");

    try {
      await axios.post(
        "http://127.0.0.1:8000/api/account-requests/",
        { username, email },
        {
          withCredentials: true,
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
          },
        }
      );
      setSuccessMsg("✅ Request submitted! An admin will review your request.");
      setUsername("");
      setEmail("");
    } catch (err) {
      console.error("Account request failed:", err);
      setError("❌ Could not submit request. Please try again.");
    }
  };

  return (
    <>
      <ErrorBanner message={error} /> {/* ✅ Error banner at top */}
      <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4 text-center">Request Account</h2>

        {successMsg && (
          <p className="text-green-600 text-center mb-4">{successMsg}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full border px-3 py-2"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            className="w-full border px-3 py-2"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Submit Request
          </button>
        </form>

        <div className="mt-4 flex justify-between text-sm text-blue-500">
          <Link to="/login" className="hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </>
  );
};

export default RequestAccountPage;
