import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaPenFancy } from "react-icons/fa";
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

function Navbar({ user, setUser, pendingSignatureCount }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginLikePage = location.pathname === "/login" || location.pathname === "/request-account"

  const [logoutError, setLogoutError] = useState("");

  const handleLogout = async () => {
    try {
      await axios.post('http://127.0.0.1:8000/auth/logout/', {}, {
        withCredentials: true,
        headers: {
          'X-CSRFToken': getCookie('csrftoken'),
        },
      });
      setUser(null);
      setLogoutError("");
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      setLogoutError("❌ Logout failed. Please try again.");
    }
  };


  const isAdmin = user?.isSuperuser;

  return (
    <div>
      <nav className="fixed top-0 left-0 w-full z-50 bg-gray-800 text-white px-4 py-3 shadow flex items-center justify-between">
        {isLoginLikePage ? (
          <div className="mx-auto text-lg font-semibold">The Quote Book</div>
        ) : (
          <>
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-lg font-semibold hover:underline">The Quote Book</Link>
              {/* {isAdmin && (
                <Link to="/create-quote" className="hover:underline">Create Quote</Link>
              )} */}
            </div>
            <div className="space-x-4">
              <Link to="/signatures/pending" className="relative inline-block mr-3 top-1.5">
                <FaPenFancy size={20} title="Signatures Needed" />
                {pendingSignatureCount > 0 && (
                  <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold px-1 py-0 rounded-full">
                    {pendingSignatureCount}
                  </span>
                )}
              </Link>
              {user ? (
                <>

                  <span className="hidden md:inline-block truncate whitespace-nowrap max-w-[400px] align-middle relative -top-[1.5px]">
                    Logged in as <strong>{user.username}</strong>{isAdmin && <span title="Admin"> 🛡️</span>}
                  </span>

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
          </>
        )}
      </nav>

      {logoutError && (
        <div className="bg-red-100 text-red-700 px-4 py-2 text-sm text-center">
          {logoutError}
        </div>
      )}
    </div>
  );
}

export default Navbar;
