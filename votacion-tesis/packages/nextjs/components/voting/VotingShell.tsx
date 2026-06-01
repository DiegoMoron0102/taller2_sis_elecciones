"use client";

import Link from "next/link";
import { SwitchTheme } from "~~/components/SwitchTheme";

type StepperProps = {
  totalSteps: number;
  currentStep: number;
  faseActual: string;
};

const FASES = ["Inicio", "Autenticación", "Votación", "Comprobante"];

export function ProgressStepper({ totalSteps, currentStep, faseActual }: StepperProps) {
  const pct = Math.max(0, Math.min(100, (currentStep / totalSteps) * 100));
  return (
    <div className="p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="flex justify-between items-center mb-3">
        <p className="text-slate-900 dark:text-white text-sm font-semibold">{faseActual}</p>
        <p className="text-[#197fe6] text-xs font-bold tabular-nums">
          Paso {currentStep} de {totalSteps}
        </p>
      </div>

      {/* Barra de progreso */}
      <div className="relative rounded-full bg-slate-200 dark:bg-slate-700 h-1.5 w-full overflow-hidden mb-3">
        <div
          className="h-full bg-[#197fe6] rounded-full"
          style={{
            width: `${pct}%`,
            transition: "width 600ms cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        />
      </div>

      {/* Puntos de paso */}
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const done = step < currentStep;
          const active = step === currentStep;
          return (
            <div key={step} className="flex flex-col items-center gap-1">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold
                  transition-colors duration-200
                  ${done ? "bg-[#197fe6] text-white" : ""}
                  ${active ? "bg-[#197fe6]/15 text-[#197fe6] ring-2 ring-[#197fe6]/40" : ""}
                  ${!done && !active ? "bg-slate-100 dark:bg-slate-800 text-slate-400" : ""}
                `}
              >
                {done ? (
                  <span aria-hidden="true" className="material-symbols-outlined text-[12px]">check</span>
                ) : (
                  step
                )}
              </div>
              <span className={`hidden sm:block text-[10px] font-medium tracking-wide
                ${active ? "text-[#197fe6]" : "text-slate-400"}`}
              >
                {FASES[i] ?? `Paso ${step}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type ShellProps = {
  sessionId?: string;
  children: React.ReactNode;
};

export default function VotingShell({ sessionId, children }: ShellProps) {
  return (
    <div className="voting-shell bg-[#f6f7f8] dark:bg-[#111921] min-h-[100dvh] text-slate-900 dark:text-slate-100">

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-[#197fe6] focus:text-white focus:rounded-lg focus:font-bold"
      >
        Saltar al contenido principal
      </a>

      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 px-6 md:px-10 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          style={{ transition: "opacity 150ms cubic-bezier(0.23, 1, 0.32, 1)" }}
        >
          <span aria-hidden="true" className="material-symbols-outlined text-[#197fe6] text-3xl" style={{ transition: "transform 150ms cubic-bezier(0.23, 1, 0.32, 1)" }}>
            verified_user
          </span>
          <span className="text-lg font-black tracking-tight">VotoSeguro</span>
        </Link>

        <div className="flex items-center gap-3">
          {sessionId && (
            <span className="hidden md:inline text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
              {sessionId}
            </span>
          )}
          <SwitchTheme />
          <button
            className="btn-votoseguro flex items-center justify-center rounded-lg h-9 w-9 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
            aria-label="Cuenta"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">account_circle</span>
          </button>
        </div>
      </header>

      <main id="main-content" className="flex flex-1 justify-center py-8 px-4 md:px-6">
        <div className="w-full max-w-[1024px] flex flex-col gap-6">{children}</div>
      </main>
    </div>
  );
}
