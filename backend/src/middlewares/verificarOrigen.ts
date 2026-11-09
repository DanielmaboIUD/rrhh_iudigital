import type { NextFunction, Request, Response } from "express";
import { entorno } from "../config/entorno";
import { ErrorHttp } from "./errores";

const METODOS_SEGUROS = new Set(["GET", "HEAD", "OPTIONS"]);

export function verificarOrigen(req: Request, _res: Response, next: NextFunction) {
  if (!METODOS_SEGUROS.has(req.method) && req.headers.origin !== entorno.origenPermitido) {
    throw new ErrorHttp(403, "Origen no permitido");
  }
  next();
}
