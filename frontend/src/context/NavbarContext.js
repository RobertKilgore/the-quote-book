import { createContext, useContext, useState } from "react";

const NavbarContext = createContext();

export function NavbarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <NavbarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </NavbarContext.Provider>
  );
}

export function useNavbar() {
  return useContext(NavbarContext);
}