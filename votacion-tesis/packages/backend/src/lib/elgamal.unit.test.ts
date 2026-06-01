import { describe, it, expect } from "vitest";
import { secp256k1 } from "@noble/curves/secp256k1";
import {
  cifrarVotoElgamal,
  sumarCifrados,
  descifrarSuma,
  clavePublicaDesdePrivada,
  secretoShamirAClaveElgamal,
} from "./elgamal";

// Clave privada de prueba
const SK_HEX = "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
const SK_SCALAR = BigInt("0x" + SK_HEX) % secp256k1.CURVE.n;
const PK_HEX = clavePublicaDesdePrivada(SK_HEX);

describe("elgamal: cifrado y descifrado de un voto", () => {
  it("cifrarVotoElgamal produce N pares cifrados", () => {
    const cifrado = cifrarVotoElgamal(0, 3, PK_HEX);
    expect(cifrado).toHaveLength(3);
    cifrado.forEach(par => {
      expect(par.c1).toMatch(/^[0-9a-f]{66}$/); // punto comprimido 33 bytes
      expect(par.c2).toMatch(/^[0-9a-f]{66}$/);
    });
  });

  it("descifrar un voto cifrado para candidato 0 de 3 da [1,0,0]", () => {
    const cifrado = cifrarVotoElgamal(0, 3, PK_HEX);
    const suma = sumarCifrados([cifrado]);
    const conteos = suma.map(par => descifrarSuma(par, SK_SCALAR));
    expect(conteos).toEqual([1, 0, 0]);
  });

  it("descifrar un voto para candidato 1 de 3 da [0,1,0]", () => {
    const cifrado = cifrarVotoElgamal(1, 3, PK_HEX);
    const suma = sumarCifrados([cifrado]);
    const conteos = suma.map(par => descifrarSuma(par, SK_SCALAR));
    expect(conteos).toEqual([0, 1, 0]);
  });

  it("suma homomórfica de múltiples votos", () => {
    const votos = [
      cifrarVotoElgamal(0, 2, PK_HEX), // candidato 0
      cifrarVotoElgamal(0, 2, PK_HEX), // candidato 0
      cifrarVotoElgamal(1, 2, PK_HEX), // candidato 1
    ];
    const suma = sumarCifrados(votos);
    const conteos = suma.map(par => descifrarSuma(par, SK_SCALAR));
    expect(conteos).toEqual([2, 1]);
  });

  it("descifrar con clave incorrecta produce resultado incorrecto", () => {
    const otroSK = BigInt("0x" + "abcd".repeat(16)) % secp256k1.CURVE.n;
    const cifrado = cifrarVotoElgamal(0, 2, PK_HEX);
    const suma = sumarCifrados([cifrado]);
    expect(() => descifrarSuma(suma[0], otroSK, 5)).toThrow();
  });
});

describe("elgamal: clavePublicaDesdePrivada y secretoShamirAClaveElgamal", () => {
  it("clavePublicaDesdePrivada produce punto secp256k1 comprimido", () => {
    const pk = clavePublicaDesdePrivada(SK_HEX);
    expect(pk).toMatch(/^0[23][0-9a-f]{64}$/);
  });

  it("secretoShamirAClaveElgamal reduce correctamente mod ORDER", () => {
    const ORDER = secp256k1.CURVE.n;
    const secreto = ORDER + 42n; // mayor que ORDER
    const clave = secretoShamirAClaveElgamal(secreto);
    expect(clave).toBe(42n);
  });

  it("secretoShamirAClaveElgamal con secreto válido no cambia", () => {
    const secreto = 12345n;
    expect(secretoShamirAClaveElgamal(secreto)).toBe(12345n);
  });
});
