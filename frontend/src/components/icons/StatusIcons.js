// components/StatusIcons.jsx
import React from "react";
import { FaCheck, FaTimes, FaFlag, FaEyeSlash } from "react-icons/fa";

function IconBox({ children, color, title, borderOnly }) {
  const borderClass = `border-${color}`;
  return (
    <div
      title={title}
      className={`w-10 h-10 rounded-md flex items-center justify-center border-2 ${borderClass} ${
        borderOnly ? "bg-transparent" : "bg-white shadow"
      }`}
    >
      {React.cloneElement(children, {
        className: `text-${color} text-xl`,
      })}
    </div>
  );
}

export const ApprovedIcon = ({ approved, borderOnly }) => (
  <IconBox
    title={approved ? "Approved" : "Not Approved"}
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

export const FlaggedIcon = ({ flagCount, borderOnly }) =>
  flagCount > 0 ? (
    <IconBox title={`Flagged by ${flagCount}`} color="yellow-500" borderOnly={borderOnly}>
      <div className="relative">
        <FaFlag />
        <span className="absolute -right-2 -top-2 text-xs font-bold">
          {flagCount}
        </span>
      </div>
    </IconBox>
  ) : null;
