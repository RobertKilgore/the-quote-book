// components/QuoteNotes.jsx
import React from "react";

export default function QuoteNotes({ quote, setShowImageModal }) {
  if (!quote.quote_notes && !quote.quote_source && !quote.quote_source_image) return null;

  return (
    <div className="mt-6 space-y-4 text-sm text-gray-800">
      {quote.quote_notes && (
        <div className="bg-gray-50 p-4 rounded border">
          <p className="font-medium text-gray-600 mb-1">Notes</p>
          <p className="whitespace-pre-wrap">{quote.quote_notes}</p>
        </div>
      )}

      {(quote.quote_source || quote.quote_source_image) && (
        <div className="bg-gray-50 p-4 rounded border">
          <p className="font-medium text-gray-600 mb-1">Source</p>
          <div className="space-y-2">
            {quote.quote_source && (
              <p>
                <a
                  href={quote.quote_source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800 break-words"
                >
                  {quote.quote_source}
                </a>
              </p>
            )}
            {quote.quote_source_image && (
              <img
                src={quote.quote_source_image}
                alt="Quote Source"
                className="max-h-64 rounded border object-contain mx-auto shadow cursor-pointer hover:opacity-80 transition"
                onClick={setShowImageModal}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
