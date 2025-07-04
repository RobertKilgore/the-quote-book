import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiGlobe, FiLock } from "react-icons/fi";
import api from "../api/axios";
import getCookie from "../utils/getCookie";
import { useSignature } from "../context/SignatureContext";

export default function QuoteChip({
  quote: initialQuote,
  user,
  onError,
  showVisibilityIcon = true,
  showSignButtons = true,
  fadeBackIn = true
}) {
  const navigate = useNavigate();
  const [quote, setQuote] = useState(initialQuote);
  const [fadeIn, setFadeIn] = useState(true); // 🔄
  
  const { refreshCount } = useSignature();
  const [isRemoved, setIsRemoved] = useState(false);

  const isParticipant = quote.participant_status?.some(p => p.name === user?.username);
  const participantData = quote.participant_status?.find(p => p.name === user?.username);
  const needsSignature = isParticipant && !participantData?.signature_image && !participantData?.refused;

  const hasUnsignedParticipant = quote.participant_status?.some(
    p => !p.signature_image && !p.refused
  );

  const shouldShowSignButton = showSignButtons && (needsSignature || (user?.isSuperuser && hasUnsignedParticipant));
  const shouldShowRefuseButton = showSignButtons && needsSignature;

  const handleRefuse = async () => {
    try {
        await api.post("/api/signatures/refuse/", {
        quote_id: quote.id
        }, {
        withCredentials: true,
        headers: { "X-CSRFToken": getCookie("csrftoken") }
        });

        setFadeIn(false); // fade out

        setTimeout(() => {
          if (!fadeBackIn) {
            setIsRemoved(true); // Actually remove from DOM
          } else {
            // If fading back in, fetch updated data
            api.get(`/api/quotes/${quote.id}/`, { withCredentials: true })
              .then(res => {
                setQuote(res.data);
                setFadeIn(true); // Fade back in if allowed
              });
          }

          refreshCount();
        }, 300); // Match your transition duration
    } catch (error) {
        if (onError) onError("Error refusing to sign. Please try again.");
    }
    };


  if (isRemoved) return null;

  return (
    <div
      className={`relative bg-white p-4 pr-12 shadow rounded hover:bg-gray-50 transition cursor-pointer duration-300 ease-in-out ${fadeIn ? "opacity-100" : "opacity-0"}`}
      onClick={() => navigate(`/quote/${quote.id}`)}
    >
      {showVisibilityIcon && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="bg-white shadow-md ring-1 ring-gray-200 rounded-full p-2">
            {quote.visible ? (
              <FiGlobe className="text-blue-500 text-lg" />
            ) : (
              <FiLock className="text-yellow-500 text-lg" />
            )}
          </div>
        </div>
      )}

      {quote.lines.map((line, idx) => (
        <div key={idx} className="mb-1">
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
          quote.participant_status.map((p, idx) => (
            <div
              key={idx}
              className="bg-gray-100 border border-gray-300 px-3 py-1 rounded-lg text-sm text-gray-800 flex items-center gap-2"
            >
              <span className="font-semibold">{p.name}</span>
              {p.refused ? (
                <span className="text-red-600 font-semibold">Refusal to sign</span>
              ) : p.signature_image ? (
                <img
                  src={p.signature_image}
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

      {(shouldShowSignButton || shouldShowRefuseButton) && (
        <div
          className="mt-4 flex flex-wrap gap-3"
          onClick={(e) => e.stopPropagation()}
        >
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
      )}
    </div>
  );
}
