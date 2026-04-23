"use client";

import Link from "next/link";

type StepperProps = {
  totalSteps: number;
  currentStep: number;
  faseActual: string;
};

export function ProgressStepper({ totalSteps, currentStep, faseActual }: StepperProps) {
  const pct = Math.max(0, Math.min(100, (currentStep / totalSteps) * 100));
  return (
    <div className="flex flex-col gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="flex gap-6 justify-between items-center">
        <p className="text-slate-900 dark:text-white text-base font-semibold">Progreso de Votación</p>
        <p className="text-[#197fe6] text-sm font-bold">
          Paso {currentStep} de {totalSteps}
        </p>
      </div>
      <div className="rounded-full bg-slate-200 dark:bg-slate-700 h-2 w-full overflow-hidden">
        <div className="h-full bg-[#197fe6] transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#197fe6] text-sm">info</span>
        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Fase Actual: {faseActual}</p>
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
    <div className="voting-shell bg-[#f6f7f8] dark:bg-[#111921] min-h-screen text-slate-900 dark:text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 md:px-10 py-3 bg-white dark:bg-slate-900">
        <Link href="/" className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#197fe6] text-3xl">verified_user</span>
          <span className="text-lg font-bold tracking-tight">VotoSeguro</span>
        </Link>
        <div className="flex items-center gap-3">
          {sessionId && (
            <span className="hidden md:inline text-sm font-medium text-slate-600 dark:text-slate-400">
              ID de Sesión: {sessionId}
            </span>
          )}
          <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </header>

      <main className="flex flex-1 justify-center py-8 px-4 md:px-6">
        <div className="w-full max-w-[1024px] flex flex-col gap-6">{children}</div>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 px-6 md:px-10 bg-white dark:bg-slate-900">
        <div className="max-w-[1024px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs font-medium">
          <p>© 2026 Prototipo de Grado UCB · Diego Morón Mejía</p>
          <div className="flex gap-6">
            <Link className="hover:text-[#197fe6]" href="/verificar">Verificar</Link>
            <Link className="hover:text-[#197fe6]" href="/votar">Votar</Link>
            <Link className="hover:text-[#197fe6]" href="/explorer">Explorer</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
