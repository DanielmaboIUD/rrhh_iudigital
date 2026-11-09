import cookieParser from "cookie-parser";
import express from "express";
import { manejarErrores } from "./middlewares/errores";
import { verificarOrigen } from "./middlewares/verificarOrigen";
import { router } from "./routes";

export const app = express();

app.disable("x-powered-by");
app.use("/api", verificarOrigen);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use("/api", router);
app.use(manejarErrores);
