import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

const EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes

export default function useScrollRestoration({ key, loading, matchPath = null }) {
  const { pathname } = useLocation();

  const pathMatches = () => {
    if (typeof matchPath === "function") return matchPath(pathname);
    if (typeof matchPath === "string") return pathname === matchPath;
    return pathname.startsWith(`/${key}`);
  };

  const storageKey = `scroll-${key}`;

  // Restore scroll position
  useLayoutEffect(() => {
    if (loading || !pathMatches()) return;

    const saved = sessionStorage.getItem(storageKey);
    if (!saved) return;

    try {
      const { y, savedAt } = JSON.parse(saved);
      if (Date.now() - savedAt > EXPIRATION_MS) {
        sessionStorage.removeItem(storageKey);
        return;
      }
      requestAnimationFrame(() => {
        window.scrollTo(0, y < 5 ? 0 : y);
      });
    } catch {
      sessionStorage.removeItem(storageKey);
    }
  }, [loading, pathname]);

  // Save scroll position
  useLayoutEffect(() => {
    if (loading || !pathMatches()) return;

    const handleScroll = () => {
      if (window.scrollY > 0) {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({ y: window.scrollY, savedAt: Date.now() })
        );
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname, loading]);
}
