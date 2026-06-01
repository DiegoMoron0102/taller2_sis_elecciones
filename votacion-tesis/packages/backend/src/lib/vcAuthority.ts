import crypto from "crypto";
import { secp256k1 } from "@noble/curves/secp256k1";

export interface CredencialVerificable {
  "@context": string[];
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: {
    id: string;
    numeroPadron: string;
    nombre: string;
    elegible: boolean;
  };
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofValue: string; // ECDSA signature hex (compact: r||s, 64 bytes)
  };
}

function buildPayload(vc: Pick<CredencialVerificable, "credentialSubject" | "issuanceDate">) {
  return JSON.stringify({
    numeroPadron: vc.credentialSubject.numeroPadron,
    nombre: vc.credentialSubject.nombre,
    elegible: vc.credentialSubject.elegible,
    issuanceDate: vc.issuanceDate,
  });
}

export function emitirVC(numeroPadron: string, nombre: string, issuanceDate?: string): CredencialVerificable {
  const pkHex = process.env.VC_AUTHORITY_PRIVATE_KEY;
  if (!pkHex) throw new Error("VC_AUTHORITY_PRIVATE_KEY no configurada");

  const fecha = issuanceDate ?? new Date().toISOString();

  const vc: Omit<CredencialVerificable, "proof"> & { proof?: CredencialVerificable["proof"] } = {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiableCredential", "CredencialElectoral"],
    issuer: "did:votoseguro:authority",
    issuanceDate: fecha,
    credentialSubject: {
      id: `did:padron:${numeroPadron}`,
      numeroPadron,
      nombre,
      elegible: true,
    },
  };

  const mensaje = Buffer.from(buildPayload(vc as CredencialVerificable));
  const msgHash = crypto.createHash("sha256").update(mensaje).digest();
  const privateKey = Buffer.from(pkHex, "hex");
  const sig = secp256k1.sign(msgHash, privateKey);

  vc.proof = {
    type: "EcdsaSecp256k1Signature2019",
    created: fecha,
    verificationMethod: "did:votoseguro:authority#key-1",
    proofValue: Buffer.from(sig.toCompactRawBytes()).toString("hex"),
  };

  return vc as CredencialVerificable;
}

export function verificarVC(vc: CredencialVerificable): boolean {
  const pkHex = process.env.VC_AUTHORITY_PRIVATE_KEY;
  if (!pkHex) return false;

  try {
    const privateKey = Buffer.from(pkHex, "hex");
    const publicKey = secp256k1.getPublicKey(privateKey, true);

    const mensaje = Buffer.from(buildPayload(vc));
    const msgHash = crypto.createHash("sha256").update(mensaje).digest();
    const sigBytes = Buffer.from(vc.proof.proofValue, "hex");

    return secp256k1.verify(sigBytes, msgHash, publicKey);
  } catch {
    return false;
  }
}

export function obtenerClavePublicaVC(): string {
  const pkHex = process.env.VC_AUTHORITY_PRIVATE_KEY;
  if (!pkHex) throw new Error("VC_AUTHORITY_PRIVATE_KEY no configurada");
  const privateKey = Buffer.from(pkHex, "hex");
  return Buffer.from(secp256k1.getPublicKey(privateKey, true)).toString("hex");
}

// ─── VC Custodio de Escrutinio ────────────────────────────────────────────────

export interface CredencialCustodio {
  "@context": string[];
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: {
    nombre: string;
    partido: string;
    indiceCompartimento: number;
  };
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofValue: string;
  };
}

function buildPayloadCustodio(vc: Pick<CredencialCustodio, "credentialSubject" | "issuanceDate">) {
  return JSON.stringify({
    nombre: vc.credentialSubject.nombre,
    partido: vc.credentialSubject.partido,
    indiceCompartimento: vc.credentialSubject.indiceCompartimento,
    issuanceDate: vc.issuanceDate,
  });
}

export function emitirVCCustodio(
  nombre: string,
  partido: string,
  indiceCompartimento: number,
  issuanceDate?: string,
): CredencialCustodio {
  const pkHex = process.env.VC_AUTHORITY_PRIVATE_KEY;
  if (!pkHex) throw new Error("VC_AUTHORITY_PRIVATE_KEY no configurada");

  const fecha = issuanceDate ?? new Date().toISOString();

  const vc: Omit<CredencialCustodio, "proof"> & { proof?: CredencialCustodio["proof"] } = {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiableCredential", "CredencialCustodio"],
    issuer: "did:votoseguro:authority",
    issuanceDate: fecha,
    credentialSubject: { nombre, partido, indiceCompartimento },
  };

  const mensaje = Buffer.from(buildPayloadCustodio(vc as CredencialCustodio));
  const msgHash = crypto.createHash("sha256").update(mensaje).digest();
  const sig = secp256k1.sign(msgHash, Buffer.from(pkHex, "hex"));

  vc.proof = {
    type: "EcdsaSecp256k1Signature2019",
    created: fecha,
    verificationMethod: "did:votoseguro:authority#key-1",
    proofValue: Buffer.from(sig.toCompactRawBytes()).toString("hex"),
  };

  return vc as CredencialCustodio;
}

export function verificarVCCustodio(vc: CredencialCustodio): boolean {
  const pkHex = process.env.VC_AUTHORITY_PRIVATE_KEY;
  if (!pkHex) return false;

  try {
    if (!vc?.type?.includes("CredencialCustodio")) return false;
    const privateKey = Buffer.from(pkHex, "hex");
    const publicKey = secp256k1.getPublicKey(privateKey, true);

    const mensaje = Buffer.from(buildPayloadCustodio(vc));
    const msgHash = crypto.createHash("sha256").update(mensaje).digest();
    const sigBytes = Buffer.from(vc.proof.proofValue, "hex");

    return secp256k1.verify(sigBytes, msgHash, publicKey);
  } catch {
    return false;
  }
}
