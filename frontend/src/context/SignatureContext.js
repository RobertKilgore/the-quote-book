// src/context/SignatureContext.js
import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const SignatureContext = createContext();

export function useSignature() {
  return useContext(SignatureContext);
}

export function SignatureProvider({ children }) {
  const [pendingCount, setPendingCount] = useState(0);

  const refreshCount = async () => {
    try {
      const res = await api.get("/api/signatures/pending/count/", {
        withCredentials: true
      });
      setPendingCount(res.data.count);
    } catch (err) {
      console.error("Failed to fetch pending signature count");
    }
  };

  useEffect(() => {
    refreshCount();
  }, []);

  return (
    <SignatureContext.Provider value={{ pendingCount, refreshCount }}>
      {children}
    </SignatureContext.Provider>
  );
}
