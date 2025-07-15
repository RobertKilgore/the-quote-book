// components/QuoteMetaMetadata.jsx
import React from "react";
import {
  ApprovedIcon,
  RedactedIcon,
  FlaggedIcon,
} from "./icons/StatusIcons";
import useAppContext from "../context/useAppContext";


export default function QuoteMetaMetadata({ quote }) {
  const { user } = useAppContext();

const formatDateTime = (dt) => {
  const date = new Date(dt);
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const dateStr = date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  return `${time} - ${dateStr}`;
};



return (
    <div className="mt-6 border-t pt-6">
      <div className="bg-gray-50 rounded-lg p-4 shadow-inner border border-gray-300">
        {/* Top Centered Status Icons */}
        <div className="flex justify-center gap-4 mb-4">
          <ApprovedIcon 
            approved={quote.approved} 
            approvedAt={formatDateTime(quote.approved_at)}
            borderOnly 
          />
          <RedactedIcon redacted={quote.redacted} borderOnly />
          <FlaggedIcon
            flagCount={quote.flag_count}
            flaggedBy={quote.flagged_by_users}
            isAdmin={user?.isSuperuser}
            borderOnly
          />
        </div>

        {/* Metadata */}
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>Created by:</strong>{" "}
            {quote.created_by?.name || quote.created_by?.username || "Unknown"}{" "}
            @ {quote.created_at ? formatDateTime(quote.created_at) : "Unknown"}
          </p>
        </div>
      </div>
    </div>
  );
}
