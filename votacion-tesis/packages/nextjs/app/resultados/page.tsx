"use client";

import { useState, useEffect } from "react";
import VotingShell from "../../components/voting/VotingShell";

interface CandidatoResultado {
  indice: number;
  nombre: string;
  descripcion: string | null;
  votos: number;
}

interface ResultadosData {
  publicado: boolean;
  totalVotos?: number;
  hashPaqueteEvidencias?: string;
  timestamp?: number;
  candidatos?: CandidatoResultado[];
  mensaje?: string;
}

function BarraVotos({ votos, total, color }: { votos: number; total: number; color: string }) {
  const porcentaje = total > 0 ? Math.round((votos / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 w-12 text-right">
        {porcentaje}%
      </span>
    </div>
  );
}

const COLORES = [
  "bg-[#197fe6]",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-red-500",
];

export default function ResultadosPage() {
  const [datos, setDatos] = useState<ResultadosData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        const res = await fetch("/api/voto/resultados");
        if (!res.ok) throw new Error("Error al obtener resultados");
        const data = await res.json();
        setDatos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const ganador = datos?.candidatos
    ? [...datos.candidatos].sort((a, b) => b.votos - a.votos)[0]
    : null;

  return (
    <VotingShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Resultados Electorales</h1>
          <p className="text-slate-500 text-sm">Resultados finales verificados en cadena mediante escrutinio cooperativo</p>
        </div>

        {cargando && (
          <div className="flex justify-center items-center py-20">
            <span className="material-symbols-outlined text-[#197fe6] text-4xl animate-spin">progress_activity</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl p-4 text-sm">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {!cargando && !error && datos && !datos.publicado && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-6xl">schedule</span>
            <p className="text-xl font-semibold text-slate-700 dark:text-slate-300">Resultados no disponibles</p>
            <p className="text-slate-500 text-sm max-w-sm">
              El escrutinio cooperativo aún no ha sido ejecutado. Los resultados se publicarán una vez completado el proceso.
            </p>
          </div>
        )}

        {!cargando && !error && datos?.publicado && datos.candidatos && (
          <>
            {/* Ganador destacado */}
            {ganador && ganador.votos > 0 && (
              <div className="bg-gradient-to-r from-[#197fe6]/10 to-emerald-500/10 border border-[#197fe6]/30 rounded-xl p-6 flex items-center gap-5">
                <span className="material-symbols-outlined text-5xl text-amber-500">emoji_events</span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Candidato más votado</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{ganador.nombre}</p>
                  {ganador.descripcion && (
                    <p className="text-sm text-slate-500">{ganador.descripcion}</p>
                  )}
                  <p className="text-[#197fe6] font-semibold mt-1">
                    {ganador.votos} votos · {datos.totalVotos! > 0 ? Math.round((ganador.votos / datos.totalVotos!) * 100) : 0}%
                  </p>
                </div>
              </div>
            )}

            {/* Resumen */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total de votos</p>
                <p className="text-3xl font-bold text-[#197fe6] mt-1">{datos.totalVotos}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Candidatos</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{datos.candidatos.length}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm col-span-2 md:col-span-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Publicado</p>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">verified</span>
                  {datos.timestamp
                    ? new Date(datos.timestamp * 1000).toLocaleString("es-BO", { dateStyle: "medium", timeStyle: "short" })
                    : "—"}
                </p>
              </div>
            </div>

            {/* Tabla de resultados */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#197fe6]">bar_chart</span>
                <h2 className="font-semibold text-slate-900 dark:text-white">Distribución de votos</h2>
              </div>
              <div className="p-5 flex flex-col gap-5">
                {[...datos.candidatos]
                  .sort((a, b) => b.votos - a.votos)
                  .map((c, i) => (
                    <div key={c.indice} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`w-3 h-3 rounded-full ${COLORES[i % COLORES.length]}`} />
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white text-sm">{c.nombre}</span>
                            {c.descripcion && (
                              <span className="text-slate-400 text-xs ml-2">{c.descripcion}</span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                          {c.votos} {c.votos === 1 ? "voto" : "votos"}
                        </span>
                      </div>
                      <BarraVotos votos={c.votos} total={datos.totalVotos!} color={COLORES[i % COLORES.length]} />
                    </div>
                  ))}
              </div>
            </div>

            {/* Evidencia criptográfica */}
            {datos.hashPaqueteEvidencias && (
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-base">fingerprint</span>
                  <span className="text-sm font-medium">Hash de evidencias (SHA-256)</span>
                </div>
                <code className="text-xs font-mono text-slate-500 dark:text-slate-400 break-all">
                  {datos.hashPaqueteEvidencias}
                </code>
                <p className="text-xs text-slate-400">
                  Este hash está registrado de forma inmutable en la cadena de bloques y permite verificar la integridad del paquete de evidencias del escrutinio.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </VotingShell>
  );
}
