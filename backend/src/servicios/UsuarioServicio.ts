import bcrypt from "bcrypt";
import { entorno } from "../config/entorno";
import type { RolDao } from "../dao/RolDao";
import type { UsuarioDao } from "../dao/UsuarioDao";
import { ErrorHttp } from "../middlewares/errores";
import type { Rol } from "../models/Rol";
import type { DatosCuenta, UsuarioPublico } from "../models/Usuario";
import type { UsuarioSesion } from "../models/UsuarioSesion";

const ERRORES_RESTRICCION: Record<string, [number, string]> = {
  uq_usuario_nombre_usuario: [409, "Ese nombre de usuario ya existe"],
  uq_usuario_funcionario: [409, "Ese funcionario ya tiene una cuenta"],
  fk_usuario_funcionario: [400, "El funcionario indicado no existe"],
};

async function traducirRestricciones<T>(operacion: () => Promise<T>): Promise<T> {
  try {
    return await operacion();
  } catch (error) {
    const conocido = ERRORES_RESTRICCION[(error as { constraint?: string }).constraint ?? ""];
    if (conocido) throw new ErrorHttp(conocido[0], conocido[1]);
    throw error;
  }
}

const noEncontrado = () => new ErrorHttp(404, "Usuario no encontrado");

export class UsuarioServicio {
  constructor(
    private readonly usuarios: UsuarioDao,
    private readonly roles: RolDao,
  ) {}

  listar(): Promise<UsuarioPublico[]> {
    return this.usuarios.findAll();
  }

  listarRoles(): Promise<Rol[]> {
    return this.roles.findAll();
  }

  private async validarRol(rolId: number, funcionarioId: number | null): Promise<Rol> {
    const rol = await this.roles.findById(rolId);
    if (!rol) throw new ErrorHttp(400, "El rol indicado no existe");
    if (rol.codigo === "FUNCIONARIO" && funcionarioId === null) {
      throw new ErrorHttp(400, "El rol FUNCIONARIO exige un funcionario enlazado");
    }
    return rol;
  }

  async crear(nombreUsuario: string, contrasena: string, rolId: number, funcionarioId: number | null): Promise<UsuarioPublico> {
    await this.validarRol(rolId, funcionarioId);
    const hash = await bcrypt.hash(contrasena, entorno.bcryptCosto);
    return traducirRestricciones(() => this.usuarios.crear(nombreUsuario, hash, rolId, funcionarioId));
  }

  async actualizar(sesion: UsuarioSesion, id: number, datos: DatosCuenta): Promise<UsuarioPublico> {
    const rol = await this.validarRol(datos.rol_id, datos.funcionario_id);
    const actual = await this.usuarios.findById(id);
    if (!actual) throw noEncontrado();
    if (id === sesion.id && (datos.rol_id !== actual.rol_id || !datos.activo)) {
      throw new ErrorHttp(409, "No puede cambiar su propio rol ni desactivar su propia cuenta");
    }
    const usuario = await traducirRestricciones(() => this.usuarios.actualizar(id, datos, rol.codigo === "ADMIN"));
    if (!usuario) throw noEncontrado();
    return usuario;
  }

  async cambiarContrasena(id: number, contrasena: string): Promise<void> {
    const hash = await bcrypt.hash(contrasena, entorno.bcryptCosto);
    if (!(await this.usuarios.cambiarContrasena(id, hash))) throw noEncontrado();
  }

  async desbloquear(id: number): Promise<UsuarioPublico> {
    const usuario = await this.usuarios.desbloquear(id);
    if (!usuario) throw noEncontrado();
    return usuario;
  }

  async eliminar(sesion: UsuarioSesion, id: number): Promise<void> {
    if (id === sesion.id) throw new ErrorHttp(409, "No puede eliminar su propia cuenta");
    if (!(await this.usuarios.eliminar(id))) throw noEncontrado();
  }
}
