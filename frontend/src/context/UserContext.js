import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios"; // your axios wrapper
import { useError } from "./ErrorContext";



const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  //const [error, setError] = useError();

  useEffect(() => {
    api.get("http://127.0.0.1:8000/api/test-auth/", { withCredentials: true })
      .then(res => {
        setUser({
          id: res.data.id,
          name: res.data.name,
          username: res.data.username,
          email: res.data.email,
          isSuperuser: res.data.is_superuser,
        });
      })
      .catch((error) => {
        setUser(null)
        console.log(error)
      })
      .finally(() => setLoading(false));
  }, []);
  return (
    <UserContext.Provider value={{ user, setUser, loading , setLoading}}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
