import type { NextFunction, Request, Response } from "express";
import type { CodigoRol } from "../models/Rol";
import { ErrorHttp } from "./errores";

export function autorizar(...roles: CodigoRol[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      throw new ErrorHttp(403, "No tiene permisos para esta acción");
    }
    next();
  };
}
