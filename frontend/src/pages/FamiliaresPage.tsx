import { useAuth } from "../auth/AuthContext";
import { permisosCrud } from "../auth/permisos";
import { CrudPage } from "../CrudPage";
import type { Campo, Catalogos, Opcion } from "../types";

interface Props {
  catalogos: Catalogos;
  funcionarios: Opcion[];
}

export function FamiliaresPage({ catalogos, funcionarios }: Props) {
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
    { nombre: "parentesco_id", etiqueta: "Parentesco", opciones: catalogos.parentescos },
    { nombre: "tipo_identificacion_id", etiqueta: "Tipo id.", opciones: catalogos.tiposIdentificacion },
    { nombre: "numero_identificacion", etiqueta: "Número id." },
    { nombre: "nombres", etiqueta: "Nombres" },
    { nombre: "apellidos", etiqueta: "Apellidos" },
    { nombre: "sexo_id", etiqueta: "Sexo", opciones: catalogos.sexos },
    { nombre: "fecha_nacimiento", etiqueta: "Fecha nacimiento", tipo: "date" },
    { nombre: "telefono", etiqueta: "Teléfono", tipo: "tel", opcional: true },
  ];
  return <CrudPage titulo="familiar" recurso="familiares" campos={campos} {...permisosCrud(usuario.rol, "familiares")} />;
}
