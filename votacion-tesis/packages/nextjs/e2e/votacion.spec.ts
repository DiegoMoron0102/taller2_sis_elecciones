import { test, expect, Page } from "@playwright/test";

/**
 * Pruebas E2E de VotoSeguro (PE-01..PE-06).
 * Mockean las rutas /api/* del propio Next para no requerir backend Express ni Hardhat.
 * Ejercitan el flujo real del usuario: landing → /verificar → /votar → /explorer.
 */

const TOKEN_FAKE = "a".repeat(64);
const SESSION_FAKE = "sess-e2e-001";

const ESTADO_ABIERTO = {
  abierta: true,
  candidatos: ["Ana Mamani - Partido A", "Carlos Quispe - Partido B", "Luis Flores - Partido C"],
  totalBoletas: 0,
  timestamp: new Date().toISOString(),
};

const RESPUESTA_VOTO = {
  mensaje: "Voto emitido exitosamente",
  boleta: {
    votoCifrado: "0xvotocifrado",
    pruebaZK: "0xprueba",
    nullifier: "0xnullifier-e2e",
  },
  transaccion: { hash: "0xtxhash-e2e", bloque: 100 },
  hashComprobante: "0xcomprobantee2e",
  timestamp: new Date().toISOString(),
};

const BOLETAS_MOCK = [
  { nullifier: "0xaabbcc11223344556677", votoCifrado: "0xvoto001abc", bloque: 100 },
  { nullifier: "0xddeeff8899aabbccddee", votoCifrado: "0xvoto002def", bloque: 101 },
];

const TX_HASH_VALIDO = "0x" + "a".repeat(64);

const COMPROBANTE_MOCK = {
  txHash: TX_HASH_VALIDO,
  blockNumber: 10,
  boletaId: 0,
  nullifier: "0x" + "b".repeat(64),
  timestamp: 1700000000,
  estado: "registrado",
};

/** Espera a que la página esté cargada e hidratada por React. */
async function gotoReady(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  // Pequeño margen para que React 19 termine de hidratar handlers
  await page.waitForTimeout(800);
}

async function setupMocks(page: Page) {
  await page.route("**/api/auth/verificar-elegibilidad", async route => {
    const body = route.request().postDataJSON();
    if (body?.numeroPadron === "LP000000") {
      await route.fulfill({ status: 400, json: { mensaje: "Credencial no encontrada" } });
      return;
    }
    await route.fulfill({
      status: 200,
      json: { token: TOKEN_FAKE, sessionId: SESSION_FAKE, expiresIn: 3600 },
    });
  });

  await page.route("**/api/voto/estado-eleccion", async route => {
    await route.fulfill({ status: 200, json: ESTADO_ABIERTO });
  });

  await page.route("**/api/voto/emitir", async route => {
    await route.fulfill({ status: 200, json: RESPUESTA_VOTO });
  });

  await page.route("**/api/voto/boletas", async route => {
    await route.fulfill({ status: 200, json: { boletas: BOLETAS_MOCK } });
  });

  await page.route(`**/api/voto/comprobante**`, async route => {
    const url = new URL(route.request().url());
    const txHash = url.searchParams.get("txHash");
    if (txHash === TX_HASH_VALIDO) {
      await route.fulfill({ status: 200, json: COMPROBANTE_MOCK });
    } else {
      await route.fulfill({ status: 404, json: { error: "Transacción no encontrada o no corresponde a una boleta" } });
    }
  });
}

