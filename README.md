# RRHH IU Digital — CRUD con patrón DAO

Monorepo (pnpm workspaces) con MVC:

- **Modelo**: `backend/src/models` (entidades) + `backend/src/dao` (acceso a datos).
- **Vista**: `frontend` (React + Vite).
- **Controlador**: `backend/src/controllers` (Express).

`Dao<T>` define el contrato; cada `*Dao` lo implementa con SQL parametrizado sobre PostgreSQL. Los
controladores solo conocen la interfaz, y la implementación concreta se inyecta en `routes/index.ts`.

## Ejecutar

Requiere la base `rrhh_iudigital` creada con los scripts `00`–`02` y [mkcert](https://github.com/FiloSottile/mkcert).

```
mkcert -install
mkdir certs
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 ::1

pnpm install
cp backend/.env.example backend/.env   # completar DB_PASSWORD
pnpm dev
```

El proxy de Vite confía en la CA de mkcert con `--use-system-ca`. Si responde 502 por el certificado,
define `NODE_EXTRA_CA_CERTS=<salida de mkcert -CAROOT>/rootCA.pem` como variable real del sistema: Node
la ignora si viene de un archivo `.env`.

- API: https://localhost:3000/api
- Frontend: https://localhost:5173
