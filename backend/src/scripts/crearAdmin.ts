import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import bcrypt from "bcrypt";
import { pool } from "../config/db";

const COSTO_BCRYPT = 12;
const FORMATO_NOMBRE = /^[a-z0-9._-]{4,50}$/;
const VIOLACION_UNICO = "23505";
const TABLA_INEXISTENTE = "42P01";

class ErrorEntrada extends Error {}

let ocultarEntrada = false;
const salida = new Writable({
  write(fragmento, _codificacion, listo) {
    if (!ocultarEntrada) process.stdout.write(fragmento);
    listo();
  },
});

const consola = createInterface({ input: process.stdin, output: salida, terminal: process.stdin.isTTY });
consola.on("SIGINT", () => process.exit(130));
// Tras el nombre todo es contraseña; se apaga aquí para cubrir también el texto pegado de golpe
consola.once("line", () => {
  ocultarEntrada = true;
});
// El iterador no pierde líneas cuando la entrada llega por tubería
const lineas = consola[Symbol.asyncIterator]();

async function preguntar(texto: string, oculto = false): Promise<string> {
  process.stdout.write(texto);
  const { value, done } = await lineas.next();
  if (oculto) process.stdout.write("\n");
  if (done) throw new ErrorEntrada("Entrada cancelada.");
  return value;
}

async function pedirDatos() {
  const nombreUsuario = await preguntar("Nombre de usuario: ");
  if (!FORMATO_NOMBRE.test(nombreUsuario)) {
    throw new ErrorEntrada("El nombre debe tener de 4 a 50 caracteres: minúsculas, números, punto, guion o guion bajo.");
  }

  const contrasena = await preguntar("Contraseña: ", true);
  const bytes = Buffer.byteLength(contrasena, "utf8");
  if (bytes === 0 || bytes > 72) {
    throw new ErrorEntrada("La contraseña no puede estar vacía ni superar 72 bytes.");
  }
  if ((await preguntar("Repita la contraseña: ", true)) !== contrasena) {
    throw new ErrorEntrada("Las contraseñas no coinciden.");
  }

  return { nombreUsuario, contrasena };
}

async function crearAdmin() {
  const { nombreUsuario, contrasena } = await pedirDatos();
  const hash = await bcrypt.hash(contrasena, COSTO_BCRYPT);

  const { rowCount } = await pool.query(
    `INSERT INTO rrhh.usuario (nombre_usuario, contrasena_hash, rol_id)
     SELECT $1, $2, id FROM rrhh.rol WHERE codigo = 'ADMIN'`,
    [nombreUsuario, hash],
  );
  if (rowCount === 0) throw new ErrorEntrada("No existe el rol ADMIN. Ejecute 03_seguridad.sql.");

  console.log(`Administrador "${nombreUsuario}" creado.`);
}

function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorEntrada) return error.message;
  const codigo = (error as { code?: string }).code;
  if (codigo === VIOLACION_UNICO) return "Ese nombre de usuario ya existe.";
  if (codigo === TABLA_INEXISTENTE) return "Faltan las tablas de seguridad. Ejecute 03_seguridad.sql.";
  return "No se pudo crear el administrador. Revise la conexión a la base de datos.";
}

try {
  await crearAdmin();
} catch (error) {
  console.error(mensajeDeError(error));
  process.exitCode = 1;
} finally {
  consola.close();
  await pool.end();
}
