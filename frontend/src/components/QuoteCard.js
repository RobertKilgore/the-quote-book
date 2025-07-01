import React from "react";
import { Link } from "react-router-dom";

function QuoteCard({ quote, animate = false }) {
  return (
    <div
      className={`border p-4 rounded shadow mb-4 transition duration-500 transform ${
        animate ? "bg-green-100 border-green-400 opacity-0 scale-95" : "hover:bg-gray-50"
      }`}
    >
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
              <span className="text-sm">
                {sig.refused ? (
                  <span className="text-red-600 font-bold">Refusal to sign</span>
                ) : (
                  sig.user || sig.name
                )}
              </span>
              {!sig.refused && sig.signature_image && (
                <img src={sig.signature_image} alt="signature" className="h-6" />
              )}
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
