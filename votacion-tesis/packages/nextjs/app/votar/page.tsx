"use client";

import { useEffect, useState } from "react";

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
    const load = async () => {
      const resp = await fetch("/api/voto/estado-eleccion");
      const data = await resp.json();
      setEstado(data);
    };
    load();
  }, []);

  const emitir = async () => {
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("votingToken");
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
    return <main className="p-8">Cargando estado de elección...</main>;
  }

  return (
    <main className="min-h-screen bg-[#f6f7f8] dark:bg-[#111921] py-10 px-4">
      <div className="max-w-4xl mx-auto rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h1 className="text-3xl font-black">Boleta Electrónica</h1>
        <p className="mt-2 text-sm opacity-70">
          Estado: {estado.abierta ? "Jornada abierta" : "Jornada cerrada"} · Total boletas on-chain: {estado.totalBoletas}
        </p>

        {!resultado ? (
          <>
            <div className="mt-6 grid gap-3">
              {estado.candidatos.map((c, idx) => (
                <button
                  key={idx}
                  onClick={() => setSeleccion(idx)}
                  className={`text-left rounded-lg border px-4 py-3 ${
                    seleccion === idx
                      ? "border-[#197fe6] bg-[#197fe6]/10"
                      : "border-slate-300 dark:border-slate-700"
                  }`}
                >
                  <span className="font-semibold">{idx + 1}. </span>
                  {c}
                </button>
              ))}
            </div>

            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

            <button
              onClick={emitir}
              disabled={loading || !estado.abierta}
              className="mt-6 w-full rounded-lg bg-[#197fe6] text-white font-bold py-3 disabled:opacity-60"
            >
              {loading ? "Registrando en blockchain..." : "Emitir voto"}
            </button>
          </>
        ) : (
          <div className="mt-6 rounded-lg border border-green-400/40 bg-green-500/10 p-4">
            <h2 className="font-bold text-lg">✅ Voto emitido exitosamente</h2>
            <p className="mt-2 text-sm">TX Hash: {resultado.transaccion?.hash}</p>
            <p className="text-sm">Bloque: {resultado.transaccion?.bloque}</p>
            <p className="text-sm">Nullifier: {resultado.boleta?.nullifier}</p>
            <p className="text-sm">Hash comprobante: {resultado.hashComprobante}</p>
          </div>
        )}
      </div>
    </main>
  );
}
