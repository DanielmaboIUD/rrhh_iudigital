import type { Catalogos, Registro } from "./types";

async function pedir<T>(url: string, opciones?: RequestInit): Promise<T> {
  const res = await fetch(`/api${url}`, {
    headers: { "Content-Type": "application/json" },
    ...opciones,
  });
  if (!res.ok) {
    const cuerpo = await res.json().catch(() => ({}));
    throw new Error(cuerpo.error ?? `Error ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  catalogos: () => pedir<Catalogos>("/catalogos"),
  listar: (recurso: string) => pedir<Registro[]>(`/${recurso}`),
  crear: (recurso: string, datos: Registro) =>
    pedir<Registro>(`/${recurso}`, { method: "POST", body: JSON.stringify(datos) }),
  actualizar: (recurso: string, id: number, datos: Registro) =>
    pedir<Registro>(`/${recurso}/${id}`, { method: "PUT", body: JSON.stringify(datos) }),
  eliminar: (recurso: string, id: number) =>
    pedir<void>(`/${recurso}/${id}`, { method: "DELETE" }),
};
