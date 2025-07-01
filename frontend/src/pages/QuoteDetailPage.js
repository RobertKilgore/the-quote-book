import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { FiGlobe, FiLock } from "react-icons/fi";

function QuoteDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/api/quotes/${id}/`, { withCredentials: true })
      .then(res => setQuote(res.data))
      .catch(() => setError("This quote is either private or could not be found."));
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this quote?")) {
      try {
        await api.delete(`/api/quotes/${id}/`, { withCredentials: true });
        navigate("/");
      } catch {
        alert("Failed to delete quote.");
      }
    }
  };

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

  if (!quote) return <p>Loading...</p>;

  const displayDate = quote.date ? new Date(quote.date).toLocaleDateString() : "Unknown";
  const displayTime = quote.time || "Unknown";

  return (
    <div className="relative max-w-4xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg space-y-6">
      {/* Visibility icon */}
      <div className="absolute top-12 right-4">
        <div className="bg-white shadow-md ring-1 ring-gray-200 rounded-full p-2">
          {quote.visible ? (
            <FiGlobe className="text-blue-500 text-xl" />
          ) : (
            <FiLock className="text-yellow-500 text-xl" />
          )}
        </div>
      </div>

      <h2 className="text-2xl font-bold text-center mb-2">Quote Details</h2>

      <div className="text-center text-sm text-gray-600">
        <p><strong>Date:</strong> {displayDate} &nbsp;&nbsp; <strong>Time:</strong> {displayTime}</p>
      </div>

      <div className="space-y-2 mt-6">
        {quote.lines.map((line, idx) => (
          <div key={idx} className="pl-4 border-l-4 border-blue-400">
            {quote.redacted ? (
              <p className="text-red-600 font-bold">{line.speaker_name}: [REDACTED]</p>
            ) : (
              <p>
                <span className="font-semibold">{line.speaker_name}</span>: {line.text}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Signatures Section */}
      <div className="flex flex-wrap gap-3 mt-6">
        {quote.participants_signatures?.map((sig, idx) => (
          <div
            key={idx}
            className="border border-gray-300 px-3 py-2 rounded shadow-sm flex flex-col items-center text-sm bg-gray-50"
          >
            <span className="font-semibold">{sig.name}</span>
            {sig.refused ? (
              <span className="text-red-600 font-medium mt-1">Refusal to sign</span>
            ) : sig.image ? (
              <img src={sig.image} alt="signature" className="h-12 mt-1" />
            ) : (
              <span className="text-gray-400 italic mt-1">No signature yet</span>
            )}
          </div>
        ))}
      </div>

      {/* Metadata */}
      <div className="pt-6 border-t mt-6 text-sm text-gray-700 space-y-1">
        {/* <p><strong>Redacted:</strong> {quote.redacted ? "Yes" : "No"}</p> */}
        <p><strong>Approved:</strong> {quote.approved ? "Yes" : "No"}</p>
        <p><strong>Created by:</strong> {quote.created_by?.username}</p>
        <p><strong>Created at:</strong> {new Date(quote.created_at).toLocaleString()}</p>
      </div>

      {/* Admin Buttons */}
      {user?.isSuperuser && (
        <div className="flex gap-3 pt-6">
          <button
            onClick={() => navigate(`/edit-quote/${quote.id}`)}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800 transition"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default QuoteDetailPage;
