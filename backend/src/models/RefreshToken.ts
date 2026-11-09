export interface RefreshToken {
  // BIGINT: pg lo entrega como texto
  id: string;
  usuario_id: number;
  revocado: boolean;
  vencido: boolean;
}
