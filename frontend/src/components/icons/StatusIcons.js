// components/StatusIcons.jsx
import React from "react";
import { FaCheck, FaTimes, FaFlag, FaEyeSlash } from "react-icons/fa";

const IconBox = ({ children, color, title, borderOnly }) => {
  const borderClass = `border-${color}`;
  const textClass = `text-${color}`;

  // Tailwind-safe mappings
  const safeColors = {
    "green-600": "text-green-600 border-green-600",
    "red-600": "text-red-600 border-red-600",
    "gray-700": "text-gray-700 border-gray-700",
    "yellow-500": "text-yellow-500 border-yellow-500",
  };

  const fallback = "text-gray-500 border-gray-500";
  const colorClass = safeColors[color] || fallback;

  return (
    <div
      title={title}
      className={`w-10 h-10 rounded-md flex items-center justify-center border-2 ${
        borderOnly ? "bg-transparent" : "bg-white shadow"
      } ${colorClass}`}
    >
      {/* Apply text color directly here */}
      {React.cloneElement(children, {
        className: `text-inherit text-xl`,
      })}
    </div>
  );
};

export const ApprovedIcon = ({ approved, approvedAt, borderOnly }) => (
  <IconBox
    title={
      approved
        ? `Approved @ ${approvedAt}`
        : "Not approved"
    }
     color={approved ? "green-600" : "red-600"}
     borderOnly={borderOnly}
   >
    {approved ? <FaCheck /> : <FaTimes />}
  </IconBox>
);

export const RedactedIcon = ({ redacted, borderOnly }) =>
  redacted ? (
    <IconBox title="Redacted" color="gray-700" borderOnly={borderOnly}>
      <FaEyeSlash />
    </IconBox>
  ) : null;

export const FlaggedIcon = ({ flagCount, flaggedBy = [], isAdmin = false, borderOnly }) => {
  if (flagCount === 0) return null;

  const title = isAdmin
    ? `Flagged by:\n  ${flaggedBy.map(user => user.name || user.username || "Unknown").join("\n")}`
    : `Flagged by ${flagCount}`;

  return (
    <IconBox title={title} color="yellow-500" borderOnly={borderOnly}>
      <div className="relative">
        <FaFlag />
        <span className="absolute -right-2 -top-2 text-xs font-bold">
          {flagCount}
        </span>
      </div>
    </IconBox>
  );
};
