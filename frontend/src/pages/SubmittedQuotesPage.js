import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import QuoteChip from "../components/QuoteChip";
import EmptyState from "../components/EmptyState";


export default function SubmittedQuotesPage({ user }) {
  const [quotes, setQuotes] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/quotes/submitted/", { withCredentials: true })
      .then(res => {
        setQuotes(res.data);
        setError(null);
      })
      .catch(() => {
        setError("Failed to fetch your submitted quotes.");
        setQuotes([]);
      });
  }, []);

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

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Unapproved Quotes</h2>

      {quotes.length === 0 ? (
          <EmptyState
            title="Nothing to review!"
            message="No unapproved quotes — looks like everyone’s on the same page!"
          />
      ) : (
        quotes.map((q) => (
          <QuoteChip
            quote={q}
            user={user}
            onError={setError}
            showVisibilityIcon={false}
            showSignButtons={false}
          />
        ))
      )}
    </div>
  );
}
