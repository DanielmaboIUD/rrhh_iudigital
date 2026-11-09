import type { CodigoRol } from "./Rol";

export interface Usuario {
  id: number;
  nombre_usuario: string;
  contrasena_hash: string;
  rol_id: number;
  rol: CodigoRol;
  funcionario_id: number | null;
  activo: boolean;
  intentos_fallidos: number;
  bloqueado: boolean;
}
