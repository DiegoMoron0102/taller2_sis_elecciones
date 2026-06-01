# Matriz de Regresión Funcional

**Proyecto:** Sistema de Votación Electrónica Descentralizada Verificable  
**Autor:** Diego Morón Mejía — UCB San Pablo

## Objetivo
Asegurar que los cambios no rompan funcionalidades previamente validadas del sistema de votación.

## Frecuencia
- Ejecutar antes de cada `checkpoint`.
- Ejecutar después de cambios en backend, contratos o flujo UI de votación.
- Comando: `node scripts/testing/run-all-tests.mjs`

---

## Casos de regresión

| ID | Capa | Flujo | Precondición | Resultado esperado | Automatizado |
|---|---|---|---|---|---|
| REG-001 | Backend integración | Health backend | Backend levantado | `GET /health` → 200, `status=ok` | ✅ PI-01 |
| REG-002 | Backend integración | Verificación elegibilidad (mock) | Servicio disponible | `POST /api/auth/verificar-elegibilidad` → 200 con token | ✅ PI-02 |
| REG-003 | Backend integración | Error negocio → 400 | Servicio falla | Respuesta 400 con mensaje explícito | ✅ PI-03 |
| REG-004 | Backend integración | 404 en ruta no existente | Cualquier ruta inválida | Responde 404 | ✅ PI-04 |
| REG-005 | Unitaria backend | Credencial válida | Datos correctos | `verificarFormatoCredencial` → `valida=true` | ✅ PU-01 |
| REG-006 | Unitaria backend | Padrón inválido | Formato incorrecto | Rechaza con motivo | ✅ PU-02 |
| REG-007 | Unitaria backend | Elección cerrada → rechaza | `eleccionAbierta=false` | Lanza error "cerrada" | ✅ PU-07 |
| REG-008 | Unitaria backend | Doble voto → rechaza | Nullifier ya usado | Lanza error "doble voto" | ✅ PU-09 |
| REG-009 | Unitaria backend | Candidato fuera de rango | candidatoId ≥ total candidatos | Lanza error "fuera de rango" | ✅ PU-08 |
| REG-010 | Unitaria backend | Voto exitoso E2E | Todo válido | Devuelve tx hash y comprobante | ✅ PU-10 |
| REG-011 | Contrato | AdminParams guarda candidatos | Deploy exitoso | Lectura == escritura | ✅ PC-01 |
| REG-012 | Contrato | BulletinBoard registra boleta | Elección abierta + nullifier elegible | Total boletas incrementa | ✅ PC-02 |
| REG-013 | Contrato | NullifierSet impide doble voto | Nullifier ya usado | Revierte con `NullifierYaUsado` | ✅ PC-03 |
| REG-014 | Contrato | Estado elección open/closed | Admin llama apertura/cierre | `eleccionAbierta` refleja correctamente | ✅ PC-04 |
| REG-015 | Contrato | Boleta rechazada sin nullifier elegible | Nullifier no registrado | Revierte con `NullifierNoElegible` | ✅ PC-05 |
| REG-016 | Frontend | VotingShell muestra marca | Componente cargado | "VotoSeguro" visible en header | ✅ PF-00 |
| REG-017 | Frontend | ProgressStepper muestra paso | Props recibidos | "Paso X de Y" correcto | ✅ PF-00b |
| REG-018 | Frontend | Verificar — textarea VC visible por defecto | Página cargada | Textarea JSON + botón habilitado (modo vc) | ✅ PF-01 |
| REG-019 | Frontend | Verificar — error en pantalla | API falla | Mensaje de error visible | ✅ PF-01 |
| REG-020 | Frontend | Verificar — redirige on success | API devuelve token | `router.push("/votar")` llamado | ✅ PF-01 |
| REG-021 | Frontend | Votar — candidatos visibles | Elección abierta | Lista de candidatos renderizada | ✅ PF-02 |
| REG-022 | Frontend | Votar — botón deshabilitado | Elección cerrada | Botón "Emitir voto" deshabilitado | ✅ PF-02 |
| REG-023 | Frontend | Votar — confirmación on success | Candidato seleccionado + token | Panel de confirmación visible | ✅ PF-02 |
| REG-024 | Frontend | Explorer — vacío cuando sin boletas | API devuelve `[]` | Texto "no hay boletas" visible | ✅ PF-03 |
| REG-025 | Frontend | Explorer — tabla con filas | API devuelve boletas | Filas = N boletas + 1 header | ✅ PF-03 |
| REG-026 | Contrato | Escrutinio habilita conteo + evento | Deploy + admin | `conteoHabilitado=true`, evento emitido | ✅ PC-06 |
| REG-027 | Contrato | Escrutinio rechaza doble habilitación | Conteo ya habilitado | Revierte con `ConteoYaHabilitado` | ✅ PC-07 |
| REG-028 | Contrato | Escrutinio publica resultados y los devuelve | Conteo habilitado | Suma correcta y hash evidencias guardado | ✅ PC-08 |
| REG-029 | Contrato | Escrutinio impide doble publicación | Resultados ya publicados | Revierte con `ResultadosYaPublicados` | ✅ PC-09 |
| REG-081 | Contrato | resetearJornada permite nueva jornada | Resultados publicados → reset | `conteoHabilitado=false`, nueva pub posible | ✅ PC-10 |
| REG-082 | Contrato | resetearJornada incrementa contador | Llamadas sucesivas | `numeroJornada` sube en 1 por llamada | ✅ PC-11 |
| REG-083 | Backend integración | POST /api/admin/escrutinio/resetear retorna 200 | Service mock OK | `numeroJornada` y `txHash` en respuesta | ✅ PE-reset-01 |
| REG-084 | Backend integración | POST /api/admin/escrutinio/resetear retorna 401 sin token | Sin Authorization | 401 | ✅ PE-reset-02 |
| REG-085 | Backend integración | POST /api/admin/escrutinio/resetear retorna 400 si falla | Service lanza error | 400 con mensaje | ✅ PE-reset-03 |
| REG-030 | Backend unitario | Admin login válido → retorna JWT | Admin existe, password correcta | Token + nombre + email en respuesta | ✅ PA-admin-01 |
| REG-031 | Backend unitario | Admin login inválido → rechaza | Password incorrecta o admin inexistente | Lanza "Credenciales inválidas" | ✅ PA-admin-02 |
| REG-032 | Backend integración | JWT middleware protege rutas admin | Sin Authorization header | 401 con mensaje explícito | ✅ PA-04 |
| REG-033 | Backend integración | JWT inválido → 401 | Token basura o expirado | `requireAdmin` rechaza con 401 | ✅ PA-05 |
| REG-034 | Backend integración | Admin login endpoint público | Credenciales válidas (mock) | 200 con token JWT | ✅ PA-01 |
| REG-035 | Backend unitario | agregarCandidato asigna índice correcto | Sin candidatos previos / con candidatos | índice = 0 o último+1 | ✅ PA-admin-07 |
| REG-036 | Backend unitario | agregarVotanteElegible limpia credencial previa | Padrón con CredencialEmitida stale | deleteMany ejecutado antes de create | ✅ PA-admin-08 |
| REG-037 | Backend unitario | agregarVotanteElegible rechaza duplicado | Padrón ya en VotanteElegible | Lanza "ya está registrado" | ✅ PA-admin-09 |
| REG-038 | Backend unitario | emitirTokenAnonimo revoca token no usado | CredencialEmitida existe, sesión no usada | Revoca sesión antigua, emite nueva | ✅ PU-votante-re-emit |
| REG-039 | Backend unitario | emitirTokenAnonimo bloquea si ya votó | SesionVotante.usado=true | Lanza "ya emitió su voto" | ✅ PU-votante-block |
| REG-040 | Backend unitario | estadoEleccion lee candidatos desde SQLite | Candidatos en Prisma, no en contrato | candidatos[] = filas de Candidato | ✅ PU-11 |
| REG-041 | Backend integración | GET /api/admin/candidatos con JWT válido | Candidatos en BD | 200 con lista de candidatos | ✅ PA-07 |
| REG-042 | Backend integración | POST /api/admin/padron agrega votante | Padrón no existe | 201 con datos del votante | ✅ PA-11 |
| REG-043 | E2E | Landing muestra branding VotoSeguro | Dev server activo | "VotoSeguro" visible + CTAs presentes | ✅ PE-01 |
| REG-044 | E2E | Verificar credencial inválida → error UI | Campos con formato incorrecto | Mensaje de error en pantalla | ✅ PE-03 |
| REG-045 | E2E | Verificar válida → token en localStorage | Padrón elegible en backend | Token persistido + redirección a /votar | ✅ PE-04 |
| REG-046 | E2E | Votar → seleccionar candidato y emitir | Token válido + elección abierta | Panel de confirmación con txHash | ✅ PE-05 |
| REG-047 | E2E | Explorer muestra boletas on-chain | Al menos 1 boleta registrada | Tabla con fila de boleta | ✅ PE-06 |
| REG-048 | E2E | /comprobar con txHash no existente | txHash inválido | Estado "no encontrado" visible | ✅ PE-08 |
| REG-049 | Unitaria backend | Shamir: reconstrucción con N shares completa | secreto aleatorio | secreto reconstruido == original | ✅ escrutinioService:sha1 |
| REG-050 | Unitaria backend | Shamir: reconstrucción con exactamente umbral shares | M de N compartimentos | secreto reconstruido == original | ✅ escrutinioService:sha2 |
| REG-051 | Unitaria backend | Shamir: compartimentos incorrectos NO reconstruyen | shares de dos secretos mezclados | resultado ≠ secreto original | ✅ escrutinioService:sha4 |
| REG-052 | Unitaria backend | inicializarShares crea N archivos en disco | directorio vacío | N compartimentos + config.json creados | ✅ escrutinioService:init2 |
| REG-053 | Unitaria backend | inicializarShares lanza si ya inicializado | config.json existe | Error "ya fueron inicializados" | ✅ escrutinioService:init1 |
| REG-054 | Unitaria backend | round-trip Shamir con archivos reales | inicializarShares + reconstruirSecreto | hash verificación == hashSecreto guardado | ✅ escrutinioService:init3 |
| REG-055 | Unitaria backend | ejecutarEscrutinio rechaza sin conteo habilitado | conteoHabilitado=false | Lanza "no está habilitado" | ✅ escrutinioService:exec1 |
| REG-056 | Unitaria backend | ejecutarEscrutinio rechaza si ya publicado | resultadosPublicados=true | Lanza "ya fueron publicados" | ✅ escrutinioService:exec2 |
| REG-057 | Unitaria backend | ejecutarEscrutinio rechaza con < umbral shares | 2 shares, umbral 3 | Lanza "al menos 3 compartimentos" | ✅ escrutinioService:exec3 |
| REG-058 | Backend integración | GET /api/admin/escrutinio/estado con token válido | Token JWT admin | 200 con campos inicializado, conteoHabilitado, resultadosPublicados | ✅ PE-01 |
| REG-059 | Backend integración | GET /api/admin/escrutinio/estado sin token | Sin Authorization | 401 | ✅ PE-02 |
| REG-060 | Backend integración | POST /api/admin/escrutinio/inicializar retorna compartimentos | Service mock OK | 200 con indicesDisponibles[5] | ✅ PE-03 |
| REG-061 | Backend integración | POST /api/admin/escrutinio/inicializar retorna 400 si ya existe | Service lanza error | 400 con mensaje | ✅ PE-04 |
| REG-062 | Backend integración | POST /api/admin/escrutinio/ejecutar retorna 400 con < umbral | 2 shares enviadas | 400 validación Zod | ✅ PE-05 |
| REG-063 | Backend integración | POST /api/admin/escrutinio/ejecutar retorna 400 en error de servicio | Service lanza error | 400 con mensaje | ✅ PE-06 |
| REG-064 | Backend integración | GET /api/voto/resultados retorna publicado=false cuando no publicado | Service retorna null | 200 con publicado=false | ✅ PE-07 |
| REG-065 | Backend integración | GET /api/voto/resultados retorna datos cuando publicado | Service retorna resultados | 200 con totalVotos y candidatos[] | ✅ PE-07b |
| REG-066 | Unitaria backend | vcAuthority emite VC con firma ECDSA válida | VC_AUTHORITY_PRIVATE_KEY configurada | proofValue 128 hex chars, verificarVC=true | ✅ vcAuthority:emit1 |
| REG-067 | Unitaria backend | vcAuthority rechaza VC con proof alterado | proofValue modificado | verificarVC retorna false | ✅ vcAuthority:tamper1 |
| REG-068 | Unitaria backend | vcAuthority rechaza si nombre o padrón modificados | Campo credentialSubject alterado | verificarVC retorna false | ✅ vcAuthority:tamper2 |
| REG-069 | Unitaria backend | vcAuthority es determinista con la misma issuanceDate | Misma fecha, mismos campos | proofValues idénticos | ✅ vcAuthority:deterministic |
| REG-070 | Unitaria backend | ElGamal cifra voto candidato 0 de 3: descifra [1,0,0] | clave pública válida | conteos == [1,0,0] | ✅ elgamal:dec1 |
| REG-071 | Unitaria backend | ElGamal suma homomórfica 2+1 votos candidatos 0 y 1 | 3 votos en 2 candidatos | conteos == [2,1] | ✅ elgamal:homo1 |
| REG-072 | Unitaria backend | ElGamal con clave incorrecta no descifra (lanza excepción) | SK distinto del de cifrado | Error al descifrar | ✅ elgamal:wrongkey |
| REG-073 | Unitaria backend | Schnorr prueba generada verifica correctamente | token y mensaje válidos | verificarSchnorr=true | ✅ schnorr:ok1 |
| REG-074 | Unitaria backend | Schnorr falla con mensaje diferente | prueba con mensaje A, verificar con B | false | ✅ schnorr:fail1 |
| REG-075 | Unitaria backend | Schnorr falla con s alterado | s='00'*32 | false | ✅ schnorr:fail2 |
| REG-076 | Unitaria backend | Schnorr falla con tokenPoint incorrecto | punto de otro token | false | ✅ schnorr:fail3 |
| REG-077 | Backend integración | POST /api/auth/verificar-elegibilidad acepta VC ECDSA real | VC firmada con clave de prueba | 200 con token | ✅ PS6-01 |
| REG-078 | Backend integración | POST /api/auth/verificar-elegibilidad acepta formato legado | {numeroPadron, nombre, ci} sin VC | 200 con token | ✅ PS6-02 |
| REG-079 | Backend integración | POST /api/voto/emitir acepta schnorrProof en body | schnorrProof presente | 200 emite voto | ✅ PS6-03 |
| REG-080 | Backend integración | POST /api/admin/padron retorna VC en respuesta | VC_AUTHORITY_PRIVATE_KEY configurada | vc.type contiene CredencialElectoral | ✅ PA-11 |
| REG-086 | Unitaria backend | emitirVCCustodio genera VC con tipo y firma ECDSA | clave configurada, custodio válido | type=CredencialCustodio, proofValue 128 hex | ✅ REG-086 |
| REG-087 | Unitaria backend | verificarVCCustodio acepta VC válida y rechaza alterada | proof/nombre/índice modificado | true / false según integridad | ✅ REG-087 |
| REG-088 | Unitaria backend | verificarVCCustodio rechaza si nombre o índice alterado | credentialSubject modificado | false | ✅ REG-088 |
| REG-089 | Unitaria backend | emitirVCCustodio es determinista con misma issuanceDate | misma fecha y datos | proofValue idéntico en ambas llamadas | ✅ REG-089 |

