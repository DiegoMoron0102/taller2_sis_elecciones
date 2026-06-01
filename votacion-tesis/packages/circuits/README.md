# @votacion/circuits — Reservado para extensiones futuras

Este paquete está estructurado en el monorepo pero no contiene código activo en el prototipo actual.

La prueba de conocimiento cero del sistema está implementada mediante el protocolo **Schnorr con transformación de Fiat-Shamir** en:
- `packages/backend/src/lib/schnorr.ts` — verificador (Node.js)
- `packages/nextjs/lib/schnorr.ts` — generador de prueba (browser, `@noble/curves`)
