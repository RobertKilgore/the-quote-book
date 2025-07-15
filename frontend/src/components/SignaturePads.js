import React, { useState, useEffect } from "react";
import SignaturePadSingle from "./SignaturePadSingle";
import useAppContext from "../context/useAppContext";

export default function SignaturePads({ quote, setQuote }) {
  const { user } = useAppContext();
  const [visibleIds, setVisibleIds] = useState([]);

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

  return (
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
