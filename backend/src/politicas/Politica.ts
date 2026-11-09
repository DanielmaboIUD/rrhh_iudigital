import type { Dao, DaoPorFuncionario } from "../dao/Dao";
import { ErrorHttp } from "../middlewares/errores";
import type { Funcionario } from "../models/Funcionario";
import type { UsuarioSesion } from "../models/UsuarioSesion";

export interface Politica<T> {
  listar(usuario: UsuarioSesion): Promise<T[]>;
  puedeAcceder(usuario: UsuarioSesion, entidad: T): boolean;
  paraCrear(usuario: UsuarioSesion, datos: T): T;
  paraEditar(usuario: UsuarioSesion, datos: T, actual: T): T;
  validarEliminacion(usuario: UsuarioSesion, entidad: T): void;
}

// null: el rol no está restringido a registros propios
function funcionarioPropio(usuario: UsuarioSesion): number | null {
  if (usuario.rol !== "FUNCIONARIO") return null;
  if (usuario.funcionarioId === null) throw new ErrorHttp(403, "Su cuenta no está enlazada a un funcionario");
  return usuario.funcionarioId;
}

export class PoliticaFuncionario implements Politica<Funcionario> {
  constructor(private readonly dao: Dao<Funcionario>) {}

  async listar(usuario: UsuarioSesion) {
    const propio = funcionarioPropio(usuario);
    if (propio === null) return this.dao.findAll();
    const ficha = await this.dao.findById(propio);
    return ficha ? [ficha] : [];
  }

  puedeAcceder(usuario: UsuarioSesion, entidad: Funcionario) {
    const propio = funcionarioPropio(usuario);
    return propio === null || entidad.id === propio;
  }

  paraCrear(_usuario: UsuarioSesion, datos: Funcionario) {
    return datos;
  }

  paraEditar(usuario: UsuarioSesion, datos: Funcionario, actual: Funcionario) {
    if (funcionarioPropio(usuario) === null) return datos;
    return {
      ...datos,
      tipo_identificacion_id: actual.tipo_identificacion_id,
      numero_identificacion: actual.numero_identificacion,
    };
  }

  // Borrar la ficha propia eliminaría en cascada la cuenta con la que se opera
  validarEliminacion(usuario: UsuarioSesion, entidad: Funcionario) {
    if (usuario.funcionarioId === entidad.id) throw new ErrorHttp(409, "No puede eliminar su propia ficha");
  }
}

export class PoliticaPorFuncionario<T extends { funcionario_id: number }> implements Politica<T> {
  constructor(private readonly dao: DaoPorFuncionario<T>) {}

  async listar(usuario: UsuarioSesion) {
    const propio = funcionarioPropio(usuario);
    return propio === null ? this.dao.findAll() : this.dao.findAllByFuncionario(propio);
  }

  puedeAcceder(usuario: UsuarioSesion, entidad: T) {
    const propio = funcionarioPropio(usuario);
    return propio === null || entidad.funcionario_id === propio;
  }

  paraCrear(usuario: UsuarioSesion, datos: T) {
    return this.forzarPropietario(usuario, datos);
  }

  paraEditar(usuario: UsuarioSesion, datos: T, _actual: T) {
    return this.forzarPropietario(usuario, datos);
  }

  validarEliminacion() {}

  private forzarPropietario(usuario: UsuarioSesion, datos: T): T {
    const propio = funcionarioPropio(usuario);
    return propio === null ? datos : { ...datos, funcionario_id: propio };
  }
}
