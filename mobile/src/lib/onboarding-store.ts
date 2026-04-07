import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CepLookupResult, VerificationStatusDto } from '@bairronow/shared-types';

interface OnboardingState {
  address: CepLookupResult | null;
  status: VerificationStatusDto | null;
  setAddress: (a: CepLookupResult | null) => void;
  setStatus: (s: VerificationStatusDto | null) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      address: null,
      status: null,
      setAddress: (address) => set({ address }),
      setStatus: (status) => set({ status }),
      reset: () => set({ address: null, status: null }),
    }),
    {
      name: 'bairronow-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
