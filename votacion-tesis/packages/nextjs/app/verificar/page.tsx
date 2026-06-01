"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import VotingShell, { ProgressStepper } from "~~/components/voting/VotingShell";

type Modo = "vc" | "legacy";

export default function VerificarPage() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("vc");

  const [vcJson, setVcJson] = useState("");
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

      <div className="stagger-1 flex flex-col gap-2 px-1">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none mb-0">
          Autenticación con SSI/VC
        </h1>
        <p className="mt-2 mb-0 text-slate-600 dark:text-slate-400 text-base leading-relaxed">
          Presente su Credencial Verificable firmada por la Autoridad Electoral para acreditar elegibilidad.
          El sistema únicamente verifica la firma — no registra su identidad junto con el voto.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="stagger-2 relative flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5">
        {/* Pill deslizante */}
        <div
          aria-hidden="true"
          className="absolute top-1.5 h-[calc(100%-12px)] rounded-lg bg-[#197fe6] shadow-sm"
          style={{
            width: "calc(50% - 4px)",
            left: modo === "vc" ? "6px" : "calc(50% + 2px)",
            transition: "left 220ms cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        />
        <button
          type="button"
          onClick={() => setModo("vc")}
          className="relative flex-1 py-2 rounded-lg text-sm font-bold z-10"
          style={{ transition: "color 220ms cubic-bezier(0.23, 1, 0.32, 1)", color: modo === "vc" ? "white" : undefined }}
        >
          Credencial Verificable
        </button>
        <button
          type="button"
          onClick={() => setModo("legacy")}
          className="relative flex-1 py-2 rounded-lg text-sm font-bold z-10"
          style={{ transition: "color 220ms cubic-bezier(0.23, 1, 0.32, 1)", color: modo === "legacy" ? "white" : undefined }}
        >
          Campos individuales
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className="stagger-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col gap-5"
      >
        {modo === "vc" ? (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#197fe6]/10 text-[#197fe6]">
                <span aria-hidden="true" className="material-symbols-outlined text-[20px]">verified_user</span>
              </div>
              <div>
                <p className="font-bold mb-0">Credencial Verificable con firma ECDSA</p>
                <p className="mt-0 mb-0 text-xs text-slate-500">Emitida por la Autoridad Electoral al registrarse en el padrón</p>
              </div>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                JSON de su Credencial Verificable
              </span>
              <textarea
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#197fe6]/40 focus:border-[#197fe6]/50 h-48 resize-none"
                style={{ transition: "border-color 150ms, box-shadow 150ms" }}
                placeholder='{"@context": [...], "type": [...], "credentialSubject": {...}, "proof": {...}}'
                value={vcJson}
                onChange={e => setVcJson(e.target.value)}
                required={modo === "vc"}
                autoComplete="off"
                spellCheck={false}
              />
            </label>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 px-3 py-2.5">
              <span aria-hidden="true" className="material-symbols-outlined text-amber-600 text-[18px]">info</span>
              <p className="text-xs text-amber-700 dark:text-amber-400 mb-0">
                Modo de compatibilidad: sin firma criptográfica.
              </p>
            </div>
            {[
              { label: "Número de Padrón", placeholder: "LP123456", value: numeroPadron, onChange: (v: string) => setNumeroPadron(v.toUpperCase()), autoComplete: "off" },
              { label: "Nombre completo", placeholder: "Juan Pérez", value: nombre, onChange: (v: string) => setNombre(v), autoComplete: "name" },
              { label: "Carnet de Identidad", placeholder: "12345678L", value: ci, onChange: (v: string) => setCi(v.toUpperCase()), autoComplete: "off" },
            ].map(field => (
              <label key={field.label} className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{field.label}</span>
                <input
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#197fe6]/40 focus:border-[#197fe6]/50"
                  style={{ transition: "border-color 150ms, box-shadow 150ms" }}
                  placeholder={field.placeholder}
                  value={field.value}
                  onChange={e => field.onChange(e.target.value)}
                  required={modo === "legacy"}
                  autoComplete={field.autoComplete}
                />
              </label>
            ))}
          </>
        )}

        <div aria-live="polite" aria-atomic="true">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2.5 text-sm text-red-600 dark:text-red-400">
              <span aria-hidden="true" className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-votoseguro w-full h-12 rounded-xl bg-[#197fe6] text-white font-bold shadow-lg shadow-[#197fe6]/20 hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? <><span aria-hidden="true" className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Verificando credencial…</>
            : <><span aria-hidden="true" className="material-symbols-outlined text-[18px]">fingerprint</span> Autenticar credencial digital</>
          }
        </button>
      </form>

      <div className="flex justify-center items-center gap-2 py-1 opacity-50">
        <span aria-hidden="true" className="material-symbols-outlined text-[14px]">lock</span>
        <p className="m-0 text-[10px] uppercase tracking-widest font-bold">
          Token anónimo de un solo uso · Firma ECDSA secp256k1
        </p>
      </div>
    </VotingShell>
  );
}
