import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import { useUser } from "./UserContext";

const UnratedQuoteContext = createContext();

export function UnratedQuoteProvider({ children }) {
  const [unratedCount, setUnratedCount] = useState(0);
  const userContext = useUser();
  const user = userContext?.user;

  const refreshUnratedCount = useCallback(() => {
    if (!user) {
      setUnratedCount(0);
      return;
    }

    api.get("/quotes/unrated/count/", { withCredentials: true, cache: false })
      .then(res => {
        setUnratedCount(res.data.count);
      })
      .catch(() => {
        setUnratedCount(0);
      });
  }, [user?.id, user?.isSuperuser]);

  useEffect(() => {
    refreshUnratedCount();
  }, [refreshUnratedCount]);

  return (
    <UnratedQuoteContext.Provider value={{ unratedCount, refreshUnratedCount }}>
      {children}
    </UnratedQuoteContext.Provider>
  );
}

export function useUnratedQuotes() {
  return useContext(UnratedQuoteContext);
}
