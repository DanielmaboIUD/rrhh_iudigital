import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { CatalogoController } from "../controllers/CatalogoController";
import { CrudController } from "../controllers/CrudController";
import { UsuarioController } from "../controllers/UsuarioController";
import { CatalogoDao } from "../dao/CatalogoDao";
import { FamiliarDao } from "../dao/FamiliarDao";
import { FormacionAcademicaDao } from "../dao/FormacionAcademicaDao";
import { FuncionarioDao } from "../dao/FuncionarioDao";
import { RefreshTokenDao } from "../dao/RefreshTokenDao";
import { RolDao } from "../dao/RolDao";
import { UsuarioDao } from "../dao/UsuarioDao";
import { autenticar } from "../middlewares/autenticar";
import { autorizar } from "../middlewares/autorizar";
import { limiteLogin } from "../middlewares/limiteLogin";
import type { CodigoRol } from "../models/Rol";
import { PoliticaFuncionario, PoliticaPorFuncionario } from "../politicas/Politica";
import { AuthServicio } from "../servicios/AuthServicio";
import { UsuarioServicio } from "../servicios/UsuarioServicio";

export const router = Router();

interface PermisosCrud {
  crear: CodigoRol[];
  editar: CodigoRol[];
  eliminar: CodigoRol[];
}

const LECTURA: CodigoRol[] = ["ADMIN", "RRHH", "CONSULTA", "FUNCIONARIO"];

function rutasCrud<T>(ruta: string, controller: CrudController<T>, permisos: PermisosCrud) {
  router.get(ruta, autorizar(...LECTURA), controller.listar);
  router.get(`${ruta}/:id`, autorizar(...LECTURA), controller.obtener);
  router.post(ruta, autorizar(...permisos.crear), controller.crear);
  router.put(`${ruta}/:id`, autorizar(...permisos.editar), controller.actualizar);
  router.delete(`${ruta}/:id`, autorizar(...permisos.eliminar), controller.eliminar);
}

const auth = new AuthController(new AuthServicio(new UsuarioDao(), new RefreshTokenDao()));
router.post("/auth/login", limiteLogin, auth.login);
router.post("/auth/refresh", auth.refresh);
router.post("/auth/logout", auth.logout);

// Todo lo registrado después de esta línea exige sesión
router.use(autenticar);

router.get("/auth/me", auth.yo);

const funcionarios = new FuncionarioDao();
rutasCrud("/funcionarios", new CrudController(funcionarios, new PoliticaFuncionario(funcionarios)), {
  crear: ["ADMIN", "RRHH"],
  editar: ["ADMIN", "RRHH", "FUNCIONARIO"],
  eliminar: ["ADMIN"],
});

const permisosPorFuncionario: PermisosCrud = {
  crear: ["ADMIN", "RRHH", "FUNCIONARIO"],
  editar: ["ADMIN", "RRHH", "FUNCIONARIO"],
  eliminar: ["ADMIN", "FUNCIONARIO"],
};
const familiares = new FamiliarDao();
rutasCrud("/familiares", new CrudController(familiares, new PoliticaPorFuncionario(familiares)), permisosPorFuncionario);
const formaciones = new FormacionAcademicaDao();
rutasCrud("/formaciones", new CrudController(formaciones, new PoliticaPorFuncionario(formaciones)), permisosPorFuncionario);

router.get("/catalogos", autorizar(...LECTURA), new CatalogoController(new CatalogoDao()).listar);

const usuarios = new UsuarioController(new UsuarioServicio(new UsuarioDao(), new RolDao()));
const soloAdmin = autorizar("ADMIN");
router.get("/roles", soloAdmin, usuarios.listarRoles);
router.get("/usuarios", soloAdmin, usuarios.listar);
router.post("/usuarios", soloAdmin, usuarios.crear);
router.put("/usuarios/:id", soloAdmin, usuarios.actualizar);
router.put("/usuarios/:id/contrasena", soloAdmin, usuarios.cambiarContrasena);
router.post("/usuarios/:id/desbloquear", soloAdmin, usuarios.desbloquear);
router.delete("/usuarios/:id", soloAdmin, usuarios.eliminar);
