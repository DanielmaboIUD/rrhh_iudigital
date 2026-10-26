import type { Request, Response } from "express";
import type { Dao } from "../dao/Dao";
import { ErrorHttp } from "../middlewares/errores";

function parsearId(valor: string): number {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw new ErrorHttp(400, "Id inválido");
  return id;
}

export class CrudController<T> {
  constructor(private readonly dao: Dao<T>) {}

  listar = async (_req: Request, res: Response) => {
    res.json(await this.dao.findAll());
  };

  obtener = async (req: Request<{ id: string }>, res: Response) => {
    const entidad = await this.dao.findById(parsearId(req.params.id));
    if (!entidad) throw new ErrorHttp(404, "Registro no encontrado");
    res.json(entidad);
  };

  crear = async (req: Request, res: Response) => {
    res.status(201).json(await this.dao.create(req.body));
  };

  actualizar = async (req: Request<{ id: string }>, res: Response) => {
    const entidad = await this.dao.update(parsearId(req.params.id), req.body);
    if (!entidad) throw new ErrorHttp(404, "Registro no encontrado");
    res.json(entidad);
  };

  eliminar = async (req: Request<{ id: string }>, res: Response) => {
    const eliminado = await this.dao.delete(parsearId(req.params.id));
    if (!eliminado) throw new ErrorHttp(404, "Registro no encontrado");
    res.status(204).end();
  };
}
