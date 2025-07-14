import { useSignature } from "../context/SignatureContext";
import { useUnapprovedQuotes } from "../context/UnapprovedQuoteContext";
//import { useUnapprovedUserCount } from "../context/UnapprovedUserContext";
import { useUnratedQuotes } from "../context/UnratedQuoteContext";
import { useFlaggedQuotes } from "../context/FlaggedQuoteContext";
import { useUser } from "../context/UserContext";

export default function useRefreshAllQuoteContexts() {
  const { refreshCount } = useSignature();
  const { refreshUnapprovedCount } = useUnapprovedQuotes();
  //const { refreshUnapprovedUserCount } = useUnapprovedUserCount();
  const { refreshUnratedCount } = useUnratedQuotes();
  const { refreshFlaggedCount } = useFlaggedQuotes();
  const { user, setUser } = useUser();

  const refreshAll = () => {

    refreshCount?.();
    refreshUnratedCount?.();

    if (user?.isSuperUser) {
    //refreshUnapprovedUserCount?.();
    refreshFlaggedCount?.();
    refreshUnapprovedCount?.();
    }
  };

  return refreshAll;
}
