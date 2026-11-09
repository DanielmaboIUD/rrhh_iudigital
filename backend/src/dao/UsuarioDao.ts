import type { PoolClient } from "pg";
import { enTransaccion, pool } from "../config/db";
import { ErrorHttp } from "../middlewares/errores";
import type { DatosCuenta, Usuario, UsuarioPublico } from "../models/Usuario";

// El bloqueo se evalúa en SQL porque las columnas son TIMESTAMP sin zona
const BLOQUEADO = "COALESCE(u.bloqueado_hasta > LOCALTIMESTAMP, FALSE) AS bloqueado";
const DESDE = "FROM rrhh.usuario u JOIN rrhh.rol r ON r.id = u.rol_id";

const SELECCION = `SELECT u.id, u.nombre_usuario, u.contrasena_hash, u.rol_id, r.codigo AS rol, u.funcionario_id,
    u.activo, u.intentos_fallidos, ${BLOQUEADO}
  ${DESDE}`;

const SELECCION_PUBLICA = `SELECT u.id, u.nombre_usuario, u.rol_id, r.codigo AS rol, u.funcionario_id, u.activo,
    u.intentos_fallidos, ${BLOQUEADO}, u.bloqueado_hasta, u.ultimo_acceso, u.fecha_registro
  ${DESDE}`;

const ULTIMO_ADMIN = "No se puede dejar el sistema sin ningún administrador activo";

/** Serializa las operaciones que pueden retirar administradores; debe ir dentro de una transacción. */
export async function bloquearAdminsActivos(cliente: PoolClient): Promise<number[]> {
  const { rows } = await cliente.query<{ id: number }>(
    `SELECT u.id ${DESDE} WHERE r.codigo = 'ADMIN' AND u.activo ORDER BY u.id FOR UPDATE OF u`,
  );
  return rows.map((fila) => fila.id);
}

export function exigirOtroAdmin(admins: number[], usuarioId: number, mensaje = ULTIMO_ADMIN) {
  if (admins.length === 1 && admins[0] === usuarioId) throw new ErrorHttp(409, mensaje);
}

async function revocarSesiones(cliente: PoolClient, usuarioId: number) {
  await cliente.query(
    "UPDATE rrhh.refresh_token SET revocado_en = LOCALTIMESTAMP WHERE usuario_id = $1 AND revocado_en IS NULL",
    [usuarioId],
  );
}

export class UsuarioDao {
  async findAll(): Promise<UsuarioPublico[]> {
    const { rows } = await pool.query<UsuarioPublico>(`${SELECCION_PUBLICA} ORDER BY u.nombre_usuario`);
    return rows;
  }

  async findPublicoById(id: number): Promise<UsuarioPublico | null> {
    const { rows } = await pool.query<UsuarioPublico>(`${SELECCION_PUBLICA} WHERE u.id = $1`, [id]);
    return rows[0] ?? null;
  }

  async findByNombreUsuario(nombreUsuario: string): Promise<Usuario | null> {
    const { rows } = await pool.query<Usuario>(`${SELECCION} WHERE u.nombre_usuario = $1`, [nombreUsuario]);
    return rows[0] ?? null;
  }

  async findById(id: number): Promise<Usuario | null> {
    const { rows } = await pool.query<Usuario>(`${SELECCION} WHERE u.id = $1`, [id]);
    return rows[0] ?? null;
  }

  async crear(nombreUsuario: string, contrasenaHash: string, rolId: number, funcionarioId: number | null): Promise<UsuarioPublico> {
    const { rows } = await pool.query<{ id: number }>(
      `INSERT INTO rrhh.usuario (nombre_usuario, contrasena_hash, rol_id, funcionario_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [nombreUsuario, contrasenaHash, rolId, funcionarioId],
    );
    return (await this.findPublicoById(rows[0].id))!;
  }

  async actualizar(id: number, datos: DatosCuenta, seguiraSiendoAdmin: boolean): Promise<UsuarioPublico | null> {
    return enTransaccion(async (cliente) => {
      const admins = await bloquearAdminsActivos(cliente);
      const { rows } = await cliente.query<DatosCuenta>(
        "SELECT rol_id, funcionario_id, activo FROM rrhh.usuario WHERE id = $1 FOR UPDATE",
        [id],
      );
      const actual = rows[0];
      if (!actual) return null;
      if (!seguiraSiendoAdmin || !datos.activo) exigirOtroAdmin(admins, id);

      await cliente.query("UPDATE rrhh.usuario SET rol_id = $1, funcionario_id = $2, activo = $3 WHERE id = $4", [
        datos.rol_id, datos.funcionario_id, datos.activo, id,
      ]);
      // Rol y funcionario viajan en el access token: la cuenta debe volver a autenticarse
      if (actual.rol_id !== datos.rol_id || actual.funcionario_id !== datos.funcionario_id || actual.activo !== datos.activo) {
        await revocarSesiones(cliente, id);
      }
      const resultado = await cliente.query<UsuarioPublico>(`${SELECCION_PUBLICA} WHERE u.id = $1`, [id]);
      return resultado.rows[0];
    });
  }

  async cambiarContrasena(id: number, contrasenaHash: string): Promise<boolean> {
    return enTransaccion(async (cliente) => {
      const { rowCount } = await cliente.query("UPDATE rrhh.usuario SET contrasena_hash = $1 WHERE id = $2", [contrasenaHash, id]);
      if (rowCount !== 1) return false;
      await revocarSesiones(cliente, id);
      return true;
    });
  }

  async desbloquear(id: number): Promise<UsuarioPublico | null> {
    await pool.query("UPDATE rrhh.usuario SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = $1", [id]);
    return this.findPublicoById(id);
  }

  async eliminar(id: number): Promise<boolean> {
    return enTransaccion(async (cliente) => {
      exigirOtroAdmin(await bloquearAdminsActivos(cliente), id);
      const { rowCount } = await cliente.query("DELETE FROM rrhh.usuario WHERE id = $1", [id]);
      return rowCount === 1;
    });
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
