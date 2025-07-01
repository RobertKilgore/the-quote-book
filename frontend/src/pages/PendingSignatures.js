import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { FiGlobe, FiLock } from "react-icons/fi";

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export default function PendingSignaturesPage({ user, setPendingSignatureCount }) {
  const [quotes, setQuotes] = useState([]);
  const [refusedIds, setRefusedIds] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/signatures/pending/", {
      withCredentials: true,
      headers: { "X-CSRFToken": getCookie("csrftoken") }
    })
      .then((res) => {
        setQuotes(res.data);
      })
      .catch(() => setQuotes([]));
  }, []);

  const handleRefuse = async (quoteId) => {
    try {
      await api.post("/api/signatures/refuse/", { quote_id: quoteId }, {
        withCredentials: true,
        headers: { "X-CSRFToken": getCookie("csrftoken") }
      });

      setRefusedIds(prev => [...prev, quoteId]);

      setTimeout(() => {
        setQuotes(prev => prev.filter(q => q.id !== quoteId));
      }, 1000);

      const res = await api.get("/api/signatures/pending/count/", { withCredentials: true });
      setPendingSignatureCount(res.data.count || 0);
    } catch (err) {
      alert("Error refusing to sign.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Pending Signatures</h2>
      {quotes.length === 0 ? (
        <p>No quotes waiting for your signature ✅</p>
      ) : (
        quotes.map((q) => (
          <div
            key={q.id}
            className={`relative bg-white p-4 shadow rounded transition duration-500 transform ${
              refusedIds.includes(q.id)
                ? "bg-green-100 border border-green-400 opacity-0 scale-95"
                : "hover:bg-gray-50"
            }`}
          >
            {/* Visibility icon */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="bg-white shadow-md rounded-full p-2">
                {q.visible ? (
                  <FiGlobe className="text-blue-500 text-lg" />
                ) : (
                  <FiLock className="text-yellow-500 text-lg" />
                )}
              </div>
            </div>


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
              {q.participants_signatures && q.participants_signatures.length > 0 ? (
                q.participants_signatures.map((sig, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-100 border border-gray-300 px-3 py-1 rounded-lg text-sm text-gray-800 flex items-center gap-2"
                  >
                    <span className="font-semibold">{sig.name}</span>
                    {sig.refused ? (
                      <span className="text-red-600 font-semibold">Refusal to sign</span>
                    ) : sig.signature_image ? (
                      <img
                        src={sig.signature_image}
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

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="px-4 py-1.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-full transition-colors duration-200"
                onClick={() => navigate(`/signatures/quote/${q.id}`)}
              >
                Sign
              </button>

              <button
                className="px-4 py-1.5 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-full transition-colors duration-200"
                onClick={() => handleRefuse(q.id)}
              >
                Refuse to Sign
              </button>

              {user?.isSuperuser && (
                <button
                  className="px-4 py-1.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-full transition-colors duration-200"
                  onClick={() => navigate(`/signatures/quote/${q.id}?admin=true`)}
                >
                  Sign for Other
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
