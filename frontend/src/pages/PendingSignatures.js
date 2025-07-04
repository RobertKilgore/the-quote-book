import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import QuoteChip from "../components/QuoteChip";
import EmptyState from "../components/EmptyState";


function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export default function PendingSignaturesPage({ user, setPendingSignatureCount }) {
  const [quotes, setQuotes] = useState([]);
  const [refusedIds, setRefusedIds] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/signatures/pending/", {
      withCredentials: true,
      headers: { "X-CSRFToken": getCookie("csrftoken") }
    })
      .then((res) => {
        setQuotes(res.data);
        setError(null);
      })
      .catch(() => {
        setError("Unable to fetch your pending signatures. Please try again.");
        setQuotes([]);
      });
  }, []);


  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Pending Signatures</h2>

      {error ? (
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-blue-600 mb-4">Oops!</h2>
            <p className="text-xl text-gray-700">{error}</p>
          </div>
        </div>
      ) : quotes.length === 0 ? (
          <EmptyState
            title="You're all caught up!"
            message="No signatures needed right now."
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
    </div>
  );
}
