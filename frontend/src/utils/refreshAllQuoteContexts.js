import { useSignature } from "../context/SignatureContext";
import { useUnapprovedQuotes } from "../context/UnapprovedQuoteContext";
import { useUnapprovedUserCount } from "../context/UnapprovedUserContext";
import { useUnratedQuotes } from "../context/UnratedQuoteContext";
import { useFlaggedQuotes } from "../context/FlaggedQuoteContext";

export default function useRefreshAllQuoteContexts() {
  const { refreshCount } = useSignature();
  const { refreshUnapprovedCount } = useUnapprovedQuotes();
  //const { refreshUnapprovedUserCount } = useUnapprovedUserCount();
  const { refreshUnratedCount } = useUnratedQuotes();
  const { refreshFlaggedCount } = useFlaggedQuotes();

  const refreshAll = () => {
    refreshCount?.();
    refreshUnapprovedCount?.();
    //refreshUnapprovedUserCount?.();
    refreshUnratedCount?.();
    refreshFlaggedCount?.();
  };

  return refreshAll;
}
