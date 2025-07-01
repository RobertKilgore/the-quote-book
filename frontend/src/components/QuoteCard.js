import React from "react";
import { Link } from "react-router-dom";

function QuoteCard({ quote }) {
  return (
    <div className="border p-4 rounded shadow mb-4">
      <h3 className="font-bold">Quote #{quote.id}</h3>

      <p className="text-sm text-gray-600">
        Date: {quote.date ? new Date(quote.date).toLocaleDateString() : "Unknown"}
      </p>

      {quote.redacted ? (
        <p className="text-red-600 font-bold mt-2">REDACTED</p>
      ) : (
        quote.lines.map((line, i) => (
          <p key={i}>
            <strong>{line.speaker_name}:</strong> {line.text}
          </p>
        ))
      )}

      {quote.signatures?.length > 0 && (
        <div className="mt-2">
          <p className="text-sm font-medium">Signatures:</p>
          {quote.signatures.map((sig, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm">{sig.name}</span>
              <img src={sig.image} alt="signature" className="h-6" />
            </div>
          ))}
        </div>
      )}

      <Link to={`/quote/${quote.id}`} className="text-blue-500 hover:underline text-sm mt-2 block">
        View Full
      </Link>
    </div>
  );
}

export default QuoteCard;
