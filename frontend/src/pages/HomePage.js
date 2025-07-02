import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { FiGlobe, FiLock } from "react-icons/fi";

export default function HomePage({ user }) {
  const [quotes, setQuotes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/quotes/", { withCredentials: true })
      .then((res) => {
        const isAdmin = user?.isSuperuser;
        const visibleQuotes = isAdmin
          ? res.data
          : res.data.filter((q) => q.visible);
        setQuotes(visibleQuotes);
      })
      .catch(() => setQuotes([]));
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Quotes</h2>
      {quotes.length === 0 ? (
        <p>No quotes available.</p>
      ) : (
        quotes.map((q) => (
          <div
            key={q.id}
            onClick={() => navigate(`/quote/${q.id}`)}
            className="relative bg-white p-4 pr-12 shadow rounded cursor-pointer hover:bg-gray-50 transition"
          >
            {/* Admin-only visibility icon */}
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

            {/* Quote lines */}
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

            {/* Date */}
            <p className="text-sm mt-2 text-gray-500">
              {q.date ? new Date(q.date).toLocaleDateString() : "Unknown"}
            </p>

            {/* Signature display from participant_status */}
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
                    ) : p.signature_image ? (console.log(p),
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
