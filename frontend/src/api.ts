import type { Catalogos, Registro, UsuarioSesion } from "./types";

let renovacion: Promise<boolean> | null = null;
let notificarSesionPerdida = () => {};

export function alPerderSesion(callback: () => void) {
  notificarSesionPerdida = callback;
}

// Solo un 401 significa que la sesión se perdió; un backend caído no debe expulsar al usuario
async function solicitarRenovacion(): Promise<boolean> {
  const res = await fetch("/api/auth/refresh", { method: "POST" });
  return res.status !== 401;
}

// El candado evita que otra pestaña use el mismo token a la vez, lo que contaría como reutilización
function renovarSesion(): Promise<boolean> {
  renovacion ??= navigator.locks
    .request("renovar-sesion", solicitarRenovacion)
    .catch(() => true)
    .finally(() => {
      renovacion = null;
    });
  return renovacion;
}

function enviar(url: string, opciones?: RequestInit): Promise<Response> {
  return fetch(`/api${url}`, {
    headers: { "Content-Type": "application/json" },
    ...opciones,
  });
}

async function pedir<T>(url: string, opciones?: RequestInit, renovar = true): Promise<T> {
  let res = await enviar(url, opciones);
  // Cualquier 401, no solo TOKEN_EXPIRADO: al vencer, la cookie deja de enviarse y el backend no ve token
  if (res.status === 401 && renovar) {
    if (await renovarSesion()) res = await enviar(url, opciones);
    if (res.status === 401) {
      notificarSesionPerdida();
      throw new Error("Su sesión expiró. Inicie sesión de nuevo");
    }
  }
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

export const apiAuth = {
  yo: () => pedir<UsuarioSesion>("/auth/me"),
  login: (nombreUsuario: string, contrasena: string) =>
    pedir<UsuarioSesion>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ nombre_usuario: nombreUsuario, contrasena }) },
      false,
    ),
  logout: () => pedir<void>("/auth/logout", { method: "POST" }, false),
};
