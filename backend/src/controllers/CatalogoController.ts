import type { Request, Response } from "express";
import type { CatalogoDao } from "../dao/CatalogoDao";

export class CatalogoController {
  constructor(private readonly dao: CatalogoDao) {}

  listar = async (_req: Request, res: Response) => {
    res.json(await this.dao.findAll());
  };
}
