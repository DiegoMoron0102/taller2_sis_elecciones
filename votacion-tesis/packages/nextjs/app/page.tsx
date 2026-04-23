"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { CheckBadgeIcon, DocumentMagnifyingGlassIcon, LockClosedIcon } from "@heroicons/react/24/outline";

const Home: NextPage = () => {
  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5 max-w-4xl text-center">
          <h1>
            <span className="block text-2xl mb-2">Prototipo de Grado</span>
            <span className="block text-4xl font-bold">Sistema de Votación Descentralizada Verificable</span>
          </h1>
          <p className="mt-6 text-lg">
            Elecciones presidenciales con identidad verificable, voto anónimo cifrado y escrutinio auditable.
          </p>
          <p className="mt-2 text-sm opacity-70">
            Diego Morón Mejía — Universidad Católica Boliviana &quot;San Pablo&quot; — Taller de Grado 2
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link href="/verificar" className="btn btn-primary">
              Verificar elegibilidad
            </Link>
            <Link href="/resultados" className="btn btn-ghost">
              Ver resultados públicos
            </Link>
          </div>
        </div>

        <div className="grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-8 flex-col md:flex-row max-w-6xl mx-auto">
            <div className="flex flex-col bg-base-100 px-8 py-8 text-center items-center max-w-xs rounded-3xl">
              <CheckBadgeIcon className="h-10 w-10 fill-secondary" />
              <h3 className="font-bold mt-2">Identidad Verificable</h3>
              <p className="text-sm mt-2">
                Credenciales digitales firmadas (W3C VC) que separan elegibilidad de identidad.
              </p>
            </div>
            <div className="flex flex-col bg-base-100 px-8 py-8 text-center items-center max-w-xs rounded-3xl">
              <LockClosedIcon className="h-10 w-10 fill-secondary" />
              <h3 className="font-bold mt-2">Voto Anónimo Cifrado</h3>
              <p className="text-sm mt-2">
                Cifrado ElGamal + pruebas de conocimiento cero (Noir) para proteger el secreto del sufragio.
              </p>
            </div>
            <div className="flex flex-col bg-base-100 px-8 py-8 text-center items-center max-w-xs rounded-3xl">
              <DocumentMagnifyingGlassIcon className="h-10 w-10 fill-secondary" />
              <h3 className="font-bold mt-2">Auditoría Universal</h3>
              <p className="text-sm mt-2">
                Cualquier tercero puede reproducir el conteo con el paquete de evidencias publicado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
