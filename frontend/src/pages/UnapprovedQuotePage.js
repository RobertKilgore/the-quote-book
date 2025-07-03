import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { FiGlobe, FiLock } from "react-icons/fi";

export default function UnapprovedQuotesPage({ user }) {
  const [quotes, setQuotes] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/quotes/unapproved/", { withCredentials: true })
      .then(res => {
        setQuotes(res.data);
        setError(null);
      })
      .catch(err => {
        console.error("Failed to fetch unapproved quotes:", err);
        setError("Failed to load unapproved quotes. Please try again later.");
      });
  }, []);

  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <h2 className="text-3xl font-semibold text-blue-600 mb-4">Oops!</h2>
          <p className="text-xl text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Unapproved Quotes</h2>

      {quotes.length === 0 ? (
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-blue-600 mb-4">Nothing to review!</h2>
            <p className="text-xl text-gray-700">
              No unapproved quotes — looks like everyone’s on the same page!
            </p>
          </div>
        </div>
      ) : (
        quotes.map((q) => (
          <div
            key={q.id}
            onClick={() => navigate(`/quote/${q.id}`)}
            className="relative bg-white p-4 pr-12 shadow rounded cursor-pointer hover:bg-gray-50 transition"
          >
            {user?.isSuperuser && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="bg-white shadow-md ring-1 ring-gray-200 rounded-full p-2">
                  {q.visible ? (
                    <FiGlobe className="text-blue-500 text-lg" />
                  ) : (
                    <FiLock className="text-yellow-500 text-lg" />
                  )}
                </div>
              </div>
            )}

            {q.lines.map((line, idx) => (
              <div key={idx} className="mb-1">
                <span className="font-semibold">{line.speaker_name}:</span>{" "}
                {q.redacted ? (
                  <span className="text-red-600 font-bold">[REDACTED]</span>
                ) : (
                  <span>{line.text}</span>
                )}
              </div>
            ))}

            <p className="text-sm mt-2 text-gray-500">
              {q.date ? new Date(q.date).toLocaleDateString() : "Unknown"}
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {q.participant_status?.length > 0 ? (
                q.participant_status.map((p, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-100 border border-gray-300 px-3 py-1 rounded-lg text-sm text-gray-800 flex items-center gap-2"
                  >
                    <span className="font-semibold">{p.name}</span>
                    {p.refused ? (
                      <span className="text-red-600 font-semibold">Refusal to sign</span>
                    ) : p.signature_image ? (
                      <img
                        src={p.signature_image}
                        alt="signature"
                        className="h-6 max-w-[120px] object-contain"
                      />
                    ) : (
                      <span className="italic text-gray-400">No signature yet</span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-400 italic">No signatures needed</div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
