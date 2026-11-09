import type { CodigoRol } from "../types";

export type Recurso = "funcionarios" | "familiares" | "formaciones" | "usuarios";
export type Accion = "ver" | "crear" | "editar" | "eliminar";

const TODOS: CodigoRol[] = ["ADMIN", "RRHH", "CONSULTA", "FUNCIONARIO"];
const SOLO_ADMIN: CodigoRol[] = ["ADMIN"];
const GESTION: CodigoRol[] = ["ADMIN", "RRHH", "FUNCIONARIO"];
const PROPIOS = { ver: TODOS, crear: GESTION, editar: GESTION, eliminar: ["ADMIN", "FUNCIONARIO"] as CodigoRol[] };

// Solo decide qué se muestra: el control real está en el backend
const MATRIZ: Record<Recurso, Record<Accion, CodigoRol[]>> = {
  funcionarios: { ver: TODOS, crear: ["ADMIN", "RRHH"], editar: GESTION, eliminar: SOLO_ADMIN },
  familiares: PROPIOS,
  formaciones: PROPIOS,
  usuarios: { ver: SOLO_ADMIN, crear: SOLO_ADMIN, editar: SOLO_ADMIN, eliminar: SOLO_ADMIN },
};

export function puede(rol: CodigoRol, recurso: Recurso, accion: Accion): boolean {
  return MATRIZ[recurso][accion].includes(rol);
}

export function permisosCrud(rol: CodigoRol, recurso: Recurso) {
  return {
    puedeCrear: puede(rol, recurso, "crear"),
    puedeEditar: puede(rol, recurso, "editar"),
    puedeEliminar: puede(rol, recurso, "eliminar"),
  };
}
