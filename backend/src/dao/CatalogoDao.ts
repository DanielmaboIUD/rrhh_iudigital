import { pool } from "../config/db";
import type { Catalogos, ItemCatalogo } from "../models/Catalogo";

export class CatalogoDao {
  async findAll(): Promise<Catalogos> {
    const [tiposIdentificacion, estadosCiviles, sexos, parentescos, nivelesEstudio, universidades] =
      await Promise.all([
        this.listar("SELECT id, nombre FROM rrhh.tipo_identificacion WHERE activo ORDER BY nombre"),
        this.listar("SELECT id, nombre FROM rrhh.estado_civil WHERE activo ORDER BY nombre"),
        this.listar("SELECT id, nombre FROM rrhh.sexo WHERE activo ORDER BY nombre"),
        this.listar("SELECT id, nombre FROM rrhh.parentesco WHERE activo ORDER BY nombre"),
        this.listar("SELECT id, nombre FROM rrhh.nivel_estudio WHERE activo ORDER BY orden"),
        this.listar("SELECT id, nombre FROM rrhh.universidad WHERE activo ORDER BY nombre"),
      ]);
    return { tiposIdentificacion, estadosCiviles, sexos, parentescos, nivelesEstudio, universidades };
  }

  private async listar(sql: string): Promise<ItemCatalogo[]> {
    const { rows } = await pool.query<ItemCatalogo>(sql);
    return rows;
  }
}
