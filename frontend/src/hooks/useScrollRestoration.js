import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function useScrollRestoration(key, loading) {
  const location = useLocation();

  // Restore scroll when content is ready
  useEffect(() => {
    if (loading) return;

    const y = sessionStorage.getItem(`scroll-${key}`);
    if (y !== null) {
      var scrollPos = parseInt(y, 10)
      requestAnimationFrame(() => {
        if (scrollPos < 5) {
          window.scrollTo(0, 0);
        } else {
          window.scrollTo(0, scrollPos);
        }
        
      });
    }
  }, [key, loading]);

  // Save on scroll if scrollY > 0
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        sessionStorage.setItem(`scroll-${key}`, window.scrollY);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [key, location.pathname]);
}
