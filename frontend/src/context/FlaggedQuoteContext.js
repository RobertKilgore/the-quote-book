import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import { useUser } from "./UserContext";

const FlaggedQuoteContext = createContext();

export function FlaggedQuoteProvider({ children }) {
  const [flaggedCount, setFlaggedCount] = useState(0);
  const userContext = useUser();
  const user = userContext?.user;

  const refreshFlaggedCount = useCallback(() => {
    if (!user?.isSuperuser) {
      setFlaggedCount(0);
      return;
    }

    api.get("/quotes/flagged/count/", { withCredentials: true, cache: false })
      .then(res => {
        setFlaggedCount(res.data.count ?? 0);
      })
      .catch((error) => {
        console.error("Failed to fetch flagged quote count", error);
        setFlaggedCount(0);
      });
  }, [user?.id, user?.isSuperuser]);

  useEffect(() => {
    refreshFlaggedCount();
  }, [refreshFlaggedCount]);

  return (
    <FlaggedQuoteContext.Provider value={{ flaggedCount, refreshFlaggedCount }}>
      {children}
    </FlaggedQuoteContext.Provider>
  );
}

export function useFlaggedQuotes() {
  return useContext(FlaggedQuoteContext);
}