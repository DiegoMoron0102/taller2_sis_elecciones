"use client";

import Link from "next/link";
import type { NextPage } from "next";
import VotingShell from "~~/components/voting/VotingShell";

const Home: NextPage = () => {
  return (
    <VotingShell>
      {/* Hero */}
      <section className="stagger-1 rounded-2xl bg-gradient-to-br from-[#197fe6]/10 via-white to-white dark:from-[#197fe6]/20 dark:via-slate-900 dark:to-slate-900 border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-sm">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#197fe6]/10 text-[#197fe6] px-3 py-1 text-xs font-bold uppercase tracking-wider">
          <span aria-hidden="true" className="material-symbols-outlined text-base">verified_user</span>
          Prototipo de Grado · UCB
        </span>

        <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tight leading-none">
          Votación <span className="text-[#197fe6]">Descentralizada</span>
          <br className="hidden md:block" /> Verificable
        </h1>

        <p className="mt-4 mb-0 text-slate-600 dark:text-slate-400 text-base md:text-lg max-w-2xl leading-relaxed">
          Identidad verificable, voto anónimo cifrado y auditoría universal.
          Criptografía real con registro inmutable en blockchain.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/verificar"
            className="btn-votoseguro inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-[#197fe6] text-white font-bold shadow-lg shadow-[#197fe6]/25 hover:brightness-110"
          >
            <span aria-hidden="true" className="material-symbols-outlined">how_to_vote</span>
            Iniciar votación
          </Link>
          <Link
            href="/explorer"
            className="btn-votoseguro inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <span aria-hidden="true" className="material-symbols-outlined">search</span>
            Explorador público
          </Link>
          <Link
            href="/comprobar"
            className="btn-votoseguro inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <span aria-hidden="true" className="material-symbols-outlined">receipt_long</span>
            Verificar comprobante
          </Link>
        </div>
      </section>

      {/* Feature Bento — asimétrico (rompe el patrón de 3 cols iguales) */}
      <section className="grid grid-cols-1 md:grid-cols-5 gap-4">

        {/* Tarjeta grande (3/5) */}
        <article className="stagger-2 md:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm flex flex-col gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#197fe6]/10">
            <span aria-hidden="true" className="material-symbols-outlined text-[22px] text-[#197fe6]">verified</span>
          </div>
          <div>
            <h2 className="font-bold text-xl tracking-tight mb-0">Identidad Verificable</h2>
            <p className="mt-2 mb-0 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Credenciales W3C firmadas con ECDSA secp256k1 separan elegibilidad de identidad.
              El sistema verifica la firma sin almacenar datos personales vinculados al voto.
            </p>
          </div>
          <div className="mt-auto flex items-center gap-2 text-xs font-semibold text-[#197fe6] border-t border-slate-100 dark:border-slate-800 pt-4">
            <span aria-hidden="true" className="material-symbols-outlined text-sm">lock</span>
            ECDSA secp256k1 · W3C VC 1.1
          </div>
        </article>

        {/* Tarjeta mediana (2/5) */}
        <article className="stagger-3 md:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm flex flex-col gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
            <span aria-hidden="true" className="material-symbols-outlined text-[22px] text-emerald-600">lock</span>
          </div>
          <div>
            <h2 className="font-bold text-xl tracking-tight mb-0">Voto Anónimo Cifrado</h2>
            <p className="mt-2 mb-0 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              ElGamal homomórfico + prueba Schnorr-Fiat-Shamir garantizan el secreto del sufragio.
            </p>
          </div>
          <div className="mt-auto flex items-center gap-2 text-xs font-semibold text-emerald-600 border-t border-slate-100 dark:border-slate-800 pt-4">
            <span aria-hidden="true" className="material-symbols-outlined text-sm">shield</span>
            ElGamal · Schnorr NIZKPoK
          </div>
        </article>

        {/* Tarjeta horizontal full-width (5/5) */}
        <article className="stagger-4 md:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20">
            <span aria-hidden="true" className="material-symbols-outlined text-[22px] text-amber-600">policy</span>
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-xl tracking-tight mb-0">Auditoría Universal</h2>
            <p className="mt-1 mb-0 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Cualquier tercero reproduce el conteo con el paquete de evidencias publicado.
              Shamir Secret Sharing distribuye la clave privada entre 5 custodios con umbral de 3.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 shrink-0 pl-0 sm:pl-4 border-l-0 sm:border-l sm:border-slate-100 dark:sm:border-slate-800">
            <span aria-hidden="true" className="material-symbols-outlined text-sm">hub</span>
            Shamir 5-de-3 · Blockchain
          </div>
        </article>
      </section>
    </VotingShell>
  );
};

export default Home;
