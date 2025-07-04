// src/context/UnapprovedQuoteContext.js

import React, { createContext, useContext, useState, useCallback } from "react";
import axios from "axios";

const UnapprovedQuoteContext = createContext();

export function UnapprovedQuoteProvider({ children }) {
  const [unapprovedCount, setUnapprovedCount] = useState(0);

  const refreshUnapprovedCount = useCallback(async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/quotes/unapproved/count/", {
        withCredentials: true,
      });
      setUnapprovedCount(res.data.count || 0);
    } catch (error) {
      console.error("Failed to fetch unapproved quote count", error);
      setUnapprovedCount(0);
    }
  }, []);

  return (
    <UnapprovedQuoteContext.Provider value={{ unapprovedCount, refreshUnapprovedCount }}>
      {children}
    </UnapprovedQuoteContext.Provider>
  );
}

export function useUnapprovedQuotes() {
  return useContext(UnapprovedQuoteContext);
}
