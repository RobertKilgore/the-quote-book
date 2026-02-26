import api from "../api/axios";
import { showConfirm } from "../components/ConfirmDialog";
import useAppContext from "../context/useAppContext";

export default function QuoteSignatures({ quote, setQuote }) {
  const { user, setError } = useAppContext();
  const isAdmin = !!user?.isSuperuser;
  console.log("QuoteSignatures admin?", user?.is_superuser, "sigId sample:", quote?.participant_status?.[0]?.signature_id);
  const guests = quote.guest_signatures || [];

  const refreshQuote = async () => {
    const res = await api.get(`/api/quotes/${quote.id}/`, { withCredentials: true });
    setQuote(res.data);
  };

  const clearSig = async (signatureId) => {
    if (!signatureId) return;

    showConfirm({
      title: "Clear Signature",
      message: "Clear this signature and reopen signing?",
      confirmText: "Yes, Clear it",
      confirmClassName: "delete-button",
      onConfirm: async () => {
        try {
          await api.post(`/api/signatures/${signatureId}/admin-clear/`, null, {
            withCredentials: true,
          });
          await refreshQuote();
        } catch {
          setError?.("Failed to clear signature.");
        }
      },
    });
  };

  const renderSigBox = (key, name, signature_image, refused, signatureId) => (
    <div
      key={key}
      className="relative border border-gray-300 px-3 py-2 rounded shadow-sm flex flex-col items-center text-sm bg-gray-50"
    >
      {isAdmin && signatureId && (
        <button
          onClick={() => clearSig(signatureId)}
          title="Clear signature"
          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white hover:bg-red-700 flex items-center justify-center shadow"
        >
          ✕
        </button>
      )}

      <span className="font-semibold">{name}</span>

      {refused ? (
        <div className="h-12 mt-1 min-w-[248px] flex items-center justify-center">
          <span className="text-red-600 font-medium text-center">Refusal to sign</span>
        </div>
      ) : signature_image ? (
        <img
          src={`${signature_image}?${Date.now()}`}
          alt="signature"
          className="h-12 mt-1 min-w-[248px] object-contain"
        />
      ) : (
        <div className="h-12 mt-1 min-w-[248px] flex items-center justify-center">
          <span className="text-gray-400 italic text-center">No signature yet</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-wrap gap-3 mt-6">
      {quote.participant_status?.map((p) =>
        renderSigBox(p.user, p.name, p.signature_image, p.refused, p.signature_id)
      )}

      {guests.map((g) =>
        renderSigBox(`guest-${g.id}`, g.name, g.signature_image, g.refused, g.id)
      )}
    </div>
  );
}