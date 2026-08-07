import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import useAppContext from "../context/useAppContext";
import QuoteRarityVote from "../components/QuoteRarityVote";
import QuoteBody from "../components/QuoteBody";
import SignaturePads from "../components/SignaturePads";
import QuoteMetaMetadata from "../components/QuoteMetaMetadata";
import QuoteActions from "../components/QuoteActions";


const rarityColors = {
  common: "bg-white",
  uncommon: "bg-green-50",
  rare: "bg-blue-50",
  epic: "bg-purple-50",
  legendary: "bg-yellow-50",
};


function QuoteDetailPage() {
  const { user, setError, setLoading } = useAppContext();
  const { id } = useParams();
  const [quote, setQuote] = useState(null);

  const loadQuote = useCallback(() => {
    if (!user || !id) return;

    api
      .get(`/api/quotes/${id}/`, { withCredentials: true, cache: false })
      .then((res) => setQuote(res.data))
      .catch(() => setError("This quote is either private or could not be found."));
  }, [id, user, setError]);

  useEffect(() => {
    if (!user || !id) return;

    loadQuote();
    setLoading(false);
  }, [id, user, loadQuote, setLoading]);

  useEffect(() => {
    if (!quote?.participant_status?.length) return;

    const deadlines = quote.participant_status
      .map((entry) => entry.deadline_at)
      .filter(Boolean)
      .map((value) => new Date(value).getTime())
      .filter((value) => Number.isFinite(value));

    if (!deadlines.length) return;

    const nextDeadline = Math.min(...deadlines);
    const timeoutMs = Math.max(nextDeadline - Date.now(), 0);

    const timeoutId = window.setTimeout(() => {
      loadQuote();
    }, timeoutMs);

    return () => window.clearTimeout(timeoutId);
  }, [quote?.participant_status, loadQuote]);
 
  if (!quote || !user) return null;


  return (
      <div className={`max-w-4xl mx-auto mt-10 p-6 rounded-xl shadow-lg space-y-6 transition-all duration-300 ${rarityColors[quote?.rank] || "bg-white"}`}>
        <QuoteBody quote={quote} setQuote={setQuote} />
        <SignaturePads quote={quote} setQuote={setQuote} />
        {/* <QuoteSignaturePad quote={quote} setQuote={setQuote} /> */}
        <QuoteRarityVote quote={quote} setQuote={setQuote} />
        <QuoteMetaMetadata quote={quote} setQuote={setQuote} />
        <div className="flex justify-center">
          <QuoteActions quote={quote} setQuote={setQuote}/>
        </div>
      </div>
  );

}

export default QuoteDetailPage;
