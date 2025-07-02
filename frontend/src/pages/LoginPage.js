import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

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

function LoginPage({ user, setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
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
        username: res.data.user,
        isSuperuser: res.data.is_superuser,
        id: res.data.id
      });

      navigate("/");
    } catch (err) {
      console.error("Login failed:", err);
      setErrorMsg("❌ Invalid username or password");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
      {errorMsg && <p className="text-red-600 text-center mb-4">{errorMsg}</p>}
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          className="w-full border px-3 py-2"
          type="text"
          value={username}
          placeholder="Username"
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
      {/* <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <Link to="/request-account" className="text-blue-500 hover:underline">
            Request one
          </Link>
        </p>
        <Link to="/forgot-password" className="text-sm text-blue-500 hover:underline">
          Forgot password?
        </Link>
      </div> */}
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
