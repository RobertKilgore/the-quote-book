import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import axios from "axios";
import getCookie from "../utils/getCookie";
import LoadingPage from "../pages/LoadingPage";
import useAppContext from "../context/useAppContext";

function LoginPage({ loading }) {
  const { user, setUser, setError, setSuccess } = useAppContext();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await axios.post(
        "http://127.0.0.1:8000/auth/login/",
        { username, password },
        {
          withCredentials: true,
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
          },
        }
      );

      const res = await axios.get("http://127.0.0.1:8000/api/test-auth/", {
        withCredentials: true,
      });

        setUser({
          id: res.data.id,
          name: res.data.name,
          username: res.data.username,
          email: res.data.email,
          isSuperuser: res.data.is_superuser,
        });

      navigate("/home");
    } catch (err) {
      setError("Invalid username or password");
    }
  };
  if (loading) return <LoadingPage />;
  return (
      <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            className="w-full border px-3 py-2"
            type="text"
            value={username}
            placeholder="Username or Email"
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="w-full border px-3 py-2"
            type="password"
            value={password}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </form>

        <div className="mt-4 flex justify-between text-sm text-blue-500">
          <Link to="/request-account" className="hover:underline">
            Request an account
          </Link>
          <Link to="/forgot-password" className="hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>
  );
}

export default LoginPage;
