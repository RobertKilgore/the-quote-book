// src/pages/LoginPage.js

import React, { useState } from "react";
import api from "../api/axios";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/login/", { username, password });
      window.location.href = "/";
    } catch (err) {
      alert("Login failed.");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Login</h2>
      <form onSubmit={handleLogin} className="space-y-3">
        <input
          className="border p-2 block w-full"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
        <input
          type="password"
          className="border p-2 block w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Log In
        </button>
      </form>
    </div>
  );
}

export default LoginPage; 
