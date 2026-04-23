"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import VotingShell, { ProgressStepper } from "~~/components/voting/VotingShell";

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
    <VotingShell sessionId="PRE-AUTH">
      <ProgressStepper totalSteps={4} currentStep={2} faseActual="Autenticación de Identidad Digital" />

      <div className="flex flex-col gap-2 px-1">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Autenticación con SSI/VC</h1>
        <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg">
          Utilice su Credencial Verificable para acreditar su elegibilidad de forma privada y segura.
          El sistema únicamente verifica que usted esté en el padrón; no registra su identidad junto con el voto.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#197fe6]/10 text-[#197fe6]">
            <span className="material-symbols-outlined">cloud_done</span>
          </div>
          <div>
            <p className="font-bold">Servicio de Credenciales Digitales</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Conectado al backend local UCB</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wider">
          <span className="size-2 rounded-full bg-green-500 animate-pulse" /> Activo
        </span>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg grid gap-5"
      >
        <h2 className="text-xl font-bold">Credencial simulada</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Estos campos representan una VC simulada que el sistema verifica antes de emitir su token anónimo de votación.
        </p>

        <label className="block">
          <span className="text-sm font-semibold">Número de Padrón</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#197fe6]/40"
            placeholder="LP123456"
            value={numeroPadron}
            onChange={e => setNumeroPadron(e.target.value.toUpperCase())}
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold">Nombre completo</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#197fe6]/40"
            placeholder="Juan Pérez"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold">Carnet de Identidad</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#197fe6]/40"
            placeholder="12345678L"
            value={ci}
            onChange={e => setCi(e.target.value.toUpperCase())}
            required
          />
        </label>

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-500">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-[#197fe6] text-white font-bold shadow-lg shadow-[#197fe6]/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <span className="material-symbols-outlined">fingerprint</span>
          {loading ? "Verificando credencial..." : "Autenticar credencial digital"}
        </button>
      </form>

      <div className="flex justify-center items-center gap-2 py-2 opacity-60">
        <span className="material-symbols-outlined text-sm">lock</span>
        <p className="text-[10px] uppercase tracking-widest font-bold">Token anónimo de un solo uso</p>
      </div>
    </VotingShell>
  );
}
