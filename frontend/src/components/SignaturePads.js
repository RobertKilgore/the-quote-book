import React, { useState, useEffect } from "react";
import SignaturePadSingle from "./SignaturePadSingle";
import useAppContext from "../context/useAppContext";
import { MdScreenRotation } from "react-icons/md";

export default function SignaturePads({ quote, setQuote }) {
  const { user } = useAppContext();

  /* ───────────── narrow-screen detection ───────────── */
  const [isTooNarrow, setIsTooNarrow] = useState(false);
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth, h = window.innerHeight;
      setIsTooNarrow(w < 500 && h > w); // portrait + narrow screen
    };
    check(); window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);


  /* ───────────── track visible participant pads ───────────── */
  const [visibleIds, setVisibleIds] = useState([]);
  useEffect(() => {
    const fresh = quote.participants_detail
      .filter(p => {
        const sig = quote.signatures.find(s => s.user === p.id);
        return !sig || (!sig.signature_image && !sig.refused);
      })
      .map(p => p.id);

    setVisibleIds(prev => Array.from(new Set([...prev, ...fresh])));
  }, [quote]);

  const handleFadeOut = (id) => setVisibleIds(prev => prev.filter(x => x !== id));

  const activeParticipants = quote.participants_detail
    .filter(p => visibleIds.includes(p.id));

  if (isTooNarrow) {
    return (
      <div className="p-6 text-center text-gray-700 bg-yellow-100 border border-yellow-300 rounded-lg shadow
                      flex flex-col items-center justify-center space-y-3">
        <MdScreenRotation className="text-5xl animate-pulse" />
        <p className="text-lg font-semibold">Rotate your device</p>
        <p className="text-sm text-gray-600">Please switch to landscape mode to sign.</p>
      </div>
    );
  }

  /* ───────────── non-admins only see their own pad ───────────── */
  if (!user.isSuperuser) {
    const me = activeParticipants.find(p => String(p.id) === String(user.id));
    return me ? (
      <SignaturePadSingle
        signerId={me.id}
        signerName={me.name}
        quote={quote}
        setQuote={setQuote}
        onFadeOut={handleFadeOut}
      />
    ) : null;
  }

  /* ───────────── admin view ───────────── */
  return (
    <div className="space-y-8">
      {activeParticipants.map(p => (
        <SignaturePadSingle
          key={p.id}
          signerId={p.id}
          signerName={p.name}
          quote={quote}
          setQuote={setQuote}
          onFadeOut={handleFadeOut}
        />
      ))}

      {/* ───────── guest pad (always available for admins) ───────── */}
      <SignaturePadSingle
        key="guest-pad"
        signerId={null}
        signerName={null}
        quote={quote}
        setQuote={setQuote}
        onFadeOut={() => {}}
      />
    </div>
  );
}