---

## Registro de ejecución

| Fecha | Commit | Backend | Contratos | Frontend | E2E | Cobertura backend | Casos REG OK |
|---|---|---|---|---|---|---|---|
| 2026-04-27 | ver `RESULTADO_2026-04-27.md` | 18/18 | 5/5 | 26/26 | — | sin medir | 25/25 |
| 2026-04-30 | ver `RESULTADO_2026-04-30.md` | **27/27** | **10/10** | 26/26 | — | services 71.37%, votoService 91.56%, votanteService 100% | **29/29** |
| 2026-05-07 | ver `RESULTADO_2026-05-07.md` | **62/62** | **10/10** | 26/26 | **9/9** | votanteService 97.75%, votoService 90.21%, adminService 55.5% | **48/48** |
| 2026-05-10 | Sprint 5 Escrutinio | **86/86** | **10/10** | 26/26 | — | escrutinioService nuevo | **65/65** |
| 2026-05-10 | Sprint 6 Cripto real | **113/113** | **10/10** | 26/26 | — | vcAuthority+elgamal+schnorr nuevos | **80/80** |
| 2026-05-10 | Sprint 6 E2E+Frontend fix | **113/113** | **10/10** | **27/27** | — | modo VC default en /verificar | **81/81** |
| 2026-05-10 | resetearJornada multi-elección | **116/116** | **12/12** | **27/27** | — | resetearEscrutinio + PC-10/PC-11 nuevos | **86/86** |
| 2026-05-10 | Sprint 7 custodia distribuida | **122/122** | **12/12** | **27/27** | — | CredencialCustodio + aportarCompartimento | **90/90** |
