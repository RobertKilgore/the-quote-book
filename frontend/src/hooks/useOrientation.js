import { useEffect, useState } from "react";

export default function useOrientation() {
  const getLandscape = () =>
    window.matchMedia("(orientation: landscape)").matches;

  const [isLandscape, setIsLandscape] = useState(getLandscape());

  useEffect(() => {
    const media = window.matchMedia("(orientation: landscape)");
    const listener = () => setIsLandscape(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  return isLandscape;
}
