export type CodigoRol = "ADMIN" | "RRHH" | "CONSULTA" | "FUNCIONARIO";

export interface Rol {
  id: number;
  codigo: CodigoRol;
  nombre: string;
  descripcion: string;
}
