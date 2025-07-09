import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function useScrollRestoration() {
  const location = useLocation();
  const lastScrollY = useRef(0);
  const key = `scroll-position:${location.pathname}`;

  // 🔁 Update scroll position on scroll (with throttling)
  useEffect(() => {
    const handleScroll = () => {
      lastScrollY.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 🧠 Save scroll position BEFORE route changes away from this page
  const previousPath = useRef(location.pathname);
  useEffect(() => {
    const prevKey = `scroll-position:${previousPath.current}`;
    sessionStorage.setItem(prevKey, lastScrollY.current.toString());
    console.log(`[ScrollRestore] Saved scroll for ${previousPath.current}:`, lastScrollY.current);

    previousPath.current = location.pathname; // Update to new path
  }, [location.pathname]);

  // 🧯 Restore scroll when entering this route
  useEffect(() => {
    const saved = sessionStorage.getItem(key);
    console.log(`[ScrollRestore] Attempting to restore for ${location.pathname}:`, saved);
    if (saved !== null) {
      setTimeout(() => {
        console.log(`[ScrollRestore] Restoring scroll to ${saved}`);
        window.scrollTo(0, parseInt(saved, 10));
      }, 500);
    }
  }, [location.pathname]);
}
