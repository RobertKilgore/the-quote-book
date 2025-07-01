// src/pages/HomePage.js
import { useEffect, useState } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";

export default function HomePage() {
  const [quotes, setQuotes] = useState([]);

  useEffect(() => {
    api.get("/api/quotes/", { withCredentials: true })
      .then(res => setQuotes(res.data))
      .catch(() => setQuotes([]));
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Public Quotes</h2>
      {quotes.length === 0 ? (
        <p>No quotes available.</p>
      ) : (
        quotes.map((q) => (
          <div key={q.id} className="bg-white p-4 shadow rounded">
            <blockquote className="italic">"{q.text}"</blockquote>
            <p className="text-right text-sm mt-2">— {q.name}</p>
            <Link to={`/quote/${q.id}`} className="text-blue-500 hover:underline text-sm">View Details</Link>
          </div>
        ))
      )}
    </div>
  );
}
