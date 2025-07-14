import { useEffect, useState } from "react";

export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );

  useEffect(() => {
    // fall-back: watch width
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return isMobile;
}
