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
            <div className="h-12 mt-1 min-w-[248px] flex items-center justify-center">
              <span className="text-red-600 font-medium text-center">Refusal to sign</span>
            </div>
          ) : p.signature_image ? (
            <img
              src={`${p.signature_image}?${new Date().getTime()}`}
              alt="signature"
              className="h-12 mt-1 min-w-[248px] object-contain"
            />
          ) : (
            <div className="h-12 mt-1 min-w-[248px] flex items-center justify-center">
              <span className="text-gray-400 italic text-center">No signature yet</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
