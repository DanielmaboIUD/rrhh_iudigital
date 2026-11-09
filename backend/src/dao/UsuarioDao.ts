import { pool } from "../config/db";
import type { Usuario } from "../models/Usuario";

// El bloqueo se evalúa en SQL porque las columnas son TIMESTAMP sin zona
const SELECCION = `SELECT u.id, u.nombre_usuario, u.contrasena_hash, u.rol_id, r.codigo AS rol, u.funcionario_id,
    u.activo, u.intentos_fallidos, COALESCE(u.bloqueado_hasta > LOCALTIMESTAMP, FALSE) AS bloqueado
  FROM rrhh.usuario u
  JOIN rrhh.rol r ON r.id = u.rol_id`;

export class UsuarioDao {
  async findByNombreUsuario(nombreUsuario: string): Promise<Usuario | null> {
    const { rows } = await pool.query<Usuario>(`${SELECCION} WHERE u.nombre_usuario = $1`, [nombreUsuario]);
    return rows[0] ?? null;
  }

  async findById(id: number): Promise<Usuario | null> {
    const { rows } = await pool.query<Usuario>(`${SELECCION} WHERE u.id = $1`, [id]);
    return rows[0] ?? null;
  }

  // Al bloquear, el contador vuelve a 0 para que al vencer el bloqueo haya intentos completos
  async registrarFallo(id: number, maxIntentos: number, bloqueoMin: number): Promise<void> {
    await pool.query(
      `UPDATE rrhh.usuario
       SET intentos_fallidos = CASE WHEN intentos_fallidos + 1 >= $2 THEN 0 ELSE intentos_fallidos + 1 END,
           bloqueado_hasta = CASE WHEN intentos_fallidos + 1 >= $2
             THEN LOCALTIMESTAMP + make_interval(mins => $3) ELSE bloqueado_hasta END
       WHERE id = $1 AND (bloqueado_hasta IS NULL OR bloqueado_hasta <= LOCALTIMESTAMP)`,
      [id, maxIntentos, bloqueoMin],
    );
  }

  async registrarExito(id: number): Promise<void> {
    await pool.query(
      `UPDATE rrhh.usuario
       SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_acceso = LOCALTIMESTAMP
       WHERE id = $1`,
      [id],
    );
  }
}
