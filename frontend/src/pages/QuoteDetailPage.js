import React, { useEffect, useState, useRef } from "react";
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


const rarityColors = {
  common: "bg-white",
  uncommon: "bg-green-50",
  rare: "bg-blue-50",
  epic: "bg-purple-50",
  legendary: "bg-yellow-50",
};

const rarityLabels = ["common", "uncommon", "rare", "epic", "legendary"];
const rarityColorMap = {
  common: {
    text: "text-gray-800",
    bg: "bg-white",
    border: "border-gray-300",
    hover: "hover:bg-gray-100",
    ring: "ring-gray-300"
  },
  uncommon: {
    text: "text-green-800",
    bg: "bg-green-100",
    border: "border-green-300",
    hover: "hover:bg-green-200",
    ring: "ring-green-300"
  },
  rare: {
    text: "text-blue-800",
    bg: "bg-blue-100",
    border: "border-blue-300",
    hover: "hover:bg-blue-200",
    ring: "ring-blue-300"
  },
  epic: {
    text: "text-purple-800",
    bg: "bg-purple-100",
    border: "border-purple-300",
    hover: "hover:bg-purple-200",
    ring: "ring-purple-300"
  },
  legendary: {
    text: "text-yellow-900",
    bg: "bg-yellow-100",
    border: "border-yellow-300",
    hover: "hover:bg-yellow-200",
    ring: "ring-yellow-300"
  }
};


