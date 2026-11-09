import { enTransaccion, pool } from "../config/db";
import type { Funcionario } from "../models/Funcionario";
import type { Dao } from "./Dao";
import { bloquearAdminsActivos, exigirOtroAdmin } from "./UsuarioDao";

const COLUMNAS = `id, tipo_identificacion_id, numero_identificacion, nombres, apellidos,
  estado_civil_id, sexo_id, direccion, telefono, fecha_nacimiento`;

export class FuncionarioDao implements Dao<Funcionario> {
  async findAll(): Promise<Funcionario[]> {
    const { rows } = await pool.query<Funcionario>(
      `SELECT ${COLUMNAS} FROM rrhh.funcionario ORDER BY apellidos, nombres`,
    );
    return rows;
  }

  async findById(id: number): Promise<Funcionario | null> {
    const { rows } = await pool.query<Funcionario>(
      `SELECT ${COLUMNAS} FROM rrhh.funcionario WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async create(f: Funcionario): Promise<Funcionario> {
    const { rows } = await pool.query<Funcionario>(
      `INSERT INTO rrhh.funcionario (tipo_identificacion_id, numero_identificacion, nombres, apellidos,
         estado_civil_id, sexo_id, direccion, telefono, fecha_nacimiento)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING ${COLUMNAS}`,
      [f.tipo_identificacion_id, f.numero_identificacion, f.nombres, f.apellidos,
        f.estado_civil_id, f.sexo_id, f.direccion, f.telefono, f.fecha_nacimiento],
    );
    return rows[0];
  }

  async update(id: number, f: Funcionario): Promise<Funcionario | null> {
    const { rows } = await pool.query<Funcionario>(
      `UPDATE rrhh.funcionario
       SET tipo_identificacion_id = $1, numero_identificacion = $2, nombres = $3, apellidos = $4,
           estado_civil_id = $5, sexo_id = $6, direccion = $7, telefono = $8, fecha_nacimiento = $9
       WHERE id = $10
       RETURNING ${COLUMNAS}`,
      [f.tipo_identificacion_id, f.numero_identificacion, f.nombres, f.apellidos,
        f.estado_civil_id, f.sexo_id, f.direccion, f.telefono, f.fecha_nacimiento, id],
    );
    return rows[0] ?? null;
  }

  // La cuenta enlazada se borra en cascada, así que puede ser el último administrador
  async delete(id: number): Promise<boolean> {
    return enTransaccion(async (cliente) => {
      const admins = await bloquearAdminsActivos(cliente);
      const { rows } = await cliente.query<{ id: number }>("SELECT id FROM rrhh.usuario WHERE funcionario_id = $1", [id]);
      if (rows[0]) exigirOtroAdmin(admins, rows[0].id, "Su cuenta es la del único administrador activo");
      const { rowCount } = await cliente.query("DELETE FROM rrhh.funcionario WHERE id = $1", [id]);
      return rowCount === 1;
    });
  }
}
