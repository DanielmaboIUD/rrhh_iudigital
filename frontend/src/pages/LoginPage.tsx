import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await login(nombreUsuario.trim(), contrasena);
    } catch (e) {
      setError((e as Error).message);
      setContrasena("");
      setEnviando(false);
    }
  }

  return (
    <main className="login">
      <h1>Recursos Humanos · IU Digital</h1>
      <form onSubmit={enviar}>
        <label>
          Usuario
          <input
            value={nombreUsuario}
            required
            autoFocus
            autoComplete="username"
            onChange={(e) => setNombreUsuario(e.target.value)}
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={contrasena}
            required
            autoComplete="current-password"
            onChange={(e) => setContrasena(e.target.value)}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={enviando}>{enviando ? "Ingresando..." : "Ingresar"}</button>
      </form>
    </main>
  );
}
