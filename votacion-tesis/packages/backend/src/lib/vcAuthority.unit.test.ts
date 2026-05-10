import { describe, it, expect, beforeAll } from "vitest";
import { emitirVC, verificarVC, obtenerClavePublicaVC } from "./vcAuthority";

// Clave de prueba: 32 bytes válidos para secp256k1
const TEST_PRIVATE_KEY = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

describe("vcAuthority", () => {
  beforeAll(() => {
    process.env.VC_AUTHORITY_PRIVATE_KEY = TEST_PRIVATE_KEY;
  });

  it("emitirVC genera una VC con firma ECDSA", () => {
    const vc = emitirVC("LP123456", "Juan Pérez");

    expect(vc["@context"]).toContain("https://www.w3.org/2018/credentials/v1");
    expect(vc.type).toContain("CredencialElectoral");
    expect(vc.credentialSubject.numeroPadron).toBe("LP123456");
    expect(vc.credentialSubject.nombre).toBe("Juan Pérez");
    expect(vc.credentialSubject.elegible).toBe(true);
    expect(vc.proof.type).toBe("EcdsaSecp256k1Signature2019");
    expect(vc.proof.proofValue).toMatch(/^[0-9a-f]{128}$/); // 64 bytes compacto
  });

  it("verificarVC retorna true para VC válida", () => {
    const vc = emitirVC("LP123456", "Juan Pérez");
    expect(verificarVC(vc)).toBe(true);
  });

  it("verificarVC retorna false si proofValue fue alterado", () => {
    const vc = emitirVC("LP123456", "Juan Pérez");
    vc.proof.proofValue = "00".repeat(64);
    expect(verificarVC(vc)).toBe(false);
  });

  it("verificarVC retorna false si el nombre fue modificado", () => {
    const vc = emitirVC("LP123456", "Juan Pérez");
    vc.credentialSubject.nombre = "Atacante Malicioso";
    expect(verificarVC(vc)).toBe(false);
  });

  it("verificarVC retorna false si el padrón fue modificado", () => {
    const vc = emitirVC("LP123456", "Juan Pérez");
    vc.credentialSubject.numeroPadron = "CB999999";
    expect(verificarVC(vc)).toBe(false);
  });

  it("emitirVC es determinista con la misma issuanceDate", () => {
    const fecha = "2026-05-10T12:00:00.000Z";
    const vc1 = emitirVC("LP123456", "Juan Pérez", fecha);
    const vc2 = emitirVC("LP123456", "Juan Pérez", fecha);
    expect(vc1.proof.proofValue).toBe(vc2.proof.proofValue);
  });

  it("obtenerClavePublicaVC retorna punto secp256k1 comprimido", () => {
    const pk = obtenerClavePublicaVC();
    expect(pk).toMatch(/^0[23][0-9a-f]{64}$/); // punto comprimido 33 bytes
  });
});
