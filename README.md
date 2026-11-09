# RRHH IU Digital — CRUD con patrón DAO

Monorepo (pnpm workspaces) con MVC:

- **Modelo**: `backend/src/models` (entidades) + `backend/src/dao` (acceso a datos).
- **Vista**: `frontend` (React + Vite).
- **Controlador**: `backend/src/controllers` (Express).

`Dao<T>` define el contrato; cada `*Dao` lo implementa con SQL parametrizado sobre PostgreSQL. Los
controladores solo conocen la interfaz, y la implementación concreta se inyecta en `routes/index.ts`.

## Requisitos

| Herramienta | Versión | Instalación |
|---|---|---|
| [Node.js](https://nodejs.org) | 24 | Instalador oficial |
| [pnpm](https://pnpm.io) | 11 | `npm install -g pnpm@11` |
| [PostgreSQL](https://www.postgresql.org/download/) | 10 o superior | Instalador oficial; incluye pgAdmin en Windows y macOS |
| [mkcert](https://github.com/FiloSottile/mkcert) | Actual | Ver paso 2 |
| [Git](https://git-scm.com) | Actual | Instalador oficial |

## Ejecutar en local

Salvo que se indique otra cosa, los comandos van **en la raíz del proyecto**.

### 1. Obtener el código e instalar dependencias

```
git clone <url-del-repositorio> sofseg
cd sofseg
pnpm install
```

### 2. Generar los certificados HTTPS

Instala mkcert según tu sistema y abre una terminal nueva para que reconozca el comando:

| Sistema | Comando |
|---|---|
| Windows (PowerShell como administrador) | `winget install FiloSottile.mkcert` |
| macOS | `brew install mkcert nss` |
| Debian / Ubuntu | `sudo apt install mkcert libnss3-tools` |

Instala la CA local una sola vez por equipo y genera los certificados **en la raíz del proyecto**:

```
mkcert -install
mkdir certs
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 ::1
```

Si el navegador estaba abierto, ciérralo por completo para que tome la CA nueva.

### 3. Crear la base de datos

Ejecuta los scripts **en este orden**:

| Script | Conectado a la base |
|---|---|
| `00_crear_base_datos.sql` | `postgres` |
| `01_esquema.sql` | `rrhh_iudigital` |
| `02_poblado.sql` | `rrhh_iudigital` |
| `03_seguridad.sql` | `rrhh_iudigital` |

En **pgAdmin**, abre el Query Tool de la base indicada, carga cada script y ejecútalo. Con **psql** (bash;
en PowerShell cambia la primera línea por `$env:PGCLIENTENCODING="UTF8"`):

```
export PGCLIENTENCODING=UTF8
psql -U postgres -d postgres -v ON_ERROR_STOP=1 -f 00_crear_base_datos.sql
psql -U postgres -d rrhh_iudigital -v ON_ERROR_STOP=1 -f 01_esquema.sql
psql -U postgres -d rrhh_iudigital -v ON_ERROR_STOP=1 -f 02_poblado.sql
psql -U postgres -d rrhh_iudigital -v ON_ERROR_STOP=1 -f 03_seguridad.sql
```

Volver a correr `01` borra el esquema, incluidas las cuentas: después hay que repetir `02`, `03` y el paso 5.

### 4. Configurar el backend

```
cp backend/.env.example backend/.env
```

Genera el secreto de los tokens:

```
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Completa `backend/.env`. Los valores de `TLS_*`, tiempos, bcrypt y origen ya vienen listos; solo faltan estos
(ajusta usuario y contraseña a tu PostgreSQL):

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rrhh_iudigital
DB_USER=postgres
DB_PASSWORD=<tu contraseña de PostgreSQL>
JWT_SECRET=<el valor generado>
```

### 5. Crear el primer administrador

```
pnpm --filter backend crear-admin
```

Pide usuario y contraseña (esta no se muestra al escribir). El usuario admite de 4 a 50 caracteres: minúsculas,
números, punto, guion o guion bajo.

### 6. Iniciar

```
pnpm dev
```

Abre https://localhost:5173, comprueba el candado del navegador e ingresa con el administrador. Las demás
cuentas se crean en la pestaña **Usuarios**.

- API: https://localhost:3000/api
- Frontend: https://localhost:5173

Otros comandos: `pnpm typecheck` y `pnpm --filter frontend build`.

## Problemas frecuentes

| Síntoma | Solución |
|---|---|
| `mkcert` no se reconoce | Abre una terminal nueva tras instalarlo |
| `mkcert -install` falla con `keytool` (Java) | Se puede ignorar si dice `installed in the system trust store`; el proyecto no usa Java |
| `ENOENT ... certs\localhost.pem` o «No se pudieron leer los certificados» | Los certificados deben estar en `certs/` de la raíz; repite el paso 2 desde ahí |
| «Configuración inválida en backend/.env» o «Faltan TLS_CERT_PATH» | Completa la variable que indica el mensaje (paso 4) |
| El navegador advierte que el sitio no es seguro | Ejecuta `mkcert -install` y reinicia el navegador |
| El proxy responde 502 por el certificado | Define `NODE_EXTRA_CA_CERTS=<salida de mkcert -CAROOT>/rootCA.pem` como variable real del sistema: Node la ignora si viene de un archivo `.env` |
| Errores de conexión a la base o de autenticación | Revisa que PostgreSQL esté activo y los `DB_*` de `backend/.env` |
| «Faltan las tablas de seguridad» | Ejecuta `03_seguridad.sql` sobre `rrhh_iudigital` |
| «Demasiados intentos» (429) | Espera 15 minutos o reinicia `pnpm dev` |
| «Cuenta bloqueada temporalmente» | Espera 15 minutos o desbloquéala en la pestaña **Usuarios** con otro ADMIN |

## Variables de entorno

Todas van en `backend/.env`; la plantilla es `backend/.env.example`.

| Variable | Uso |
|---|---|
| `PORT` | Puerto de la API. Usa 3000: el proxy de Vite apunta a ese puerto |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Conexión a PostgreSQL |
| `TLS_CERT_PATH`, `TLS_KEY_PATH` | Certificado y clave de mkcert, relativos a `backend/` |
| `JWT_SECRET` | Firma de los tokens; mínimo 32 bytes |
| `ACCESS_TOKEN_MIN` | Vigencia del access token, en minutos |
| `REFRESH_TOKEN_DIAS` | Vigencia del refresh token, en días |
| `MAX_INTENTOS_LOGIN`, `BLOQUEO_MIN` | Fallos antes del bloqueo y su duración en minutos |
| `BCRYPT_COSTO` | Costo de bcrypt para las cuentas creadas por la API |
| `ORIGEN_PERMITIDO` | Origen aceptado en escrituras, sin `/` final |

La API no arranca en HTTP ni con la configuración incompleta. `certs/`, `*.pem` y `.env` no se versionan.

## Seguridad

- La sesión usa un access token JWT y un refresh token rotativo, ambos en cookies `HttpOnly; Secure; SameSite=Strict`.
- Reutilizar un refresh token ya rotado revoca todas las sesiones del usuario.
- Tras los fallos configurados, la cuenta se bloquea. El login admite 10 intentos por IP cada 15 minutos.
- Cambiar rol, funcionario, estado o contraseña revoca las sesiones; el access token vigente dura hasta vencer.
- Solo ADMIN crea cuentas, desde la pestaña Usuarios. El sistema siempre conserva un ADMIN activo.

## Roles y permisos

✔ permitido · ✘ prohibido · **Propio**: solo los registros del funcionario enlazado a la cuenta.

| Recurso / acción | ADMIN | RRHH | CONSULTA | FUNCIONARIO |
|---|---|---|---|---|
| Funcionarios · listar / ver | ✔ | ✔ | ✔ | Propio |
| Funcionarios · crear | ✔ | ✔ | ✘ | ✘ |
| Funcionarios · editar | ✔ | ✔ | ✘ | Propio (sin cambiar identificación) |
| Funcionarios · eliminar | ✔ | ✘ | ✘ | ✘ |
| Familiares y formaciones · listar / ver | ✔ | ✔ | ✔ | Propio |
| Familiares y formaciones · crear / editar | ✔ | ✔ | ✘ | Propio |
| Familiares y formaciones · eliminar | ✔ | ✘ | ✘ | Propio |
| Catálogos · listar | ✔ | ✔ | ✔ | ✔ |
| Usuarios · todo | ✔ | ✘ | ✘ | ✘ |

El backend es el único control real; el frontend solo oculta lo que el rol no puede usar. Un registro ajeno
responde 404 para no revelar que existe.
