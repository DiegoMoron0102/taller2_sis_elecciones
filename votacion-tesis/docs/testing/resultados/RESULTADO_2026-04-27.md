# Reporte de Pruebas — 2026-04-27

**Proyecto:** Sistema de Votación Electrónica Descentralizada Verificable  
**Commit evaluado:** `160806f`  
**Generado:** 2026-04-27T18:21:17.048Z  
**Resultado global:** ✅ TODAS LAS PRUEBAS PASARON

---

## Resumen por capa

| Capa | Estado | Resumen |
|---|---|---|
| Backend — unitarias + integración (Vitest) | ✅ PASS | [2m Test Files [22m [1m[32m3 passed[39m[22m[90m (3)[39m | [2m      Tests [22m [1m[32m18 passed[39m[22m[90m (18)[39m |
| Backend — cobertura (Vitest --coverage) | ✅ PASS | [2m Test Files [22m [1m[32m3 passed[39m[22m[90m (3)[39m | [2m      Tests [22m [1m[32m18 passed[39m[22m[90m (18)[39m |
| Contratos Solidity — PC-01..PC-05 (Hardhat + Chai) | ✅ PASS | 5 passing (519ms) |
| Frontend — PF-00..PF-03 (Vitest + Testing Library) | ✅ PASS | [2m Test Files [22m [1m[32m4 passed[39m[22m[90m (4)[39m | [2m      Tests [22m [1m[32m26 passed[39m[22m[90m (26)[39m |

---

## Capas evaluadas

| # | Capa | Herramienta | Cobertura objetivo |
|---|---|---|---|
| 1 | Unitarias backend (VotanteService, VotoService) | Vitest | ≥ 70% |
| 2 | Cobertura backend con v8 | Vitest --coverage | ≥ 70% |
| 3 | Contratos Solidity (AdminParams, NullifierSet, BulletinBoard) | Hardhat + Chai | 1 test / contrato |
| 4 | Frontend (VotingShell, /verificar, /votar, /explorer) | Vitest + Testing Library | smoke por página |

---

## Observaciones

_Sin fallos detectados en esta ejecución._

---

## Próximos pasos

- Ampliar tests de VotoService con casos edge adicionales.
- Añadir tests de `Escrutinio.sol` cuando el contrato esté implementado.
- Ejecutar protocolo de usabilidad presencial (ver `PROTOCOLO_USABILIDAD.md`).
- Actualizar `MATRIZ_REGRESION.md` con resultados de este commit.
