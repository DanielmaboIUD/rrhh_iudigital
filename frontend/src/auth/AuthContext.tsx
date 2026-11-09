import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { alPerderSesion, apiAuth } from "../api";
import type { UsuarioSesion } from "../types";

interface ValorAuth {
  usuario: UsuarioSesion | null;
  cargando: boolean;
  login: (nombreUsuario: string, contrasena: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<ValorAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    alPerderSesion(() => setUsuario(null));
    apiAuth
      .yo()
      .then(setUsuario)
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false));
  }, []);

  async function login(nombreUsuario: string, contrasena: string) {
    setUsuario(await apiAuth.login(nombreUsuario, contrasena));
  }

  async function logout() {
    try {
      await apiAuth.logout();
    } finally {
      setUsuario(null);
    }
  }

  return <AuthContext.Provider value={{ usuario, cargando, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): ValorAuth {
  const valor = useContext(AuthContext);
  if (!valor) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return valor;
}
