// src/pages/UnratedQuotesPage.js
import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import QuoteChip from "../components/QuoteChip";
import EmptyState from "../components/EmptyState";
import LoadingPage from "./LoadingPage";

export default function UnratedQuotesPage({ user }) {
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/quotes/unrated/", { withCredentials: true })
      .then(res => {
        setQuotes(res.data);
        setError(null);
      })
      .catch(err => {
        console.error("Failed to fetch unrated quotes:", err);
        setError("Failed to load unrated quotes. Please try again later.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = (id) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  };

  if (loading) return <LoadingPage />;
  if (error) return <EmptyState title="Oops!" message={error} />;


  console.log(quotes.length)
  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Unrated Quotes</h2>
      {quotes.length === 0 ? (
        <EmptyState
          title="You're all caught up!"
          message="No unrated quotes left — thanks for participating!"
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
            showDeleteButton={false}
            showRarity={true}
            showSignButtons={false}
          />
        ))
      )}
    </div>
  );
}
