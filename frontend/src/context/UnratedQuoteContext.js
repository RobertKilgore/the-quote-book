import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const UnratedQuoteContext = createContext();

export function UnratedQuoteProvider({ children }) {
  const [unratedCount, setUnratedCount] = useState(0);

    const refreshUnratedCount = () => {
    api.get("/quotes/unrated/count/", { withCredentials: true })
        .then(res => {
        setUnratedCount(res.data.count);
        })
        .catch(() => {
        setUnratedCount(0);
        });
    };

  useEffect(() => {
    refreshUnratedCount();
  }, []);

  return (
    <UnratedQuoteContext.Provider value={{ unratedCount, refreshUnratedCount }}>
      {children}
    </UnratedQuoteContext.Provider>
  );
}

export function useUnratedQuotes() {
  return useContext(UnratedQuoteContext);
}
