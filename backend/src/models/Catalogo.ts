export interface ItemCatalogo {
  id: number;
  nombre: string;
}

export interface Catalogos {
  tiposIdentificacion: ItemCatalogo[];
  estadosCiviles: ItemCatalogo[];
  sexos: ItemCatalogo[];
  parentescos: ItemCatalogo[];
  nivelesEstudio: ItemCatalogo[];
  universidades: ItemCatalogo[];
}
