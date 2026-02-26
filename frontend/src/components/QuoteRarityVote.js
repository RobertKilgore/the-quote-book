// components/QuoteRarityVote.jsx
import React, { useState } from "react";
import api              from "../api/axios";
import getCookie        from "../utils/getCookie";
import useAppContext    from "../context/useAppContext";
import useRefreshAllQuoteContexts from "../utils/refreshAllQuoteContexts";

const rarityLabels = ["common","uncommon","rare","epic","legendary"];
const rarityColorMap = {
  common:     { text:"text-gray-800",  bg:"bg-white",     border:"border-gray-300",  hover:"hover:bg-gray-100",   ring:"ring-gray-300"  },
  uncommon:   { text:"text-green-800", bg:"bg-green-100", border:"border-green-300", hover:"hover:bg-green-200",  ring:"ring-green-300" },
  rare:       { text:"text-blue-800",  bg:"bg-blue-100",  border:"border-blue-300",  hover:"hover:bg-blue-200",   ring:"ring-blue-300"  },
  epic:       { text:"text-purple-800",bg:"bg-purple-100",border:"border-purple-300",hover:"hover:bg-purple-200", ring:"ring-purple-300"},
  legendary:  { text:"text-yellow-900",bg:"bg-yellow-100",border:"border-yellow-300",hover:"hover:bg-yellow-200", ring:"ring-yellow-300"}
};

export default function QuoteRarityVote({ quote, setQuote }) {
  const { setError }   = useAppContext();
  const refreshAll     = useRefreshAllQuoteContexts();
  const [submitting,setSubmitting] = useState(false);
  const currentVote = quote?.user_rarity_vote;
  const [visibleTooltip, setVisibleTooltip] = useState(null); // rarity string or null
  let holdTimer = null;

  const handleTouchStart = (rarity) => {
    holdTimer = setTimeout(() => {
      setVisibleTooltip(rarity);
    }, 500); // 500ms hold
  };

  const handleTouchEnd = () => {
    clearTimeout(holdTimer);
    holdTimer = null;
  };

  const closeTooltip = () => setVisibleTooltip(null);

  const handleVote = async (rarity) => {
    if (submitting) return;
    setSubmitting(true);
    const clearing = currentVote === rarity;
    try {
      const res = await api.post(
        `/quotes/${quote.id}/vote/`,
        { rarity: clearing ? null : rarity },
        { withCredentials:true, headers:{ "X-CSRFToken":getCookie("csrftoken") } }
      );
      setQuote(res.data);
      refreshAll();
    } catch { setError("Failed to register vote."); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="mt-6 pt-6 border-t">
      <div className="flex justify-center gap-3 flex-wrap">
{rarityLabels.map((rarity) => {
  const selected = currentVote === rarity;
  const color = rarityColorMap[rarity];
  const voters = quote.rank_votes?.[rarity] ?? [];
  const count = voters.length;
  const isTooltipVisible = visibleTooltip === rarity;

  return (
    <div
      key={rarity}
      className="relative group"
      onTouchStart={() => handleTouchStart(rarity)}
      onTouchEnd={handleTouchEnd}
      onMouseLeave={closeTooltip}
    >
      {/* Vote button */}
      <button
        disabled={submitting}
        onClick={() => handleVote(rarity)}
        className={`
          w-[7.5rem] text-center px-4 py-2 rounded-full border transition-all
          ${selected ? `ring-2 ring-offset-2 ${color.ring} font-bold scale-105 shadow-md` : ""}
          ${color.bg} ${color.text} ${color.border} ${color.hover}
          ${submitting ? "opacity-60 cursor-not-allowed" : ""}
        `}
      >
        {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
      </button>

      {/* Vote count badge */}
      <span className="absolute -top-2 -right-2 bg-gray-700 text-white text-xs px-2 py-0.5 rounded-full shadow">
        {count}
      </span>

      {/* Tooltip for desktop hover + mobile long-press */}
      {count > 0 && (
        <div
          className={`absolute left-1/2 -translate-x-1/2 mt-2 z-20 
                      bg-white border border-gray-300 rounded shadow-lg px-3 py-2 text-sm text-gray-800 
                      whitespace-nowrap 
                      ${isTooltipVisible ? "block" : "hidden"} 
                      group-hover:block`}
        >
          <p className="font-semibold mb-1 text-center">
            {count} vote{count === 1 ? "" : "s"}
          </p>
          {voters.map(v => (
            <p key={v.id}>{v.name}</p>
          ))}
        </div>
      )}
    </div>
  );
})}
      </div>
    </div>
  );
}
