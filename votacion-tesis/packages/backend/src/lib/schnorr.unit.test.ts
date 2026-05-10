import { describe, it, expect } from "vitest";
import { verificarSchnorr, generarPruebaSchnorr, calcularTokenPoint, tokenAEscalar, MENSAJE_SCHNORR_PREFIX } from "./schnorr";
import { secp256k1 } from "@noble/curves/secp256k1";

const TOKEN_PRUEBA = "a1b2c3d4e5f6".repeat(5) + "a1b2c3d4"; // 64 hex chars

describe("schnorr: generación y verificación de pruebas", () => {
  it("prueba generada es verificable para el mismo token y mensaje", () => {
    const mensaje = `${MENSAJE_SCHNORR_PREFIX}:0`;
    const tokenPoint = calcularTokenPoint(TOKEN_PRUEBA);
    const prueba = generarPruebaSchnorr(TOKEN_PRUEBA, mensaje);
    expect(verificarSchnorr(tokenPoint, prueba, mensaje)).toBe(true);
  });

  it("verificarSchnorr falla con mensaje diferente", () => {
    const tokenPoint = calcularTokenPoint(TOKEN_PRUEBA);
    const prueba = generarPruebaSchnorr(TOKEN_PRUEBA, "mensaje-original");
    expect(verificarSchnorr(tokenPoint, prueba, "mensaje-diferente")).toBe(false);
  });

  it("verificarSchnorr falla con tokenPoint incorrecto", () => {
    const otroToken = "b2c3d4e5f6a1".repeat(5) + "b2c3d4e5";
    const tokenPointCorrecto = calcularTokenPoint(TOKEN_PRUEBA);
    const tokenPointIncorrecto = calcularTokenPoint(otroToken);
    const prueba = generarPruebaSchnorr(TOKEN_PRUEBA, "mensaje");
    expect(verificarSchnorr(tokenPointIncorrecto, prueba, "mensaje")).toBe(false);
    expect(verificarSchnorr(tokenPointCorrecto, prueba, "mensaje")).toBe(true);
  });

  it("verificarSchnorr falla con s alterado", () => {
    const mensaje = `${MENSAJE_SCHNORR_PREFIX}:1`;
    const tokenPoint = calcularTokenPoint(TOKEN_PRUEBA);
    const prueba = generarPruebaSchnorr(TOKEN_PRUEBA, mensaje);
    const pruebaAlterada = { ...prueba, s: "00".repeat(32) };
    expect(verificarSchnorr(tokenPoint, pruebaAlterada, mensaje)).toBe(false);
  });

  it("verificarSchnorr falla con R alterado", () => {
    const mensaje = `${MENSAJE_SCHNORR_PREFIX}:2`;
    const tokenPoint = calcularTokenPoint(TOKEN_PRUEBA);
    const prueba = generarPruebaSchnorr(TOKEN_PRUEBA, mensaje);
    const pruebaAlterada = { ...prueba, R: secp256k1.ProjectivePoint.BASE.multiply(2n).toHex(true) };
    expect(verificarSchnorr(tokenPoint, pruebaAlterada, mensaje)).toBe(false);
  });

  it("pruebas distintas para el mismo token son no-deterministas (nonce aleatorio)", () => {
    const mensaje = "test";
    const p1 = generarPruebaSchnorr(TOKEN_PRUEBA, mensaje);
    const p2 = generarPruebaSchnorr(TOKEN_PRUEBA, mensaje);
    // Con alta probabilidad los R son distintos (nonces aleatorios)
    expect(p1.R === p2.R).toBe(false);
  });
});

describe("schnorr: calcularTokenPoint y tokenAEscalar", () => {
  it("tokenAEscalar mapea un token de 64 hex a escalar en [1, ORDER-1]", () => {
    const scalar = tokenAEscalar(TOKEN_PRUEBA);
    expect(scalar).toBeGreaterThan(0n);
    expect(scalar).toBeLessThan(secp256k1.CURVE.n);
  });

  it("calcularTokenPoint retorna punto secp256k1 comprimido", () => {
    const point = calcularTokenPoint(TOKEN_PRUEBA);
    expect(point).toMatch(/^0[23][0-9a-f]{64}$/);
  });

  it("el mismo token siempre produce el mismo tokenPoint", () => {
    expect(calcularTokenPoint(TOKEN_PRUEBA)).toBe(calcularTokenPoint(TOKEN_PRUEBA));
  });
});
