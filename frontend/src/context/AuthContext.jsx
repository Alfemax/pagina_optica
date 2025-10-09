import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null); // nombre/usuario
  const [rol, setRol] = useState(null);

  // Cargar sesión guardada
  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("usuario");
    const r = localStorage.getItem("rol");
    if (t && u) {
      setToken(t);
      setUsuario(u);
      setRol(r);
    }
  }, []);

  const login = ({ token, usuario, rol }) => {
    setToken(token);
    setUsuario(usuario);
    setRol(rol);
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", usuario);
    localStorage.setItem("rol", rol ?? "");
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    setRol(null);
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("rol");
  };

  return (
    <AuthContext.Provider value={{ token, usuario, rol, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
