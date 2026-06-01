# Capítulo de Pruebas Funcionales

**Proyecto:** Sistema de Votación Electrónica Descentralizada Verificable  
**Autor:** Diego Morón Mejía — UCB San Pablo — Taller de Grado 2  
**Etapa:** 3 — Pruebas con calificación

---

## 1. Introducción

El sistema propuesto es crítico en términos de confianza, privacidad y correctitud: una falla puede comprometer el secreto del voto, permitir doble votación o alterar el conteo. Por eso el capítulo de pruebas aplica un enfoque en capas que cubre los cuatro tipos obligatorios:

1. Pruebas unitarias
2. Pruebas de integración
3. Pruebas de regresión
4. Pruebas de usabilidad

Cada tipo se justifica, se implementa como evidencia ejecutable y se enlaza a los requisitos funcionales del sistema.

---

## 2. Objetivos

- Validar que cada componente del sistema cumple su contrato funcional.
- Validar que los módulos (backend, contratos, frontend) interoperan correctamente.
- Detectar regresiones al introducir cambios nuevos en sprints posteriores.
- Evaluar la experiencia de usuario del flujo de votación.
- Generar evidencia académica reproducible y versionada.

---

## 3. Alcance

El alcance se alinea con el estado actual del prototipo (Sprint 0/1/2):

- **Backend:** servicios `VotanteService`, `VotoService`, `BlockchainService`; controladores y rutas Express.
- **Contratos:** `AdminParams`, `NullifierSet`, `BulletinBoard`, `Escrutinio`.
- **Frontend:** páginas `/`, `/verificar`, `/votar`, `/explorer` y componente `VotingShell`.
- **Flujo E2E:** autenticación de credencial → emisión de token → registro on-chain → consulta pública.

Queda fuera de alcance, por ahora, el circuito ZK final en Noir y el escrutinio cooperativo (Sprints 5+).

---

## 4. Tipos de prueba y su importancia

### 4.1 Pruebas Unitarias

**Importancia.** Garantizan que cada componente individual funcione correctamente desde el principio. Permiten detectar y corregir errores en las primeras etapas del desarrollo, reduciendo el costo de corrección y asegurando que la lógica de negocio aislada (validaciones, reglas, hashing, firmas) sea confiable antes de integrarse.

**Aplicación al proyecto.**
- Validar formato de credencial (`VotanteService.verificarFormatoCredencial`).
- Validar generación y consumo de token anónimo.
- Validar reglas de negocio de `VotoService` (token válido, elección abierta, candidato en rango, anti doble voto).
- Validar funciones puras de hashing/cifrado.

### 4.2 Pruebas de Integración

**Importancia.** Verifican que los diferentes módulos del sistema interactúen correctamente entre sí, asegurando que el sistema funcione como un todo coherente. En este proyecto son clave porque la arquitectura está distribuida: frontend ⇄ backend ⇄ contratos on-chain ⇄ base de datos.

**Aplicación al proyecto.**
- API HTTP Express responde correctamente a los endpoints clave.
- Backend invoca correctamente al `BlockchainService`.
- Backend persiste sesiones y logs de auditoría en Prisma/SQLite.
- Frontend consume los proxies `/api/auth/*` y `/api/voto/*`.

### 4.3 Pruebas de Regresión

**Importancia.** Aseguran que los cambios realizados en el sistema no introduzcan errores en las partes previamente verificadas, manteniendo la estabilidad del sistema a lo largo de sprints sucesivos.

**Aplicación al proyecto.**
- Matriz formal de casos críticos que debe pasar en cada checkpoint.
- Registro histórico de ejecuciones con fecha, commit y resultado.
- Ejecución automatizable mediante `yarn test` en backend y contratos.

### 4.4 Pruebas de Usabilidad

**Importancia.** Son esenciales porque el proyecto tiene una interfaz de usuario crítica para ciudadanía. Un sistema técnicamente sólido pero difícil de usar puede fracasar incluso si cumple sus requisitos funcionales.

**Aplicación al proyecto.**
- Protocolo estructurado con tareas, métricas y criterios de aceptación.
- Guión del moderador para asegurar reproducibilidad.
- Registro cuantitativo por participante (éxito, tiempo, errores, satisfacción).

