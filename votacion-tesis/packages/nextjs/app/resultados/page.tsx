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

const COLORES = [
  { bar: "bg-[#197fe6]", text: "text-[#197fe6]", dot: "bg-[#197fe6]" },
  { bar: "bg-emerald-500", text: "text-emerald-600", dot: "bg-emerald-500" },
  { bar: "bg-purple-500", text: "text-purple-600", dot: "bg-purple-500" },
  { bar: "bg-amber-500", text: "text-amber-600", dot: "bg-amber-500" },
  { bar: "bg-rose-500", text: "text-rose-600", dot: "bg-rose-500" },
];

function BarraVotos({
  votos, total, colorClass, delay,
}: { votos: number; total: number; colorClass: string; delay: number }) {
  const porcentaje = total > 0 ? Math.round((votos / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full bar-animate ${colorClass}`}
          style={{ width: `${porcentaje}%`, animationDelay: `${delay}ms` }}
        />
      </div>
      <span className="text-sm font-bold tabular-nums w-10 text-right text-slate-600 dark:text-slate-300">
        {porcentaje}%
      </span>
    </div>
  );
}

function SkeletonResultados() {
  return (
    <div className="flex flex-col gap-6">
      <div className="skeleton h-32 w-full" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="skeleton h-24" />
        <div className="skeleton h-24" />
        <div className="skeleton h-24 col-span-2 md:col-span-1" />
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="skeleton h-14 rounded-none" />
        <div className="p-5 flex flex-col gap-6">
          {[80, 45, 20].map((w, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex justify-between">
                <div className={`skeleton h-4`} style={{ width: `${w}px` }} />
                <div className="skeleton h-4 w-12" />
              </div>
              <div className="skeleton h-2 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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

  const candidatosOrdenados = datos?.candidatos
    ? [...datos.candidatos].sort((a, b) => b.votos - a.votos)
    : [];
  const ganador = candidatosOrdenados[0] ?? null;

  return (
    <VotingShell>
      <div className="stagger-1 flex flex-col gap-1 px-1">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none mb-0">
          Resultados Electorales
        </h1>
        <p className="mt-2 mb-0 text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          Resultados finales verificados en cadena mediante escrutinio cooperativo Shamir
        </p>
      </div>

      {cargando && <SkeletonResultados />}

      {error && !cargando && (
        <div className="stagger-2 flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl p-4 text-sm">
          <span className="material-symbols-outlined shrink-0">error</span>
          {error}
        </div>
      )}

      {!cargando && !error && datos && !datos.publicado && (
        <div className="stagger-2 flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-4xl">schedule</span>
          </div>
          <p className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-0">
            Resultados no disponibles
          </p>
          <p className="mt-0 mb-0 text-slate-400 text-sm max-w-xs leading-relaxed">
            El escrutinio cooperativo aún no ha sido ejecutado.
            Los resultados se publicarán una vez completado el proceso.
          </p>
        </div>
      )}

      {!cargando && !error && datos?.publicado && datos.candidatos && (
        <div className="flex flex-col gap-5">

          {/* Ganador */}
          {ganador && ganador.votos > 0 && (
            <div className="stagger-2 relative overflow-hidden rounded-xl border border-[#197fe6]/20 bg-gradient-to-r from-[#197fe6]/8 to-white dark:to-slate-900 p-6 flex items-center gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <span className="material-symbols-outlined text-amber-500 text-3xl">emoji_events</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-0">
                  Candidato más votado
                </p>
                <p className="mt-1 mb-0 text-2xl font-black tracking-tight text-slate-900 dark:text-white truncate">
                  {ganador.nombre}
                </p>
                {ganador.descripcion && (
                  <p className="mt-0 mb-0 text-sm text-slate-500 truncate">{ganador.descripcion}</p>
                )}
                <p className="mt-1 mb-0 text-[#197fe6] font-bold text-sm">
                  {ganador.votos} {ganador.votos === 1 ? "voto" : "votos"} ·{" "}
                  {datos.totalVotos! > 0
                    ? Math.round((ganador.votos / datos.totalVotos!) * 100)
                    : 0}%
                </p>
              </div>
              {/* Decoración */}
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#197fe6]/5" />
            </div>
          )}

          {/* KPIs */}
          <div className="stagger-3 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-0">Total de votos</p>
              <p className="mt-1 mb-0 text-3xl font-black text-[#197fe6] tabular-nums">{datos.totalVotos}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-0">Candidatos</p>
              <p className="mt-1 mb-0 text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                {datos.candidatos.length}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 col-span-2 md:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-0">Publicado</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-500 text-[16px]">verified</span>
                <p className="mb-0 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {datos.timestamp
                    ? new Date(datos.timestamp * 1000).toLocaleString("es-BO", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Distribución */}
          <div className="stagger-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#197fe6] text-[20px]">bar_chart</span>
              <h2 className="font-bold text-slate-900 dark:text-white mb-0">Distribución de votos</h2>
            </div>
            <div className="p-5 flex flex-col gap-5">
              {candidatosOrdenados.map((c, i) => {
                const color = COLORES[i % COLORES.length];
                return (
                  <div key={c.indice} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color.dot}`} />
                        <span className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                          {c.nombre}
                        </span>
                        {c.descripcion && (
                          <span className="text-slate-400 text-xs hidden sm:inline truncate">{c.descripcion}</span>
                        )}
                      </div>
                      <span className={`font-bold text-sm tabular-nums shrink-0 ${color.text}`}>
                        {c.votos} {c.votos === 1 ? "voto" : "votos"}
                      </span>
                    </div>
                    <BarraVotos
                      votos={c.votos}
                      total={datos.totalVotos!}
                      colorClass={color.bar}
                      delay={i * 100}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hash de evidencias */}
          {datos.hashPaqueteEvidencias && (
            <div className="stagger-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-slate-500">
                <span className="material-symbols-outlined text-[16px]">fingerprint</span>
                <span className="text-xs font-semibold uppercase tracking-widest">Hash de evidencias · SHA-256</span>
              </div>
              <code className="text-xs font-mono text-slate-500 dark:text-slate-400 break-all leading-relaxed">
                {datos.hashPaqueteEvidencias}
              </code>
              <p className="mb-0 text-xs text-slate-400 leading-relaxed">
                Registrado de forma inmutable en blockchain. Permite verificar la integridad del paquete de evidencias del escrutinio.
              </p>
            </div>
          )}
        </div>
      )}
    </VotingShell>
  );
}
