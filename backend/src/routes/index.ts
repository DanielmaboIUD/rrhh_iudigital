import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { CatalogoController } from "../controllers/CatalogoController";
import { CrudController } from "../controllers/CrudController";
import { CatalogoDao } from "../dao/CatalogoDao";
import { FamiliarDao } from "../dao/FamiliarDao";
import { FormacionAcademicaDao } from "../dao/FormacionAcademicaDao";
import { FuncionarioDao } from "../dao/FuncionarioDao";
import { RefreshTokenDao } from "../dao/RefreshTokenDao";
import { UsuarioDao } from "../dao/UsuarioDao";
import { autenticar } from "../middlewares/autenticar";
import { limiteLogin } from "../middlewares/limiteLogin";
import { AuthServicio } from "../servicios/AuthServicio";

export const router = Router();

const auth = new AuthController(new AuthServicio(new UsuarioDao(), new RefreshTokenDao()));
router.post("/auth/login", limiteLogin, auth.login);
router.post("/auth/refresh", auth.refresh);
router.post("/auth/logout", auth.logout);
router.get("/auth/me", autenticar, auth.yo);

function rutasCrud<T>(ruta: string, controller: CrudController<T>) {
  router.get(ruta, controller.listar);
  router.get(`${ruta}/:id`, controller.obtener);
  router.post(ruta, controller.crear);
  router.put(`${ruta}/:id`, controller.actualizar);
  router.delete(`${ruta}/:id`, controller.eliminar);
}

rutasCrud("/funcionarios", new CrudController(new FuncionarioDao()));
rutasCrud("/familiares", new CrudController(new FamiliarDao()));
rutasCrud("/formaciones", new CrudController(new FormacionAcademicaDao()));
router.get("/catalogos", new CatalogoController(new CatalogoDao()).listar);
