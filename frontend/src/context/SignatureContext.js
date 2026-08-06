// src/context/SignatureContext.js
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import { useUser } from "./UserContext";

const SignatureContext = createContext();

export function useSignature() {
  return useContext(SignatureContext);
}

export function SignatureProvider({ children }) {
  const [pendingCount, setPendingCount] = useState(0);
  const userContext = useUser();
  const user = userContext?.user;

  const refreshCount = useCallback(async () => {
    if (!user) {
      setPendingCount(0);
      return;
    }

    try {
      const res = await api.get("/api/signatures/pending/count/", {
        withCredentials: true,
        cache: false,
      });
      setPendingCount(res.data.count);
    } catch (err) {
      console.error("Failed to fetch pending signature count");
    }
  }, [user?.id, user?.isSuperuser]);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  return (
    <SignatureContext.Provider value={{ pendingCount, refreshCount }}>
      {children}
    </SignatureContext.Provider>
  );
}
