import React, { useState, useEffect } from "react";
import SignaturePadSingle from "./SignaturePadSingle";
import useAppContext from "../context/useAppContext";
import { MdScreenRotation } from "react-icons/md";


export default function SignaturePads({ quote, setQuote }) {
  const { user } = useAppContext();
  const [visibleIds, setVisibleIds] = useState([]);
  const [isTooNarrow, setIsTooNarrow] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsTooNarrow(width < 500 && height > width); // portrait + narrow screen
    };

    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  /* refresh eligibility → merge into list (never shrink automatically) */
  useEffect(() => {
    const fresh = quote.participants_detail
      .filter(p => {
        const m = quote.signatures.find(s => s.user === p.id);
        return !m || (!m.signature_image && !m.refused);
      })
      .map(p => p.id);

    setVisibleIds(prev => Array.from(new Set([...prev, ...fresh])));
  }, [quote]);

  const handleFadeOut = (id) =>
    setVisibleIds(ids => ids.filter(x => x !== id));

  /* ───────────────── render list ───────────────── */
  const toRender = quote.participants_detail.filter(p => visibleIds.includes(p.id));

  if (!user.isSuperuser){
    const me = toRender.find(p => String(p.id) === String(user.id));
    return me
      ? <SignaturePadSingle
          signerId={me.id} signerName={me.name}
          quote={quote} setQuote={setQuote}
          onFadeOut={handleFadeOut}/>
      : null;
  }

  return isTooNarrow ? (
  <div className="p-6 text-center text-gray-700 bg-yellow-100 border border-yellow-300 rounded-lg shadow flex flex-col items-center justify-center space-y-3">
    <MdScreenRotation className="text-5xl text-black-600 animate-pulse " />
    <p className="text-lg font-semibold">Rotate Your Device</p>
    <p className="text-sm text-gray-600">Please switch to landscape mode to sign.</p>
  </div>
  ) : (
    <div className="space-y-8">
      {toRender.map(p => (
        <SignaturePadSingle
          key={p.id}
          signerId={p.id}
          signerName={p.name}
          quote={quote}
          setQuote={setQuote}
          onFadeOut={handleFadeOut}
        />
      ))}
    </div>
  );
}
