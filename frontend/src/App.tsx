import { useEffect, useState } from "react";
import { api } from "./api";
import { useAuth } from "./auth/AuthContext";
import { puede } from "./auth/permisos";
import { FamiliaresPage } from "./pages/FamiliaresPage";
import { FormacionesPage } from "./pages/FormacionesPage";
import { FuncionariosPage } from "./pages/FuncionariosPage";
import { LoginPage } from "./pages/LoginPage";
import { UsuariosPage } from "./pages/UsuariosPage";
import type { Catalogos, Opcion } from "./types";

type Pestana = "funcionarios" | "familiares" | "formaciones" | "usuarios";

const PESTANAS: [Pestana, string][] = [
  ["funcionarios", "Funcionarios"],
  ["familiares", "Grupo familiar"],
  ["formaciones", "Formación académica"],
  ["usuarios", "Usuarios"],
];

export function App() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <main><p>Cargando...</p></main>;
  return usuario ? <Principal /> : <LoginPage />;
}

function Principal() {
  const { usuario, logout } = useAuth();
  const [pestana, setPestana] = useState<Pestana>("funcionarios");
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [funcionarios, setFuncionarios] = useState<Opcion[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.catalogos().then(setCatalogos).catch((e) => setError(e.message));
  }, []);

  // Se recarga al cambiar de pestaña para reflejar funcionarios recién creados
  useEffect(() => {
    api
      .listar("funcionarios")
      .then((lista) =>
        setFuncionarios(lista.map((f) => ({ id: f.id!, nombre: `${f.nombres} ${f.apellidos}` }))),
      )
      .catch((e) => setError(e.message));
  }, [pestana]);

  return (
    <main>
      <header className="cabecera">
        <h1>Recursos Humanos · IU Digital</h1>
        <div>
          <span>{usuario?.nombreUsuario} · {usuario?.rol}</span>
          <button className="secundario" onClick={logout}>Cerrar sesión</button>
        </div>
      </header>
      <nav>
        {PESTANAS.filter(([clave]) => puede(usuario!.rol, clave, "ver")).map(([clave, texto]) => (
          <button
            key={clave}
            className={pestana === clave ? "activa" : ""}
            onClick={() => setPestana(clave)}
          >
            {texto}
          </button>
        ))}
      </nav>

      {error && <p className="error">{error}</p>}

      {catalogos && pestana === "funcionarios" && <FuncionariosPage catalogos={catalogos} />}
      {catalogos && pestana === "familiares" && (
        <FamiliaresPage catalogos={catalogos} funcionarios={funcionarios} />
      )}
      {catalogos && pestana === "formaciones" && (
        <FormacionesPage catalogos={catalogos} funcionarios={funcionarios} />
      )}
      {pestana === "usuarios" && <UsuariosPage funcionarios={funcionarios} />}
    </main>
  );
}
