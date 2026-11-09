import { rateLimit } from "express-rate-limit";

export const limiteLogin = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Demasiados intentos de inicio de sesión. Intente más tarde" },
});
