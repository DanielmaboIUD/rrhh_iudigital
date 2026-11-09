import type { CookieOptions, Request, Response } from "express";
import { entorno } from "../config/entorno";
import { ErrorHttp } from "../middlewares/errores";
import type { AuthServicio, SesionEmitida } from "../servicios/AuthServicio";

const COOKIE_ACCESS = "access_token";
const COOKIE_REFRESH = "refresh_token";
const BASE: CookieOptions = { httpOnly: true, secure: true, sameSite: "strict" };
const OPCIONES_ACCESS: CookieOptions = { ...BASE, path: "/api" };
const OPCIONES_REFRESH: CookieOptions = { ...BASE, path: "/api/auth" };

function fijarCookies(res: Response, { accessToken, refreshToken }: SesionEmitida) {
  res.cookie(COOKIE_ACCESS, accessToken, { ...OPCIONES_ACCESS, maxAge: entorno.accessTokenMin * 60_000 });
  res.cookie(COOKIE_REFRESH, refreshToken, { ...OPCIONES_REFRESH, maxAge: entorno.refreshTokenDias * 86_400_000 });
}

function limpiarCookies(res: Response) {
  res.clearCookie(COOKIE_ACCESS, OPCIONES_ACCESS);
  res.clearCookie(COOKIE_REFRESH, OPCIONES_REFRESH);
}

// cookie-parser convierte los valores con prefijo "j:" en objetos
function leerRefresh(req: Request): string | undefined {
  const valor = req.cookies?.[COOKIE_REFRESH];
  return typeof valor === "string" ? valor : undefined;
}

export class AuthController {
  constructor(private readonly servicio: AuthServicio) {}

  login = async (req: Request, res: Response) => {
    const { nombre_usuario: nombreUsuario, contrasena } = req.body ?? {};
    if (typeof nombreUsuario !== "string" || typeof contrasena !== "string" || !nombreUsuario || !contrasena) {
      throw new ErrorHttp(400, "Usuario y contraseña son obligatorios");
    }
    const emitida = await this.servicio.login(nombreUsuario, contrasena);
    fijarCookies(res, emitida);
    res.json(emitida.sesion);
  };

  refresh = async (req: Request, res: Response) => {
    try {
      const emitida = await this.servicio.refresh(leerRefresh(req));
      fijarCookies(res, emitida);
      res.json(emitida.sesion);
    } catch (error) {
      if (error instanceof ErrorHttp) limpiarCookies(res);
      throw error;
    }
  };

  logout = async (req: Request, res: Response) => {
    await this.servicio.logout(leerRefresh(req));
    limpiarCookies(res);
    res.status(204).end();
  };

  yo = (req: Request, res: Response) => {
    res.json(req.usuario);
  };
}
