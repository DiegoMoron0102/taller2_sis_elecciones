"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import VotingShell from "~~/components/voting/VotingShell";

type ComprobanteOk = {
  txHash: string;
  blockNumber: number;
  boletaId: number;
  nullifier: string;
  timestamp: number;
  estado: "registrado";
};

type Estado = "idle" | "loading" | "ok" | "notfound" | "error";

export default function ComprobarPage() {
  return (
    <Suspense fallback={<VotingShell><p className="text-center opacity-70">Cargando...</p></VotingShell>}>
      <ComprobarContent />
    </Suspense>
  );
}

function ComprobarContent() {
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const [txHash, setTxHash] = useState("");
  const [estado, setEstado] = useState<Estado>("idle");
  const [resultado, setResultado] = useState<ComprobanteOk | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  useEffect(() => {
    const prefill = searchParams.get("txHash");
    if (prefill) {
      setTxHash(prefill);
    }
  }, [searchParams]);

  const verificar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstado("loading");
    setResultado(null);
    setMensajeError(null);

    try {
      const resp = await fetch(`/api/voto/comprobante?txHash=${encodeURIComponent(txHash.trim())}`);
      const data = await resp.json();

      if (resp.status === 404) {
        setEstado("notfound");
      } else if (!resp.ok) {
        setEstado("error");
        setMensajeError(data.error ?? data.mensaje ?? "Error desconocido");
      } else {
        setResultado(data as ComprobanteOk);
        setEstado("ok");
      }
    } catch {
      setEstado("error");
      setMensajeError("No se pudo conectar con el servidor. Intente nuevamente.");
    }
  };

  const limpiar = () => {
    setTxHash("");
    setEstado("idle");
    setResultado(null);
    setMensajeError(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const fechaFormateada = resultado
    ? new Date(resultado.timestamp * 1000).toLocaleString("es-BO", {
        dateStyle: "long",
        timeStyle: "medium",
      })
    : null;

  return (
    <VotingShell>
      <div className="flex flex-col gap-2 px-1">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#197fe6]/10 text-[#197fe6] px-3 py-1 text-xs font-bold uppercase tracking-wider w-fit">
          <span className="material-symbols-outlined text-base">receipt_long</span>
          Verificación de comprobante
        </span>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">¿Llegó tu voto?</h1>
        <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg">
          Ingresa el hash de transacción que recibiste al emitir tu voto para confirmar que tu boleta
          está registrada de forma inmutable en la blockchain.
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={verificar} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300" htmlFor="txHash">
            Hash de transacción (txHash)
          </label>
          <input
            ref={inputRef}
            id="txHash"
            type="text"
            value={txHash}
            onChange={e => setTxHash(e.target.value)}
            placeholder="0x..."
            spellCheck={false}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#197fe6] transition"
            disabled={estado === "loading"}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            64 caracteres hexadecimales precedidos de <code>0x</code>. Lo encontrarás en tu comprobante de voto.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          {estado !== "idle" && (
            <button
              type="button"
              onClick={limpiar}
              className="px-6 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Nueva consulta
            </button>
          )}
          <button
            type="submit"
            disabled={estado === "loading" || txHash.trim().length < 5}
            className="px-8 h-11 rounded-xl bg-[#197fe6] text-white font-bold shadow-lg shadow-[#197fe6]/20 hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-60"
          >
            {estado === "loading" ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                Consultando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">search</span>
                Verificar
              </>
            )}
          </button>
        </div>
      </form>

      {/* Resultado exitoso */}
      {estado === "ok" && resultado && (
        <div className="rounded-xl border border-green-400/40 bg-green-50 dark:bg-green-900/20 p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-green-600 text-4xl">verified</span>
            <div>
              <h2 className="text-lg font-bold text-green-800 dark:text-green-300">Voto verificado ✓</h2>
              <p className="text-sm text-green-700 dark:text-green-400">
                Esta boleta está registrada de forma inmutable en la blockchain.
              </p>
            </div>
          </div>

          <div className="grid gap-2 text-sm font-mono bg-white/70 dark:bg-slate-900/60 rounded-lg p-4 break-all border border-green-200/60 dark:border-green-800/40">
            <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-sans font-semibold not-italic">Estado</span>
              <span className="text-green-600 dark:text-green-400 font-bold font-sans">✓ Registrado</span>

              <span className="text-slate-500 dark:text-slate-400 font-sans font-semibold not-italic">Boleta ID</span>
              <span>#{resultado.boletaId}</span>

              <span className="text-slate-500 dark:text-slate-400 font-sans font-semibold not-italic">Bloque</span>
              <span>#{resultado.blockNumber}</span>

              <span className="text-slate-500 dark:text-slate-400 font-sans font-semibold not-italic">Fecha</span>
              <span className="font-sans not-italic">{fechaFormateada}</span>

              <span className="text-slate-500 dark:text-slate-400 font-sans font-semibold not-italic">TX Hash</span>
              <span className="text-xs break-all">{resultado.txHash}</span>

              <span className="text-slate-500 dark:text-slate-400 font-sans font-semibold not-italic">Nullifier</span>
              <span className="text-xs break-all">{resultado.nullifier}</span>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link
              href="/explorer"
              className="inline-flex items-center gap-2 px-6 h-10 rounded-xl bg-[#197fe6] text-white font-bold text-sm hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined text-base">search</span>
              Ver en Explorer
            </Link>
            <button
              onClick={limpiar}
              className="inline-flex items-center gap-2 px-6 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              Verificar otro
            </button>
          </div>
        </div>
      )}

      {/* No encontrado */}
      {estado === "notfound" && (
        <div className="rounded-xl border border-red-300/40 bg-red-50 dark:bg-red-900/20 p-6 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500 text-4xl">gpp_bad</span>
            <div>
              <h2 className="text-lg font-bold text-red-800 dark:text-red-300">Boleta no encontrada</h2>
              <p className="text-sm text-red-700 dark:text-red-400">
                La transacción no existe en la blockchain o no corresponde a una boleta registrada.
              </p>
            </div>
          </div>
          <ul className="text-sm text-slate-600 dark:text-slate-400 list-disc list-inside space-y-1">
            <li>Verifica que copiaste el txHash completo desde tu comprobante.</li>
            <li>El voto puede demorar algunos segundos en confirmarse.</li>
            <li>Si usas una red local (Hardhat), asegúrate de estar conectado al nodo correcto.</li>
          </ul>
        </div>
      )}

      {/* Error técnico */}
      {estado === "error" && (
        <div className="rounded-xl border border-orange-300/40 bg-orange-50 dark:bg-orange-900/20 p-6 flex items-start gap-3">
          <span className="material-symbols-outlined text-orange-500 text-3xl flex-shrink-0">warning</span>
          <div>
            <h2 className="text-base font-bold text-orange-800 dark:text-orange-300">Error de consulta</h2>
            <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">{mensajeError}</p>
          </div>
        </div>
      )}

      {/* Info card */}
      {estado === "idle" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          {[
            {
              icon: "fingerprint",
              title: "Privacidad garantizada",
              desc: "Solo verificas que la boleta existe. No se revela tu identidad ni tu elección.",
            },
            {
              icon: "link",
              title: "Verificación on-chain",
              desc: "Consultamos directamente el contrato BulletinBoard en la blockchain local.",
            },
            {
              icon: "lock",
              title: "Inmutabilidad",
              desc: "Una vez registrada, ninguna entidad puede alterar o eliminar tu boleta.",
            },
          ].map(card => (
            <article
              key={card.title}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm"
            >
              <span className="material-symbols-outlined text-2xl text-[#197fe6]">{card.icon}</span>
              <h3 className="mt-2 font-bold text-sm">{card.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{card.desc}</p>
            </article>
          ))}
        </div>
      )}
    </VotingShell>
  );
}