function QuoteDetailPage() {
  const { user, setUser, setError, setSuccess } = useAppContext();
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState(null);
  const [signingAs, setSigningAs] = useState(null);
  const [canSign, setCanSign] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const refreshAll = useRefreshAllQuoteContexts();

  const canvasRef = useRef(null);
  const [signaturePad, setSignaturePad] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  
  const SIG_RATIO = 4;                // width : height

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const dpr    = Math.max(window.devicePixelRatio || 1, 1);

    /* draw baseline + X (permanent) */
      const paintGuide = () => {
      const w = canvas.parentElement.clientWidth;
      const h = w / SIG_RATIO;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const padding = w * 0.10;         // 10% left/right
      const lineW   = w * 0.80;         // 80% line width
      const y       = .75 * h;           // baseline y-position

      // X drawing slightly offset left of baseline start
      const xSize = 14;
      const xxOffset = 12; 
      const xyOffset = 7;
      const xxCenter = padding - xxOffset;
      const xyCenter = y - xyOffset;

      ctx.strokeStyle = "#a0aec0";
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(xxCenter - xSize / 2, xyCenter - xSize / 2);
      ctx.lineTo(xxCenter + xSize / 2, xyCenter + xSize / 2);
      ctx.moveTo(xxCenter - xSize / 2, xyCenter + xSize / 2);
      ctx.lineTo(xxCenter + xSize / 2, xyCenter - xSize / 2);
      ctx.stroke();

      // Baseline
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + lineW, y);
      ctx.stroke();
    };

    /* create / recreate signature-pad */
    let pad;
    const initPad = () => {
      paintGuide();
      const w = canvas.parentElement.clientWidth;
      const minW = 0.5 * (w / 800);
      const maxW = 2.0 * (w / 800);

      pad?.off();
      pad = new SignaturePad(canvas, { minWidth: minW, maxWidth: maxW });
      paintGuide();
      pad.onBegin = () => setHasDrawn(true);
      setSignaturePad(pad);
    };

    initPad();
    window.addEventListener('resize', initPad);
    return () => {
      pad?.off();
      window.removeEventListener('resize', initPad);
    };
  }, [quote]);

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

  useEffect(() => {
    if (!user || !quote) return;
    if (user.isSuperuser) {
      const eligible = quote.participants_detail.filter((p) => {
        const match = quote.signatures.find((sig) => sig.user === p.id);
        return !match || (!match.signature_image && !match.refused);
      });
      if (eligible.length > 0) {
        setSigningAs(eligible[0].id);
      }
    }
  }, [user, quote]);

  useEffect(() => {
    if (!user || !quote) return;

    const userIsParticipant = quote.participants.some(
      (p) => String(p.id) === String(user.id)
    );

    const userHasSignedOrRefused = quote.signatures.some(
      (sig) => sig.user === user.id && (sig.signature_image || sig.refused)
    );

    const adminHasEligibleUsers =
      user.isSuperuser &&
      quote.participants.some((p) => {
        const sig = quote.signatures.find((s) => s.user === p.id);
        return !sig || (!sig.signature_image && !sig.refused);
      });
    
    if (!canSign)
    setCanSign(
      quote.approved &&
        ((userIsParticipant && !userHasSignedOrRefused) || adminHasEligibleUsers)
    );
  }, [quote, user]);

  const handleSignatureSubmit = async () => {
    if (!signaturePad || signaturePad.isEmpty()) {
      setError("Please provide a signature first.");
      return;
    }

    const dataUrl = signaturePad.toDataURL("image/png");
    const payload = {
      quote_id: quote.id,
      signature_image: dataUrl,
      sign_as_user_id: user?.isSuperuser ? signingAs : user?.id,
    };

    try {
      await api.post("/api/signatures/submit/", payload, {
        withCredentials: true,
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });
      refreshAll();

      const res = await api.get(`/api/quotes/${quote.id}/`, {
        withCredentials: true,
      });
      const updatedQuote = res.data;
      setQuote(updatedQuote);

      const stillEligible = updatedQuote.participants_detail.filter((p) => {
        const sig = updatedQuote.signatures.find((s) => s.user === p.id);
        return !sig || (!sig.signature_image && !sig.refused);
      });

      const userHasSignedOrRefused = updatedQuote.signatures.some(
        (s) => s.user === user.id && (s.signature_image || s.refused)
      );

      const shouldFadeOut =
        (user.isSuperuser && stillEligible.length === 0) ||
        (!user.isSuperuser && userHasSignedOrRefused);

      if (shouldFadeOut) {
        setFadingOut(true);
      } else {
        setSigningAs(stillEligible[0]?.id ?? null);
      }
    } catch {
      setError("Error submitting signature.");
    }
  };

  const handleRefuseSignature = async () => {
    const payload = {
      quote_id: quote.id,
      sign_as_user_id: user?.isSuperuser ? signingAs : user?.id,
    };

    try {
      await api.post("/api/signatures/refuse/", payload, {
        withCredentials: true,
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });
      

      const res = await api.get(`/api/quotes/${quote.id}/`, {
        withCredentials: true,
      });
      const updatedQuote = res.data;
      setQuote(updatedQuote);

      const stillEligible = updatedQuote.participants_detail.filter((p) => {
        const sig = updatedQuote.signatures.find((s) => s.user === p.id);
        return !sig || (!sig.signature_image && !sig.refused);
      });

      const userHasSignedOrRefused = updatedQuote.signatures.some(
        (s) => s.user === user.id && (s.signature_image || s.refused)
      );

      const shouldFadeOut =
        (user.isSuperuser && stillEligible.length === 0) ||
        (!user.isSuperuser && userHasSignedOrRefused);

      if (shouldFadeOut) {
        setFadingOut(true);
      } else {
        setSigningAs(stillEligible[0]?.id ?? null);
      }
      refreshAll();
    } catch {
      setError("Error refusing to sign.");
    }
  };

  const handleClear = () => {
    signaturePad?.clear();
    setHasDrawn(false);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        const w = canvasRef.current.parentElement.clientWidth;
        const h = w / SIG_RATIO;

        const dpr = Math.max(window.devicePixelRatio || 1, 1);
        canvasRef.current.width = w * dpr;
        canvasRef.current.height = h * dpr;
        canvasRef.current.style.width = `${w}px`;
        canvasRef.current.style.height = `${h}px`;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        const padding = w * 0.10;
        const lineW = w * 0.80;
        const y = .75 * h;

        const xSize = 14;
        const xxOffset = 12;
        const xyOffset = 7;
        const xxCenter = padding - xxOffset;
        const xyCenter = y - xyOffset;

        ctx.strokeStyle = "#a0aec0";
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.moveTo(xxCenter - xSize / 2, xyCenter - xSize / 2);
        ctx.lineTo(xxCenter + xSize / 2, xyCenter + xSize / 2);
        ctx.moveTo(xxCenter - xSize / 2, xyCenter + xSize / 2);
        ctx.lineTo(xxCenter + xSize / 2, xyCenter - xSize / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + lineW, y);
        ctx.stroke();
      }
    }
  };

  const handleDelete = () => {
    confirmAlert({
      title: "Confirm Delete",
      message: "Are you sure you want to delete this quote?",
      buttons: [
        {
          label: "Cancel",
          onClick: () => {},
          className: "cancel-button",
        },
        {
          label: "Yes, Delete it",
          onClick: async () => {
            try {
              await api.delete(`/api/quotes/${id}/`, {
                withCredentials: true,
                headers: { "X-CSRFToken": getCookie("csrftoken") },
              });
              refreshAll();
              navigate("/home");
            } catch {
              setError("Failed to delete quote.");
            }
          },
          className: "delete-button",
        },
      ],
      closeOnEscape: true,
      closeOnClickOutside: true,
    });
  };

  const handleFlagQuote = async () => {
    try {
      await api.post(`/quotes/${quote.id}/flag/`, {}, { 
        withCredentials: true,
        headers: { "X-CSRFToken": getCookie("csrftoken") }, 
      });
      const updated = { 
        ...quote,
        has_flagged: true,
        is_flagged: true,
        flag_count: (quote.flag_count ?? 0) + 1,
        flagged_by_users: [...(quote.flagged_by_users ?? []), {
          id: user.id,
          name: user.name || user.username || "Unknown User"
        }]
      };
      setQuote(updated);
      refreshAll();
    } catch {
      setError("Failed to flag quote.");
    }
  };

  
  const handleVote = async (rarity) => {
    const isClearing = (currentVote === rarity);
    console.log(currentVote)
    try {
      const res = await api.post(`/quotes/${quote.id}/vote/`, {
        rarity: isClearing ? null : rarity
      }, {
        withCredentials: true,
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });
      setQuote(res.data);
      refreshAll();
    } catch {
      setError("Failed to register vote.");
    }
  };

  function formatTimeTo12Hour(timeStr) {
    if (!timeStr) return null;
    const [hourStr, minuteStr] = timeStr.split(":");
    let hour = parseInt(hourStr);
    const minute = minuteStr;
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12; // convert 0 → 12
    return `${hour}:${minute} ${ampm}`;
  }

  const currentVote = quote?.user_rarity_vote;


 
  if (!quote || !user) return null;


  const displayTime = formatTimeTo12Hour(quote.time);

  const eligibleSigners = quote.participants_detail.filter((p) => {
    const match = quote.signatures.find((sig) => sig.user === p.id);
    return !match || (!match.signature_image && !match.refused);
  });


  return (
      <div className={`max-w-4xl mx-auto mt-10 p-6 rounded-xl shadow-lg space-y-6 transition-all duration-300 ${rarityColors[quote?.rank] || "bg-white"}`}>
        <div className="relative">
          <RarityChip rarity={quote.rank} size="large" />
          <div className="absolute top-1 right-2 z-10">
            <VisibilityChip quote={quote} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-2">Quote Details</h2>

        
        <div className="text-center text-sm text-gray-600">
          {quote.date ? (
            new Date(quote.date) < new Date("1980-06-09") ? (
              <p>
                <strong>Date:</strong> Ancient History
              </p>
            ) : (
              <p>
                <strong>Date:</strong> {new Date(quote.date).toLocaleDateString()} &nbsp;&nbsp;
                <strong>Time:</strong> {displayTime || "Unknown"}
              </p>
            )
          ) : (
            <p>
              <strong>Date:</strong> Unknown
            </p>
          )}
        </div>

        <div className="space-y-2 mt-6">
          {quote.lines.map((line, idx) => (
            <div key={idx} className="pl-4 border-l-4 border-blue-400">
              {quote.redacted ? (
                <p>
                  <span className="font-semibold">{line.speaker_name}</span>:{" "}
                  <span className="text-red-600 font-bold">[REDACTED]</span>
                </p>
              ) : (
                <p>
                  <span className="font-semibold">{line.speaker_name}</span>: {line.text}
                </p>
              )}
            </div>
          ))}
        </div>
        {/* 📝 Quote Notes & Source Info */}
        {(quote.quote_notes || quote.quote_source || quote.quote_source_image) && (
          <div className="">
            <div className="space-y-4 text-sm text-gray-800">

              {quote.quote_notes && (
                <div className="bg-gray-50 p-4 rounded border">
                  <p className="font-medium text-gray-600 mb-1">Notes</p>
                  <p className="whitespace-pre-wrap">{quote.quote_notes}</p>
                </div>
              )}

              {(quote.quote_source || quote.quote_source_image) && (
                <div className="bg-gray-50 p-4 rounded border">
                  <p className="font-medium text-gray-600 mb-1">Source</p>
                  <div className="space-y-2">
                    {quote.quote_source && (
                      <p>
                        <a
                          href={quote.quote_source}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline hover:text-blue-800 break-words"
                        >
                          {quote.quote_source}
                        </a>
                      </p>
                    )}
                    {quote.quote_source_image && (
                      <img
                        src={quote.quote_source_image}
                        alt="Quote Source"
                        className="max-h-64 rounded border object-contain mx-auto shadow cursor-pointer hover:opacity-80 transition"
                        onClick={() => setShowImageModal(true)}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-3 mt-6">
          {quote.participant_status?.map((p) => (
            <div
              key={p.user}
              className="border border-gray-300 px-3 py-2 rounded shadow-sm flex flex-col items-center text-sm bg-gray-50"
            >
              <span className="font-semibold">{p.name}</span>
              {p.refused ? (
                <span className="text-red-600 font-medium mt-1">Refusal to sign</span>
              ) : p.signature_image ? (
                <img
                  src={p.signature_image}
                  alt="signature"
                  className="h-12 mt-1 max-w-[150px] object-contain"
                />
              ) : (
                <span className="text-gray-400 italic mt-1">No signature yet</span>
              )}
            </div>
            
          ))}
        </div>
      

        {/* 🌟 Rarity Voting Section */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex justify-center gap-3 flex-wrap">
            {rarityLabels.map((rarity) => {
              const isSelected = currentVote === rarity;
              const color = rarityColorMap[rarity];
              const count = quote.rank_votes?.[rarity]?.length || 0;

              return (
                <div key={rarity} className="relative">
                  <button
                    onClick={() => handleVote(rarity)}
                    className={`w-[7.5rem] text-center px-4 py-2 rounded-full border transition-all
                      ${isSelected ? `ring-2 ring-offset-2 ${color.ring} font-bold scale-105 shadow-md` : ""}
                      ${color.bg} ${color.text} ${color.border} ${color.hover}
                    `}
                  >
                    {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                  </button>

                  {/* Chip badge */}
                  <span className="absolute -top-2 -right-2 bg-gray-700 text-white text-xs px-2 py-0.5 rounded-full shadow">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {canSign && (
          <div
            className={`mt-10 pt-6 border-t transition-opacity duration-500 ease-in-out ${
              fadingOut ? "opacity-0" : "opacity-100"
            }`}
            onTransitionEnd={() => {
              if (fadingOut) {
                setFadingOut(false);
                setCanSign(false);
              }
            }}
          >

            {user?.isSuperuser && eligibleSigners.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sign as:
                </label>
                <select
                  className="border rounded px-3 py-1 text-sm w-full"
                  value={signingAs ?? ""}
                  onChange={(e) => setSigningAs(e.target.value)}
                >
                  {eligibleSigners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative w-full mb-6">
              {/* Canvas */}
              <canvas
                ref={canvasRef}
                className="w-full touch-none"   // <-- make sure touch events hit canvas
              />

              {/* Placeholder text + pen icon (pointer-events NONE for the wrapper too) */}
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center gap-2 text-gray-300 text-lg pointer-events-none">
                  <FiPenTool className="text-xl" />
                  <span>Please sign here</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex gap-4">
                <button
                  onClick={handleSignatureSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Submit
                </button>
                <button
                  onClick={handleRefuseSignature}
                  className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
                >
                  Refuse to Sign
                </button>
              </div>

              <button
                onClick={handleClear}
                className="ml-auto px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        <div className="pt-0 border-t mt-6 text-sm text-gray-700 space-y-1">

          {user?.isSuperuser && (
            <div className="pt-6">
              <p>
                <strong>Approved:</strong> {quote.approved ? "Yes" : "No"}
              </p>
              {quote.approved && quote.approved_at && (
                <p>
                  <strong>Approved at:</strong>{" "}
                  {new Date(quote.approved_at).toLocaleString()}
                </p>
              )}
              <p>
                <strong>Created by:</strong> {quote.created_by?.name}
              </p>
              <p>
                <strong>Created at:</strong>{" "}
                {new Date(quote.created_at).toLocaleString()}
              </p>
            </div>
          )}
          

          {user?.isSuperuser && quote.flag_count > 0 && (
            <div>
              <p className=" mb-2 text-sm text-gray-700">
                <strong>This quote has been flagged by {quote.flag_count} {quote.flag_count === 1 ? "user" : "users"}:</strong>
              </p>
              <ul className="list-disc list-inside ml-4 text-gray-600">
                {quote.flagged_by_users.map((user) => (
                  <li key={user.id}>{user.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {user && (
          <div className="flex gap-3 mt-4 flex-wrap">
            {user.isSuperuser && (
              <>
                <button
                  onClick={() => navigate(`/quote/${quote.id}/edit`)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800 transition"
                >
                  Delete
                </button>
              </>
            )}
            {quote.visible && (
              <button
                onClick={handleFlagQuote}
                disabled={quote.has_flagged}
                className={`px-4 py-2 rounded transition ${
                  quote.has_flagged
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-yellow-500 text-white hover:bg-yellow-600"
                }`}
              >
                {quote.has_flagged ? "Flagged for Review" : "Petition to Hide"}
              </button>
            )}
          </div>
        )}
          {showImageModal && (
            <div
              className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
              onClick={() => setShowImageModal(false)}
            >
              <img
                src={quote.quote_source_image}
                alt="Full Quote Source"
                className="max-h-[90vh] max-w-[90vw] rounded shadow-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
      </div>
  );

}

export default QuoteDetailPage;
