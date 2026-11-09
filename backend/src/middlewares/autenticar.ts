import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { UsuarioSesion } from "../models/UsuarioSesion";
import { verificarAccessToken } from "../servicios/AuthServicio";
import { ErrorHttp } from "./errores";

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioSesion;
    }
  }
}

export function autenticar(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.access_token;
  if (typeof token !== "string") throw new ErrorHttp(401, "No autenticado");
  try {
    req.usuario = verificarAccessToken(token);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) throw new ErrorHttp(401, "Sesión expirada", "TOKEN_EXPIRADO");
    throw new ErrorHttp(401, "No autenticado");
  }
  next();
}
