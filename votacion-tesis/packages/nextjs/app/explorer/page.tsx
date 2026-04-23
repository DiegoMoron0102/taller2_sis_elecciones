"use client";

import { useEffect, useState } from "react";
import VotingShell from "~~/components/voting/VotingShell";

export default function ExplorerPage() {
  const [boletas, setBoletas] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const resp = await fetch("/api/voto/boletas");
      const data = await resp.json();
      setBoletas(data.boletas ?? []);
    })();
  }, []);

  return (
    <VotingShell>
      <div className="flex flex-col gap-2 px-1">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Explorador de Boletas</h1>
        <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg">
          Visualización pública de las boletas cifradas registradas on-chain. Cada fila incluye el hash del voto,
          la prueba asociada y el bloque en que fue incluido.
        </p>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-sm w-fit">
          <span className="material-symbols-outlined text-base">inventory_2</span>
          Total de boletas: {boletas.length}
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800/70 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Nullifier</th>
              <th className="px-4 py-3 font-semibold">Bloque</th>
              <th className="px-4 py-3 font-semibold">Voto cifrado</th>
            </tr>
          </thead>
          <tbody>
            {boletas.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  Aún no hay boletas registradas on-chain.
                </td>
              </tr>
            )}
            {boletas.map((b, i) => (
              <tr key={i} className="border-t border-slate-200 dark:border-slate-800">
                <td className="px-4 py-3">{i + 1}</td>
                <td className="px-4 py-3 font-mono break-all">{String(b.nullifier).slice(0, 22)}…</td>
                <td className="px-4 py-3">{b.bloque}</td>
                <td className="px-4 py-3 font-mono break-all">{String(b.votoCifrado).slice(0, 22)}…</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </VotingShell>
  );
}
