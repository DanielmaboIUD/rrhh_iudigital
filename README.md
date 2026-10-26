# RRHH IU Digital — CRUD con patrón DAO

Monorepo (pnpm workspaces) con MVC:

- **Modelo**: `backend/src/models` (entidades) + `backend/src/dao` (acceso a datos).
- **Vista**: `frontend` (React + Vite).
- **Controlador**: `backend/src/controllers` (Express).

`Dao<T>` define el contrato; cada `*Dao` lo implementa con SQL parametrizado sobre PostgreSQL. Los
controladores solo conocen la interfaz, y la implementación concreta se inyecta en `routes/index.ts`.

## Ejecutar

Requiere la base `rrhh_iudigital` creada con los scripts `00`–`02`.

```
pnpm install
cp backend/.env.example backend/.env   # completar DB_PASSWORD
pnpm dev
```

- API: http://localhost:3000/api
- Frontend: http://localhost:5173
