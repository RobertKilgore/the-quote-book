import React, { useState, useLayoutEffect, useRef, useEffect  } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import axios from "axios";
import getCookie from "../utils/getCookie";
import NavButtons from "./NavButtons";
import { useNavbar } from "../context/NavbarContext";
import useAppContext from "../context/useAppContext";

export default function Navbar({ loading }) {
  const { user, setUser, setError, setSuccess } = useAppContext();

  const navigate = useNavigate();
  const location = useLocation();
  const isLoginLikePage =
    location.pathname === "/login" || location.pathname === "/request-account";

  const { collapsed, setCollapsed } = useNavbar();
  const [menuOpen, setMenuOpen] = useState(false);

  const buttonWrapRef = useRef(null);
  const userMenuRef = useRef(null);
  const dropdownRef   = useRef(null);   // the actual menu
  const bottomBarHeight = 80;

  const handleLogout = async () => {
    try {
      await axios.post("http://127.0.0.1:8000/auth/logout/", {}, {
        withCredentials: true,
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });
      setUser(null);
      setMenuOpen(false)
      navigate("/login");
    } catch {
      setError("Logout failed. Please try again.");
    }
  };

  useLayoutEffect(() => {
    const checkFit = () => {
      const btn = buttonWrapRef.current;
      const menu = userMenuRef.current;
      if (!btn || !menu) return;

      const avail = btn.parentElement.clientWidth;
      const btnW = btn.scrollWidth;
      const menuW = menu.scrollWidth;

      const fitsButtonsOnly = btnW + menuW + 15 <= avail;

      setCollapsed((prev) => (prev !== !fitsButtonsOnly ? !fitsButtonsOnly : prev));
    };

    const ro = new ResizeObserver(() => requestAnimationFrame(checkFit));
      if (buttonWrapRef.current) ro.observe(buttonWrapRef.current);
      if (userMenuRef.current) ro.observe(userMenuRef.current);
      checkFit();
      return () => ro.disconnect();
    }, [location.pathname]);


    useEffect(() => {
      if (!menuOpen) return;
      const handleClick = (e) => {
        if (
          dropdownRef.current  && !dropdownRef.current.contains(e.target) &&
          userMenuRef.current && !userMenuRef.current.contains(e.target)
        ) {
          setMenuOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("touchstart", handleClick);
      return () => {
        document.removeEventListener("mousedown", handleClick);
        document.removeEventListener("touchstart", handleClick);
      };
    }, [menuOpen]);
    useLayoutEffect(() => {
      document.body.style.paddingBottom = collapsed ? `${bottomBarHeight}px` : "";
    }, [collapsed]);

  if (loading) return null;

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 bg-gray-800 text-white shadow h-16 flex items-center">
        {isLoginLikePage ? (
          <div className="w-full text-center">
            <Link to="/home" className="text-lg font-semibold hover:underline">
              The Quote Book
            </Link>
          </div>
        ) : (
          <div className="flex justify-between items-center w-full px-4">
            <div className="flex-shrink-0">
              <Link to="/home" className="text-lg font-semibold hover:underline">
                The Quote Book
              </Link>
            </div>

            <div className="flex items-center space-x-4 min-w-0 relative">
              <div
                ref={buttonWrapRef}
                className={`overflow-hidden ${collapsed ? "pointer-events-none opacity-0" : ""}`}
                style={{ maxWidth: "100%" }}
              >

                <NavButtons
                  layout="row"
                />
              </div>

              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex-none relative inline-flex items-center justify-center w-11 h-11 rounded bg-gray-800 shadow-lg hover:bg-gray-600 transition"
                  title="User Menu"
                >
                  <FaUserCircle size={20} />
                </button>

                {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 z-50 animate-fadeAndPop  origin-top-right">
                      {/* triangle tip (slightly adjusted leftwards) */}
                      <div className="absolute right-3.5 -top-2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-white"></div>

                      {/* dropdown menu */}
                      <div
                        ref={dropdownRef}
                        className="w-52 bg-white text-black shadow-xl rounded-xl p-3 space-y-3 origin-top-right"
                      >
                      <div className="text-sm border-b border-gray-300 pb-2 break-words">
                        Logged in as <strong>{user?.name}</strong>
                      </div>

                      <Link
                        to="/settings"
                        className="block px-3 py-1 text-center  bg-gray-100 hover:bg-gray-200 rounded"
                        onClick={() => setMenuOpen(false)}
                      >
                        Account Settings
                      </Link>

                      {/* centered, smaller logout button */}
                      <div className="flex justify-center">
                        <button
                          onClick={handleLogout}
                          className="px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-2xl w-28 text-center shadow-md"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {collapsed && !isLoginLikePage  &&(
        <div className="fixed bottom-0 left-0 w-full h-20 bg-gray-800 text-white shadow-inner z-40 flex items-center">
          <div className="w-full px-4">
            <NavButtons
              layout="bar"
            />
          </div>
        </div>
      )}
    </>
  );
}
