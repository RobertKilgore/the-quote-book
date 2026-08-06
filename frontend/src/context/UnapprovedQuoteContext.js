// src/context/UnapprovedQuoteContext.js

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "../api/axios";
import { useUser } from "./UserContext";

const UnapprovedQuoteContext = createContext();

export function UnapprovedQuoteProvider({ children }) {
  const [unapprovedCount, setUnapprovedCount] = useState(0);
  const userContext = useUser();
  const user = userContext?.user;

  const refreshUnapprovedCount = useCallback(async () => {
    if (!user) {
      setUnapprovedCount(0);
      return;
    }

    try {
      const endpoint = user.isSuperuser
        ? "/api/quotes/unapproved/count/"
        : "/api/quotes/submitted/count/";
      const res = await api.get(endpoint, {
        withCredentials: true,
        cache: false,
      });
      setUnapprovedCount(res.data.count || 0);
    } catch (error) {
      console.error("Failed to fetch unapproved quote count", error);
      setUnapprovedCount(0);
    }
  }, [user?.id, user?.isSuperuser]);

  useEffect(() => {
    refreshUnapprovedCount();
  }, [refreshUnapprovedCount]);

  return (
    <UnapprovedQuoteContext.Provider value={{ unapprovedCount, refreshUnapprovedCount }}>
      {children}
    </UnapprovedQuoteContext.Provider>
  );
}

export function useUnapprovedQuotes() {
  return useContext(UnapprovedQuoteContext);
}
