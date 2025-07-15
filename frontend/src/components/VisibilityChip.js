import { FiGlobe, FiLock } from "react-icons/fi";

export default function VisibilityChip({ quote, size = "responsive" }) {
  const sizeClasses =
    size === "large"
      ? "p-2 text-xl"
      : size === "small"
      ? "p-1 text-sm"
      : // ✅ Responsive: small default, large on larger screens
        "p-1 text-sm sm:p-2 sm:text-xl";

  return (
    <div className={`bg-white shadow-md ring-1 ring-gray-200 rounded-full ${sizeClasses}`}>
      {quote.visible ? (
        <FiGlobe className="text-blue-500" />
      ) : (
        <FiLock className="text-yellow-500" />
      )}
    </div>
  );
}
