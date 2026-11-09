import type { Request, Response } from "express";
import { ErrorHttp } from "../middlewares/errores";
import { FORMATO_NOMBRE, MAX_BYTES_CONTRASENA } from "../servicios/AuthServicio";
import type { UsuarioServicio } from "../servicios/UsuarioServicio";

const MAX_SMALLINT = 32_767;
const MAX_INTEGER = 2_147_483_647;

function esId(valor: unknown, maximo: number): valor is number {
  return typeof valor === "number" && Number.isInteger(valor) && valor > 0 && valor <= maximo;
}

function parsearId(valor: string): number {
  const id = Number(valor);
  if (!esId(id, MAX_INTEGER)) throw new ErrorHttp(400, "Id inválido");
  return id;
}

function validarContrasena(valor: unknown): string {
  if (typeof valor !== "string" || !valor || Buffer.byteLength(valor, "utf8") > MAX_BYTES_CONTRASENA) {
    throw new ErrorHttp(400, `La contraseña es obligatoria y no puede superar ${MAX_BYTES_CONTRASENA} bytes`);
  }
  return valor;
}

function validarRolId(valor: unknown): number {
  if (!esId(valor, MAX_SMALLINT)) throw new ErrorHttp(400, "rol_id inválido");
  return valor;
}

function validarFuncionarioId(valor: unknown): number | null {
  if (valor === null || valor === undefined) return null;
  if (!esId(valor, MAX_INTEGER)) throw new ErrorHttp(400, "funcionario_id inválido");
  return valor;
}

export class UsuarioController {
  constructor(private readonly servicio: UsuarioServicio) {}

  listar = async (_req: Request, res: Response) => {
    res.json(await this.servicio.listar());
  };

  listarRoles = async (_req: Request, res: Response) => {
    res.json(await this.servicio.listarRoles());
  };

  crear = async (req: Request, res: Response) => {
    const cuerpo = req.body ?? {};
    if (typeof cuerpo.nombre_usuario !== "string" || !FORMATO_NOMBRE.test(cuerpo.nombre_usuario)) {
      throw new ErrorHttp(400, "El nombre debe tener de 4 a 50 caracteres: minúsculas, números, punto, guion o guion bajo");
    }
    const usuario = await this.servicio.crear(
      cuerpo.nombre_usuario,
      validarContrasena(cuerpo.contrasena),
      validarRolId(cuerpo.rol_id),
      validarFuncionarioId(cuerpo.funcionario_id),
    );
    res.status(201).json(usuario);
  };

  actualizar = async (req: Request<{ id: string }>, res: Response) => {
    const id = parsearId(req.params.id);
    const cuerpo = req.body ?? {};
    if (typeof cuerpo.activo !== "boolean") throw new ErrorHttp(400, "activo debe ser verdadero o falso");
    res.json(
      await this.servicio.actualizar(req.usuario!, id, {
        rol_id: validarRolId(cuerpo.rol_id),
        funcionario_id: validarFuncionarioId(cuerpo.funcionario_id),
        activo: cuerpo.activo,
      }),
    );
  };

  cambiarContrasena = async (req: Request<{ id: string }>, res: Response) => {
    await this.servicio.cambiarContrasena(parsearId(req.params.id), validarContrasena(req.body?.contrasena));
    res.status(204).end();
  };

  desbloquear = async (req: Request<{ id: string }>, res: Response) => {
    res.json(await this.servicio.desbloquear(parsearId(req.params.id)));
  };

  eliminar = async (req: Request<{ id: string }>, res: Response) => {
    await this.servicio.eliminar(req.usuario!, parsearId(req.params.id));
    res.status(204).end();
  };
}
