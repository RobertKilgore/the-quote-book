// src/pages/UnapprovedQuotesPage.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function UnapprovedQuotesPage({user}) {
  const [quotes, setQuotes] = useState([]);
  const navigate = useNavigate();

    useEffect(() => {
    api.get("/api/quotes/unapproved/", { withCredentials: true })
        .then(res => setQuotes(res.data))
        .catch(err => console.error("Failed to fetch unapproved quotes:", err));
    }, []);

  return (
    <div className="max-w-4xl mx-auto mt-20 p-6 bg-white rounded-2xl shadow">
      <h2 className="text-2xl font-bold mb-4">Unapproved Quotes</h2>
      {quotes.length === 0 ? (
        <p>No unapproved quotes found.</p>
      ) : (
        <ul className="space-y-4">
          {quotes.map((quote) => (
            <li key={quote.id} className="border p-4 rounded-md shadow-sm hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/quote/${quote.id}`)}>
              <div className="text-sm text-gray-500">Created by: {quote.created_by_username}</div>
              <div className="font-medium">
                {quote.redacted ? (
                  <span>REDACTED by {quote.created_by_username}</span>
                ) : (
                  quote.lines.map((line, i) => (
                    <div key={i} className="text-gray-800">
                      <strong>{line.speaker_name}:</strong> {line.text}
                    </div>
                  ))
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
