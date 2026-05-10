"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import VotingShell, { ProgressStepper } from "~~/components/voting/VotingShell";

type Modo = "vc" | "legacy";

export default function VerificarPage() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("vc");

  // Modo VC (Sprint 6)
  const [vcJson, setVcJson] = useState("");

  // Modo legado (compatibilidad)
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
      let body: Record<string, unknown>;

      if (modo === "vc") {
        let vc: unknown;
        try {
          vc = JSON.parse(vcJson);
        } catch {
          throw new Error("JSON de la Credencial Verificable inválido. Verifique el formato.");
        }
        body = { vc };
      } else {
        body = { numeroPadron, nombre, ci };
      }

      const resp = await fetch("/api/auth/verificar-elegibilidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
          Presente su Credencial Verificable firmada por la Autoridad Electoral para acreditar elegibilidad.
          El sistema únicamente verifica la firma; no registra su identidad junto con el voto.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
        <button
          type="button"
          onClick={() => setModo("vc")}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${modo === "vc" ? "bg-[#197fe6] text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
        >
          Credencial Verificable (VC)
        </button>
        <button
          type="button"
          onClick={() => setModo("legacy")}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${modo === "legacy" ? "bg-[#197fe6] text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
        >
          Campos individuales
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg grid gap-5"
      >
        {modo === "vc" ? (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#197fe6]/10 text-[#197fe6]">
                <span className="material-symbols-outlined">verified_user</span>
              </div>
              <div>
                <p className="font-bold">Credencial Verificable con firma ECDSA</p>
                <p className="text-xs text-slate-500">Emitida por la Autoridad Electoral al registrarse en el padrón</p>
              </div>
            </div>
            <label className="block">
              <span className="text-sm font-semibold">
                JSON de su Credencial Verificable
              </span>
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#197fe6]/40 h-48 resize-none"
                placeholder='{"@context": [...], "type": [...], "credentialSubject": {...}, "proof": {...}}'
                value={vcJson}
                onChange={e => setVcJson(e.target.value)}
                required={modo === "vc"}
              />
            </label>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Modo de compatibilidad: ingrese sus datos directamente sin firma criptográfica.
            </p>
            <label className="block">
              <span className="text-sm font-semibold">Número de Padrón</span>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#197fe6]/40"
                placeholder="LP123456"
                value={numeroPadron}
                onChange={e => setNumeroPadron(e.target.value.toUpperCase())}
                required={modo === "legacy"}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Nombre completo</span>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#197fe6]/40"
                placeholder="Juan Pérez"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required={modo === "legacy"}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Carnet de Identidad</span>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#197fe6]/40"
                placeholder="12345678L"
                value={ci}
                onChange={e => setCi(e.target.value.toUpperCase())}
                required={modo === "legacy"}
              />
            </label>
          </>
        )}

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
        <p className="text-[10px] uppercase tracking-widest font-bold">Token anónimo de un solo uso · Firma ECDSA secp256k1</p>
      </div>
    </VotingShell>
  );
}
