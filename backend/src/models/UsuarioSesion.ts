import type { CodigoRol } from "./Rol";

export interface UsuarioSesion {
  id: number;
  nombreUsuario: string;
  rol: CodigoRol;
  funcionarioId: number | null;
}
