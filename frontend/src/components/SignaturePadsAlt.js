// components/SignaturePadsAlt.jsx
import React, { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { FiPenTool }       from "react-icons/fi";
import { HiOutlineArrowPath } from "react-icons/hi2";
import api            from "../api/axios";
import getCookie      from "../utils/getCookie";
import useAppContext  from "../context/useAppContext";
import useRefreshAllQuoteContexts from "../utils/refreshAllQuoteContexts";

const SIG_RATIO     = 4;
const FADE_DURATION = 700;     // ms (keep in sync with duration‑700 below)

export default function SignaturePadsAlt({ quote, setQuote }) {
  const { user, setError } = useAppContext();
  const refreshAll         = useRefreshAllQuoteContexts();

  /** store signer‑IDs we *should* still render (even while fading) */
  const [activeIds, setActiveIds] = useState([]);

  /** build list of *currently* eligible IDs whenever quote changes */
  useEffect(() => {
    const freshEligible = quote.participants_detail
      .filter(p => {
        const match = quote.signatures.find(s => s.user === p.id);
        return !match || (!match.signature_image && !match.refused);
      })
      .map(p => p.id);

    // ensure any already‑active IDs remain, then add any new eligible
    setActiveIds(prev => Array.from(new Set([...prev, ...freshEligible])));
  }, [quote]);

  /* ---------- helper ---------- */
  const doRequest = async (url, body) => {
    await api.post(url, body, {
      withCredentials: true,
      headers: { "X-CSRFToken": getCookie("csrftoken") }
    });
  };

  const refreshQuote = async () => {
    const res = await api.get(`/api/quotes/${quote.id}/`, { withCredentials: true });
    setQuote(res.data);
    return res.data;
  };

  /* ---------- individual pad component (inner) ---------- */
  const Pad = ({ signer }) => {
    const canvasRef = useRef(null);
    const padRef    = useRef(null);
    const [hasDrawn, setHasDrawn]     = useState(false);
    const [fading,   setFading]       = useState(false);
    const [err,      setLocalErr]     = useState("");

    /* init signature‑pad */
    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx    = canvas.getContext("2d");
      const dpr    = Math.max(window.devicePixelRatio || 1, 1);

      const paintGuide = () => {
        const w = canvas.parentElement.clientWidth;
        const h = w / SIG_RATIO;
        canvas.width  = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width  = `${w}px`;
        canvas.style.height = `${h}px`;

        ctx.setTransform(1,0,0,1,0,0);
        ctx.scale(dpr,dpr);
        ctx.clearRect(0,0,w,h);

        const pad = w*0.1;
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth   = 1.5;
        ctx.beginPath(); ctx.moveTo(pad,0.75*h); ctx.lineTo(w-pad,0.75*h); ctx.stroke();
      };

      paintGuide();
      padRef.current = new SignaturePad(canvas,{
        minWidth:0.6,maxWidth:2.5,onBegin:()=>setHasDrawn(true)
      });
      window.addEventListener("resize",paintGuide);
      return () => {
        padRef.current.off();
        window.removeEventListener("resize",paintGuide);
      };
    }, []);

    const clear = () => { padRef.current.clear(); setHasDrawn(false); setLocalErr(""); };

    const fadeThenRemove = () => {
      setFading(true);
      setTimeout(() => {
        setActiveIds(ids => ids.filter(id => id !== signer.id));
      }, FADE_DURATION);
    };

    const submitOrRefuse = async (refuse=false) => {
      if (!refuse && padRef.current.isEmpty()){
        setLocalErr("Please provide a signature first."); return;
      }
      try {
        const body = refuse
          ? { quote_id: quote.id, sign_as_user_id: signer.id }
          : { quote_id: quote.id, signature_image: padRef.current.toDataURL("image/png"),
              sign_as_user_id: signer.id };

        const url  = refuse
          ? "/api/signatures/refuse/"
          : "/api/signatures/submit/";

        await doRequest(url,body);
        await refreshQuote();
        refreshAll();
        fadeThenRemove();
      } catch { setError(refuse? "Failed to refuse." : "Failed to submit."); }
    };

    return (
      <div
        className={`transition-opacity duration-${FADE_DURATION} ease-in-out
                    ${fading?"opacity-0 pointer-events-none":"opacity-100"}`}
      >
        <div className="border rounded-xl shadow p-4 space-y-4 bg-white">
          {/* header */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800">{signer.name}</h3>
            <button onClick={clear} title="Reset"
              className="text-gray-500 hover:text-gray-700">
              <HiOutlineArrowPath size={18}/>
            </button>
          </div>

          {/* canvas */}
          <div className="relative">
            <canvas ref={canvasRef} className="w-full touch-none rounded border"/>
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center
                              text-gray-300 gap-2 pointer-events-none">
                <FiPenTool/><span className="text-sm">Sign here</span>
              </div>
            )}
          </div>

          {err && <div className="text-sm text-red-600 text-center -mt-2">{err}</div>}

          {/* buttons */}
          <div className="flex justify-center gap-4">
            <button onClick={()=>submitOrRefuse(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm
                         hover:bg-blue-700 transition">Submit</button>
            <button onClick={()=>submitOrRefuse(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-sm
                         hover:bg-red-700 transition">Refuse</button>
          </div>
        </div>
      </div>
    );
  };
  /* ---------- render ---------- */
  const signersToShow = quote.participants_detail.filter(p => activeIds.includes(p.id));

  if (!user.isSuperuser) {
    const me = signersToShow.find(p => String(p.id) === String(user.id));
    return me ? <Pad signer={me}/> : null;
  }

  return (
    <div className="space-y-8">
      {signersToShow.map(p => <Pad key={p.id} signer={p}/>)}
    </div>
  );
}
