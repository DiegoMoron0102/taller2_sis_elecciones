import type { CredencialVerificable } from "../lib/vcAuthority";

export type { CredencialVerificable };

export interface CredencialInput {
  numeroPadron: string;
  nombre: string;
  ci: string;
  vc?: CredencialVerificable; // Sprint 6: credencial verificable con firma ECDSA
}

export interface ResultadoVerificacionCredencial {
  valida: boolean;
  motivo?: string;
}

export interface EmisionTokenResult {
  token: string;
  tokenHash: string;
  sessionId: string;
  expiresIn: number;
}
