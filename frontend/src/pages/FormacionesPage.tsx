import { useAuth } from "../auth/AuthContext";
import { permisosCrud } from "../auth/permisos";
import { CrudPage } from "../CrudPage";
import type { Campo, Catalogos, Opcion } from "../types";

interface Props {
  catalogos: Catalogos;
  funcionarios: Opcion[];
}

export function FormacionesPage({ catalogos, funcionarios }: Props) {
  const usuario = useAuth().usuario!;
  const esFuncionario = usuario.rol === "FUNCIONARIO";
  const campos: Campo[] = [
    {
      nombre: "funcionario_id",
      etiqueta: "Funcionario",
      opciones: funcionarios,
      soloLectura: esFuncionario,
      valorInicial: esFuncionario ? usuario.funcionarioId ?? undefined : undefined,
    },
    { nombre: "universidad_id", etiqueta: "Universidad", opciones: catalogos.universidades },
    { nombre: "nivel_estudio_id", etiqueta: "Nivel", opciones: catalogos.nivelesEstudio },
    { nombre: "titulo", etiqueta: "Título" },
    { nombre: "fecha_grado", etiqueta: "Fecha grado", tipo: "date", opcional: true },
  ];
  return <CrudPage titulo="estudio" recurso="formaciones" campos={campos} {...permisosCrud(usuario.rol, "formaciones")} />;
}