test.describe("VotoSeguro — Flujo E2E (PE-01..PE-06)", () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
  });

  test("PE-01: Landing muestra branding, hero y CTA de votación", async ({ page }) => {
    await gotoReady(page, "/");

    await expect(page.getByRole("heading", { name: /Sistema de Votación Descentralizada/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Iniciar votación/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Explorador público/i })).toBeVisible();

    // Tres tarjetas de valor (h3 dentro de cada article)
    await expect(page.getByRole("heading", { level: 3, name: "Identidad Verificable" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Voto Anónimo Cifrado" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: "Auditoría Universal" })).toBeVisible();
  });

  test("PE-02: Botones de la landing apuntan a las rutas correctas", async ({ page }) => {
    await gotoReady(page, "/");
    const cta = page.getByRole("link", { name: /Iniciar votación/i });
    const explorerLink = page.getByRole("link", { name: /Explorador público/i });

    await expect(cta).toHaveAttribute("href", "/verificar");
    await expect(explorerLink).toHaveAttribute("href", "/explorer");
  });

  test("PE-03: Verificar — credencial inválida muestra error en pantalla", async ({ page }) => {
    await gotoReady(page, "/verificar");

    await page.getByPlaceholder("LP123456").fill("LP000000");
    await page.getByPlaceholder("Juan Pérez").fill("Juan Test");
    await page.getByPlaceholder("12345678L").fill("12345678L");
    await page.getByRole("button", { name: /Autenticar credencial digital/i }).click();

    await expect(page.getByText(/Credencial no encontrada/i)).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/verificar$/);
  });

  test("PE-04: Verificar — credencial válida emite token y persiste en localStorage", async ({ page }) => {
    await gotoReady(page, "/verificar");

    await page.getByPlaceholder("LP123456").fill("LP123456");
    await page.getByPlaceholder("Juan Pérez").fill("Juan Lopez");
    await page.getByPlaceholder("12345678L").fill("12345678L");
    await page.getByRole("button", { name: /Autenticar credencial digital/i }).click();

    // Esperar a que el flujo de auth deposite el token en localStorage
    await page.waitForFunction(() => localStorage.getItem("votingToken") !== null, null, {
      timeout: 15000,
    });

    const token = await page.evaluate(() => localStorage.getItem("votingToken"));
    const sid = await page.evaluate(() => localStorage.getItem("votingSessionId"));
    expect(token).toBe(TOKEN_FAKE);
    expect(sid).toBe(SESSION_FAKE);
  });

  test("PE-05: Votar — selecciona candidato y emite voto exitosamente", async ({ page }) => {
    // Pre-cargar token en localStorage (como si ya hubiera autenticado)
    await gotoReady(page, "/");
    await page.evaluate(
      ({ token, sid }) => {
        localStorage.setItem("votingToken", token);
        localStorage.setItem("votingSessionId", sid);
      },
      { token: TOKEN_FAKE, sid: SESSION_FAKE },
    );

    await gotoReady(page, "/votar");

    // Esperar a que carguen los candidatos
    await expect(page.getByText("Ana Mamani").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Carlos Quispe").first()).toBeVisible();
    await expect(page.getByText("Luis Flores").first()).toBeVisible();

    // Seleccionar a Ana
    await page.getByText("Ana Mamani").first().click();

    // Emitir voto
    await page.getByRole("button", { name: /Emitir voto/i }).click();

    // Confirmación visible
    await expect(page.getByText(/Voto emitido exitosamente/i)).toBeVisible({ timeout: 10000 });
  });

  test("PE-06: Explorer — muestra boletas registradas on-chain", async ({ page }) => {
    await gotoReady(page, "/explorer");

    await expect(page.getByRole("heading", { name: /Explorador/i }).first()).toBeVisible();
    await expect(page.getByText(/Total de boletas:\s*2/i)).toBeVisible({ timeout: 10000 });

    // Las dos boletas mock: nullifier abreviado debe aparecer
    await expect(page.getByText(/0xaabbcc/i).first()).toBeVisible();
    await expect(page.getByText(/0xddeeff/i).first()).toBeVisible();
  });
});

test.describe("VotoSeguro — Verificación de comprobante (PE-07..PE-09)", () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
  });

  test("PE-07: /comprobar renderiza formulario y tarjetas informativas en estado idle", async ({ page }) => {
    await gotoReady(page, "/comprobar");

    await expect(page.getByRole("heading", { name: /¿Llegó tu voto\?/i })).toBeVisible();
    await expect(page.getByLabel(/Hash de transacción/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Verificar/i })).toBeVisible();

    // Tarjetas informativas presentes
    await expect(page.getByRole("heading", { level: 3, name: /Privacidad garantizada/i })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3, name: /Verificación on-chain/i })).toBeVisible();
  });

  test("PE-08: /comprobar con txHash no encontrado muestra estado 'no encontrado'", async ({ page }) => {
    await gotoReady(page, "/comprobar");

    await page.getByLabel(/Hash de transacción/i).fill("0x" + "c".repeat(64));
    await page.getByRole("button", { name: /Verificar/i }).click();

    await expect(page.getByRole("heading", { name: /Boleta no encontrada/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/no existe en la blockchain/i)).toBeVisible();
  });

  test("PE-09: /comprobar con txHash válido muestra comprobante registrado", async ({ page }) => {
    await gotoReady(page, "/comprobar");

    await page.getByLabel(/Hash de transacción/i).fill(TX_HASH_VALIDO);
    await page.getByRole("button", { name: /Verificar/i }).click();

    await expect(page.getByRole("heading", { name: /Voto verificado/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Registrado/i).first()).toBeVisible();
    await expect(page.getByText(/#0/i)).toBeVisible();
    await expect(page.getByText(/#10/i)).toBeVisible();
  });
});
