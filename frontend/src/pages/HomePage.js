// src/pages/HomePage.js
import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";


export default function HomePage({ user }) {
  const [quotes, setQuotes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/api/quotes/", { withCredentials: true })
      .then((res) => setQuotes(res.data))
      .catch(() => setQuotes([]));
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Public Quotes</h2>
      {quotes.length === 0 ? (
        <p>No quotes available.</p>
      ) : (
        quotes.map((q) => (
          <div
            key={q.id}
            onClick={() => navigate(`/quote/${q.id}`)}
            className="bg-white p-4 shadow rounded cursor-pointer hover:bg-gray-50 transition"
          >
            {q.redacted ? (
              <div className="text-red-600 font-bold">REDACTED</div>
            ) : (
              q.lines.map((line, idx) => (
                <div key={idx} className="mb-1">
                  <span className="font-semibold">{line.speaker_name}:</span>{" "}
                  <span>{line.text}</span>
                </div>
              ))
            )}

            <p className="text-sm mt-2 text-gray-500">
              {q.date ? new Date(q.date).toLocaleDateString() : "Unknown Date"}
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {q.signatures && q.signatures.length > 0 ? (
                q.signatures.map((sig, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-100 border border-gray-300 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    ✒️ {sig.name}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-400 italic">No signatures yet</div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
