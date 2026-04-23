"use client";

import Link from "next/link";
import type { NextPage } from "next";
import VotingShell from "~~/components/voting/VotingShell";

const Home: NextPage = () => {
  return (
    <VotingShell>
      <section className="rounded-2xl bg-gradient-to-br from-[#197fe6]/10 via-white to-white dark:from-[#197fe6]/20 dark:via-slate-900 dark:to-slate-900 border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-sm">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#197fe6]/10 text-[#197fe6] px-3 py-1 text-xs font-bold uppercase tracking-wider">
          <span className="material-symbols-outlined text-base">verified_user</span>
          Prototipo de Grado · UCB
        </span>
        <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tight">
          Sistema de Votación Descentralizada Verificable
        </h1>
        <p className="mt-4 text-slate-600 dark:text-slate-400 text-base md:text-lg max-w-3xl">
          Identidad verificable, voto anónimo cifrado y auditoría universal. Diseñado para restaurar
          la confianza ciudadana mediante criptografía moderna y registro inmutable en blockchain.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/verificar"
            className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-[#197fe6] text-white font-bold shadow-lg shadow-[#197fe6]/20 hover:brightness-110 transition-all"
          >
            <span className="material-symbols-outlined">how_to_vote</span>
            Iniciar votación
          </Link>
          <Link
            href="/explorer"
            className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined">search</span>
            Explorador público
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: "verified",
            title: "Identidad Verificable",
            desc: "Credenciales firmadas (W3C VC) separan elegibilidad de identidad.",
          },
          {
            icon: "lock",
            title: "Voto Anónimo Cifrado",
            desc: "ElGamal + ZK proofs aseguran el secreto del sufragio.",
          },
          {
            icon: "policy",
            title: "Auditoría Universal",
            desc: "Cualquier tercero reproduce el conteo con el paquete de evidencias.",
          },
        ].map(card => (
          <article
            key={card.title}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm"
          >
            <span className="material-symbols-outlined text-3xl text-[#197fe6]">{card.icon}</span>
            <h3 className="mt-3 font-bold text-lg">{card.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{card.desc}</p>
          </article>
        ))}
      </section>
    </VotingShell>
  );
};

export default Home;
