"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import VotingShell, { ProgressStepper } from "~~/components/voting/VotingShell";
import { generarSchnorr, MENSAJE_SCHNORR_PREFIX } from "~~/lib/schnorr";

type EstadoEleccion = {
  abierta: boolean;
  candidatos: string[];
  totalBoletas: number;
};

type ResultadoVoto = {
  transaccion?: { hash: string; bloque: number };
  hashComprobante?: string;
};

function CandidatoAvatar({ indice, nombre, activo }: { indice: number; nombre: string; activo: boolean }) {
  const [error, setError] = useState(false);
  const src = `/candidatos/candidato-${indice}.jpg`;

  if (!error) {
    return (
      <div className={`w-full aspect-square rounded-lg overflow-hidden transition-all duration-200
        ${activo ? "ring-2 ring-[#197fe6]/40" : ""}`}
      >
        <Image
          src={src}
          alt={nombre}
          width={200}
          height={200}
          className="w-full h-full object-cover object-center"
          onError={() => setError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`w-full aspect-square rounded-lg flex items-center justify-center
      transition-colors duration-200
      ${activo
        ? "bg-gradient-to-br from-[#197fe6]/20 to-[#197fe6]/5 dark:from-[#197fe6]/30 dark:to-[#197fe6]/10"
        : "bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900"
      }`}
    >
      <span aria-hidden="true" className={`material-symbols-outlined text-5xl transition-colors duration-200
        ${activo ? "text-[#197fe6]" : "text-slate-300 dark:text-slate-600 group-hover:text-[#197fe6]/50"}`}>
        account_circle
      </span>
    </div>
  );
}

function SkeletonCandidatos() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-3">
          <div className="skeleton aspect-square rounded-lg" />
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function VotarPage() {
  const [estado, setEstado] = useState<EstadoEleccion | null>(null);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoVoto | null>(null);
  const [generandoPrueba, setGenerandoPrueba] = useState(false);

  useEffect(() => {
    (async () => {
      const resp = await fetch("/api/voto/estado-eleccion");
      const data = await resp.json();
      setEstado(data);
    })();
  }, []);

  const emitir = async () => {
    setError(null);
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("votingToken") : null;
      if (!token) throw new Error("No hay token de votación. Verifique elegibilidad primero.");
      if (seleccion === null) throw new Error("Seleccione un candidato.");

      setGenerandoPrueba(true);
      let schnorrProof: { R: string; s: string };
      try {
        const mensaje = `${MENSAJE_SCHNORR_PREFIX}:${seleccion}`;
        schnorrProof = await generarSchnorr(token, mensaje);
      } catch (e) {
        throw new Error(
          "No se pudo generar la prueba criptográfica (Schnorr). " +
          "Verifique que su navegador soporte Web Crypto API.",
        );
      } finally {
        setGenerandoPrueba(false);
      }

      // schnorrProof es siempre requerido — el backend rechaza votos sin ella
      const body = { candidatoId: seleccion, token, schnorrProof };

      const resp = await fetch("/api/voto/emitir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.mensaje ?? "No se pudo emitir el voto");

      setResultado(data);
      localStorage.removeItem("votingToken");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
      setGenerandoPrueba(false);
    }
  };

  const botonLabel = generandoPrueba
    ? "Generando prueba ZK…"
    : loading
      ? "Registrando on-chain…"
      : "Emitir voto";

  return (
    <VotingShell sessionId="VOTACION">
      <ProgressStepper totalSteps={4} currentStep={3} faseActual="Emisión del voto" />

      <div className="stagger-1 flex flex-col gap-2 px-1">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none mb-0">Boleta Electrónica</h1>
        <p className="mt-2 mb-0 text-slate-600 dark:text-slate-400 text-base leading-relaxed">
          Seleccione al candidato de su preferencia. El voto se cifra con ElGamal homomórfico
          y se registra on-chain sin vincularlo a su identidad.
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold
            ${estado?.abierta
              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
              : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
            }`}>
            <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${estado?.abierta ? "bg-emerald-500" : "bg-red-500"}`} />
            {estado ? (estado.abierta ? "Jornada abierta" : "Jornada cerrada") : "…"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 font-semibold text-slate-600 dark:text-slate-400">
            <span aria-hidden="true" className="material-symbols-outlined text-[14px]">inventory_2</span>
            Boletas on-chain: {estado?.totalBoletas ?? "—"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#197fe6]/10 text-[#197fe6] px-3 py-1 font-semibold">
            <span aria-hidden="true" className="material-symbols-outlined text-[14px]">lock</span>
            ElGamal + Schnorr ZK
          </span>
        </div>
      </div>

      {!resultado ? (
        <>
          {!estado ? (
            <>
              <p aria-live="polite" className="text-sm text-slate-500 dark:text-slate-400">
                Cargando estado de elección…
              </p>
              <SkeletonCandidatos />
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {estado.candidatos.map((c, idx) => {
                const [nombre, partido] = c.split(" - ");
                const activo = seleccion === idx;
                const staggerClass = `stagger-${Math.min(idx + 2, 5)}`;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSeleccion(idx)}
                    className={`${staggerClass} btn-votoseguro group flex flex-col gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border text-center shadow-sm relative overflow-hidden
                      ${activo
                        ? "border-[#197fe6] ring-2 ring-[#197fe6]/30 shadow-[#197fe6]/10 shadow-md"
                        : "border-slate-200 dark:border-slate-800 hover:border-[#197fe6]/50 hover:shadow-md"
                      }`}
                    aria-pressed={activo}
                  >
                    {/* Check indicator */}
                    <span
                      aria-hidden="true"
                      className={`absolute top-3 right-3 material-symbols-outlined text-xl
                        transition-opacity duration-150
                        ${activo ? "text-[#197fe6] opacity-100" : "opacity-0 group-hover:opacity-30 text-[#197fe6]"}`}
                    >
                      check_circle
                    </span>

                    {/* Avatar */}
                    <CandidatoAvatar indice={idx} nombre={nombre ?? c} activo={activo} />

                    <div className="flex flex-col items-center gap-0.5">
                      <p className="font-bold text-slate-900 dark:text-white mb-0">{nombre ?? c}</p>
                      {partido && (
                        <p className="mt-0.5 mb-0 text-[#197fe6] text-xs font-bold tracking-wide">{partido}</p>
                      )}
                      <p className="mt-1 mb-0 text-slate-400 text-[10px] font-semibold uppercase tracking-widest">
                        Opción {idx + 1}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div aria-live="polite" aria-atomic="true">
            {error && (
              <div className="stagger-1 flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                <span aria-hidden="true" className="material-symbols-outlined text-base shrink-0">error</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
            <a
              href="/verificar"
              className="btn-votoseguro w-full sm:w-auto px-8 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center"
            >
              Volver
            </a>
            <button
              type="button"
              onClick={emitir}
              disabled={loading || generandoPrueba || !estado?.abierta || seleccion === null}
              className="btn-votoseguro w-full sm:w-auto px-12 h-12 rounded-xl bg-[#197fe6] text-white font-bold shadow-lg shadow-[#197fe6]/20 hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(loading || generandoPrueba) && (
                <span aria-hidden="true" className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
              )}
              {botonLabel}
              {!loading && !generandoPrueba && (
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">arrow_forward</span>
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="stagger-1 rounded-xl border border-emerald-300/50 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/20 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              <span aria-hidden="true" className="material-symbols-outlined text-emerald-600 text-[22px]">verified</span>
            </div>
            <div>
              <h2 className="font-bold text-lg mb-0">Voto emitido exitosamente</h2>
              <p className="mt-0 mb-0 text-xs text-slate-500">
                Cifrado ElGamal · Prueba Schnorr verificada · Registrado on-chain
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-white/60 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 p-4 grid gap-2 text-xs font-mono break-all">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-slate-400">TX Hash</span>
              <span className="text-slate-700 dark:text-slate-300">{resultado.transaccion?.hash}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-slate-400">Bloque</span>
                <span className="text-slate-700 dark:text-slate-300">{resultado.transaccion?.bloque}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-slate-400">Comprobante</span>
                <span className="text-slate-700 dark:text-slate-300">{resultado.hashComprobante?.slice(0, 20)}…</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={`/comprobar?txHash=${resultado.transaccion?.hash}`}
              className="btn-votoseguro inline-flex items-center justify-center gap-2 px-6 h-11 rounded-xl bg-[#197fe6] text-white font-bold shadow-md shadow-[#197fe6]/20 hover:brightness-110"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">receipt_long</span>
              Verificar comprobante
            </a>
            <a
              href="/explorer"
              className="btn-votoseguro inline-flex items-center justify-center gap-2 px-6 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold hover:bg-slate-50"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">search</span>
              Ver en Explorer
            </a>
          </div>
        </div>
      )}
    </VotingShell>
  );
}
