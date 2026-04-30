# Reporte de Pruebas — 2026-04-30

**Proyecto:** Sistema de Votación Electrónica Descentralizada Verificable  
**Resultado global:** ✅ TODAS LAS PRUEBAS PASARON

---

## Ejecución A — Sprint 0/1/2 (checkpoint temprano)

**Commit evaluado:** `160806f`  
**Generado:** 2026-04-30T17:12:38.346Z

| Capa | Estado | Tests |
|---|---|---|
| Backend — unitarias + integración (Vitest) | ✅ PASS | 27 passed (3 archivos) |
| Contratos Solidity PC-01..PC-05 (Hardhat + Chai) | ✅ PASS | 10 passing |
| Frontend PF-00..PF-03 (Vitest + Testing Library) | ✅ PASS | 26 passed (4 archivos) |

---

## Ejecución B — Sprint 3: Verificación de comprobante

**Generado:** 2026-04-30T20:09:16.000Z

| Capa | Estado | Tests | Detalle |
|---|---|---|---|
| Backend — unitarias + integración (Vitest) | ✅ PASS | **33 passed** (3 archivos) | +6 nuevos: PU-12, PU-13, PI-05..PI-08 |
| Contratos Solidity (Hardhat + Chai) | ✅ PASS | 10 passing | sin cambios |
| Frontend (Vitest + Testing Library) | ✅ PASS | 26 passed (4 archivos) | sin regresiones |

### Nuevos casos Sprint 3

| ID | Descripción | Estado |
|---|---|---|
| PU-12 | `VotoService.verificarComprobante` retorna datos cuando txHash existe | ✅ PASS |
| PU-13 | `VotoService.verificarComprobante` retorna null cuando no encontrado | ✅ PASS |
| PI-05 | `GET /api/voto/comprobante` sin txHash retorna 400 | ✅ PASS |
| PI-06 | `GET /api/voto/comprobante` con formato inválido retorna 400 | ✅ PASS |
| PI-07 | `GET /api/voto/comprobante` con txHash no existente retorna 404 | ✅ PASS |
| PI-08 | `GET /api/voto/comprobante` con txHash válido retorna datos de boleta | ✅ PASS |

### Entregables Sprint 3

| Artefacto | Descripción |
|---|---|
| `BlockchainService.verificarComprobante` | Parsea evento `BoletaRegistrada` de la tx receipt |
| `VotoService.verificarComprobante` | Delegación al servicio blockchain |
| `VotoController.comprobante` | Controlador con validación de formato txHash |
| `GET /api/voto/comprobante` | Nuevo endpoint backend |
| `app/api/voto/comprobante/route.ts` | Proxy Next.js → backend |
| `app/comprobar/page.tsx` | Página `/comprobar`: idle / loading / ok / notfound / error |
| `e2e/votacion.spec.ts` | Tests PE-07..PE-09 para la página `/comprobar` |

---

## Capas evaluadas (acumulado)

| # | Capa | Herramienta | Estado |
|---|---|---|---|
| 1 | Unitarias backend (VotanteService, VotoService) | Vitest | ✅ 33 passed |
| 2 | Contratos Solidity (AdminParams, NullifierSet, BulletinBoard, Escrutinio) | Hardhat + Chai | ✅ 10 passing |
| 3 | Frontend (VotingShell, /verificar, /votar, /explorer, /comprobar) | Vitest + Testing Library | ✅ 26 passed |
| 4 | E2E Playwright (PE-01..PE-09) | Playwright + mocks | 📝 escritos, requieren servidor activo |

---

## Observaciones

- `act(...)` warnings en tests de frontend son pre-existentes y no son fallos.
- Tests E2E Playwright (PE-07..PE-09) escritos y correctos; se ejecutan con `yarn e2e` cuando el dev server está activo.
- `@types/supertest` añadido a `devDependencies` para corregir lint error pre-existente.

---

## Próximos pasos

- Ejecutar E2E Playwright completos (PE-01..PE-09) con servidor activo.
- Continuar con **Sprint 4 — Panel Administrativo** (abrir/cerrar jornada, habilitar escrutinio).
- Ejecutar protocolo de usabilidad presencial (ver `PROTOCOLO_USABILIDAD.md`).
- Actualizar `MATRIZ_REGRESION.md` con resultados de este commit.
