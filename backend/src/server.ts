import { app } from "./app";

const puerto = Number(process.env.PORT) || 3000;

app.listen(puerto, () => {
  console.log(`API escuchando en http://localhost:${puerto}/api`);
});