---

## 5. Matriz de trazabilidad requisito → prueba

| Req. Funcional | Descripción | Tipo de prueba | Caso/ID |
|---|---|---|---|
| RF-01 | Validar credencial antes de emitir token | Unitaria | PU-01, PU-02, PU-03, PU-04 |
| RF-02 | Emitir token anónimo de un solo uso | Unitaria + Integración | PU-05, PI-01 |
| RF-03 | Verificar que elección esté abierta | Unitaria | PU-06 |
| RF-04 | Impedir doble voto por nullifier | Unitaria + Contrato | PU-07, PC-03 |
| RF-05 | Registrar boleta en blockchain | Integración + Contrato | PI-02, PC-02 |
| RF-06 | Consultar boletas registradas | Integración | PI-03 |
| RF-07 | UI de autenticación renderiza y envía datos | Frontend | PF-01 |
| RF-08 | UI de boleta permite seleccionar y emitir voto | Frontend | PF-02 |
| RF-09 | Explorador muestra boletas on-chain | Frontend + Integración | PF-03, PI-03 |
| RF-10 | Usuario completa el flujo en tiempo razonable | Usabilidad | UX-01..UX-04 |
| RF-11 | Verificar comprobante on-chain por txHash | Unitaria + Integración + E2E | PU-12, PU-13, PI-05..PI-08, PE-07..PE-09 |

---

## 6. Casos de prueba

### 6.1 Pruebas unitarias (backend)

| ID | Descripción | Resultado esperado |
|---|---|---|
| PU-01 | Credencial válida pasa verificación | `valida=true` |
| PU-02 | Padrón con formato incorrecto | `valida=false`, motivo padrón |
| PU-03 | CI con formato incorrecto | `valida=false`, motivo CI |
| PU-04 | Nombre demasiado corto | `valida=false`, motivo nombre |
| PU-05 | `validarToken` rechaza token < 32 chars | `valido=false` |
| PU-06 | `VotoService.emitirVoto` rechaza si elección cerrada | lanza error "elección está cerrada" |
| PU-07 | `VotoService.emitirVoto` rechaza candidato fuera de rango | lanza error "fuera de rango" |
| PU-08 | `VotoService.emitirVoto` rechaza nullifier ya usado | lanza error "doble voto" |
| PU-12 | `VotoService.verificarComprobante` retorna datos cuando txHash existe | objeto con `estado: "registrado"`, `boletaId`, `blockNumber` |
| PU-13 | `VotoService.verificarComprobante` retorna null cuando no encontrado | `null` |

### 6.2 Pruebas de integración

| ID | Descripción | Resultado esperado |
|---|---|---|
| PI-01 | `GET /health` retorna estado ok | 200, `status=ok` |
| PI-02 | `POST /api/auth/verificar-elegibilidad` (mock servicio) emite token | 200, token 64 chars |
| PI-03 | `POST /api/auth/verificar-elegibilidad` con error de negocio | 400, mensaje explícito |
| PI-04 | `GET` a ruta inexistente | 404, error "Ruta no encontrada" |
| PI-05 | `GET /api/voto/comprobante` sin txHash | 400, error "txHash requerido" |
| PI-06 | `GET /api/voto/comprobante` con formato inválido | 400, error "Formato de txHash inválido" |
| PI-07 | `GET /api/voto/comprobante` con txHash no existente | 404, error "no encontrada" |
| PI-08 | `GET /api/voto/comprobante` con txHash válido | 200, objeto con `estado`, `boletaId`, `blockNumber` |

### 6.3 Pruebas de contratos (Hardhat + Chai)

| ID | Descripción | Resultado esperado |
|---|---|---|
| PC-01 | `AdminParams` guarda candidatos y cierra configuración | lectura coincide con escritura |
| PC-02 | `BulletinBoard.registrarBoleta` almacena boleta con nullifier | total incrementa, datos coinciden |
| PC-03 | `NullifierSet` impide reusar nullifier | revierte con error |
| PC-04 | `BulletinBoard.eleccionAbierta` responde true/false según estado | lectura consistente |

