import { Router } from "express";
import { CatalogoController } from "../controllers/CatalogoController";
import { CrudController } from "../controllers/CrudController";
import { CatalogoDao } from "../dao/CatalogoDao";
import { FamiliarDao } from "../dao/FamiliarDao";
import { FormacionAcademicaDao } from "../dao/FormacionAcademicaDao";
import { FuncionarioDao } from "../dao/FuncionarioDao";

export const router = Router();

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
