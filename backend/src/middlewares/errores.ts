import type { NextFunction, Request, Response } from "express";

export class ErrorHttp extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

const ERRORES_PG: Record<string, [number, string]> = {
  "23505": [409, "Ya existe un registro con esos datos"],
  "23503": [409, "El registro referencia datos inexistentes"],
  "23502": [400, "Faltan datos obligatorios"],
  "23514": [400, "Algún dato no cumple las validaciones"],
  "22P02": [400, "Formato de dato inválido"],
  "22007": [400, "Fecha inválida"],
  "22008": [400, "Fecha inválida"],
  "22001": [400, "Algún dato supera la longitud permitida"],
};

export function manejarErrores(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ErrorHttp) {
    return res.status(err.status).json({ error: err.message });
  }
  const errorPg = ERRORES_PG[err.code];
  if (errorPg) {
    return res.status(errorPg[0]).json({ error: errorPg[1] });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "JSON inválido" });
  }
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
}
