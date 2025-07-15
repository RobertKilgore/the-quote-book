import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import VisibilityChip from "../components/VisibilityChip";
import RarityChip from "../components/RarityChip"; 
import api from "../api/axios";
import getCookie from "../utils/getCookie";
import useRefreshAllQuoteContexts from "../utils/refreshAllQuoteContexts";
import useAppContext from "../context/useAppContext";

const rarityColorMap = {
  common: "bg-white",
  uncommon: "bg-green-50",
  rare: "bg-blue-50",
  epic: "bg-purple-50",
  legendary: "bg-yellow-50",
};

export default function QuoteChip({
  quote: initialQuote,
  onError,
  showVisibilityIcon = true,
  showSignButtons = true,
  showDeleteButton = false,
  showRarity = true,
  fadeBackIn = true,
  onRemove = null
}) {
  const { user, setUser, setError, setSuccess } = useAppContext();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(initialQuote);
  const [fadeIn, setFadeIn] = useState(true);
  const [isRemoved, setIsRemoved] = useState(false);
  const refreshAll = useRefreshAllQuoteContexts();

  const isParticipant = quote.participant_status?.some(p => p.user === user?.id);
  const participantData = quote.participant_status?.find(p => p.user === user?.id);
  const needsSignature = isParticipant && !participantData?.signature_image && !participantData?.refused;

  const hasUnsignedParticipant = quote.participant_status?.some(
    p => !p.signature_image && !p.refused
  );

  const shouldShowSignButton = showSignButtons && (needsSignature || (user?.isSuperuser && hasUnsignedParticipant));
  const shouldShowRefuseButton = showSignButtons && needsSignature;

  const userHasVoted = quote.rarity_votes?.some(v => v.user === user?.id);

  const handleRefuse = async () => {
    try {
      await api.post("/api/signatures/refuse/", {
        quote_id: quote.id
      }, {
        withCredentials: true,
        headers: { "X-CSRFToken": getCookie("csrftoken") }
      });

      setFadeIn(false);
      setTimeout(() => {
        if (!fadeBackIn) {
          setIsRemoved(true);
          onRemove?.(); 
        } else {
          api.get(`/api/quotes/${quote.id}/`, { withCredentials: true })
            .then(res => {
              setQuote(res.data);
              setFadeIn(true);
            });
        }
        refreshAll();
      }, 300);
    } catch (error) {
      if (onError) onError("Error refusing to sign. Please try again.");
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/quotes/${quote.id}/`, {
        withCredentials: true,
        headers: { "X-CSRFToken": getCookie("csrftoken") }
      });
      setFadeIn(false);
      setTimeout(() => setIsRemoved(true), 300);
      onRemove?.();
      refreshAll();
    } catch {
      if (onError) onError("Error deleting quote.");
    }
  };

  if (isRemoved) return null;

  const rarity = quote.rank || "common";
  const bgColorClass = showRarity ? rarityColorMap[rarity] : "bg-white";

  return (
    <div
      className={`relative ${bgColorClass} p-4 pr-12 shadow rounded hover:brightness-95 transition cursor-pointer duration-300 ease-in-out ${fadeIn ? "opacity-100" : "opacity-0"}`}
      onClick={() => navigate(`/quote/${quote.id}`)}
    >
      {showRarity && (
        <div className="mb-2">
          <RarityChip rarity={rarity} />
        </div>
      )}

{showVisibilityIcon && (
  <div className="absolute right-3 top-1/2 -translate-y-1/2">
    <VisibilityChip quote={quote} />
  </div>
)}

      {quote.lines.map((line) => (
        <div key={line.id || `${line.speaker_name}-${line.text}`} className="mb-1">
          <span className="font-semibold">{line.speaker_name}:</span>{" "}
          {quote.redacted ? (
            <span className="text-red-600 font-bold">[REDACTED]</span>
          ) : (
            <span>{line.text}</span>
          )}
        </div>
      ))}

      <p className="text-sm mt-2 text-gray-500">
        {quote.date ? new Date(quote.date).toLocaleDateString() : "Unknown"}
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        {quote.participant_status?.length > 0 ? (
          quote.participant_status.map((p) => (
            <div
              key={p.user}
              className="bg-gray-100 border border-gray-300 px-3 py-1 rounded-lg text-sm text-gray-800 flex items-center gap-2"
            >
              <span className="font-semibold">{p.name}</span>
              {p.refused ? (
                <span className="text-red-600 font-semibold">Refusal to sign</span>
              ) : p.signature_image ? (
                <img
                  src={`${p.signature_image}?${new Date().getTime()}`}
                  alt="signature"
                  className="h-6 max-w-[120px] object-contain"
                />
              ) : (
                <span className="italic text-gray-400">No signature yet</span>
              )}
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-400 italic">No signatures needed</div>
        )}
      </div>

      {(shouldShowSignButton || shouldShowRefuseButton || (showDeleteButton && user?.isSuperuser)) && (
        <div
          className="mt-4 w-full flex justify-between items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-3">
            {shouldShowSignButton && (
              <button
                className="px-4 py-1.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-full transition-colors duration-200"
                onClick={() => navigate(`/quote/${quote.id}`)}
              >
                Sign
              </button>
            )}

            {shouldShowRefuseButton && (
              <button
                className="px-4 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-full transition-colors duration-200"
                onClick={handleRefuse}
              >
                Refuse to Sign
              </button>
            )}
          </div>

          <div>
            {showDeleteButton && user?.isSuperuser && (
              <button
                onClick={handleDelete}
                className="px-4 py-1.5 text-sm font-medium text-white bg-red-700 hover:bg-red-800 rounded-full transition-colors duration-200"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
