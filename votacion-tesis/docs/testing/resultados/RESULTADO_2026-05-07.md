# Reporte de Pruebas — 2026-05-07

**Proyecto:** Sistema de Votación Electrónica Descentralizada Verificable  
**Commit evaluado:** `ab141ff`  
**Generado:** 2026-05-07T19:14:44.126Z  
**Resultado global:** ✅ TODAS LAS PRUEBAS PASARON

---

## Resumen por capa

| Capa | Estado | Resumen |
|---|---|---|
| Backend — unitarias + integración (Vitest) | ✅ PASS | [2m Test Files [22m [1m[32m4 passed[39m[22m[90m (4)[39m | [2m      Tests [22m [1m[32m62 passed[39m[22m[90m (62)[39m |
| Backend — cobertura (Vitest --coverage) | ✅ PASS | [2m Test Files [22m [1m[32m4 passed[39m[22m[90m (4)[39m | [2m      Tests [22m [1m[32m62 passed[39m[22m[90m (62)[39m |
| Contratos Solidity — PC-01..PC-05 (Hardhat + Chai) | ✅ PASS | 10 passing (476ms) |
| Frontend — PF-00..PF-03 (Vitest + Testing Library) | ✅ PASS | [2m Test Files [22m [1m[32m4 passed[39m[22m[90m (4)[39m | [2m      Tests [22m [1m[32m26 passed[39m[22m[90m (26)[39m |
| E2E Playwright — PE-01..PE-09 (Chromium) | ✅ PASS | OK |

---

## Capas evaluadas

| # | Capa | Herramienta | Cobertura objetivo |
|---|---|---|---|
| 1 | Unitarias backend (VotanteService, VotoService, AdminService) | Vitest | ≥ 70% |
| 2 | Cobertura backend con v8 | Vitest --coverage | ≥ 70% |
| 3 | Contratos Solidity (AdminParams, NullifierSet, BulletinBoard, Escrutinio) | Hardhat + Chai | 1 test / contrato |
| 4 | Frontend (VotingShell, /verificar, /votar, /explorer) | Vitest + Testing Library | smoke por página |
| 5 | E2E flujo completo (landing → verificar → votar → comprobar) | Playwright + Chromium | PE-01..PE-09 |

---

## Observaciones

_Sin fallos detectados en esta ejecución._

---

## Próximos pasos

- Ampliar tests de VotoService con casos edge adicionales.
- Añadir tests de `Escrutinio.sol` cuando el contrato esté implementado.
- Ejecutar protocolo de usabilidad presencial (ver `PROTOCOLO_USABILIDAD.md`).
- Actualizar `MATRIZ_REGRESION.md` con resultados de este commit.
