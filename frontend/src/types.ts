export type Registro = Record<string, string | number | null> & { id?: number };

export type CodigoRol = "ADMIN" | "RRHH" | "CONSULTA" | "FUNCIONARIO";

export interface UsuarioSesion {
  id: number;
  nombreUsuario: string;
  rol: CodigoRol;
  funcionarioId: number | null;
}

export interface Rol {
  id: number;
  codigo: CodigoRol;
  nombre: string;
  descripcion: string;
}

export interface Usuario {
  id: number;
  nombre_usuario: string;
  rol_id: number;
  rol: CodigoRol;
  funcionario_id: number | null;
  activo: boolean;
  intentos_fallidos: number;
  bloqueado: boolean;
  bloqueado_hasta: string | null;
  ultimo_acceso: string | null;
  fecha_registro: string;
}

export interface DatosCuenta {
  rol_id: number;
  funcionario_id: number | null;
  activo: boolean;
}

export interface NuevoUsuario {
  nombre_usuario: string;
  contrasena: string;
  rol_id: number;
  funcionario_id: number | null;
}

export interface Opcion {
  id: number;
  nombre: string;
}

export interface Campo {
  nombre: string;
  etiqueta: string;
  tipo?: "text" | "date" | "tel";
  opciones?: Opcion[];
  opcional?: boolean;
  soloLectura?: boolean;
  valorInicial?: number;
}

export interface Catalogos {
  tiposIdentificacion: Opcion[];
  estadosCiviles: Opcion[];
  sexos: Opcion[];
  parentescos: Opcion[];
  nivelesEstudio: Opcion[];
  universidades: Opcion[];
}
