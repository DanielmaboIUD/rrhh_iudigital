import { useEffect, useState, type FormEvent } from "react";
import { api } from "./api";
import type { Campo, Registro } from "./types";

interface Props {
  titulo: string;
  recurso: string;
  campos: Campo[];
}

type Formulario = Record<string, string>;

function formularioVacio(campos: Campo[]): Formulario {
  return Object.fromEntries(campos.map((c) => [c.nombre, ""]));
}

function aRegistro(form: Formulario, campos: Campo[]): Registro {
  return Object.fromEntries(
    campos.map((c) => {
      const valor = form[c.nombre].trim();
      if (valor === "") return [c.nombre, null];
      return [c.nombre, c.opciones ? Number(valor) : valor];
    }),
  );
}

function textoCelda(campo: Campo, valor: Registro[string]): string {
  if (valor === null || valor === undefined) return "";
  if (campo.opciones) return campo.opciones.find((o) => o.id === valor)?.nombre ?? String(valor);
  return String(valor);
}

export function CrudPage({ titulo, recurso, campos }: Props) {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [form, setForm] = useState<Formulario>(formularioVacio(campos));
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setRegistros(await api.listar(recurso));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    cargar();
  }, [recurso]);

  function limpiar() {
    setForm(formularioVacio(campos));
    setEditandoId(null);
    setError("");
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    try {
      const datos = aRegistro(form, campos);
      if (editandoId) await api.actualizar(recurso, editandoId, datos);
      else await api.crear(recurso, datos);
      limpiar();
      cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function editar(registro: Registro) {
    setEditandoId(registro.id!);
    setForm(Object.fromEntries(campos.map((c) => [c.nombre, String(registro[c.nombre] ?? "")])));
    setError("");
  }

  async function eliminar(id: number) {
    if (!confirm("¿Eliminar este registro?")) return;
    try {
      await api.eliminar(recurso, id);
      if (editandoId === id) limpiar();
      cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section>
      <h2>{editandoId ? `Editar ${titulo}` : `Nuevo ${titulo}`}</h2>
      <form className="formulario" onSubmit={guardar}>
        {campos.map((c) => (
          <label key={c.nombre}>
            {c.etiqueta}
            {c.opciones ? (
              <select
                value={form[c.nombre]}
                required={!c.opcional}
                onChange={(e) => setForm({ ...form, [c.nombre]: e.target.value })}
              >
                <option value="">Seleccione...</option>
                {c.opciones.map((o) => (
                  <option key={o.id} value={o.id}>{o.nombre}</option>
                ))}
              </select>
            ) : (
              <input
                type={c.tipo ?? "text"}
                value={form[c.nombre]}
                required={!c.opcional}
                onChange={(e) => setForm({ ...form, [c.nombre]: e.target.value })}
              />
            )}
          </label>
        ))}
        <div className="acciones">
          <button type="submit">{editandoId ? "Actualizar" : "Crear"}</button>
          {editandoId && <button type="button" className="secundario" onClick={limpiar}>Cancelar</button>}
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      <div className="tabla">
        <table>
          <thead>
            <tr>
              {campos.map((c) => <th key={c.nombre}>{c.etiqueta}</th>)}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((r) => (
              <tr key={r.id}>
                {campos.map((c) => <td key={c.nombre}>{textoCelda(c, r[c.nombre])}</td>)}
                <td className="acciones">
                  <button className="secundario" onClick={() => editar(r)}>Editar</button>
                  <button className="peligro" onClick={() => eliminar(r.id!)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
