import { readFileSync } from "node:fs";
import { createServer } from "node:https";
import { app } from "./app";

const puerto = Number(process.env.PORT) || 3000;

function leerCredencialesTls() {
  const { TLS_CERT_PATH, TLS_KEY_PATH } = process.env;
  if (!TLS_CERT_PATH || !TLS_KEY_PATH) {
    console.error("Faltan TLS_CERT_PATH y/o TLS_KEY_PATH en backend/.env. La API no se inicia sin HTTPS.");
    process.exit(1);
  }
  try {
    return { cert: readFileSync(TLS_CERT_PATH), key: readFileSync(TLS_KEY_PATH) };
  } catch {
    console.error(`No se pudieron leer los certificados (${TLS_CERT_PATH}, ${TLS_KEY_PATH}). Genérelos con mkcert.`);
    process.exit(1);
  }
}

createServer(leerCredencialesTls(), app).listen(puerto, () => {
  console.log(`API escuchando en https://localhost:${puerto}/api`);
});
