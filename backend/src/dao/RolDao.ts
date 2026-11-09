import { pool } from "../config/db";
import type { Rol } from "../models/Rol";

const COLUMNAS = "id, codigo, nombre, descripcion";

export class RolDao {
  async findAll(): Promise<Rol[]> {
    const { rows } = await pool.query<Rol>(`SELECT ${COLUMNAS} FROM rrhh.rol ORDER BY id`);
    return rows;
  }

  async findById(id: number): Promise<Rol | null> {
    const { rows } = await pool.query<Rol>(`SELECT ${COLUMNAS} FROM rrhh.rol WHERE id = $1`, [id]);
    return rows[0] ?? null;
  }
}
