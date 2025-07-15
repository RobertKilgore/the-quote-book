// components/QuoteLines.jsx
import React from "react";

export default function QuoteLines({ quote }) {
  return (
    <div className="space-y-2 mt-6">
      {quote.lines.map((line, idx) => (
        <div key={idx} className="pl-4 border-l-4 border-blue-400">
          {quote.redacted ? (
            <p>
              <span className="font-semibold">{line.speaker_name}</span>:{" "}
              <span className="text-red-600 font-bold">[REDACTED]</span>
            </p>
          ) : (
            <p>
              <span className="font-semibold">{line.speaker_name}</span>: {line.text}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
