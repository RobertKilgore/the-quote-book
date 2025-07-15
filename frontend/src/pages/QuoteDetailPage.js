import React, { useEffect, useState, useRef, Component } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiX, FiPenTool} from "react-icons/fi";
import api from "../api/axios";
import SignaturePad from "signature_pad";
import { confirmAlert } from "react-confirm-alert";
import useRefreshAllQuoteContexts from "../utils/refreshAllQuoteContexts";
import getCookie from "../utils/getCookie";
import VisibilityChip from "../components/VisibilityChip";
import RarityChip from "../components/RarityChip"; 
import useAppContext from "../context/useAppContext";
import QuoteRarityVote from "../components/QuoteRarityVote";
import QuoteBody from "../components/QuoteBody"
import QuoteSignaturePad from "../components/QuoteSignaturePad";
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
  const { user, setUser, setError, setSuccess, loading, setLoading } = useAppContext();
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    if (user && id) {
      setQuote(null);
      api
        .get(`/api/quotes/${id}/`, { withCredentials: true })
        .then((res) => setQuote(res.data))
        .catch(() =>
          setError("This quote is either private or could not be found.")
        )
        .finally(() => setLoading(false));
    }
  }, [id, user]);
 
  if (!quote || !user) return null;


  return (
      <div className={`max-w-4xl mx-auto mt-10 p-6 rounded-xl shadow-lg space-y-6 transition-all duration-300 ${rarityColors[quote?.rank] || "bg-white"}`}>
        <QuoteBody quote={quote}/>
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
