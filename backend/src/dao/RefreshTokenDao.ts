import { pool } from "../config/db";
import type { RefreshToken } from "../models/RefreshToken";

const INSERTAR = `INSERT INTO rrhh.refresh_token (usuario_id, token_hash, expira_en)
  VALUES ($1, $2, LOCALTIMESTAMP + make_interval(days => $3))
  RETURNING id`;

export class RefreshTokenDao {
  async crear(usuarioId: number, tokenHash: string, dias: number): Promise<void> {
    await pool.query(INSERTAR, [usuarioId, tokenHash, dias]);
  }

  async buscarPorHash(tokenHash: string): Promise<RefreshToken | null> {
    const { rows } = await pool.query<RefreshToken>(
      `SELECT id, usuario_id, revocado_en IS NOT NULL AS revocado, expira_en <= LOCALTIMESTAMP AS vencido
       FROM rrhh.refresh_token
       WHERE token_hash = $1`,
      [tokenHash],
    );
    return rows[0] ?? null;
  }

  async revocar(tokenHash: string): Promise<void> {
    await pool.query(
      "UPDATE rrhh.refresh_token SET revocado_en = LOCALTIMESTAMP WHERE token_hash = $1 AND revocado_en IS NULL",
      [tokenHash],
    );
  }

  // Devuelve false si otra petición ya lo había rotado
  async rotar(actual: RefreshToken, nuevoHash: string, dias: number): Promise<boolean> {
    const cliente = await pool.connect();
    try {
      await cliente.query("BEGIN");
      const { rowCount } = await cliente.query(
        "UPDATE rrhh.refresh_token SET revocado_en = LOCALTIMESTAMP WHERE id = $1 AND revocado_en IS NULL",
        [actual.id],
      );
      if (rowCount !== 1) {
        await cliente.query("ROLLBACK");
        return false;
      }
      const { rows } = await cliente.query<{ id: string }>(INSERTAR, [actual.usuario_id, nuevoHash, dias]);
      await cliente.query("UPDATE rrhh.refresh_token SET reemplazado_por_id = $1 WHERE id = $2", [rows[0].id, actual.id]);
      await cliente.query("COMMIT");
      return true;
    } catch (error) {
      await cliente.query("ROLLBACK");
      throw error;
    } finally {
      cliente.release();
    }
  }

  async revocarTodosDeUsuario(usuarioId: number): Promise<void> {
    await pool.query(
      "UPDATE rrhh.refresh_token SET revocado_en = LOCALTIMESTAMP WHERE usuario_id = $1 AND revocado_en IS NULL",
      [usuarioId],
    );
  }
}
