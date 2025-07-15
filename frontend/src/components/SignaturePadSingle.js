import React, { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { FiPenTool } from "react-icons/fi";
import { HiOutlineArrowPath } from "react-icons/hi2";
import api from "../api/axios";
import getCookie from "../utils/getCookie";
import useAppContext from "../context/useAppContext";
import useRefreshAllQuoteContexts from "../utils/refreshAllQuoteContexts";

const SIG_RATIO     = 4;
const FADE_DURATION = 500;      // ms – matches Tailwind
const MS_DAY        = 24 * 60 * 60 * 1000;

export default function SignaturePadSingle({
  signerId, signerName, quote, setQuote, onFadeOut,
}) {
  const { setError }      = useAppContext();
  const refreshAll        = useRefreshAllQuoteContexts();
  const canvasRef         = useRef(null);
  const padRef            = useRef(null);

  const [hasDrawn, setHasDrawn]       = useState(false);
  const [fading,   setFading]         = useState(false);
  const [renderMe, setRenderMe]       = useState(true);
  const [localErr, setLocalErr]       = useState("");
  const [countStr, setCountStr]       = useState("");
  const [showCountdown, setShowCountdown] = useState(!!quote.approved);


  useEffect(() => {
    if (!quote.approved) return;

    const expireAt = new Date(quote.approved_at);
    expireAt.setDate(expireAt.getDate() + 14);
    expireAt.setHours(0, 0, 0, 0);          // next midnight server TZ

    const update = () => {
      const now = new Date();
      const diff = expireAt - now;
      if (diff <= 0) {
        setShowCountdown(false);   
        fadeNotify();         
        refreshQuote();                    
        return;
      }
      const d   = Math.floor(diff / 86_400_000);
      const hrs = Math.floor((diff % 86_400_000) / 3_600_000);
      const min = Math.floor((diff % 3_600_000) / 60_000);
      setCountStr(
        `${d}d ${hrs}h ${min}m to expire`
      );
    };

    update();                               // initial paint
    const t = setInterval(update, 60_000);  // update every minute
    return () => clearInterval(t);
  }, [quote.approved, quote.approved_at]);  //  ← dependencies

  /* ─────────────── draw guide line + “X” ─────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const dpr    = Math.max(window.devicePixelRatio || 1, 1);

    const paint = () => {
      const w = canvas.parentElement.clientWidth;
      const h = w / SIG_RATIO;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width  = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const pad = w * 0.10;
      const y   = 0.75 * h;
      const xSz = (w - 2 * pad) / 50;
      const cx  = pad + xSz;
      const cy  = y - xSz / 2;

      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth   = 1.5;
      ctx.beginPath(); ctx.moveTo(cx - xSz/2, cy - xSz/2); ctx.lineTo(cx + xSz/2, cy + xSz/2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - xSz/2, cy + xSz/2); ctx.lineTo(cx + xSz/2, cy - xSz/2); ctx.stroke();

      ctx.beginPath(); ctx.moveTo(pad + xSz*2, y); ctx.lineTo(w - pad, y); ctx.stroke();
    };

    padRef.current = new SignaturePad(canvas, {
      minWidth: 0.6, maxWidth: 2.5, onBegin: () => setHasDrawn(true),
    });

    paint();
    window.addEventListener("resize", paint);
    return () => { padRef.current.off(); window.removeEventListener("resize", paint); };
  }, []);

  /* ─────────────── countdown timer ─────────────── */
  useEffect(() => {
    if (!quote.approved || !quote.approved_at) return;

    // ➊ base expiry = approved_at + 14 days
    const base = new Date(quote.approved_at).getTime() + 14 * MS_DAY;
    // ➋ find next midnight (server local tz) **after** that
    const local = new Date(base);
    local.setHours(0, 0, 0, 0);
    const expiry = (base > local.getTime()) ? local.getTime() + MS_DAY : local.getTime();

    const interval = setInterval(() => {
      const diff = expiry - Date.now();
      if (diff <= 0) {
        setCountStr("Expired");
        clearInterval(interval);
        return;
      }
      const d = Math.floor(diff / MS_DAY);
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      const hh = h.toString().padStart(2, '0');
      const mm = m.toString().padStart(2, '0');
      const ss = s.toString().padStart(2, '0');

      setCountStr(`${d}:${hh}:${mm}:${ss} until expiration`);
    }, 1000);

    return () => clearInterval(interval);
  }, [quote.approved, quote.approved_at]);


  /* ─────────────── helpers ─────────────── */
  const clear = () => { 
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const dpr    = Math.max(window.devicePixelRatio || 1, 1);

    const paint = () => {
      const w = canvas.parentElement.clientWidth;
      const h = w / SIG_RATIO;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width  = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const pad = w * 0.10;
      const y   = 0.75 * h;
      const xSz = (w - 2 * pad) / 50;
      const cx  = pad + xSz;
      const cy  = y - xSz / 2;

      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth   = 1.5;
      ctx.beginPath(); ctx.moveTo(cx - xSz/2, cy - xSz/2); ctx.lineTo(cx + xSz/2, cy + xSz/2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - xSz/2, cy + xSz/2); ctx.lineTo(cx + xSz/2, cy - xSz/2); ctx.stroke();

      ctx.beginPath(); ctx.moveTo(pad + xSz*2, y); ctx.lineTo(w - pad, y); ctx.stroke();
    };

    padRef.current.clear();
    paint();
    setHasDrawn(false); 
    setLocalErr(""); 
  };

  const refreshQuote = async () => {
    const { data } = await api.get(`/api/quotes/${quote.id}/`, { withCredentials:true });
    setQuote(data);
    return data;
  };

  const fadeNotify = () => {
    setFading(true);
    setTimeout(() => { setRenderMe(false); onFadeOut?.(signerId); }, FADE_DURATION);
  };

  const submitRefuse = async (refuse=false) => {
    if (!refuse && padRef.current.isEmpty()) { setLocalErr("Please provide a signature first."); return; }

    const url  = refuse ? "/api/signatures/refuse/" : "/api/signatures/submit/";
    const body = refuse
      ? { quote_id: quote.id, sign_as_user_id: signerId }
      : { quote_id: quote.id, signature_image: padRef.current.toDataURL("image/png"), sign_as_user_id: signerId };

    try {
      await api.post(url, body, { withCredentials:true, headers:{ "X-CSRFToken": getCookie("csrftoken") }});
      await refreshQuote(); refreshAll(); fadeNotify();
    } catch { setError(refuse? "Failed to refuse." : "Failed to submit signature."); }
  };

  if (!renderMe) return null;

  /* ─────────────── render ─────────────── */
  return (
    <div className={`transition-opacity duration-1000 ${fading? "opacity-0 scale-95 pointer-events-none":"opacity-100"}`}>
      <div className="border rounded-xl shadow p-4 space-y-4 bg-white">
        {/* header row */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">{signerName}</h3>

          {/* countdown (only if approved) */}
    {showCountdown && countStr && (
      <div className="absolute left-1/2 transform -translate-x-1/2
                      bg-gray-100 rounded-md px-2 py-1
                      text-xs font-bold text-red-600 shadow-sm">
        {countStr}
      </div>
    )}

          <button onClick={clear} title="Reset" className="text-gray-500 hover:text-gray-700">
            <HiOutlineArrowPath size={18}/>
          </button>
        </div>

        {/* canvas */}
        <div className="relative">
          <canvas ref={canvasRef} className="w-full rounded border touch-none"/>
          {!hasDrawn && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-300 gap-2 pointer-events-none">
              <FiPenTool/><span className="text-sm">Sign here</span>
            </div>
          )}
        </div>

        {localErr && <div className="text-sm text-red-600 text-center -mt-2">{localErr}</div>}

        {/* action buttons */}
        <div className="flex justify-center gap-3 flex-wrap sm:flex-nowrap w-full">
          <button onClick={() => submitRefuse(false)}
                  className="flex-1 sm:flex-none min-w-[100px] px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition">
            Submit
          </button>
          <button onClick={() => submitRefuse(true)}
                  className="flex-1 sm:flex-none min-w-[100px] px-4 py-2 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 transition">
            Refuse
          </button>
        </div>
      </div>
    </div>
  );
}
