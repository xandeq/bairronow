import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  CepLookupResult,
  OnboardingStep,
  ProofStatus,
  VerificationStatusDto,
} from "@bairronow/shared-types";

interface OnboardingStore {
  step: OnboardingStep;
  cep: string | null;
  address: CepLookupResult | null;
  proofFileName: string | null;
  proofStatus: ProofStatus;
  status: VerificationStatusDto | null;
  setStep: (step: OnboardingStep) => void;
  setAddress: (address: CepLookupResult) => void;
  setProof: (fileName: string) => void;
  setProofStatus: (status: ProofStatus) => void;
  setStatus: (dto: VerificationStatusDto) => void;
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
      status: null,
      setStep: (step) => set({ step }),
      setAddress: (address) => set({ address, cep: address.cep }),
      setProof: (proofFileName) =>
        set({ proofFileName, proofStatus: "uploaded" }),
      setProofStatus: (proofStatus) => set({ proofStatus }),
      setStatus: (dto) => set({ status: dto, proofStatus: dto.status }),
      reset: () =>
        set({
          step: "cep",
          cep: null,
          address: null,
          proofFileName: null,
          proofStatus: "none",
          status: null,
        }),
    }),
    {
      name: "bairronow-onboarding",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
