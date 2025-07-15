import React from "react";

export default function QuoteSignatures({ quote }) {
  return (
    <div className="flex flex-wrap gap-3 mt-6">
      {quote.participant_status?.map((p) => (
        <div
          key={p.user}
          className="border border-gray-300 px-3 py-2 rounded shadow-sm flex flex-col items-center text-sm bg-gray-50"
        >
          <span className="font-semibold">{p.name}</span>
          {p.refused ? (
            <span className="text-red-600 font-medium mt-1">Refusal to sign</span>
          ) : p.signature_image ? (
            <img
              src={`${p.signature_image}?${new Date().getTime()}`}
              alt="signature"
              className="h-12 mt-1 max-w-[150px] object-contain"
            />
          ) : (
            <span className="text-gray-400 italic mt-1">No signature yet</span>
          )}
        </div>
      ))}
    </div>
  );
}