import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import ErrorBanner from "../components/ErrorBanner";
import getCookie from "../utils/getCookie";

const RequestAccountPage = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await axios.post(
        "http://127.0.0.1:8000/api/account-requests/",
        {
          first_name: firstName,
          last_name: lastName,
          username,
          email,
        },
        {
          withCredentials: true,
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
          },
        }
      );

      // Redirect to login with success flash message
      navigate("/login", {
        state: {
          success: "Request submitted! Please wait for admin approval.",
          from: "request-account",
        },
      });
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        if (data.username?.[0] === "A user with that username already exists.") {
          setError("That username is already taken.");
        } else if (data.email?.[0] === "user with this email already exists.") {
          setError("An account with this email already exists.");
        } else {
          setError("Could not submit request. Please check your info.");
        }
      } else {
        setError("An unknown error occurred.");
      }
    }
  };

  return (
    <>
      <ErrorBanner message={error} />
      <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4 text-center">Request Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full border px-3 py-2"
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            className="w-full border px-3 py-2"
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
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
