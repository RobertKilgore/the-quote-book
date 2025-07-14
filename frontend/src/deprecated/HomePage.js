import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { FiPlus } from "react-icons/fi";
import QuoteChip from "../components/QuoteChip";
import EmptyState from "../components/EmptyState";
import LoadingPage from "../pages/LoadingPage";
import useScrollRestoration from "../hooks/useScrollRestoration";
import { useNavbar } from "../context/NavbarContext";

export default function HomePage({user}) {
  
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState([]);
  const [error, setError] = useState(null);
  //const [saveScroll, setSaveScroll] = useState(true)
  const { collapsed } = useNavbar();
  const navigate = useNavigate();

  useScrollRestoration("home", loading);

  useEffect(() => {
    api.get("/api/quotes/", { withCredentials: true })
      .then((res) => {
        setQuotes(res.data);
      })
      .catch(() => {
        setError("Failed to load quotes. Please try again later.");
        setQuotes([]);
      })
      .finally(() => setLoading(false));
  }, [user]);



  if (error) {
    return  (<EmptyState title="Oops!" message={error}/>)
  }
  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Quotes</h2>
      {!loading && (
        quotes.length === 0 ? (
            <EmptyState
              title="All quiet here!"
              message="No quotes yet, but the ink is ready!"
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
            />
          ))
        )
      )}

      {user && (
        <button
          onClick={() => {
            navigate(user.isSuperuser ? "/create-quote" : "/request-quote");
          }}
          className={`fixed ${
            collapsed ? "bottom-[6rem]" : "bottom-6"
          } right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center`}
          title={user.isSuperuser ? "Create Quote" : "Request Quote"}
        >
          <FiPlus className="text-3xl" />
        </button>
      )}
    </div>
  );
}
