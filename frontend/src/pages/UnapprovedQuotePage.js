import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import QuoteChip from "../components/QuoteChip";
import EmptyState from "../components/EmptyState";
import LoadingPage from "../pages/LoadingPage";

export default function UnapprovedQuotesPage({ user }) {
  const [loading, setLoading] = useState(true);
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
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = (id) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  };

  if (error) {
    return (<EmptyState title="Oops!" message={error} />);
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Unapproved Quotes</h2>
      {!loading && (
        quotes.length === 0 ? (
          <EmptyState
            title="Nothing to review!"
            message="No unapproved quotes — looks like everyone’s on the same page!"
          />
        ) : (
          quotes.map((q) => (
            <QuoteChip
              key={q.id}
              quote={q}
              user={user}
              onError={setError}
              onRemove={() => handleRemove(q.id)}
              showVisibilityIcon={false}
              showDeleteButton={true}
              showRarity={false}
              showSignButtons={false}
            />
          ))
        )
      )}
    </div>
  );
}
