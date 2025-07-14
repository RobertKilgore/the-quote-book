import { createContext, useContext, useState } from "react";

const ErrorContext = createContext();

export function ErrorProvider({ children }) {
  const [error, setError] = useState("");

  return (
    <ErrorContext.Provider value={{ error, setError }}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useError() {
  return useContext(ErrorContext);
}
