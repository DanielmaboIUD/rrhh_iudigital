import express from "express";
import { manejarErrores } from "./middlewares/errores";
import { router } from "./routes";

export const app = express();

app.use(express.json());
app.use("/api", router);
app.use(manejarErrores);
