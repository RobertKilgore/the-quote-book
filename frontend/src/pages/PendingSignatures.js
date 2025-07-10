import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import QuoteChip from "../components/QuoteChip";
import EmptyState from "../components/EmptyState";
import LoadingPage from "../pages/LoadingPage";

export default function PendingSignaturesPage({ user }) {
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = () => {
    setLoading(true);
    api.get("/api/signatures/pending/", { withCredentials: true })
      .then((res) => {
        setQuotes(res.data);
        setError(null);
      })
      .catch(() => {
        setError("Unable to fetch your pending signatures. Please try again.");
        setQuotes([]);
      })
      .finally(() => setLoading(false));
  };

  const handleLocalRemove = (id) => {
    setQuotes(prev => prev.filter(q => q.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Pending Signatures</h2>

      {loading ? (
        <LoadingPage />
      ) : error ? (
        <EmptyState title="Oops!" message={error} />
      ) : quotes.length === 0 ? (
        <EmptyState
          title="You're all caught up!"
          message="No signatures needed right now."
        />
      ) : (
        quotes.map((q) => (
          <QuoteChip
            key={q.id}
            quote={q}
            user={user}
            onError={setError}
            showVisibilityIcon={true}
            showSignButtons={true}
            fadeBackIn={false}
            onRemove={() => handleLocalRemove(q.id)} // <-- optional
          />
        ))
      )}
    </div>
  );
}
