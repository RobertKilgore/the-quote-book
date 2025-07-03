import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaPenFancy } from "react-icons/fa";
import { MdOutlineGavel } from "react-icons/md";
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

function Navbar({ user, setUser, pendingSignatureCount, unapprovedCount }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginLikePage = location.pathname === "/login" || location.pathname === "/request-account";
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
      setLogoutError("Logout failed. Please try again.");
    }
  };

  const isAdmin = user?.isSuperuser;

  return (
    <div className={isLoginLikePage ? "" : "max-w-4xl mx-auto"}>
      <nav className="fixed top-0 left-0 w-full z-50 bg-gray-800 text-white px-4 py-1.5 shadow flex items-center justify-between">
        {isLoginLikePage ? (
          <div className="flex justify-between items-center w-full">
            <div className="invisible flex items-center space-x-4">
              <div className="w-11 h-11" />
              <div className="w-11 h-11" />
              <span className="hidden md:inline-block truncate whitespace-nowrap max-w-[400px]">
                Placeholder
              </span>
              <button className="px-3 py-1">Logout</button>
            </div>

            <div className="text-lg font-semibold text-center w-full absolute left-1/2 -translate-x-1/2">
              <Link to="/" className="hover:underline">The Quote Book</Link>
            </div>

            <div className="invisible flex items-center space-x-4">
              <div className="w-11 h-11" />
              <div className="w-11 h-11" />
              <span className="hidden md:inline-block truncate whitespace-nowrap max-w-[400px]">
                Placeholder
              </span>
              <button className="px-3 py-1">Logout</button>
            </div>
          </div>
        ) : (

          <>
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-lg font-semibold hover:underline">The Quote Book</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/signatures/pending"
                className="relative inline-flex items-center justify-center w-11 h-11 rounded bg-gray-800 shadow-xl hover:shadow-lg hover:bg-gray-600 transition"
              >
                <FaPenFancy size={20} title="Signatures Needed" />
                {pendingSignatureCount > 0 && (
                  <span className="absolute -top-0 -right-0 bg-red-500 text-white text-xs font-bold px-1 py-0 rounded-full">
                    {pendingSignatureCount}
                  </span>
                )}
              </Link>

              {isAdmin && (
                <Link
                  to="/unapproved-quotes"
                  className="relative inline-flex items-center justify-center w-11 h-11 rounded bg-gray-800 shadow-lg hover:shadow-lg hover:bg-gray-600 transition"
                >
                  <MdOutlineGavel size={20} title="Unapproved Quotes" />
                  {unapprovedCount > 0 && (
                    <span className="absolute -top-0 right-1 bg-yellow-500 text-white text-xs font-bold px-1 py-0 rounded-full">
                      {unapprovedCount}
                    </span>
                  )}
                </Link>
              )}

              {user ? (
                <>
                  <span className="hidden md:inline-block truncate whitespace-nowrap max-w-[400px]">
                    Logged in as <strong>{user.username}</strong>{isAdmin && <span title="Admin"> 🛡️</span>}
                  </span>

                  <button
                    onClick={handleLogout}
                    className="bg-red-500 px-3 py-1 rounded border border-red-700 shadow hover:bg-red-600"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogout}
                  className="bg-blue-500 px-3 py-1 rounded border border-blue-700 shadow hover:bg-blue-600"
                >
                  Logout
                </button>
              )}
            </div>
          </>
        )}
      </nav>

      {logoutError && (
        <div className="bg-red-100 text-red-700 px-4 py-2 text-sm text-center mt-[48px]">
          {logoutError}
        </div>
      )}
    </div>
  );
}

export default Navbar;
