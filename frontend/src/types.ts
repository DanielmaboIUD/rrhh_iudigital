export type Registro = Record<string, string | number | null> & { id?: number };

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
}

export interface Catalogos {
  tiposIdentificacion: Opcion[];
  estadosCiviles: Opcion[];
  sexos: Opcion[];
  parentescos: Opcion[];
  nivelesEstudio: Opcion[];
  universidades: Opcion[];
}
