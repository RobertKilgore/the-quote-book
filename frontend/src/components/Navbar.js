import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';


function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}



function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState("");

  const handleLogout = async () => {
    try {
      // throw new Error("Force logout fail"); // Test failure
      await axios.post('http://127.0.0.1:8000/auth/logout/', {}, {
        withCredentials: true,
        headers: {
          'X-CSRFToken': getCookie('csrftoken'), // use your own getCookie function
        },
      });
      setUser(null);
      setLogoutError(""); // Clear error on success
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      setLogoutError("❌ Logout failed. Please try again.");
    }
  };

  return (
    <div>
      <nav className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
        <div className="space-x-4">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/create-quote" className="hover:underline">Create Quote</Link>
          <Link to="/request-account" className="hover:underline">Request Account</Link>
        </div>
        <div className="space-x-4">
          {user ? (
            <>
              <span>Logged in as <strong>{user}</strong></span>
              <button
                onClick={handleLogout}
                className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="hover:underline">Login</Link>
          )}
        </div>
      </nav>

      {/* ✅ Make sure this is inside your main return */}
      {logoutError && (
        <div className="bg-red-100 text-red-700 px-4 py-2 text-sm text-center">
          {logoutError}
        </div>
      )}
    </div>
  );
}

export default Navbar;
