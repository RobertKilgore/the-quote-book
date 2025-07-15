import React from "react";
import RarityChip from "./RarityChip";
import VisibilityChip from "./VisibilityChip";

function formatTimeTo12Hour(timeStr) {
  if (!timeStr) return null;
  const [hourStr, minuteStr] = timeStr.split(":");
  let hour = parseInt(hourStr);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minuteStr} ${ampm}`;
}

export default function QuoteMetadata({ quote }) {
  const displayTime = formatTimeTo12Hour(quote.time);

  return (
    <div className="space-y-4">
      {/* Top row: rarity - title - visibility */}
      <div className="flex items-center justify-between w-full">
        <div className="flex-shrink-0">
          <RarityChip rarity={quote.rank} size="large" />
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
          <h2 className="text-xl font-bold text-gray-800">Quote #{quote.id}</h2>
        </div>

        <div className="flex-shrink-0">
          <VisibilityChip quote={quote} />
        </div>
      </div>

      {/* Date and Time */}
      <div className="text-center text-sm text-gray-600">
        {quote.date ? (
          new Date(quote.date) < new Date("1980-06-09") ? (
            <p><strong>Date:</strong> Ancient History</p>
          ) : (
            <p>
              <strong>Date:</strong> {new Date(quote.date).toLocaleDateString()} &nbsp;&nbsp;
              <strong>Time:</strong> {displayTime || "Unknown"}
            </p>
          )
        ) : (
          <p><strong>Date:</strong> Unknown</p>
        )}
      </div>
    </div>
  );
}
