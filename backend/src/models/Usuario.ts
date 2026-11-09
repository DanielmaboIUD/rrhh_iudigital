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

// Lo único que sale por la API: nunca incluye contrasena_hash
export interface UsuarioPublico {
  id: number;
  nombre_usuario: string;
  rol_id: number;
  rol: CodigoRol;
  funcionario_id: number | null;
  activo: boolean;
  intentos_fallidos: number;
  bloqueado: boolean;
  bloqueado_hasta: Date | null;
  ultimo_acceso: Date | null;
  fecha_registro: Date;
}

export interface DatosCuenta {
  rol_id: number;
  funcionario_id: number | null;
  activo: boolean;
}
