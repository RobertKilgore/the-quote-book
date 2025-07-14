import { useEffect, useState } from "react";
import api from "../api/axios";
import QuoteChip from "./QuoteChip";
import EmptyState from "./EmptyState";
import LoadingPage from "../pages/LoadingPage";
import useScrollRestoration from "../hooks/useScrollRestoration";
import useAppContext from "../context/useAppContext";

export default function QuoteListPage({
  fetchUrl,
  title,
  emptyTitle,
  emptyMessage,
  scrollKey = null,
  quoteChipProps = {},
  enableLocalRemove = true,
}) {
  const [loading, setLoading]   = useState(true);
  const [quotes,  setQuotes]    = useState([]);
  const { user, setUser, setError, setSuccess } = useAppContext();

  useScrollRestoration({key: scrollKey, loading});

  useEffect(() => {
    setLoading(true);
    api.get(fetchUrl, { withCredentials: true })
       .then(res => { setQuotes(res.data); setError(null); })
       .catch(()  => { setError("Failed to load quotes. Please try again later."); setQuotes([]); })
       .finally(() => setLoading(false));
  }, [fetchUrl]);

  const handleRemove = id => {
    if (!enableLocalRemove) return;
    setQuotes(prev => prev.filter(q => q.id !== id));
  };

  if (loading) return <LoadingPage />;
  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-4">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>

      {quotes.length === 0 ? (
        <EmptyState title={emptyTitle} message={emptyMessage} />
      ) : (
        quotes.map(q => (
          <QuoteChip
            key={q.id}
            quote={q}
            onError={setError}
            onRemove={() => handleRemove(q.id)}
            {...quoteChipProps}
          />
        ))
      )}
    </div>
  );
}
