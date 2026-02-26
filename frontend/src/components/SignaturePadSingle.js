import React, { useEffect, useRef, useState } from "react";
import SignaturePad          from "signature_pad";
import { FiPenTool }         from "react-icons/fi";
import { HiOutlineArrowPath } from "react-icons/hi2";
import api           from "../api/axios";
import getCookie     from "../utils/getCookie";
import useAppContext from "../context/useAppContext";
import useRefreshAllQuoteCtx from "../utils/refreshAllQuoteContexts";

const SIG_RATIO     = 4;
const FADE_DURATION = 500;        // ms – match Tailwind
const MS_DAY        = 86_400_000;

export default function SignaturePadSingle({
  signerId,          // user id OR undefined/null for guest pad
  signerName,        // full name for user; null for guest pad
  quote,
  setQuote,
  onFadeOut,         // called after fade for registered/guest alike
}) {
  /* ───────────── context & helpers ───────────── */
  const { setError }  = useAppContext();
  const refreshAll    = useRefreshAllQuoteCtx();
  const canvasRef     = useRef(null);
  const padRef        = useRef(null);

  /* ───────────── local state ───────────── */
  const [hasDrawn,  setHasDrawn]  = useState(false);
  const [fading,    setFading]    = useState(false);
  const [visible,   setVisible]   = useState(true);
  const [errMsg,    setErrMsg]    = useState("");
  const [timer,     setTimer]     = useState("");
  const [guestName, setGuestName] = useState("");
  const isGuest = !signerId;      // no id → guest pad

  /* ───────────── countdown (registered users only) ───────────── */
  useEffect(() => {
    if (isGuest || !quote.approved || !quote.approved_at) return;

    // approved_at + 14 days, then roll to next midnight
    const base   = new Date(quote.approved_at).getTime() + 14 * MS_DAY;
    const mid    = new Date(base); mid.setHours(0,0,0,0);
    const expiry = base > mid ? mid.getTime() + MS_DAY : mid.getTime();

    const intId = setInterval(() => {
      const diff = expiry - Date.now();
      if (diff <= 0) { setTimer("Expired"); clearInterval(intId); return; }
      const d  = Math.floor(diff / MS_DAY);
      const h  = Math.floor((diff / 3_600_000) % 24).toString().padStart(2,"0");
      const m  = Math.floor((diff /   60_000) % 60).toString().padStart(2,"0");
      const s  = Math.floor((diff /    1_000) % 60).toString().padStart(2,"0");
      setTimer(`${d}:${h}:${m}:${s}`);
    }, 1_000);

    return () => clearInterval(intId);
  }, [isGuest, quote.approved, quote.approved_at]);

  /* ───────────── draw guide line + X ───────────── */
  const drawGuide = () => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const dpr    = Math.max(window.devicePixelRatio || 1, 1);
    const w      = canvas.parentElement.clientWidth;
    const h      = w / SIG_RATIO;

    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    ctx.setTransform(1,0,0,1,0,0); ctx.scale(dpr,dpr); ctx.clearRect(0,0,w,h);

    const pad = w * 0.10, y = 0.75*h, xSz = (w-2*pad)/50;
    const cx  = pad + xSz, cy = y - xSz/2;

    ctx.strokeStyle="#94a3b8"; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(cx-xSz/2,cy-xSz/2); ctx.lineTo(cx+xSz/2,cy+xSz/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx-xSz/2,cy+xSz/2); ctx.lineTo(cx+xSz/2,cy-xSz/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad+xSz*2,y); ctx.lineTo(w-pad,y); ctx.stroke();
  };

  useEffect(() => {
    padRef.current = new SignaturePad(canvasRef.current,{
      minWidth:0.6,maxWidth:2.5,onBegin:()=>setHasDrawn(true),
    });
    drawGuide();
    window.addEventListener("resize", drawGuide);
    return () => { padRef.current.off(); window.removeEventListener("resize", drawGuide); };
  }, []);

  const clearPad = () => {
    padRef.current.clear();
    drawGuide();
    setHasDrawn(false);
    setErrMsg("");
  };

  /* ───────────── API helpers ───────────── */
  const refreshQuote = async () => {
    const { data } = await api.get(`/api/quotes/${quote.id}/`, { withCredentials:true });
    setQuote(data); return data;
  };

  const fadeAndNotify = () => {
    setFading(true);
    setTimeout(() => { setVisible(false); onFadeOut?.(signerId || "guest"); }, FADE_DURATION);
  };

  const submitOrRefuse = async (refuse=false) => {
    if (!refuse && padRef.current.isEmpty())             { setErrMsg("Signature required."); return; }
    if (isGuest  && !guestName.trim() && !refuse)        { setErrMsg("Guest name required."); return; }

    const endpoint = refuse ? "/api/signatures/refuse/" : "/api/signatures/submit/";
    const payload  = {
      quote_id: quote.id,
      ...(isGuest ? { guest_name: guestName.trim() } : { sign_as_user_id: signerId }),
      ...(refuse ? {} : { signature_image: padRef.current.toDataURL("image/png") }),
    };

    try {
      await api.post(endpoint, payload, {
        withCredentials:true,
        headers:{ "X-CSRFToken": getCookie("csrftoken") }
      });
      await refreshQuote(); refreshAll();
      /* For guests we keep pad alive for next signer; for users we fade */
      if (isGuest) {
        clearPad();
        setGuestName("");
      } else {
        fadeAndNotify();
      }
    } catch (err) {
        const backendMsg = err?.response?.data?.error || err?.response?.data?.detail || "";

        const isDuplicateGuest =
          backendMsg === "Guest has already responded";


        const isDuplicateUserName =
          backendMsg === "Guest name conflicts with an existing user";
        

        if (isDuplicateGuest || isDuplicateUserName) {
          setError(backendMsg);
        } else {
          setError(refuse ? "Failed to refuse." : "Failed to submit.");
        }
      }
  };

  if (!visible) return null;

  /* ───────────── render ───────────── */
  return (
    <div className={`transition-opacity duration-1000
                     ${fading? "opacity-0 scale-95 pointer-events-none":"opacity-100"}`}>
      <div className="border rounded-xl shadow p-4 space-y-4 bg-white">

        {/* Header */}
        <div className="flex items-center justify-between mb-2 relative">
          {/* Name / guest input */}
          {isGuest ? (
            <input
              value={guestName}
              onChange={e=>setGuestName(e.target.value)}
              placeholder="Guest name"
              className="font-semibold text-gray-800 px-2 py-1 border rounded
                         w-full max-w-xs"
            />
          ) : (
            <h3 className="font-semibold text-gray-800">{signerName}</h3>
          )}

          {/* Countdown */}
          {!isGuest && timer && (
            <div className="absolute left-1/2 -translate-x-1/2
                            bg-gray-100 px-2 py-1 rounded-md shadow-sm
                            text-xs font-bold text-red-600">
              {timer}
            </div>
          )}

          <button onClick={clearPad} title="Reset"
                  className="text-gray-500 hover:text-gray-700 ml-2 flex-none">
            <HiOutlineArrowPath size={18}/>
          </button>
        </div>

        {/* Canvas */}
        <div className="relative">
          <canvas ref={canvasRef} className="w-full rounded border touch-none" />
          {!hasDrawn && (
            <div className="absolute inset-0 flex items-center justify-center
                            gap-2 text-gray-300 pointer-events-none">
              <FiPenTool/><span className="text-sm">Sign here</span>
            </div>
          )}
        </div>

        {errMsg && <div className="text-sm text-red-600 text-center -mt-2">{errMsg}</div>}

        {/* Action buttons */}
        <div className="flex justify-center gap-3 flex-wrap sm:flex-nowrap w-full">
          <button onClick={()=>submitOrRefuse(false)}
                  className="flex-1 sm:flex-none min-w-[100px] px-4 py-2
                             bg-blue-600 text-white rounded-lg shadow-sm
                             hover:bg-blue-700 transition">Submit</button>
          <button onClick={()=>submitOrRefuse(true)}
                  className="flex-1 sm:flex-none min-w-[100px] px-4 py-2
                             bg-red-600 text-white rounded-lg shadow-sm
                             hover:bg-red-700 transition">Refuse</button>
        </div>
      </div>
    </div>
  );
}
