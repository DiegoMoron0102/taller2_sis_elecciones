"use client";

import { useEffect, useState } from "react";
import VotingShell, { ProgressStepper } from "~~/components/voting/VotingShell";

type EstadoEleccion = {
  abierta: boolean;
  candidatos: string[];
  totalBoletas: number;
};

export default function VotarPage() {
  const [estado, setEstado] = useState<EstadoEleccion | null>(null);
  const [seleccion, setSeleccion] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<any>(null);

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

      const resp = await fetch("/api/voto/emitir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidatoId: seleccion, token }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.mensaje ?? "No se pudo emitir el voto");

      setResultado(data);
      localStorage.removeItem("votingToken");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  if (!estado) {
    return (
      <VotingShell>
        <p className="text-center opacity-70">Cargando estado de elección...</p>
      </VotingShell>
    );
  }

  return (
    <VotingShell sessionId="VOTACION">
      <ProgressStepper totalSteps={4} currentStep={3} faseActual="Emisión del voto" />

      <div className="flex flex-col gap-2 px-1">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Boleta Electrónica</h1>
        <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg">
          Seleccione al candidato de su preferencia. El voto se cifra y se registra on-chain
          sin vincularlo a su identidad.
        </p>
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1">
            <span className="material-symbols-outlined text-base">how_to_vote</span>
            Estado: {estado.abierta ? "Jornada abierta" : "Jornada cerrada"}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1">
            <span className="material-symbols-outlined text-base">inventory_2</span>
            Boletas on-chain: {estado.totalBoletas}
          </span>
        </div>
      </div>

      {!resultado ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {estado.candidatos.map((c, idx) => {
              const [nombre, partido] = c.split(" - ");
              const activo = seleccion === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSeleccion(idx)}
                  className={`group flex flex-col gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border transition-all text-left shadow-sm hover:shadow-md relative ${
                    activo
                      ? "border-[#197fe6] ring-2 ring-[#197fe6]/40"
                      : "border-slate-200 dark:border-slate-800 hover:border-[#197fe6]"
                  }`}
                >
                  <span
                    className={`absolute top-3 right-3 material-symbols-outlined text-2xl ${
                      activo ? "text-[#197fe6]" : "opacity-0 group-hover:opacity-50 text-[#197fe6]"
                    }`}
                  >
                    check_circle
                  </span>
                  <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-[#197fe6]/15 via-slate-100 to-slate-200 dark:from-[#197fe6]/25 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-[#197fe6]/70">account_circle</span>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{nombre ?? c}</p>
                    {partido && <p className="text-[#197fe6] text-sm font-bold">{partido}</p>}
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase mt-1 tracking-wider">
                      Opción {idx + 1}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-500">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
            <a
              href="/verificar"
              className="w-full sm:w-auto px-8 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
            >
              Volver
            </a>
            <button
              onClick={emitir}
              disabled={loading || !estado.abierta}
              className="w-full sm:w-auto px-12 h-12 rounded-xl bg-[#197fe6] text-white font-bold shadow-lg shadow-[#197fe6]/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? "Registrando on-chain..." : "Emitir voto"}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-green-400/30 bg-green-50 dark:bg-green-900/20 p-6 grid gap-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-green-600 text-3xl">verified</span>
            <h2 className="text-xl font-bold">Voto emitido exitosamente</h2>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Su boleta fue cifrada, registrada on-chain y su token ha sido consumido. Puede verificarla en el Explorer.
          </p>
          <div className="grid gap-2 text-sm font-mono bg-white/60 dark:bg-slate-900/50 rounded-lg p-3 break-all">
            <span><b>TX:</b> {resultado.transaccion?.hash}</span>
            <span><b>Bloque:</b> {resultado.transaccion?.bloque}</span>
            <span><b>Nullifier:</b> {resultado.boleta?.nullifier}</span>
            <span><b>Comprobante:</b> {resultado.hashComprobante}</span>
          </div>
          <a
            href="/explorer"
            className="mt-2 inline-flex items-center justify-center gap-2 px-8 h-11 rounded-xl bg-[#197fe6] text-white font-bold"
          >
            Ver en Explorer
            <span className="material-symbols-outlined">open_in_new</span>
          </a>
        </div>
      )}
    </VotingShell>
  );
}
