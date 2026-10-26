import { pool } from "../config/db";
import type { Familiar } from "../models/Familiar";
import type { Dao } from "./Dao";

const COLUMNAS = `id, funcionario_id, parentesco_id, tipo_identificacion_id, numero_identificacion,
  nombres, apellidos, sexo_id, fecha_nacimiento, telefono`;

export class FamiliarDao implements Dao<Familiar> {
  async findAll(): Promise<Familiar[]> {
    const { rows } = await pool.query<Familiar>(
      `SELECT ${COLUMNAS} FROM rrhh.familiar ORDER BY funcionario_id, apellidos, nombres`,
    );
    return rows;
  }

  async findById(id: number): Promise<Familiar | null> {
    const { rows } = await pool.query<Familiar>(
      `SELECT ${COLUMNAS} FROM rrhh.familiar WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async create(f: Familiar): Promise<Familiar> {
    const { rows } = await pool.query<Familiar>(
      `INSERT INTO rrhh.familiar (funcionario_id, parentesco_id, tipo_identificacion_id, numero_identificacion,
         nombres, apellidos, sexo_id, fecha_nacimiento, telefono)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING ${COLUMNAS}`,
      [f.funcionario_id, f.parentesco_id, f.tipo_identificacion_id, f.numero_identificacion,
        f.nombres, f.apellidos, f.sexo_id, f.fecha_nacimiento, f.telefono],
    );
    return rows[0];
  }

  async update(id: number, f: Familiar): Promise<Familiar | null> {
    const { rows } = await pool.query<Familiar>(
      `UPDATE rrhh.familiar
       SET funcionario_id = $1, parentesco_id = $2, tipo_identificacion_id = $3, numero_identificacion = $4,
           nombres = $5, apellidos = $6, sexo_id = $7, fecha_nacimiento = $8, telefono = $9
       WHERE id = $10
       RETURNING ${COLUMNAS}`,
      [f.funcionario_id, f.parentesco_id, f.tipo_identificacion_id, f.numero_identificacion,
        f.nombres, f.apellidos, f.sexo_id, f.fecha_nacimiento, f.telefono, id],
    );
    return rows[0] ?? null;
  }

  async delete(id: number): Promise<boolean> {
    const { rowCount } = await pool.query("DELETE FROM rrhh.familiar WHERE id = $1", [id]);
    return rowCount === 1;
  }
}
