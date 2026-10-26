import { pool } from "../config/db";
import type { FormacionAcademica } from "../models/FormacionAcademica";
import type { Dao } from "./Dao";

const COLUMNAS = "id, funcionario_id, universidad_id, nivel_estudio_id, titulo, fecha_grado";

export class FormacionAcademicaDao implements Dao<FormacionAcademica> {
  async findAll(): Promise<FormacionAcademica[]> {
    const { rows } = await pool.query<FormacionAcademica>(
      `SELECT ${COLUMNAS} FROM rrhh.formacion_academica ORDER BY funcionario_id, fecha_grado`,
    );
    return rows;
  }

  async findById(id: number): Promise<FormacionAcademica | null> {
    const { rows } = await pool.query<FormacionAcademica>(
      `SELECT ${COLUMNAS} FROM rrhh.formacion_academica WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async create(f: FormacionAcademica): Promise<FormacionAcademica> {
    const { rows } = await pool.query<FormacionAcademica>(
      `INSERT INTO rrhh.formacion_academica (funcionario_id, universidad_id, nivel_estudio_id, titulo, fecha_grado)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${COLUMNAS}`,
      [f.funcionario_id, f.universidad_id, f.nivel_estudio_id, f.titulo, f.fecha_grado],
    );
    return rows[0];
  }

  async update(id: number, f: FormacionAcademica): Promise<FormacionAcademica | null> {
    const { rows } = await pool.query<FormacionAcademica>(
      `UPDATE rrhh.formacion_academica
       SET funcionario_id = $1, universidad_id = $2, nivel_estudio_id = $3, titulo = $4, fecha_grado = $5
       WHERE id = $6
       RETURNING ${COLUMNAS}`,
      [f.funcionario_id, f.universidad_id, f.nivel_estudio_id, f.titulo, f.fecha_grado, id],
    );
    return rows[0] ?? null;
  }

  async delete(id: number): Promise<boolean> {
    const { rowCount } = await pool.query("DELETE FROM rrhh.formacion_academica WHERE id = $1", [id]);
    return rowCount === 1;
  }
}
