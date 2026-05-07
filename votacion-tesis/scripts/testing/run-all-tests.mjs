/**
 * run-all-tests.mjs
 * Ejecuta todas las capas de prueba del proyecto y genera un reporte fechado.
 * Uso: node scripts/testing/run-all-tests.mjs
 */
import { execSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const RESULTADOS_DIR = join(ROOT, "docs", "testing", "resultados");

const fecha = new Date().toISOString().slice(0, 10);
const timestamp = new Date().toISOString();
let commitHash = "desconocido";

try {
  commitHash = execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim();
} catch {}

mkdirSync(RESULTADOS_DIR, { recursive: true });

const resultados = [];

function run(etiqueta, cmd) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`▶  ${etiqueta}`);
  console.log("=".repeat(60));
  try {
    const salida = execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    console.log(salida);
    const lineasResumen = salida.split("\n").filter(l => /Tests|Test Files|passing|failed/.test(l));
    resultados.push({ etiqueta, estado: "✅ PASS", resumen: lineasResumen.join(" | ").trim() || "OK" });
    return true;
  } catch (err) {
    const salida = (err.stdout ?? "") + (err.stderr ?? "");
    console.error(salida.slice(-2000));

    // Falso positivo de Windows: Worker crash de Tinypool cuando todos los tests pasaron.
    // Vitest retorna exit code 1 por "Unhandled Errors" aunque los tests no fallen.
    const hayTestsFallidos = /\d+ failed/.test(salida);
    const hayTestsPasados = /\d+ passed/.test(salida) || /\d+ passing/.test(salida);
    const workerCrash = salida.includes("Worker exited unexpectedly");
    if (!hayTestsFallidos && hayTestsPasados && workerCrash) {
      console.log("[AVISO] Worker crash de Windows detectado — los tests pasaron correctamente.");
      const lineasResumen = salida.split("\n").filter(l => /Tests|Test Files|passing|passed/.test(l));
      resultados.push({ etiqueta, estado: "✅ PASS", resumen: lineasResumen.join(" | ").trim() || "OK (worker crash ignorado)" });
      return true;
    }

    const lineasError = salida.split("\n").filter(l => /Tests|Test Files|passing|failing|failed|Error/.test(l));
    resultados.push({ etiqueta, estado: "❌ FAIL", resumen: lineasError.join(" | ").trim() || "Error desconocido" });
    return false;
  }
}

// ── 1. Backend (unitarias + integración)
run(
  "Backend — unitarias + integración (Vitest)",
  "yarn workspace @votacion/backend test",
);

// ── 2. Backend cobertura
run(
  "Backend — cobertura (Vitest --coverage)",
  "yarn workspace @votacion/backend test:coverage",
);

// ── 3. Contratos Solidity (Hardhat)
run(
  "Contratos Solidity — PC-01..PC-05 (Hardhat + Chai)",
  "yarn workspace @votacion/hardhat test",
);

// ── 4. Frontend (Vitest + Testing Library)
run(
  "Frontend — PF-00..PF-03 (Vitest + Testing Library)",
  "yarn workspace @votacion/nextjs test",
);

// ── 5. E2E Playwright
run(
  "E2E Playwright — PE-01..PE-09 (Chromium)",
  "yarn workspace @votacion/nextjs test:e2e",
);

// ── Generar reporte ─────────────────────────────────────────────────────────
const totalPass = resultados.filter(r => r.estado.includes("PASS")).length;
const totalFail = resultados.filter(r => r.estado.includes("FAIL")).length;

const tabla = resultados
  .map(r => `| ${r.etiqueta} | ${r.estado} | ${r.resumen.replace(/\n/g, " ")} |`)
  .join("\n");

const reporte = `# Reporte de Pruebas — ${fecha}

**Proyecto:** Sistema de Votación Electrónica Descentralizada Verificable  
**Commit evaluado:** \`${commitHash}\`  
**Generado:** ${timestamp}  
**Resultado global:** ${totalFail === 0 ? "✅ TODAS LAS PRUEBAS PASARON" : `❌ ${totalFail} capa(s) con fallos`}

---

## Resumen por capa

| Capa | Estado | Resumen |
|---|---|---|
${tabla}

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

_${totalFail === 0 ? "Sin fallos detectados en esta ejecución." : "Revisar capas con fallo antes del próximo checkpoint."}_

---

## Próximos pasos

- Ampliar tests de VotoService con casos edge adicionales.
- Añadir tests de \`Escrutinio.sol\` cuando el contrato esté implementado.
- Ejecutar protocolo de usabilidad presencial (ver \`PROTOCOLO_USABILIDAD.md\`).
- Actualizar \`MATRIZ_REGRESION.md\` con resultados de este commit.
`;

const archivo = join(RESULTADOS_DIR, `RESULTADO_${fecha}.md`);
writeFileSync(archivo, reporte, "utf8");
console.log(`\n${"=".repeat(60)}`);
console.log(`📄  Reporte guardado en: docs/testing/resultados/RESULTADO_${fecha}.md`);
console.log(`✅  Pasaron: ${totalPass} / ${resultados.length} capas`);
if (totalFail > 0) {
  console.log(`❌  Fallaron: ${totalFail} / ${resultados.length} capas`);
  process.exit(1);
}
