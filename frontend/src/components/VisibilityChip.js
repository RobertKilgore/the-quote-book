import { FiGlobe, FiLock } from "react-icons/fi";

export default function VisibilityChip({ quote }) {
  return (
      <div className="bg-white shadow-md ring-1 ring-gray-200 rounded-full p-2">
        {quote.visible ? (
          <FiGlobe className="text-blue-500 text-xl" />
        ) : (
          <FiLock className="text-yellow-500 text-xl" />
        )}
      </div>
  );
}