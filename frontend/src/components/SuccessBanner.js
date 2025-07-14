import { useEffect } from "react";
import { useSuccess } from "../context/SuccessContext";

export default function SuccessBanner() {
  const { success, setSuccess } = useSuccess();

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, setSuccess]);

  if (!success) return null;

  return (
    <div className="fixed top-[64px] left-0 w-full bg-green-100 text-green-700 px-4 py-2 text-sm text-center shadow z-40">
      {success}
    </div>
  );
}