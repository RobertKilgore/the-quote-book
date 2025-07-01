// src/pages/QuoteDetailPage.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

function QuoteDetailPage() {
  const { id } = useParams();
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/api/quotes/${id}/`, { withCredentials: true })
      .then(res => setQuote(res.data))
      .catch(() => setError("Failed to load quote."));
  }, [id]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!quote) return <p>Loading...</p>;

  const displayDate = quote.date ? new Date(quote.date).toLocaleDateString() : "Unknown";
  const displayTime = quote.time ? quote.time : "Unknown";

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg space-y-6">
      <h2 className="text-2xl font-bold text-center mb-2">Quote Details</h2>

      <div className="text-center text-sm text-gray-600">
        <p><strong>Date:</strong> {displayDate} &nbsp;&nbsp; <strong>Time:</strong> {displayTime}</p>
      </div>

      <div className="space-y-4 mt-6">
        {quote.lines.map((line, idx) => (
          <div key={idx} className="border-l-4 pl-4 border-blue-400">
            <p className="font-semibold">{line.speaker_name}</p>
            {quote.redacted ? (
              <p className="text-red-600 font-bold">REDACTED</p>
            ) : (
              <p>"{line.text}"</p>
            )}
          </div>
        ))}
      </div>

      {quote.signatures.length > 0 && (
        <div className="pt-4">
          <h3 className="font-semibold">Signatures:</h3>
          <ul className="list-disc list-inside">
            {quote.signatures.map((sig, idx) => (
              <li key={idx}>
                {sig.name}
                {sig.signature_image && (
                  <div className="mt-1">
                    <img
                      src={sig.signature_image}
                      alt={`Signature of ${sig.name}`}
                      className="h-16"
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-6 border-t mt-6 text-sm text-gray-700 space-y-1">
        <p><strong>Redacted:</strong> {quote.redacted ? "Yes" : "No"}</p>
        <p><strong>Public:</strong> {quote.visible ? "Yes" : "No"}</p>
        <p><strong>Approved:</strong> {quote.approved ? "Yes" : "No"}</p>
        <p><strong>Created by:</strong> {quote.created_by?.username}</p>
        <p><strong>Created at:</strong> {new Date(quote.created_at).toLocaleString()}</p>
      </div>
    </div>
  );
}

export default QuoteDetailPage;
