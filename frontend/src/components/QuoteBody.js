// components/QuoteBody.jsx
import React, { useState } from "react";
import QuoteMetadata from "./QuoteMetaData";
import QuoteLines from "./QuoteLines";
import QuoteNotes from "./QuoteNotes";
import QuoteSignatures from "./QuoteSignatures";

export default function QuoteBody({ quote }) {
  const [showImageModal, setShowImageModal] = useState(false);

  if (!quote) return null;

  const rarityColors = {
    common: "bg-white",
    uncommon: "bg-green-50",
    rare: "bg-blue-50",
    epic: "bg-purple-50",
    legendary: "bg-yellow-50",
  };

  return (
    <div>
      <QuoteMetadata quote={quote} />
      <QuoteLines quote={quote} />
      <QuoteSignatures quote={quote} />
      <QuoteNotes quote={quote} setShowImageModal={setShowImageModal} />

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
  );
}