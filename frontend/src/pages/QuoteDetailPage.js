import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import SignaturePad from "signature_pad";
import { FiGlobe, FiLock } from "react-icons/fi";
import { confirmAlert } from "react-confirm-alert";
import ErrorBanner from "../components/ErrorBanner"; // ✅ NEW IMPORT
import EmptyState from "../components/EmptyState";
import getCookie from "../utils/getCookie";
import { useSignature } from "../context/SignatureContext";
import { useUnapprovedQuotes } from "../context/UnapprovedQuoteContext";
import LoadingPage from "../pages/LoadingPage";


function QuoteDetailPage({user}) {
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);
  const [signingAs, setSigningAs] = useState(null);
  const canvasRef = useRef(null);
  const [signaturePad, setSignaturePad] = useState(null);
  const { refreshCount } = useSignature();
  const { refreshUnapprovedCount } = useUnapprovedQuotes();

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
      const eligible = quote.participants.filter((p) => {
        const match = quote.signatures.find((sig) => sig.user === p.id);
        return !match || (!match.signature_image && !match.refused);
      });
      if (eligible.length > 0) {
        setSigningAs(eligible[0].id);
      }
    }
  }, [user, quote]);

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

      pad = new SignaturePad(canvas, {
        minWidth,
        maxWidth,
      });

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
      window.location.reload();
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
      window.location.reload();
    } catch {
      setError("Error refusing to sign.");
    }
  };

  const handleClear = () => {
    signaturePad?.clear();
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

  //if (loading) return <LoadingPage />;

  if (error) {
    return  (<EmptyState title="Oops!" message={error}/>)
  }

  if (!quote || !user) return;

  const displayDate = quote.date
    ? new Date(quote.date).toLocaleDateString()
    : "Unknown";
  const displayTime = quote.time || "Unknown";

  const eligibleSigners = quote.participants.filter((p) => {
    const match = quote.signatures.find((sig) => sig.user === p.id);
    return !match || (!match.signature_image && !match.refused);
  });

  const userIsParticipant = quote.participants.some(
    (p) => String(p.id) === String(user?.id)
  );

  const userHasSignedOrRefused = quote.signatures.some(
    (sig) => sig.user === user?.id && (sig.signature_image || sig.refused)
  );

  const adminHasEligibleUsers =
    user?.isSuperuser &&
    quote.participants.some((p) => {
      const sig = quote.signatures.find((s) => s.user === p.id);
      return !sig || (!sig.signature_image && !sig.refused);
    });

  const canSign =
    user &&
    quote.approved &&
    ((userIsParticipant && !userHasSignedOrRefused) ||
      adminHasEligibleUsers);

  return (
    <>
      <ErrorBanner message={error} />
      <div className="relative max-w-4xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg space-y-6">
        <div className="absolute top-12 right-4">
          <div className="bg-white shadow-md ring-1 ring-gray-200 rounded-full p-2">
            {quote.visible ? (
              <FiGlobe className="text-blue-500 text-xl" />
            ) : (
              <FiLock className="text-yellow-500 text-xl" />
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center mb-2">Quote Details</h2>

        <div className="text-center text-sm text-gray-600">
          <p>
            <strong>Date:</strong> {displayDate} &nbsp;&nbsp;{" "}
            <strong>Time:</strong> {displayTime}
          </p>
        </div>

        <div className="space-y-2 mt-6">
          {quote.lines.map((line, idx) => (
            <div key={idx} className="pl-4 border-l-4 border-blue-400">
              {quote.redacted ? (
                <p className="text-red-600 font-bold">
                  {line.speaker_name}: [REDACTED]
                </p>
              ) : (
                <p>
                  <span className="font-semibold">{line.speaker_name}</span>:{" "}
                  {line.text}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          {quote.participants.map((p, idx) => {
            const sig = quote.signatures.find((s) => s.user === p.id);
            return (
              <div
                key={idx}
                className="border border-gray-300 px-3 py-2 rounded shadow-sm flex flex-col items-center text-sm bg-gray-50"
              >
                <span className="font-semibold">{p.username}</span>
                {sig?.refused ? (
                  <span className="text-red-600 font-medium mt-1">
                    Refusal to sign
                  </span>
                ) : sig?.signature_image ? (
                  <img
                    src={sig.signature_image}
                    alt="signature"
                    className="h-12 mt-1"
                  />
                ) : (
                  <span className="text-gray-400 italic mt-1">
                    No signature yet
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {canSign && (
          <div className="mt-10 pt-6 border-t">
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
                  value={signingAs}
                  onChange={(e) => setSigningAs(e.target.value)}
                >
                  {eligibleSigners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.username}
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

            <div className="flex gap-4">
              <button
                onClick={handleSignatureSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Submit Signature
              </button>
              <button
                onClick={handleRefuseSignature}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Refuse to Sign
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
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
          <p>
            <strong>Created by:</strong> {quote.created_by?.username}
          </p>
          <p>
            <strong>Created at:</strong>{" "}
            {new Date(quote.created_at).toLocaleString()}
          </p>
        </div>

        {user?.isSuperuser && (
          <div className="flex gap-3 pt-6">
            <button
              onClick={() => navigate(`/quote/${quote.id}/edit`)}
              className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800 transition"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default QuoteDetailPage;
