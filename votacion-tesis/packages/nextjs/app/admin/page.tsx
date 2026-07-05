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
  fotoUrl: string | null;
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

// ─── Fila de candidato con gestión de foto ────────────────────────────────────

function FilaCandidato({
  candidato, token, eleccionAbierta, onEliminar, onFotoActualizada,
}: {
  candidato: Candidato;
  token: string;
  eleccionAbierta: boolean;
  onEliminar: () => void;
  onFotoActualizada: () => Promise<void>;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [errorFoto, setErrorFoto] = useState("");
  const [preview, setPreview] = useState<string | null>(candidato.fotoUrl);

  const subirFoto = async (file: File) => {
    setErrorFoto(""); setSubiendo(true);
    try {
      const form = new FormData();
      form.append("foto", file);
      form.append("indice", String(candidato.indice));
      const res = await fetch(`/api/admin/candidatos/${candidato.id}/foto`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir");
      setPreview(`${data.fotoUrl}?t=${Date.now()}`);
      await onFotoActualizada();
    } catch (err) {
      setErrorFoto(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubiendo(false);
    }
  };

  const eliminarFoto = async () => {
    setErrorFoto(""); setSubiendo(true);
    try {
      const res = await fetch(`/api/admin/candidatos/${candidato.id}/foto`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al eliminar foto");
      setPreview(null);
      await onFotoActualizada();
    } catch (err) {
      setErrorFoto(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
      {/* Foto / placeholder */}
      <div className="relative flex-shrink-0">
        <div className="h-14 w-14 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={candidato.nombre} className="h-full w-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-slate-400 text-3xl">account_circle</span>
          )}
        </div>
        {subiendo && (
          <div className="absolute inset-0 rounded-lg bg-white/70 dark:bg-slate-900/70 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#197fe6] animate-spin text-xl">progress_activity</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 w-5">#{candidato.indice}</span>
          <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{candidato.nombre}</p>
        </div>
        {candidato.descripcion && <p className="text-xs text-slate-500 ml-7">{candidato.descripcion}</p>}
        {errorFoto && <p className="text-xs text-red-500 ml-7 mt-0.5">{errorFoto}</p>}
      </div>

      {/* Acciones foto */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <label className={`cursor-pointer flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors
          ${subiendo ? "opacity-50 pointer-events-none" : "bg-[#197fe6]/10 text-[#197fe6] hover:bg-[#197fe6]/20"}`}>
          <span className="material-symbols-outlined text-sm">upload</span>
          {preview ? "Cambiar" : "Subir foto"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={subiendo}
            onChange={e => { const f = e.target.files?.[0]; if (f) subirFoto(f); e.target.value = ""; }}
          />
        </label>

        {preview && (
          <button
            onClick={eliminarFoto}
            disabled={subiendo}
            className="text-slate-400 hover:text-red-500 disabled:opacity-50 transition-colors"
            title="Quitar foto"
          >
            <span className="material-symbols-outlined text-base">hide_image</span>
          </button>
        )}

        {!eleccionAbierta && (
          <button onClick={onEliminar} className="text-red-400 hover:text-red-600 transition-colors" title="Eliminar candidato">
            <span className="material-symbols-outlined text-base">delete</span>
          </button>
        )}
      </div>
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
        <div className="flex flex-col gap-3">
          {candidatos.map(c => (
            <FilaCandidato
              key={c.id}
              candidato={c}
              token={token}
              eleccionAbierta={eleccionAbierta}
              onEliminar={() => eliminar(c.id, c.nombre)}
              onFotoActualizada={cargar}
            />
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
  const [vcActual, setVcActual] = useState<{ vc: unknown; padron: string } | null>(null);
  const [vcsCSV, setVcsCSV] = useState<Array<{ numeroPadron: string; nombre: string | null; vc: unknown }>>([]);

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

  const descargarVC = (vc: unknown, numeroPadron: string) => {
    const blob = new Blob([JSON.stringify(vc, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VC_${numeroPadron}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const agregarIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setExito(""); setCargando(true); setVcActual(null);
    try {
      const res = await fetch("/api/admin/padron", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ numeroPadron: padron, nombre: nombre || undefined, ci: ci || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje ?? "Error");
      setExito(`Padrón ${padron} agregado`);
      if (data.vc) setVcActual({ vc: data.vc, padron });
      setPadron(""); setNombre(""); setCi("");
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setCargando(false);
    }
  };

  const descargarTodasVCs = (vcs: Array<{ numeroPadron: string; nombre: string | null; vc: unknown }>) => {
    vcs.forEach(({ numeroPadron, vc }, i) => {
      setTimeout(() => {
        const blob = new Blob([JSON.stringify(vc, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `VC_${numeroPadron}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }, i * 300);
    });
  };

  const cargarCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setExito(""); setCargando(true); setVcsCSV([]);
    try {
      const res = await fetch("/api/admin/padron/csv", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: csvTexto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje ?? "Error");
      setExito(`${data.exitosos} votantes cargados${data.errores?.length ? `, ${data.errores.length} errores` : ""}`);
      if (data.vcs?.length) setVcsCSV(data.vcs);
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
          {vcActual && (
            <div className="flex items-center gap-3 rounded-lg border border-[#197fe6]/30 bg-[#197fe6]/5 p-3">
              <span className="material-symbols-outlined text-[#197fe6] text-xl">verified_user</span>
              <div className="flex-1 text-xs text-slate-700 dark:text-slate-300">
                <p className="font-bold">Credencial Verificable generada — ECDSA secp256k1</p>
                <p className="text-slate-500">Entregue este archivo al votante {vcActual.padron}</p>
              </div>
              <button
                type="button"
                onClick={() => descargarVC(vcActual.vc, vcActual.padron)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#197fe6] text-white text-xs font-bold hover:bg-blue-700"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Descargar VC
              </button>
            </div>
          )}
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

      {vcsCSV.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-[#197fe6]/30 bg-[#197fe6]/5 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#197fe6]">folder_zip</span>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">
                {vcsCSV.length} Credenciales Verificables generadas
              </p>
            </div>
            <button
              type="button"
              onClick={() => descargarTodasVCs(vcsCSV)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#197fe6] text-white text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">download_for_offline</span>
              Descargar todas ({vcsCSV.length})
            </button>
          </div>
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
            {vcsCSV.map(({ numeroPadron, nombre, vc }) => (
              <div key={numeroPadron} className="flex items-center justify-between gap-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2">
                <div>
                  <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white">{numeroPadron}</span>
                  {nombre && <span className="text-xs text-slate-500 ml-2">{nombre}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => descargarVC(vc, numeroPadron)}
                  className="flex items-center gap-1 text-xs text-[#197fe6] hover:text-blue-700 font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  VC_{numeroPadron}.json
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            Entregue cada archivo al votante correspondiente. Las VCs contienen la firma ECDSA de la Autoridad Electoral.
          </p>
        </div>
      )}

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

// ─── Panel Escrutinio ─────────────────────────────────────────────────────────

const SHARES_N = 5;
const SHARES_UMBRAL = 3;

interface InfoCustodio { indice: number; nombre: string; partido: string }

interface EstadoEscrutinio {
  inicializado: boolean;
  conteoHabilitado: boolean;
  resultadosPublicados: boolean;
  totalBoletas: number;
  votosContabilizados: number;
  shamir: {
    n: number;
    umbral: number;
    fechaGeneracion: string;
    custodios: InfoCustodio[];
    indicesAportados: number[];
    listoParaEjecutar: boolean;
  } | null;
}

interface ResultadoEscrutinio {
  totalesPorCandidato: number[];
  totalVotos: number;
  txHash: string;
  blockNumber: number;
  hashEvidencias: string;
  custodiosParticipantes?: InfoCustodio[];
}

function descargarBundle(custodio: InfoCustodio, compartimento: unknown, vc: unknown) {
  const blob = new Blob([JSON.stringify({ custodio, compartimento, vc }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bundle_custodio_${custodio.indice}_${custodio.partido.replace(/\s+/g, "_")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function PanelEscrutinio({ token }: { token: string }) {
  const [estado, setEstado] = useState<EstadoEscrutinio | null>(null);
  const [resultado, setResultado] = useState<ResultadoEscrutinio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [ejecutando, setEjecutando] = useState(false);
  const [inicializando, setInicializando] = useState(false);
  const [resetando, setResetando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  // Formulario de inicialización con custodios
  const [custodiosForm, setCustodiosForm] = useState<Array<{ nombre: string; partido: string }>>(
    Array.from({ length: SHARES_N }, (_, i) => ({ nombre: "", partido: `Partido ${String.fromCharCode(65 + i)}` })),
  );

  // Formulario para aportar compartimento
  const [aportandoIndice, setAportandoIndice] = useState<number | null>(null);
  const [vcAporte, setVcAporte] = useState("");
  const [compartimentoAporte, setCompartimentoAporte] = useState("");
  const [aportando, setAportando] = useState(false);
  const [modoManual, setModoManual] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };
  const jsonHeaders = { ...headers, "Content-Type": "application/json" };

  const cargarEstado = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/escrutinio/estado", { headers });
      if (res.ok) setEstado(await res.json());
    } finally {
      setCargando(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { cargarEstado(); }, [cargarEstado]);

  const inicializar = async () => {
    const custodiosValidos = custodiosForm.every(c => c.nombre.trim() && c.partido.trim());
    if (!custodiosValidos) { setError("Complete el nombre y partido de todos los custodios"); return; }
    setError(""); setExito(""); setInicializando(true);
    try {
      const res = await fetch("/api/admin/escrutinio/inicializar", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ custodios: custodiosForm.map(c => ({ nombre: c.nombre.trim(), partido: c.partido.trim() })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje ?? "Error");
      // Descarga automática de cada bundle
      data.bundles.forEach((b: { custodio: InfoCustodio; compartimento: unknown; vc: unknown }) => {
        descargarBundle(b.custodio, b.compartimento, b.vc);
      });
      setExito(`${data.n} bundles generados y descargados. Entrégalos a cada custodio. El servidor NO conserva los compartimentos.`);
      await cargarEstado();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setInicializando(false);
    }
  };

  const aportar = async (indice: number) => {
    setError(""); setAportando(true);
    try {
      let vc: unknown, compartimento: unknown;
      try { vc = JSON.parse(vcAporte); } catch { throw new Error("JSON de la credencial del custodio inválido"); }
      try { compartimento = JSON.parse(compartimentoAporte); } catch { throw new Error("JSON del compartimento inválido"); }
      const res = await fetch("/api/admin/escrutinio/aportar-compartimento", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ vc, compartimento }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje ?? "Error");
      setExito(data.mensaje);
      setAportandoIndice(null);
      setVcAporte(""); setCompartimentoAporte("");
      await cargarEstado();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setAportando(false);
    }
  };

  const handleBundleFile = async (file: File, indice: number) => {
    setError(""); setAportando(true);
    try {
      let bundle: { vc?: unknown; compartimento?: unknown };
      try { bundle = JSON.parse(await file.text()); } catch { throw new Error("El archivo no es un JSON válido"); }
      if (!bundle.vc || !bundle.compartimento) throw new Error("El archivo no contiene los campos 'vc' y 'compartimento'");
      const res = await fetch("/api/admin/escrutinio/aportar-compartimento", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ vc: bundle.vc, compartimento: bundle.compartimento }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje ?? "Error al aportar");
      setExito(data.mensaje);
      setAportandoIndice(null);
      setModoManual(false);
      await cargarEstado();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setAportando(false);
    }
  };

  const aportarDirecto = async (indice: number) => {
    setError(""); setAportando(true);
    try {
      const res = await fetch("/api/admin/escrutinio/aportar-directo", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ indice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje ?? "Error");
      setExito(data.mensaje);
      await cargarEstado();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setAportando(false);
    }
  };

  const ejecutar = async () => {
    setError(""); setExito(""); setEjecutando(true);
    try {
      const res = await fetch("/api/admin/escrutinio/ejecutar", { method: "POST", headers: jsonHeaders });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje ?? "Error");
      setResultado(data);
      setExito("Escrutinio ejecutado y resultados publicados en cadena");
      await cargarEstado();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setEjecutando(false);
    }
  };

  const resetear = async () => {
    if (!confirm("¿Reiniciar el escrutinio para una nueva jornada? Se borran los compartimentos y se resetean los flags del contrato.")) return;
    setError(""); setExito(""); setResetando(true);
    try {
      const res = await fetch("/api/admin/escrutinio/resetear", { method: "POST", headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje ?? "Error");
      setResultado(null);
      setExito(`Nueva jornada #${data.numeroJornada} iniciada.`);
      await cargarEstado();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setResetando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center items-center py-10">
        <span className="material-symbols-outlined text-[#197fe6] text-3xl animate-spin">progress_activity</span>
      </div>
    );
  }

  const shamir = estado?.shamir;
  const n = shamir?.n ?? SHARES_N;
  const umbral = shamir?.umbral ?? SHARES_UMBRAL;
  const indicesAportados = shamir?.indicesAportados ?? [];

  return (
    <div className="flex flex-col gap-5">
      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col gap-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Boletas</p>
          <p className="text-2xl font-bold text-[#197fe6]">{estado?.totalBoletas ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col gap-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Contabilizados</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{estado?.votosContabilizados ?? 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col gap-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Compartimentos</p>
          <p className={`text-lg font-bold ${estado?.inicializado ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
            {estado?.inicializado ? `${indicesAportados.length}/${umbral} aportados` : "Pendiente"}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col gap-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Resultados</p>
          <p className={`text-lg font-bold ${estado?.resultadosPublicados ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
            {estado?.resultadosPublicados ? "Publicados" : "Pendiente"}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl p-4 text-sm">
          <span className="material-symbols-outlined">error</span>{error}
        </div>
      )}
      {exito && (
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl p-4 text-sm">
          <span className="material-symbols-outlined">check_circle</span>{exito}
        </div>
      )}

      {/* Resultados publicados */}
      {estado?.resultadosPublicados && resultado && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-500">verified</span>
            <h3 className="font-semibold text-slate-900 dark:text-white">Resultados publicados en cadena</h3>
          </div>
          <div className="flex flex-col gap-1">
            {resultado.totalesPorCandidato.map((votos, i) => (
              <div key={i} className="flex justify-between text-sm px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <span className="text-slate-600 dark:text-slate-400">Candidato #{i}</span>
                <span className="font-bold text-slate-900 dark:text-white">{votos} votos</span>
              </div>
            ))}
            <div className="flex justify-between text-sm px-3 py-2 border-t border-slate-200 dark:border-slate-700 mt-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Total</span>
              <span className="font-bold text-[#197fe6]">{resultado.totalVotos} votos</span>
            </div>
          </div>
          {resultado.custodiosParticipantes && resultado.custodiosParticipantes.length > 0 && (
            <div className="text-xs text-slate-500">
              <span className="font-semibold">Custodios que participaron: </span>
              {resultado.custodiosParticipantes.map(c => `${c.nombre} (${c.partido})`).join(" · ")}
            </div>
          )}
          <div className="text-xs text-slate-400 font-mono break-all">
            <span className="font-semibold text-slate-500">txHash: </span>{resultado.txHash}
          </div>
          <a href="/resultados" className="text-sm text-[#197fe6] hover:underline flex items-center gap-1 self-start">
            <span className="material-symbols-outlined text-base">open_in_new</span>
            Ver página pública de resultados
          </a>
        </div>
      )}

      {/* Reset para nueva jornada */}
      {estado?.resultadosPublicados && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-700 p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600">restart_alt</span>
            <h3 className="font-semibold text-slate-900 dark:text-white">Nueva jornada electoral</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Los resultados están publicados on-chain de forma permanente. Para iniciar una nueva jornada reinicie el escrutinio.
          </p>
          <button onClick={resetear} disabled={resetando}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors self-start">
            {resetando
              ? <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Reiniciando...</>
              : <><span className="material-symbols-outlined text-base">restart_alt</span>Reiniciar para nueva jornada</>}
          </button>
        </div>
      )}

      {/* Flujo Shamir con custodios */}
      {!estado?.resultadosPublicados && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#197fe6]">key</span>
            <h3 className="font-semibold text-slate-900 dark:text-white">Shamir Secret Sharing — Custodia Distribuida</h3>
          </div>

          {!estado?.conteoHabilitado && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
              <span className="material-symbols-outlined text-base">warning</span>
              Primero habilite el escrutinio en la pestaña "Jornada"
            </div>
          )}

          {/* Paso 1: Inicializar con custodios */}
          {estado?.conteoHabilitado && !estado.inicializado && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Asigne un nombre y partido a cada custodio. Se generará un bundle (VC firmada + compartimento) por cada uno para entrega física. El servidor <strong>no conservará</strong> los compartimentos.
              </p>
              <div className="flex flex-col gap-2">
                {custodiosForm.map((c, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <input
                      className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                      placeholder="Nombre del custodio"
                      value={c.nombre}
                      onChange={e => setCustodiosForm(prev => prev.map((x, j) => j === i ? { ...x, nombre: e.target.value } : x))}
                    />
                    <input
                      className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/40"
                      placeholder="Partido político"
                      value={c.partido}
                      onChange={e => setCustodiosForm(prev => prev.map((x, j) => j === i ? { ...x, partido: e.target.value } : x))}
                    />
                  </div>
                ))}
              </div>
              <button onClick={inicializar} disabled={inicializando}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors self-start">
                {inicializando
                  ? <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Generando y descargando bundles...</>
                  : <><span className="material-symbols-outlined text-base">vpn_key</span>Generar compartimentos y descargar bundles</>}
              </button>
            </div>
          )}

          {/* Paso 2: Custodios aportan sus compartimentos */}
          {estado?.conteoHabilitado && estado.inicializado && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Se necesitan <strong>{umbral}</strong> de <strong>{n}</strong> compartimentos.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Aportados: {indicesAportados.length}/{umbral} mínimo requerido
                  {shamir?.listoParaEjecutar && <span className="text-emerald-500 ml-1">✓ umbral alcanzado</span>}
                </p>
              </div>

              {/* Modo legacy: compartimentos en disco sin custodios con VC */}
              {(shamir?.custodios ?? []).length === 0 ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
                    <span className="material-symbols-outlined text-base shrink-0">info</span>
                    <span>
                      Compartimentos generados en formato anterior (sin custodia VC).
                      Los archivos están en el disco del servidor — cárguelos directamente.
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: n }, (_, i) => i + 1).map(idx => {
                      const yaAportado = indicesAportados.includes(idx);
                      return (
                        <button
                          key={idx}
                          onClick={() => !yaAportado && aportarDirecto(idx)}
                          disabled={aportando || yaAportado}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors
                            ${yaAportado
                              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 cursor-default"
                              : "bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white"
                            }`}
                        >
                          {yaAportado
                            ? <><span className="material-symbols-outlined text-base">check_circle</span>Compartimento {idx}</>
                            : <><span className="material-symbols-outlined text-base">upload_file</span>Cargar #{idx}</>
                          }
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Modo normal: custodios con VC */
                <div className="flex flex-col gap-2">
                  {(shamir?.custodios ?? []).map(custodio => {
                    const yaAportado = indicesAportados.includes(custodio.indice);
                    const esteAbierto = aportandoIndice === custodio.indice;
                    return (
                      <div key={custodio.indice} className={`rounded-xl border p-3 transition-all ${yaAportado ? "border-emerald-400/50 bg-emerald-50 dark:bg-emerald-900/10" : "border-slate-200 dark:border-slate-700"}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${yaAportado ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
                              {yaAportado ? "✓" : custodio.indice}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{custodio.nombre}</p>
                              <p className="text-xs text-[#197fe6] font-medium">{custodio.partido}</p>
                            </div>
                          </div>
                          {!yaAportado && (
                            <button onClick={() => { setAportandoIndice(esteAbierto ? null : custodio.indice); setVcAporte(""); setCompartimentoAporte(""); setError(""); }}
                              className="text-xs px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors">
                              {esteAbierto ? "Cancelar" : "Aportar bundle"}
                            </button>
                          )}
                        </div>
                        {esteAbierto && (
                          <div className="mt-3 flex flex-col gap-3">
                            {/* Carga por archivo */}
                            <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors group
                              ${aportando ? "opacity-50 pointer-events-none" : "border-purple-300 dark:border-purple-700 hover:border-purple-500 bg-purple-50/50 dark:bg-purple-900/10"}`}>
                              <input
                                type="file"
                                accept=".json,application/json"
                                className="hidden"
                                disabled={aportando}
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleBundleFile(f, custodio.indice); e.target.value = ""; }}
                              />
                              {aportando
                                ? <span className="material-symbols-outlined text-purple-400 text-2xl animate-spin">progress_activity</span>
                                : <span className="material-symbols-outlined text-purple-400 group-hover:text-purple-600 text-2xl">upload_file</span>}
                              <div>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                  {aportando ? "Verificando credencial…" : `Seleccionar bundle-custodio-${custodio.indice}.json`}
                                </p>
                                <p className="text-xs text-slate-400">Archivo descargado al inicializar los compartimentos</p>
                              </div>
                            </label>

                            {/* Fallback: pegar JSON manualmente */}
                            <button
                              onClick={() => setModoManual(v => !v)}
                              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 self-start underline underline-offset-2 transition-colors">
                              {modoManual ? "Ocultar entrada manual" : "¿No tienes el archivo? Pegar JSON"}
                            </button>

                            {modoManual && (
                              <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">VC del custodio (JSON)</label>
                                <textarea
                                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-400/40 h-28 resize-none"
                                  placeholder='Pega aquí el objeto "vc" del bundle...'
                                  value={vcAporte}
                                  onChange={e => setVcAporte(e.target.value)}
                                />
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Compartimento (JSON)</label>
                                <textarea
                                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-400/40 h-20 resize-none"
                                  placeholder='Pega aquí el objeto "compartimento" del bundle...'
                                  value={compartimentoAporte}
                                  onChange={e => setCompartimentoAporte(e.target.value)}
                                />
                                <button onClick={() => aportar(custodio.indice)} disabled={aportando || !vcAporte || !compartimentoAporte}
                                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors self-start">
                                  {aportando
                                    ? <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Verificando VC...</>
                                    : <><span className="material-symbols-outlined text-base">verified_user</span>Verificar y registrar</>}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Ejecutar cuando hay suficientes */}
              <button onClick={ejecutar} disabled={ejecutando || !shamir?.listoParaEjecutar}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors self-start">
                {ejecutando
                  ? <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Ejecutando escrutinio...</>
                  : <><span className="material-symbols-outlined text-base">analytics</span>Ejecutar escrutinio ({indicesAportados.length}/{umbral} compartimentos)</>}
              </button>
            </div>
          )}
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
  const [tabActiva, setTabActiva] = useState<"jornada" | "candidatos" | "padron" | "escrutinio" | "logs">("jornada");

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
    { id: "escrutinio" as const, etiqueta: "Escrutinio", icono: "analytics" },
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

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-2">
            <p className="text-xs text-slate-500 mb-3">
              <span className="font-semibold text-amber-600">Zona de reconfiguración:</span>{" "}
              Elimina candidatos, padrón, sesiones y votos de la base de datos para comenzar desde cero.
              Los datos on-chain (boletas en blockchain) requieren re-desplegar contratos (<code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">yarn deploy</code>).
            </p>
            <BotonAccion
              etiqueta="Reconfigurar elección" icono="restart_alt" colorClass="bg-slate-700 hover:bg-slate-800"
              disabled={estado?.eleccionAbierta ?? false}
              motivo={estado?.eleccionAbierta ? "Cierre la jornada antes de reconfigurar" : undefined}
              onConfirmar={async () => {
                const res = await fetch("/api/admin/reconfigurar", {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.mensaje ?? "Error al reconfigurar");
                mostrarExito(data.mensaje ?? "Elección reconfigurada");
                await cargarEstado();
              }}
            />
          </div>
        </div>
      )}

      {tabActiva === "candidatos" && (
        <PanelCandidatos token={token} eleccionAbierta={estado?.eleccionAbierta ?? false} />
      )}

      {tabActiva === "padron" && (
        <PanelPadron token={token} eleccionAbierta={estado?.eleccionAbierta ?? false} />
      )}

      {tabActiva === "escrutinio" && (
        <PanelEscrutinio token={token} />
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
