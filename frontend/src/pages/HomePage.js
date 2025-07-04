import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { FiPlus } from "react-icons/fi";
import QuoteChip from "../components/QuoteChip";
import EmptyState from "../components/EmptyState";

export default function HomePage({ user }) {
  const [quotes, setQuotes] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/quotes/", { withCredentials: true })
      .then((res) => {
        setQuotes(res.data);
      })
      .catch(() => {
        setError("Failed to load quotes. Please try again later.");
        setQuotes([]);
      });
  }, [user]);

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
      <h2 className="text-2xl font-bold mb-4">Quotes</h2>

      {quotes.length === 0 ? (
          <EmptyState
            title="All quiet here!"
            message="No quotes yet, but the ink is ready!"
          />
      ) : (
        quotes.map((q) => (
          <QuoteChip
            quote={q}
            user={user}
            onError={setError}
            showVisibilityIcon={true}
            showSignButtons={true}
          />
        ))
      )}

      {user && (
        <button
          onClick={() =>
            navigate(user.isSuperuser ? "/create-quote" : "/request-quote")
          }
          className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center"
          title={user.isSuperuser ? "Create Quote" : "Request Quote"}
        >
          <FiPlus className="text-3xl" />
        </button>
      )}
    </div>
  );
}
