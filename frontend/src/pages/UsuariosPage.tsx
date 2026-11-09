import { useEffect, useRef, useState, type FormEvent } from "react";
import { apiUsuarios } from "../api";
import { useAuth } from "../auth/AuthContext";
import type { DatosCuenta, Opcion, Rol, Usuario } from "../types";

interface Formulario {
  nombre_usuario: string;
  contrasena: string;
  rol_id: string;
  funcionario_id: string;
  activo: boolean;
}

const VACIO: Formulario = { nombre_usuario: "", contrasena: "", rol_id: "", funcionario_id: "", activo: true };

function datosCuenta(u: Usuario): DatosCuenta {
  return { rol_id: u.rol_id, funcionario_id: u.funcionario_id, activo: u.activo };
}

export function UsuariosPage({ funcionarios }: { funcionarios: Opcion[] }) {
  const sesion = useAuth().usuario!;
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [form, setForm] = useState<Formulario>(VACIO);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [restableciendo, setRestableciendo] = useState<Usuario | null>(null);
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const seccionRef = useRef<HTMLElement>(null);

  const editandoseASiMismo = editando?.id === sesion.id;
  const exigeFuncionario = roles.find((r) => String(r.id) === form.rol_id)?.codigo === "FUNCIONARIO";

  async function ejecutar(accion: () => Promise<unknown>, mensaje: string) {
    setError("");
    setAviso("");
    try {
      await accion();
      setUsuarios(await apiUsuarios.listar());
      setAviso(mensaje);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }

  useEffect(() => {
    Promise.all([apiUsuarios.listar(), apiUsuarios.roles()])
      .then(([listaUsuarios, listaRoles]) => {
        setUsuarios(listaUsuarios);
        setRoles(listaRoles);
      })
      .catch((e) => setError(e.message));
  }, []);

  function limpiar() {
    setForm(VACIO);
    setEditando(null);
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    const rolId = Number(form.rol_id);
    const funcionarioId = form.funcionario_id ? Number(form.funcionario_id) : null;
    const correcto = await (editando
      ? ejecutar(() => apiUsuarios.actualizar(editando.id, { rol_id: rolId, funcionario_id: funcionarioId, activo: form.activo }), "Usuario actualizado")
      : ejecutar(() => apiUsuarios.crear({ nombre_usuario: form.nombre_usuario.trim(), contrasena: form.contrasena, rol_id: rolId, funcionario_id: funcionarioId }), "Usuario creado"));
    if (correcto) limpiar();
  }

  function editar(u: Usuario) {
    setEditando(u);
    setRestableciendo(null);
    setForm({ nombre_usuario: u.nombre_usuario, contrasena: "", rol_id: String(u.rol_id), funcionario_id: u.funcionario_id ? String(u.funcionario_id) : "", activo: u.activo });
    setError("");
    setAviso("");
    seccionRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function abrirRestablecer(u: Usuario) {
    setRestableciendo(u);
    setNuevaContrasena("");
    limpiar();
    seccionRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function restablecer(e: FormEvent) {
    e.preventDefault();
    if (!restableciendo) return;
    const objetivo = restableciendo;
    if (await ejecutar(() => apiUsuarios.cambiarContrasena(objetivo.id, nuevaContrasena), `Contraseña de ${objetivo.nombre_usuario} restablecida`)) {
      setRestableciendo(null);
      setNuevaContrasena("");
    }
  }

  async function eliminar(u: Usuario) {
    if (!confirm(`¿Eliminar la cuenta ${u.nombre_usuario}?`)) return;
    if (editando?.id === u.id) limpiar();
    await ejecutar(() => apiUsuarios.eliminar(u.id), "Usuario eliminado");
  }

  const nombreFuncionario = (id: number | null) => (id === null ? "" : funcionarios.find((f) => f.id === id)?.nombre ?? String(id));

  return (
    <section ref={seccionRef}>
      {restableciendo ? (
        <>
          <h2>Restablecer contraseña de {restableciendo.nombre_usuario}</h2>
          <form className="formulario" onSubmit={restablecer}>
            <label>
              Nueva contraseña
              <input type="password" value={nuevaContrasena} required autoComplete="new-password" onChange={(e) => setNuevaContrasena(e.target.value)} />
            </label>
            <div className="acciones">
              <button type="submit">Guardar</button>
              <button type="button" className="secundario" onClick={() => setRestableciendo(null)}>Cancelar</button>
            </div>
          </form>
        </>
      ) : (
        <>
          <h2>{editando ? `Editar ${editando.nombre_usuario}` : "Nuevo usuario"}</h2>
          <form className="formulario" onSubmit={guardar}>
            {!editando && (
              <>
                <label>
                  Usuario
                  <input value={form.nombre_usuario} required autoComplete="off" onChange={(e) => setForm({ ...form, nombre_usuario: e.target.value })} />
                </label>
                <label>
                  Contraseña
                  <input type="password" value={form.contrasena} required autoComplete="new-password" onChange={(e) => setForm({ ...form, contrasena: e.target.value })} />
                </label>
              </>
            )}
            <label>
              Rol
              <select value={form.rol_id} required disabled={editandoseASiMismo} onChange={(e) => setForm({ ...form, rol_id: e.target.value })}>
                <option value="">Seleccione...</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </label>
            <label>
              Funcionario
              <select value={form.funcionario_id} required={exigeFuncionario} onChange={(e) => setForm({ ...form, funcionario_id: e.target.value })}>
                <option value="">{exigeFuncionario ? "Seleccione..." : "Sin enlazar"}</option>
                {funcionarios.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
              </select>
            </label>
            {editando && (
              <label className="casilla">
                <input type="checkbox" checked={form.activo} disabled={editandoseASiMismo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
                Cuenta activa
              </label>
            )}
            <div className="acciones">
              <button type="submit">{editando ? "Actualizar" : "Crear"}</button>
              {editando && <button type="button" className="secundario" onClick={limpiar}>Cancelar</button>}
            </div>
          </form>
        </>
      )}

      {error && <p className="error">{error}</p>}
      {aviso && <p className="aviso">{aviso}</p>}

      <div className="tabla">
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Funcionario</th>
              <th>Estado</th>
              <th>Bloqueo</th>
              <th>Último acceso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.nombre_usuario}</td>
                <td>{u.rol}</td>
                <td>{nombreFuncionario(u.funcionario_id)}</td>
                <td>{u.activo ? "Activo" : "Inactivo"}</td>
                <td>{u.bloqueado ? "Bloqueado" : ""}</td>
                <td>{u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString() : ""}</td>
                <td className="acciones">
                  <button className="secundario" onClick={() => editar(u)}>Editar</button>
                  <button className="secundario" onClick={() => abrirRestablecer(u)}>Contraseña</button>
                  {u.bloqueado && <button className="secundario" onClick={() => ejecutar(() => apiUsuarios.desbloquear(u.id), `${u.nombre_usuario} desbloqueado`)}>Desbloquear</button>}
                  {u.id !== sesion.id && (
                    <button className="secundario" onClick={() => ejecutar(() => apiUsuarios.actualizar(u.id, { ...datosCuenta(u), activo: !u.activo }), `${u.nombre_usuario} ${u.activo ? "desactivado" : "activado"}`)}>
                      {u.activo ? "Desactivar" : "Activar"}
                    </button>
                  )}
                  {u.id !== sesion.id && <button className="peligro" onClick={() => eliminar(u)}>Eliminar</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
