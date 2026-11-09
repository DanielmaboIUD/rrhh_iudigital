function fallar(mensaje: string): never {
  console.error(`Configuración inválida en backend/.env: ${mensaje}`);
  process.exit(1);
}

function entero(nombre: string, minimo: number, maximo: number): number {
  const valor = Number(process.env[nombre]);
  if (!process.env[nombre] || !Number.isInteger(valor) || valor < minimo || valor > maximo) {
    fallar(`${nombre} debe ser un entero entre ${minimo} y ${maximo}.`);
  }
  return valor;
}

function secretoJwt(): string {
  const secreto = process.env.JWT_SECRET ?? "";
  if (Buffer.byteLength(secreto, "utf8") < 32) fallar("JWT_SECRET debe tener al menos 32 bytes.");
  return secreto;
}

function origenPermitido(): string {
  const origen = process.env.ORIGEN_PERMITIDO ?? "";
  // Se compara literalmente con la cabecera Origin: una "/" final bloquearía toda escritura
  if (!URL.canParse(origen) || new URL(origen).origin !== origen) {
    fallar("ORIGEN_PERMITIDO debe ser un origen sin ruta, por ejemplo https://localhost:5173.");
  }
  return origen;
}

export const entorno = {
  jwtSecreto: secretoJwt(),
  accessTokenMin: entero("ACCESS_TOKEN_MIN", 1, 1440),
  refreshTokenDias: entero("REFRESH_TOKEN_DIAS", 1, 365),
  maxIntentosLogin: entero("MAX_INTENTOS_LOGIN", 1, 100),
  bloqueoMin: entero("BLOQUEO_MIN", 1, 1440),
  bcryptCosto: entero("BCRYPT_COSTO", 4, 31),
  origenPermitido: origenPermitido(),
};
