"use client";

import { useEffect, useState } from "react";

export default function ExplorerPage() {
  const [boletas, setBoletas] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const resp = await fetch("/api/voto/boletas");
      const data = await resp.json();
      setBoletas(data.boletas ?? []);
    };
    load();
  }, []);

  return (
    <main className="min-h-screen bg-[#f6f7f8] dark:bg-[#111921] py-10 px-4">
      <div className="max-w-5xl mx-auto rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h1 className="text-3xl font-black">Explorador de Boletas On-chain</h1>
        <p className="mt-2 text-sm opacity-70">Total: {boletas.length}</p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-300 dark:border-slate-700">
                <th className="py-2">#</th>
                <th>Nullifier</th>
                <th>Bloque</th>
                <th>Voto cifrado</th>
              </tr>
            </thead>
            <tbody>
              {boletas.map((b, i) => (
                <tr key={i} className="border-b border-slate-200 dark:border-slate-800">
                  <td className="py-2">{i + 1}</td>
                  <td className="font-mono">{String(b.nullifier).slice(0, 18)}...</td>
                  <td>{b.bloque}</td>
                  <td className="font-mono">{String(b.votoCifrado).slice(0, 18)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
