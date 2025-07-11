import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiX } from "react-icons/fi";
import api from "../api/axios";
import SignaturePad from "signature_pad";
import { confirmAlert } from "react-confirm-alert";
import ErrorBanner from "../components/ErrorBanner";
import EmptyState from "../components/EmptyState";
import getCookie from "../utils/getCookie";
import { useSignature } from "../context/SignatureContext";
import { useUnapprovedQuotes } from "../context/UnapprovedQuoteContext";
import VisibilityChip from "../components/VisibilityChip";
import RarityChip from "../components/RarityChip"; 


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
    hover: "hover:bg-gray-100"
  },
  uncommon: {
    text: "text-green-800",
    bg: "bg-green-100",
    border: "border-green-300",
    hover: "hover:bg-green-200"
  },
  rare: {
    text: "text-blue-800",
    bg: "bg-blue-100",
    border: "border-blue-300",
    hover: "hover:bg-blue-200"
  },
  epic: {
    text: "text-purple-800",
    bg: "bg-purple-100",
    border: "border-purple-300",
    hover: "hover:bg-purple-200"
  },
  legendary: {
    text: "text-yellow-900",
    bg: "bg-yellow-100",
    border: "border-yellow-300",
    hover: "hover:bg-yellow-200"
  }
};


function QuoteDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);
  const [signingAs, setSigningAs] = useState(null);
  const [canSign, setCanSign] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  const canvasRef = useRef(null);
  const [signaturePad, setSignaturePad] = useState(null);

  const { refreshCount } = useSignature();
  const { refreshUnapprovedCount } = useUnapprovedQuotes();
  const [showImageModal, setShowImageModal] = useState(false);

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

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const context = canvas.getContext("2d");

    let pad = null;

    const resizeCanvas = () => {
      const displayWidth = canvas.offsetWidth;
      const displayHeight = displayWidth / 5;
      canvas.width = displayWidth * ratio;
      canvas.height = displayHeight * ratio;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(ratio, ratio);
      const baseWidth = 800;
      const scaleFactor = displayWidth / baseWidth;
      const minWidth = 0.5 * scaleFactor;
      const maxWidth = 2.0 * scaleFactor;

      pad = new SignaturePad(canvas, { minWidth, maxWidth });
      pad.clear();
      setSignaturePad(pad);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (pad) pad.off?.();
    };
  }, [quote]);

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
      refreshCount();

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
      refreshCount();

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
      setError("Error refusing to sign.");
    }
  };

  const handleClear = () => signaturePad?.clear();

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
              refreshUnapprovedCount();
              refreshCount();
              navigate("/");
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
    } catch {
      setError("Failed to flag quote.");
    }
  };

  
  const handleVote = async (rarity) => {
    try {
      const res = await api.post(`/quotes/${quote.id}/vote/`, { rarity }, {
        withCredentials: true,
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });
      setQuote(res.data);
    } catch {
      setError("Failed to register vote.");
    }
  };

  const clearVote = async () => {
  try {
    const res = await api.post(`/quotes/${quote.id}/vote/`, { rarity: null }, {
      withCredentials: true,
      headers: { "X-CSRFToken": getCookie("csrftoken") },
    });
    setQuote(res.data); // assumes backend returns full updated quote
  } catch {
    setError("Failed to clear vote.");
  }
};

  const currentVote = quote?.user_vote;

  //if (error) return <EmptyState title="Oops!" message={error} />;
  if (!quote || !user) return null;

  const displayDate = quote.date
    ? new Date(quote.date).toLocaleDateString()
    : "Unknown";
  const displayTime = quote.time || "Unknown";

  const eligibleSigners = quote.participants_detail.filter((p) => {
    const match = quote.signatures.find((sig) => sig.user === p.id);
    return !match || (!match.signature_image && !match.refused);
  });


  return (
        <>
      <ErrorBanner message={error} />
      <div className={`max-w-4xl mx-auto mt-10 p-6 rounded-xl shadow-lg space-y-6 transition-all duration-300 ${rarityColors[quote?.rank] || "bg-white"}`}>
        {quote && <RarityChip rarity={quote.rank} size='large'/>}

        <VisibilityChip quote={quote} />
        <h2 className="text-2xl font-bold text-center mb-2">Quote Details</h2>

        <div className="text-center text-sm text-gray-600">
          <p>
            <strong>Date:</strong> {quote.date || "Unknown"} &nbsp;&nbsp;
            <strong>Time:</strong> {quote.time || "Unknown"}
          </p>
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
        <div className="mt-6 pt-4 border-t">
          <h3 className="text-lg font-semibold mb-3">Vote on Quote Rarity</h3>
            <div className="flex gap-3 flex-wrap">
              {rarityLabels.map((rarity) => {
                const isSelected = currentVote === rarity;
                const color = rarityColorMap[rarity];

                return (
                  <button
                    key={rarity}
                    onClick={() => handleVote(rarity)}
                    className={`relative px-4 py-2 rounded-full border transition-all duration-200 
                      ${isSelected ? "ring-2 ring-black" : ""}
                      ${color.bg} ${color.text} ${color.border} ${color.hover}
                    `}
                    title={
                      quote.rank_votes?.[rarity]?.length
                        ? quote.rank_votes[rarity].map((u) => u.name).join(", ")
                        : "No votes yet"
                    }
                  >
                    {rarity.charAt(0).toUpperCase() + rarity.slice(1)}{" "}
                    ({quote.rank_votes?.[rarity]?.length || 0})
                  </button>
                );
              })}
                {/* Clear Vote Button */}
                <button
                  onClick={clearVote}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 transition"
                  title="Remove your vote"
                >
                  <FiX className="w-5 h-5" />
                  {/* <span className="hidden sm:inline">Clear Vote</span> */}
                </button>
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
            <h3 className="text-xl font-semibold mb-2">Sign this Quote</h3>
            <p className="mb-4 text-gray-600">
              Please sign below or refuse to sign.
            </p>

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

            <div className="bg-gray-100 p-4 rounded shadow-inner mb-4">
              <canvas
                ref={canvasRef}
                className="bg-white border rounded"
                style={{ width: "100%", aspectRatio: "5 / 1" }}
                width={800}
                height={160}
              />
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

        <div className="pt-6 border-t mt-6 text-sm text-gray-700 space-y-1">
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
    </>
  );

}

export default QuoteDetailPage;
