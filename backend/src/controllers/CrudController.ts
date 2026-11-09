import type { Request, Response } from "express";
import type { Dao } from "../dao/Dao";
import { ErrorHttp } from "../middlewares/errores";
import type { UsuarioSesion } from "../models/UsuarioSesion";
import type { Politica } from "../politicas/Politica";

function parsearId(valor: string): number {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw new ErrorHttp(400, "Id inválido");
  return id;
}

export class CrudController<T> {
  constructor(
    private readonly dao: Dao<T>,
    private readonly politica: Politica<T>,
  ) {}

  // Un registro ajeno responde 404 para no revelar que existe
  private async cargar(id: number, usuario: UsuarioSesion): Promise<T> {
    const entidad = await this.dao.findById(id);
    if (!entidad || !this.politica.puedeAcceder(usuario, entidad)) {
      throw new ErrorHttp(404, "Registro no encontrado");
    }
    return entidad;
  }

  listar = async (req: Request, res: Response) => {
    res.json(await this.politica.listar(req.usuario!));
  };

  obtener = async (req: Request<{ id: string }>, res: Response) => {
    res.json(await this.cargar(parsearId(req.params.id), req.usuario!));
  };

  crear = async (req: Request, res: Response) => {
    res.status(201).json(await this.dao.create(this.politica.paraCrear(req.usuario!, req.body)));
  };

  actualizar = async (req: Request<{ id: string }>, res: Response) => {
    const id = parsearId(req.params.id);
    const actual = await this.cargar(id, req.usuario!);
    const entidad = await this.dao.update(id, this.politica.paraEditar(req.usuario!, req.body, actual));
    if (!entidad) throw new ErrorHttp(404, "Registro no encontrado");
    res.json(entidad);
  };

  eliminar = async (req: Request<{ id: string }>, res: Response) => {
    const id = parsearId(req.params.id);
    await this.cargar(id, req.usuario!);
    if (!(await this.dao.delete(id))) throw new ErrorHttp(404, "Registro no encontrado");
    res.status(204).end();
  };
}
