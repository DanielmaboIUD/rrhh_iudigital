import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { entorno } from "../config/entorno";
import type { RefreshTokenDao } from "../dao/RefreshTokenDao";
import type { UsuarioDao } from "../dao/UsuarioDao";
import { ErrorHttp } from "../middlewares/errores";
import type { CodigoRol } from "../models/Rol";
import type { Usuario } from "../models/Usuario";
import type { UsuarioSesion } from "../models/UsuarioSesion";

export interface SesionEmitida {
  sesion: UsuarioSesion;
  accessToken: string;
  refreshToken: string;
}

interface ClaimsAcceso extends jwt.JwtPayload {
  nombreUsuario: string;
  rol: CodigoRol;
  funcionarioId: number | null;
}

const FORMATO_NOMBRE = /^[a-z0-9._-]{4,50}$/;
const MAX_BYTES_CONTRASENA = 72;

// Iguala el tiempo de respuesta cuando el usuario no existe
const hashFicticio = bcrypt.hash(randomBytes(32).toString("hex"), entorno.bcryptCosto);

const credencialesInvalidas = () => new ErrorHttp(401, "Usuario o contraseña incorrectos");
const sesionInvalida = () => new ErrorHttp(401, "Sesión no válida");
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const nuevoRefreshToken = () => randomBytes(48).toString("base64url");

function aSesion(u: Usuario): UsuarioSesion {
  return { id: u.id, nombreUsuario: u.nombre_usuario, rol: u.rol, funcionarioId: u.funcionario_id };
}

function firmarAccessToken(s: UsuarioSesion): string {
  return jwt.sign({ nombreUsuario: s.nombreUsuario, rol: s.rol, funcionarioId: s.funcionarioId }, entorno.jwtSecreto, {
    algorithm: "HS256",
    subject: String(s.id),
    expiresIn: entorno.accessTokenMin * 60,
  });
}

export function verificarAccessToken(token: string): UsuarioSesion {
  const claims = jwt.verify(token, entorno.jwtSecreto, { algorithms: ["HS256"] }) as ClaimsAcceso;
  return { id: Number(claims.sub), nombreUsuario: claims.nombreUsuario, rol: claims.rol, funcionarioId: claims.funcionarioId };
}

export class AuthServicio {
  constructor(
    private readonly usuarios: UsuarioDao,
    private readonly refreshTokens: RefreshTokenDao,
  ) {}

  /**
   * "Cuenta bloqueada" solo se informa a quien da la contraseña correcta, para no revelar a un
   * tercero que la cuenta existe. Durante el bloqueo los fallos no cuentan ni lo prolongan.
   */
  async login(nombreUsuario: string, contrasena: string): Promise<SesionEmitida> {
    if (Buffer.byteLength(contrasena, "utf8") > MAX_BYTES_CONTRASENA) throw credencialesInvalidas();

    const usuario = FORMATO_NOMBRE.test(nombreUsuario) ? await this.usuarios.findByNombreUsuario(nombreUsuario) : null;
    const correcta = await bcrypt.compare(contrasena, usuario?.contrasena_hash ?? (await hashFicticio));

    if (!usuario || !usuario.activo) throw credencialesInvalidas();
    if (!correcta) {
      if (!usuario.bloqueado) {
        await this.usuarios.registrarFallo(usuario.id, entorno.maxIntentosLogin, entorno.bloqueoMin);
      }
      throw credencialesInvalidas();
    }
    if (usuario.bloqueado) throw new ErrorHttp(423, "Cuenta bloqueada temporalmente");

    await this.usuarios.registrarExito(usuario.id);
    const refreshToken = nuevoRefreshToken();
    await this.refreshTokens.crear(usuario.id, hashToken(refreshToken), entorno.refreshTokenDias);
    const sesion = aSesion(usuario);
    return { sesion, accessToken: firmarAccessToken(sesion), refreshToken };
  }

  async refresh(token: string | undefined): Promise<SesionEmitida> {
    if (!token) throw sesionInvalida();
    const actual = await this.refreshTokens.buscarPorHash(hashToken(token));
    if (!actual) throw sesionInvalida();

    if (actual.revocado) {
      await this.refreshTokens.revocarTodosDeUsuario(actual.usuario_id);
      throw sesionInvalida();
    }
    if (actual.vencido) throw sesionInvalida();

    // El rol sale de la BD para que un cambio aplique en la siguiente renovación
    const usuario = await this.usuarios.findById(actual.usuario_id);
    if (!usuario || !usuario.activo) throw sesionInvalida();

    const refreshToken = nuevoRefreshToken();
    if (!(await this.refreshTokens.rotar(actual, hashToken(refreshToken), entorno.refreshTokenDias))) {
      await this.refreshTokens.revocarTodosDeUsuario(actual.usuario_id);
      throw sesionInvalida();
    }
    const sesion = aSesion(usuario);
    return { sesion, accessToken: firmarAccessToken(sesion), refreshToken };
  }

  async logout(token: string | undefined): Promise<void> {
    if (token) await this.refreshTokens.revocar(hashToken(token));
  }
}
