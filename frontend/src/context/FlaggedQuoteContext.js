import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const FlaggedQuoteContext = createContext();

export function FlaggedQuoteProvider({ children }) {
  const [flaggedCount, setFlaggedCount] = useState(0);

  const refreshFlaggedCount = () => {
    api.get("/quotes/flagged/", { withCredentials: true })
      .then(res => {
        setFlaggedCount(res.data.length);
      })
      .catch((error) => {
        console.error("Failed to fetch unapproved quote count", error);
        setFlaggedCount(0);
      });
  };

  useEffect(() => {
    refreshFlaggedCount();
  }, []);

  return (
    <FlaggedQuoteContext.Provider value={{ flaggedCount, refreshFlaggedCount }}>
      {children}
    </FlaggedQuoteContext.Provider>
  );
}

export function useFlaggedQuotes() {
  return useContext(FlaggedQuoteContext);
}