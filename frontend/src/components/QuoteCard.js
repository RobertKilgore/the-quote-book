import React from "react";
import { Link } from "react-router-dom";

function QuoteCard({ quote }) {
  const date = new Date(quote.date).toLocaleDateString();

  return (
    <div style={{ border: "1px solid #ccc", padding: "12px", margin: "8px" }}>
      <h3>Quote #{quote.id}</h3>
      <p>Date: {date}</p>
      <p>Redacted: {quote.is_redacted ? "Yes" : "No"}</p>
      <Link to={`/quote/${quote.id}`}>View Full</Link>
    </div>
  );
}

export default QuoteCard;