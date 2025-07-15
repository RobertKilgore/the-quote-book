import React, { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { FiPenTool } from "react-icons/fi";
import { HiOutlineArrowPath } from "react-icons/hi2";
import api from "../api/axios";
import getCookie from "../utils/getCookie";
import useAppContext from "../context/useAppContext";
import useRefreshAllQuoteContexts from "../utils/refreshAllQuoteContexts";

const SIG_RATIO = 4;
const FADE_DURATION = 500; // ms, must match Tailwind class

export default function SignaturePadSingle({
  signerId,
  signerName,
  quote,
  setQuote,
  onFadeOut,
}) {
  const { setError } = useAppContext();
  const refreshAll = useRefreshAllQuoteContexts();
  const canvasRef = useRef(null);
  const padRef = useRef(null);

  const [hasDrawn, setHasDrawn] = useState(false);
  const [fading, setFading] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const [localErr, setLocalErr] = useState("");

  useEffect(() => {
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

      const pad = w * 0.1;
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pad, 0.75 * h);
      ctx.lineTo(w - pad, 0.75 * h);
      ctx.stroke();
    };

    paintGuide();
    padRef.current = new SignaturePad(canvas, {
      minWidth: 0.6,
      maxWidth: 2.5,
      onBegin: () => setHasDrawn(true),
    });

    window.addEventListener("resize", paintGuide);
    return () => {
      padRef.current.off();
      window.removeEventListener("resize", paintGuide);
    };
  }, []);

  const clear = () => {
    padRef.current.clear();
    setHasDrawn(false);
    setLocalErr("");
  };

  const refreshQuote = async () => {
    const res = await api.get(`/api/quotes/${quote.id}/`, { withCredentials: true });
    setQuote(res.data);
    return res.data;
  };

  const fadeAndNotify = () => {
    setFading(true);
    setTimeout(() => {
      setShouldRender(false);
      onFadeOut?.(signerId);
    }, FADE_DURATION);
  };

  const submitOrRefuse = async (refuse = false) => {
    if (!refuse && padRef.current.isEmpty()) {
      setLocalErr("Please provide a signature first.");
      return;
    }
    try {
      const body = refuse
        ? { quote_id: quote.id, sign_as_user_id: signerId }
        : {
            quote_id: quote.id,
            signature_image: padRef.current.toDataURL("image/png"),
            sign_as_user_id: signerId,
          };

      const url = refuse ? "/api/signatures/refuse/" : "/api/signatures/submit/";

      await api.post(url, body, {
        withCredentials: true,
        headers: { "X-CSRFToken": getCookie("csrftoken") },
      });

      await refreshQuote();
      refreshAll();
      fadeAndNotify();
    } catch {
      setError(refuse ? "Failed to refuse." : "Failed to submit signature.");
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`transition-opacity duration-1000 ease-in-out ${
        fading ? "opacity-0 scale-95 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="border rounded-xl shadow p-4 space-y-4 bg-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">{signerName}</h3>
          <button
            onClick={clear}
            title="Reset"
            className="text-gray-500 hover:text-gray-700"
          >
            <HiOutlineArrowPath size={18} />
          </button>
        </div>

        <div className="relative">
          <canvas ref={canvasRef} className="w-full touch-none rounded border" />
          {!hasDrawn && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-300 gap-2 pointer-events-none">
              <FiPenTool />
              <span className="text-sm">Sign here</span>
            </div>
          )}
        </div>

        {localErr && (
          <div className="text-sm text-red-600 text-center -mt-2">{localErr}</div>
        )}

        <div className="flex justify-center gap-4">
          <button
            onClick={() => submitOrRefuse(false)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition"
          >
            Submit
          </button>
          <button
            onClick={() => submitOrRefuse(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 transition"
          >
            Refuse
          </button>
          <button
            onClick={fadeAndNotify}
            className="px-3 py-2 bg-gray-300 text-gray-700 rounded shadow-sm hover:bg-gray-400 transition"
          >
            Test Fade
          </button>
        </div>
      </div>
    </div>
  );
}
