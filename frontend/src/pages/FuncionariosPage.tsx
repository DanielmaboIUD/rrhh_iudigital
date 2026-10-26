import { CrudPage } from "../CrudPage";
import type { Campo, Catalogos } from "../types";

export function FuncionariosPage({ catalogos }: { catalogos: Catalogos }) {
  const campos: Campo[] = [
    { nombre: "tipo_identificacion_id", etiqueta: "Tipo id.", opciones: catalogos.tiposIdentificacion },
    { nombre: "numero_identificacion", etiqueta: "Número id." },
    { nombre: "nombres", etiqueta: "Nombres" },
    { nombre: "apellidos", etiqueta: "Apellidos" },
    { nombre: "estado_civil_id", etiqueta: "Estado civil", opciones: catalogos.estadosCiviles },
    { nombre: "sexo_id", etiqueta: "Sexo", opciones: catalogos.sexos },
    { nombre: "direccion", etiqueta: "Dirección" },
    { nombre: "telefono", etiqueta: "Teléfono", tipo: "tel" },
    { nombre: "fecha_nacimiento", etiqueta: "Fecha nacimiento", tipo: "date" },
  ];
  return <CrudPage titulo="funcionario" recurso="funcionarios" campos={campos} />;
}
