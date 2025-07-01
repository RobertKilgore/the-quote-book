import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

function QuoteDetailPage() {
  const { id } = useParams();
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    api.get(`/api/quotes/${id}/`)
      .then((res) => setQuote(res.data))
      .catch((err) => console.error("Failed to fetch quote", err));
  }, [id]);

  if (!quote) return <p>Loading...</p>;

  return (
    <div>
      <h2>Quote #{quote.id}</h2>
      <p><strong>Date:</strong> {new Date(quote.date).toLocaleDateString()}</p>
      <p><strong>Redacted:</strong> {quote.is_redacted ? "Yes" : "No"}</p>
      <h3>Lines</h3>
      <ul>
        {quote.lines.map((line) => (
          <li key={line.id}><strong>{line.speaker_name}</strong>: {line.text}</li>
        ))}
      </ul>
    </div>
  );
}

export default QuoteDetailPage;
