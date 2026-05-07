"use client";

import { useState, useEffect, useCallback } from "react";
import VotingShell from "../../components/voting/VotingShell";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface EstadoAdmin {
  eleccionAbierta: boolean;
  conteoHabilitado: boolean;
  resultadosPublicados: boolean;
  totalBoletas: number;
  estadoDB: string;
  nombreEleccion: string | null;
}

interface LogEntry {
  id: string;
  accion: string;
  actor: string;
  detalle: string | null;
  timestamp: string;
}

interface Candidato {
  id: string;
  nombre: string;
  descripcion: string | null;
  indice: number;
}

interface VotanteElegible {
  id: string;
  numeroPadron: string;
  nombre: string | null;
  registradoEn: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function accionEtiqueta(accion: string): string {
  const mapa: Record<string, string> = {
    ADMIN_LOGIN: "Inicio de sesión",
    ABRIR_JORNADA: "Jornada abierta",
    CERRAR_JORNADA: "Jornada cerrada",
    HABILITAR_ESCRUTINIO: "Escrutinio habilitado",
    CARGAR_PADRON: "Padrón cargado",
    TOKEN_EMITIDO: "Token emitido",
    VOTO_EMITIDO: "Voto emitido",
  };
  return mapa[accion] ?? accion;
}

function accionColor(accion: string): string {
  if (accion.includes("ABRIR")) return "text-emerald-600 dark:text-emerald-400";
  if (accion.includes("CERRAR")) return "text-red-500 dark:text-red-400";
  if (accion.includes("ESCRUTINIO")) return "text-purple-600 dark:text-purple-400";
  if (accion.includes("LOGIN")) return "text-[#197fe6]";
  if (accion.includes("PADRON")) return "text-amber-500";
  return "text-slate-500";
}

// ─── Componente de Login ──────────────────────────────────────────────────────

function LoginPanel({ onLogin }: { onLogin: (token: string, nombre: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje ?? "Error al iniciar sesión");
      onLogin(data.token, data.nombre);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex flex-1 justify-center items-center min-h-[60vh]">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 w-full max-w-[400px] flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-[#197fe6] text-5xl">admin_panel_settings</span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Panel Administrativo</h1>
          <p className="text-slate-500 text-sm text-center">Acceso restringido a administradores electorales</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#197fe6]"
              placeholder="admin@votoseguro.bo"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#197fe6]"
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-[#197fe6] hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {cargando ? (
              <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Verificando...</>
            ) : (
              <><span className="material-symbols-outlined text-base">login</span>Ingresar</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Tarjeta de estado ────────────────────────────────────────────────────────

function EstadoCard({ icono, etiqueta, valor, color }: { icono: string; etiqueta: string; valor: string; color: string }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm">
      <span className={`material-symbols-outlined text-3xl ${color}`}>{icono}</span>
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{etiqueta}</p>
        <p className={`text-lg font-bold ${color}`}>{valor}</p>
      </div>
    </div>
  );
}

// ─── Botón con confirmación ───────────────────────────────────────────────────

function BotonAccion({ etiqueta, icono, colorClass, disabled, motivo, onConfirmar }: {
  etiqueta: string; icono: string; colorClass: string;
  disabled: boolean; motivo?: string; onConfirmar: () => Promise<void>;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [ejecutando, setEjecutando] = useState(false);

  const handleClick = async () => {
    if (!confirmando) { setConfirmando(true); return; }
    setEjecutando(true);
    setConfirmando(false);
    try { await onConfirmar(); } finally { setEjecutando(false); }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={disabled || ejecutando}
        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
          disabled ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
          : confirmando ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
          : `${colorClass} text-white hover:opacity-90`
        }`}
      >
        {ejecutando
          ? <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Procesando...</>
          : <><span className="material-symbols-outlined text-base">{confirmando ? "warning" : icono}</span>{confirmando ? "¿Confirmar?" : etiqueta}</>
        }
      </button>
      {disabled && motivo && <p className="text-xs text-slate-400 px-1">{motivo}</p>}
      {confirmando && (
        <button onClick={() => setConfirmando(false)} className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-1">
          Cancelar
        </button>
      )}
    </div>
  );
}

// ─── Panel Candidatos ─────────────────────────────────────────────────────────

function PanelCandidatos({ token, eleccionAbierta }: { token: string; eleccionAbierta: boolean }) {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  const cargar = useCallback(async () => {
    const res = await fetch("/api/admin/candidatos", { headers });
    if (res.ok) {
      const data = await res.json();
      setCandidatos(data.candidatos ?? []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setExito(""); setCargando(true);
    try {
      const res = await fetch("/api/admin/candidatos", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, descripcion: descripcion || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje ?? "Error");
      setExito(`Candidato "${nombre}" agregado`);
      setNombre(""); setDescripcion("");
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  };

  const eliminar = async (id: string, nombreCandidato: string) => {
    if (!confirm(`¿Eliminar a "${nombreCandidato}"?`)) return;
    const res = await fetch(`/api/admin/candidatos/${id}`, { method: "DELETE", headers });
    if (res.ok) { setExito(`Candidato eliminado`); await cargar(); }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#197fe6]">people</span>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Candidatos</h2>
        <span className="ml-auto text-xs text-slate-400">{candidatos.length} registrados</span>
      </div>

      {eleccionAbierta && (
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
          <span className="material-symbols-outlined text-base">warning</span>
          No se pueden agregar candidatos con la jornada abierta
        </div>
      )}

      {!eleccionAbierta && (
        <form onSubmit={agregar} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Nombre del candidato"
              required
              className="flex-1 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#197fe6]"
            />
            <input
              type="text"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Partido / descripción (opcional)"
              className="flex-1 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#197fe6]"
            />
            <button
              type="submit"
              disabled={cargando || !nombre.trim()}
              className="bg-[#197fe6] hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">add</span>
              Agregar
            </button>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          {exito && <p className="text-emerald-600 text-xs">{exito}</p>}
        </form>
      )}

      {candidatos.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">Sin candidatos registrados</p>
      ) : (
        <div className="flex flex-col gap-2">
          {candidatos.map(c => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400 w-6 text-center">#{c.indice}</span>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm">{c.nombre}</p>
                  {c.descripcion && <p className="text-xs text-slate-500">{c.descripcion}</p>}
                </div>
              </div>
              {!eleccionAbierta && (
                <button
                  onClick={() => eliminar(c.id, c.nombre)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Panel Padrón ─────────────────────────────────────────────────────────────

function PanelPadron({ token, eleccionAbierta }: { token: string; eleccionAbierta: boolean }) {
  const [votantes, setVotantes] = useState<VotanteElegible[]>([]);
  const [padron, setPadron] = useState("");
  const [nombre, setNombre] = useState("");
  const [ci, setCi] = useState("");
  const [csvTexto, setCsvTexto] = useState("");
  const [modo, setModo] = useState<"individual" | "csv">("individual");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  const cargar = useCallback(async () => {
    const res = await fetch("/api/admin/padron", { headers });
    if (res.ok) {
      const data = await res.json();
      setVotantes(data.votantes ?? []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { cargar(); }, [cargar]);

  const agregarIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setExito(""); setCargando(true);
    try {
      const res = await fetch("/api/admin/padron", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ numeroPadron: padron, nombre: nombre || undefined, ci: ci || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje ?? "Error");
      setExito(`Padrón ${padron} agregado`);
      setPadron(""); setNombre(""); setCi("");
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  };

  const cargarCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setExito(""); setCargando(true);
    try {
      const res = await fetch("/api/admin/padron/csv", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: csvTexto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje ?? "Error");
      setExito(`${data.exitosos} votantes cargados${data.errores?.length ? `, ${data.errores.length} errores` : ""}`);
      setCsvTexto("");
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#197fe6]">how_to_reg</span>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Padrón Electoral</h2>
        <span className="ml-auto text-xs text-slate-400">{votantes.length} habilitados</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setModo("individual")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${modo === "individual" ? "bg-[#197fe6] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
        >
          Individual
        </button>
        <button
          onClick={() => setModo("csv")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${modo === "csv" ? "bg-[#197fe6] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}
        >
          Cargar CSV
        </button>
      </div>

      {modo === "individual" ? (
        <form onSubmit={agregarIndividual} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={padron}
              onChange={e => setPadron(e.target.value.toUpperCase())}
              placeholder="Padrón ej: LP123456"
              required
              className="border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#197fe6]"
            />
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Nombre completo (opcional)"
              className="border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#197fe6]"
            />
            <input
              type="text"
              value={ci}
              onChange={e => setCi(e.target.value)}
              placeholder="CI (opcional)"
              className="border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#197fe6]"
            />
          </div>
          <button
            type="submit"
            disabled={cargando || !padron.trim()}
            className="bg-[#197fe6] hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 self-start"
          >
            <span className="material-symbols-outlined text-base">person_add</span>
            Agregar al padrón
          </button>
        </form>
      ) : (
        <form onSubmit={cargarCSV} className="flex flex-col gap-3">
          <p className="text-xs text-slate-500">
            Formato: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">PADRON,Nombre Completo,CI</code> — una persona por línea. La columna nombre y CI son opcionales.
          </p>
          <textarea
            value={csvTexto}
            onChange={e => setCsvTexto(e.target.value)}
            rows={6}
            placeholder={"LP123456,Juan Pérez,12345678\nLP654321,María García,87654321\nSC001001"}
            className="border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#197fe6] resize-none"
          />
          <button
            type="submit"
            disabled={cargando || !csvTexto.trim()}
            className="bg-[#197fe6] hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 self-start"
          >
            <span className="material-symbols-outlined text-base">upload_file</span>
            Importar padrón
          </button>
        </form>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {exito && <p className="text-emerald-600 text-sm font-medium">{exito}</p>}

      {votantes.length > 0 && (
        <div className="overflow-x-auto max-h-48 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-slate-900">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Padrón</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Nombre</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Registrado</th>
              </tr>
            </thead>
            <tbody>
              {votantes.map(v => (
                <tr key={v.id} className="border-b border-slate-100 dark:border-slate-800/60">
                  <td className="py-2 px-3 font-mono text-xs font-medium text-slate-900 dark:text-white">{v.numeroPadron}</td>
                  <td className="py-2 px-3 text-slate-500 text-xs hidden md:table-cell">{v.nombre ?? "—"}</td>
                  <td className="py-2 px-3 text-slate-400 text-xs">{new Date(v.registradoEn).toLocaleDateString("es-BO")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard principal ──────────────────────────────────────────────────────

function Dashboard({ token, nombre, onLogout }: { token: string; nombre: string; onLogout: () => void }) {
  const [estado, setEstado] = useState<EstadoAdmin | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [mensajeExito, setMensajeExito] = useState("");
  const [mensajeError, setMensajeError] = useState("");
  const [cargandoEstado, setCargandoEstado] = useState(true);
  const [tabActiva, setTabActiva] = useState<"jornada" | "candidatos" | "padron" | "logs">("jornada");

  const headers = { Authorization: `Bearer ${token}` };

  const cargarEstado = useCallback(async () => {
    try {
      const [resEstado, resLogs] = await Promise.all([
        fetch("/api/admin/estado", { headers }),
        fetch("/api/admin/logs-auditoria?limite=20", { headers }),
      ]);
      if (resEstado.ok) setEstado(await resEstado.json());
      if (resLogs.ok) {
        const data = await resLogs.json();
        setLogs(data.logs ?? []);
      }
    } finally {
      setCargandoEstado(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    cargarEstado();
    const intervalo = setInterval(cargarEstado, 10000);
    return () => clearInterval(intervalo);
  }, [cargarEstado]);

  const mostrarExito = (msg: string) => {
    setMensajeExito(msg); setMensajeError("");
    setTimeout(() => setMensajeExito(""), 4000);
  };
  const mostrarError = (msg: string) => {
    setMensajeError(msg); setMensajeExito("");
    setTimeout(() => setMensajeError(""), 6000);
  };

  const ejecutarAccion = async (ruta: string, mensajeOk: string) => {
    const res = await fetch(ruta, { method: "POST", headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.mensaje ?? "Error desconocido");
    mostrarExito(mensajeOk);
    await cargarEstado();
  };

  if (cargandoEstado) {
    return (
      <div className="flex justify-center items-center py-20">
        <span className="material-symbols-outlined text-[#197fe6] text-4xl animate-spin">progress_activity</span>
      </div>
    );
  }

  const tabs = [
    { id: "jornada" as const, etiqueta: "Jornada", icono: "how_to_vote" },
    { id: "candidatos" as const, etiqueta: "Candidatos", icono: "people" },
    { id: "padron" as const, etiqueta: "Padrón", icono: "how_to_reg" },
    { id: "logs" as const, etiqueta: "Auditoría", icono: "history" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Panel Electoral</h1>
          <p className="text-slate-500 text-sm">Bienvenido, <span className="font-medium text-slate-700 dark:text-slate-300">{nombre}</span></p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 transition-colors self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          Cerrar sesión
        </button>
      </div>

      {/* Notificaciones globales */}
      {mensajeExito && (
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl p-4 text-sm font-medium">
          <span className="material-symbols-outlined">check_circle</span>{mensajeExito}
        </div>
      )}
      {mensajeError && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl p-4 text-sm font-medium">
          <span className="material-symbols-outlined">error</span>{mensajeError}
        </div>
      )}

      {/* Tarjetas de estado */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <EstadoCard
          icono={estado?.eleccionAbierta ? "how_to_vote" : "lock"}
          etiqueta="Jornada"
          valor={estado?.eleccionAbierta ? "Abierta" : "Cerrada"}
          color={estado?.eleccionAbierta ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}
        />
        <EstadoCard icono="ballot" etiqueta="Boletas" valor={String(estado?.totalBoletas ?? 0)} color="text-[#197fe6]" />
        <EstadoCard
          icono={estado?.conteoHabilitado ? "fact_check" : "pending"}
          etiqueta="Escrutinio"
          valor={estado?.conteoHabilitado ? "Habilitado" : "Pendiente"}
          color={estado?.conteoHabilitado ? "text-purple-600 dark:text-purple-400" : "text-slate-400"}
        />
        <EstadoCard
          icono={estado?.resultadosPublicados ? "verified" : "schedule"}
          etiqueta="Resultados"
          valor={estado?.resultadosPublicados ? "Publicados" : "Sin publicar"}
          color={estado?.resultadosPublicados ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}
        />
      </div>

      {/* Tabs de navegación */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTabActiva(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              tabActiva === tab.id
                ? "bg-white dark:bg-slate-900 text-[#197fe6] shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icono}</span>
            <span className="hidden sm:inline">{tab.etiqueta}</span>
          </button>
        ))}
      </div>

      {/* Contenido de tabs */}
      {tabActiva === "jornada" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#197fe6]">settings</span>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Control de Jornada</h2>
          </div>
          <div className="flex flex-wrap gap-4">
            <BotonAccion
              etiqueta="Abrir Jornada" icono="play_circle" colorClass="bg-emerald-600 hover:bg-emerald-700"
              disabled={estado?.eleccionAbierta ?? true}
              motivo={estado?.eleccionAbierta ? "La jornada ya está abierta" : undefined}
              onConfirmar={async () => {
                try { await ejecutarAccion("/api/admin/abrir-jornada", "Jornada electoral abierta correctamente"); }
                catch (err) { mostrarError(err instanceof Error ? err.message : "Error"); throw err; }
              }}
            />
            <BotonAccion
              etiqueta="Cerrar Jornada" icono="stop_circle" colorClass="bg-red-600 hover:bg-red-700"
              disabled={!estado?.eleccionAbierta}
              motivo={!estado?.eleccionAbierta ? "La jornada ya está cerrada" : undefined}
              onConfirmar={async () => {
                try { await ejecutarAccion("/api/admin/cerrar-jornada", "Jornada electoral cerrada correctamente"); }
                catch (err) { mostrarError(err instanceof Error ? err.message : "Error"); throw err; }
              }}
            />
            <BotonAccion
              etiqueta="Habilitar Escrutinio" icono="analytics" colorClass="bg-purple-600 hover:bg-purple-700"
              disabled={estado?.eleccionAbierta || estado?.conteoHabilitado || !estado}
              motivo={
                estado?.eleccionAbierta ? "Cierre la jornada primero"
                : estado?.conteoHabilitado ? "El escrutinio ya está habilitado"
                : undefined
              }
              onConfirmar={async () => {
                try { await ejecutarAccion("/api/admin/habilitar-escrutinio", "Escrutinio habilitado correctamente"); }
                catch (err) { mostrarError(err instanceof Error ? err.message : "Error"); throw err; }
              }}
            />
          </div>
          {estado && (
            <p className="text-xs text-slate-400">
              Estado en cadena: jornada{" "}
              <span className={estado.eleccionAbierta ? "text-emerald-500 font-medium" : "text-red-400 font-medium"}>
                {estado.eleccionAbierta ? "ABIERTA" : "CERRADA"}
              </span>
              {" · "}escrutinio{" "}
              <span className={estado.conteoHabilitado ? "text-purple-500 font-medium" : "text-slate-400 font-medium"}>
                {estado.conteoHabilitado ? "HABILITADO" : "PENDIENTE"}
              </span>
            </p>
          )}
        </div>
      )}

      {tabActiva === "candidatos" && (
        <PanelCandidatos token={token} eleccionAbierta={estado?.eleccionAbierta ?? false} />
      )}

      {tabActiva === "padron" && (
        <PanelPadron token={token} eleccionAbierta={estado?.eleccionAbierta ?? false} />
      )}

      {tabActiva === "logs" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#197fe6]">history</span>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Registro de Auditoría</h2>
            </div>
            <span className="text-xs text-slate-400">Últimas {logs.length} acciones</span>
          </div>
          {logs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Sin registros todavía</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acción</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actor</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Detalle</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3"><span className={`font-medium ${accionColor(log.accion)}`}>{accionEtiqueta(log.accion)}</span></td>
                      <td className="py-2 px-3 text-slate-500 font-mono text-xs">{log.actor}</td>
                      <td className="py-2 px-3 text-slate-400 hidden md:table-cell">{log.detalle ?? "—"}</td>
                      <td className="py-2 px-3 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("es-BO", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("adminToken");
    const savedNombre = localStorage.getItem("adminNombre");
    if (saved) { setToken(saved); setNombre(savedNombre ?? "Administrador"); }
  }, []);

  const handleLogin = (t: string, n: string) => {
    localStorage.setItem("adminToken", t);
    localStorage.setItem("adminNombre", n);
    setToken(t); setNombre(n);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminNombre");
    setToken(null); setNombre("");
  };

  return (
    <VotingShell>
      {token ? <Dashboard token={token} nombre={nombre} onLogout={handleLogout} /> : <LoginPanel onLogin={handleLogin} />}
    </VotingShell>
  );
}
