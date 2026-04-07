export interface CepAddress {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  lat?: number;
  lng?: number;
}

export type ProofStatus = "none" | "uploaded" | "pending" | "approved" | "rejected";

export type OnboardingStep = "cep" | "proof" | "pending" | "done";

export interface OnboardingState {
  step: OnboardingStep;
  cep: string | null;
  address: CepAddress | null;
  proofFileName: string | null;
  proofStatus: ProofStatus;
}
