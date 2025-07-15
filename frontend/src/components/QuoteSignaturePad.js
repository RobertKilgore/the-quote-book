// components/QuoteSignaturePad.jsx
import React, { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import getCookie from "../utils/getCookie";
import api from "../api/axios";
import { FiPenTool } from "react-icons/fi";
import useAppContext from "../context/useAppContext";
import useRefreshAllQuoteContexts from "../utils/refreshAllQuoteContexts";
import SignaturePads from "../components/SignaturePads";

const SIG_RATIO = 4;

export default function QuoteSignaturePad({ quote, setQuote }) {
  const { user, setError } = useAppContext();
  const refreshAll = useRefreshAllQuoteContexts();

  const canvasRef = useRef(null);
  const [signaturePad, setSignaturePad] = useState(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signingAs, setSigningAs] = useState(null);
  const [canSign, setCanSign] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  const eligibleSigners = quote.participants_detail.filter((p) => {
    const match = quote.signatures.find((sig) => sig.user === p.id);
    return !match || (!match.signature_image && !match.refused);
  });

  useEffect(() => {
    if (!user || !quote) return;

    const isParticipant = quote.participants.some((p) => String(p.id) === String(user.id));
    const hasSignedOrRefused = quote.signatures.some(
      (sig) => sig.user === user.id && (sig.signature_image || sig.refused)
    );

    const adminEligible = user.isSuperuser && eligibleSigners.length > 0;

    setCanSign(quote.approved && ((isParticipant && !hasSignedOrRefused) || adminEligible));
    if (user.isSuperuser && eligibleSigners.length > 0) {
      setSigningAs(eligibleSigners[0].id);
    }
  }, [user, quote]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = Math.max(window.devicePixelRatio || 1, 1);

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

      const padding = w * 0.1;
      const lineW = w * 0.8;
      const y = 0.75 * h;

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
    };

    const pad = new SignaturePad(canvas);
    pad.onBegin = () => setHasDrawn(true);
    setSignaturePad(pad);
    paintGuide();

    window.addEventListener("resize", paintGuide);
    return () => {
      pad.off();
      window.removeEventListener("resize", paintGuide);
    };
  }, [quote]);

//   const clearSignature = () => {
//     signaturePad?.clear();
//     setHasDrawn(false);
//   };

  const refreshQuote = async () => {
    const res = await api.get(`/api/quotes/${quote.id}/`, { withCredentials: true });
    setQuote(res.data);
    return res.data;
  };

  const handleSubmit = async () => {
    if (!signaturePad || signaturePad.isEmpty()) {
      setError("Please provide a signature first.");
      return;
    }

    const dataUrl = signaturePad.toDataURL("image/png");
    const payload = {
      quote_id: quote.id,
      signature_image: dataUrl,
      sign_as_user_id: user.isSuperuser ? signingAs : user.id,
    };

    try {
      await api.post("/api/signatures/submit/", payload, {
        withCredentials: true,
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });

      const updated = await refreshQuote();
      refreshAll();

      const remaining = updated.participants_detail.filter((p) => {
        const sig = updated.signatures.find((s) => s.user === p.id);
        return !sig || (!sig.signature_image && !sig.refused);
      });

      const selfSigned = updated.signatures.some(
        (s) => s.user === user.id && (s.signature_image || s.refused)
      );

      const shouldFadeOut = (user.isSuperuser && remaining.length === 0) || (!user.isSuperuser && selfSigned);
      if (shouldFadeOut) {
        setFadingOut(true);
      } else {
        setSigningAs(remaining[0]?.id ?? null);
      }
    } catch {
      setError("Error submitting signature.");
    }
  };

  const handleRefuse = async () => {
    const payload = {
      quote_id: quote.id,
      sign_as_user_id: user.isSuperuser ? signingAs : user.id,
    };

    try {
      await api.post("/api/signatures/refuse/", payload, {
        withCredentials: true,
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });

      const updated = await refreshQuote();
      refreshAll();

      const remaining = updated.participants_detail.filter((p) => {
        const sig = updated.signatures.find((s) => s.user === p.id);
        return !sig || (!sig.signature_image && !sig.refused);
      });

      const selfSigned = updated.signatures.some(
        (s) => s.user === user.id && (s.signature_image || s.refused)
      );

      const shouldFadeOut = (user.isSuperuser && remaining.length === 0) || (!user.isSuperuser && selfSigned);
      if (shouldFadeOut) {
        setFadingOut(true);
      } else {
        setSigningAs(remaining[0]?.id ?? null);
      }
    } catch {
      setError("Error refusing to sign.");
    }
  };

  if (!canSign) return null;

  return (
    <SignaturePads quote={quote} setQuote={setQuote} />
  );
}
