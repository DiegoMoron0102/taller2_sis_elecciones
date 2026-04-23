export interface CredencialInput {
  numeroPadron: string;
  nombre: string;
  ci: string;
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
