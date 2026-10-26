import { useEffect, useState } from "react";
import { api } from "./api";
import { FamiliaresPage } from "./pages/FamiliaresPage";
import { FormacionesPage } from "./pages/FormacionesPage";
import { FuncionariosPage } from "./pages/FuncionariosPage";
import type { Catalogos, Opcion } from "./types";

type Pestana = "funcionarios" | "familiares" | "formaciones";

const PESTANAS: [Pestana, string][] = [
  ["funcionarios", "Funcionarios"],
  ["familiares", "Grupo familiar"],
  ["formaciones", "Formación académica"],
];

export function App() {
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
      <h1>Recursos Humanos · IU Digital</h1>
      <nav>
        {PESTANAS.map(([clave, texto]) => (
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
    </main>
  );
}