### 6.4 Pruebas de frontend (Vitest + Testing Library)

| ID | Descripción | Resultado esperado |
|---|---|---|
| PF-01 | `/verificar` renderiza formulario y valida inputs | muestra campos, botón enabled |
| PF-02 | `/votar` muestra candidatos y permite selección | un item activo a la vez |
| PF-03 | `/explorer` consulta API y renderiza filas | tabla con N boletas |
| PF-04 | `/comprobar` renderiza formulario e info cards en estado idle | formulario visible, 3 tarjetas informativas |

### 6.5 Pruebas E2E (Playwright)

| ID | Descripción | Resultado esperado |
|---|---|---|
| PE-01 | Landing muestra branding, hero y CTA | título, botón "Iniciar votación", 3 tarjetas de valor |
| PE-02 | Botones de landing apuntan a rutas correctas | href `/verificar` y `/explorer` |
| PE-03 | Verificar — credencial inválida muestra error | mensaje de error visible, permanece en `/verificar` |
| PE-04 | Verificar — credencial válida persiste token en localStorage | token y sessionId guardados |
| PE-05 | Votar — selecciona candidato y emite voto | mensaje "Voto emitido exitosamente" visible |
| PE-06 | Explorer — muestra boletas registradas | tabla con 2 boletas mock |
| PE-07 | /comprobar — renderiza formulario e info cards en estado idle | heading, input y tarjetas visibles |
| PE-08 | /comprobar — txHash no encontrado muestra estado 404 | heading "Boleta no encontrada" |
| PE-09 | /comprobar — txHash válido muestra comprobante registrado | heading "Voto verificado", boletaId y blockNumber |

### 6.6 Pruebas de regresión

Definidas en `MATRIZ_REGRESION.md` (REG-001 a REG-008). Se ejecutan antes de cada checkpoint.

### 6.7 Pruebas de usabilidad

Definidas en `PROTOCOLO_USABILIDAD.md`. Mínimo 3 participantes reales antes de defensa.

---

## 7. Criterios de aceptación

| Dimensión | Objetivo mínimo |
|---|---|
| Cobertura unitaria (`VotanteService`) | ≥ 70% |
| Cobertura unitaria (`VotoService`) | ≥ 70% |
| Tests de integración | 100% del endpoint público cubierto |
| Tests de contratos | 1 test funcional por contrato |
| Regresión por checkpoint | 100% de casos críticos verdes |
| Usabilidad | ≥ 80% de éxito en flujo, tiempo medio ≤ 3 min, satisfacción ≥ 4/5 |

---

## 8. Herramientas utilizadas

| Capa | Herramienta |
|---|---|
| Backend | Vitest + Supertest |
| Contratos | Hardhat + Chai + hardhat-chai-matchers |
| Frontend | Vitest + @testing-library/react |
| Cobertura | `@vitest/coverage-v8`, `solidity-coverage` |
| E2E | Playwright (pruebas PE-01..PE-09) |
| Usabilidad | Protocolo presencial + CSV |

---

## 9. Ejecución local de pruebas

Desde `votacion-tesis`:

```bash
yarn install

# Backend
yarn workspace @votacion/backend test
yarn workspace @votacion/backend test:coverage

# Contratos
yarn workspace @votacion/hardhat test

# Frontend
yarn workspace @votacion/nextjs test

# Ejecutar todo y generar reporte
node scripts/testing/run-all-tests.mjs
```

---

## 10. Reporte de resultados

Cada ejecución completa produce un archivo fechado bajo:

```
docs/testing/resultados/RESULTADO_<YYYY-MM-DD>.md
```

Ese archivo contiene:

- Commit evaluado.
- Resumen de tests pasados/fallidos por capa.
- Cobertura total y por módulo.
- Observaciones y acciones correctivas.

---

## 11. Criterio de avance por checkpoint

No se cerrará un checkpoint sin:

- Pruebas unitarias backend en verde.
- Pruebas de integración API en verde.
- Pruebas de contratos en verde.
- Pruebas de frontend en verde (al menos smoke por página).
- Matriz de regresión actualizada.
- Protocolo de usabilidad ejecutado al menos 1 vez antes de la defensa final.
