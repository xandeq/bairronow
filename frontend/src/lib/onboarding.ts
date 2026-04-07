import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  CepAddress,
  OnboardingStep,
  ProofStatus,
} from "@bairronow/shared-types";

interface OnboardingStore {
  step: OnboardingStep;
  cep: string | null;
  address: CepAddress | null;
  proofFileName: string | null;
  proofStatus: ProofStatus;
  setStep: (step: OnboardingStep) => void;
  setAddress: (address: CepAddress) => void;
  setProof: (fileName: string) => void;
  setProofStatus: (status: ProofStatus) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      step: "cep",
      cep: null,
      address: null,
      proofFileName: null,
      proofStatus: "none",
      setStep: (step) => set({ step }),
      setAddress: (address) => set({ address, cep: address.cep }),
      setProof: (proofFileName) =>
        set({ proofFileName, proofStatus: "uploaded" }),
      setProofStatus: (proofStatus) => set({ proofStatus }),
      reset: () =>
        set({
          step: "cep",
          cep: null,
          address: null,
          proofFileName: null,
          proofStatus: "none",
        }),
    }),
    {
      name: "bairronow-onboarding",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
