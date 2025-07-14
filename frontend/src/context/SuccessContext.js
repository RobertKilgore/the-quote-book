import { createContext, useContext, useState } from "react";

const SuccessContext = createContext();

export function SuccessProvider({ children }) {
  const [success, setSuccess] = useState("");

  return (
    <SuccessContext.Provider value={{ success, setSuccess }}>
      {children}
    </SuccessContext.Provider>
  );
}

export function useSuccess() {
  return useContext(SuccessContext);
}
