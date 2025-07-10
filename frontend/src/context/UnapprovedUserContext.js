import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const UnapprovedUserContext = createContext();

export function UnapprovedUserProvider({ children }) {
  const [unapprovedUserCount, setUnapprovedUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshUnapprovedUserCount = () => {
    api
      .get("users/unapproved/count/", { withCredentials: true })
      .then((res) => {
        setUnapprovedUserCount(res.data.count);
      })
      .catch((err) => {
        console.error("Failed to fetch unapproved user count:", err);
        setUnapprovedUserCount(0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshUnapprovedUserCount();
  }, []);

  return (
    <UnapprovedUserContext.Provider
      value={{ unapprovedUserCount, refreshUnapprovedUserCount, loading }}
    >
      {children}
    </UnapprovedUserContext.Provider>
  );
}

export function useUnapprovedUserCount() {
  return useContext(UnapprovedUserContext);
}
