import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function CreateQuotePage() {
  const navigate = useNavigate();
  const [quoteText, setQuoteText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await api.post(
        "/api/quotes/",
        {
          author_name: authorName,
          quote_text: quoteText,
          is_public: isPublic,
        },
        {
          withCredentials: true,
        }
      );
      setSuccess(true);
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError("Failed to create quote. Make sure you're logged in and have permission.");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Create a New Quote</h2>

      {error && <div className="text-red-600 mb-4">{error}</div>}
      {success && <div className="text-green-600 mb-4">Quote created! Redirecting...</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Author Name</label>
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full border rounded px-3 py-2 mt-1"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Quote</label>
          <textarea
            value={quoteText}
            onChange={(e) => setQuoteText(e.target.value)}
            className="w-full border rounded px-3 py-2 mt-1"
            rows="4"
            required
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            id="public-checkbox"
            className="h-4 w-4"
          />
          <label htmlFor="public-checkbox" className="text-sm">Make quote public</label>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          Submit Quote
        </button>
      </form>
    </div>
  );
}

export default CreateQuotePage;
