"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerificarPage() {
  const router = useRouter();
  const [numeroPadron, setNumeroPadron] = useState("");
  const [nombre, setNombre] = useState("");
  const [ci, setCi] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const resp = await fetch("/api/auth/verificar-elegibilidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numeroPadron, nombre, ci }),
      });

      const data = await resp.json();
      if (!resp.ok || !data.token) {
        throw new Error(data.mensaje ?? "No se pudo verificar elegibilidad");
      }

      localStorage.setItem("votingToken", data.token);
      localStorage.setItem("votingSessionId", data.sessionId);
      router.push("/votar");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f7f8] dark:bg-[#111921] py-10 px-4">
      <div className="max-w-3xl mx-auto rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h1 className="text-3xl font-black">Autenticación SSI / VC</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Verifique su elegibilidad antes de emitir su voto anónimo.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold">Número de Padrón</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2"
              placeholder="LP123456"
              value={numeroPadron}
              onChange={e => setNumeroPadron(e.target.value.toUpperCase())}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">Nombre completo</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2"
              placeholder="Juan Pérez"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">CI</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2"
              placeholder="12345678L"
              value={ci}
              onChange={e => setCi(e.target.value.toUpperCase())}
              required
            />
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#197fe6] text-white font-bold py-3 disabled:opacity-60"
          >
            {loading ? "Verificando..." : "Autenticar credencial digital"}
          </button>
        </form>
      </div>
    </main>
  );
}
