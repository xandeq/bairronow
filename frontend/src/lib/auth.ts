import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserInfo } from '@/types/auth';

interface AuthState {
  accessToken: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  setAccessToken: (token: string) => void;
  setUser: (user: UserInfo) => void;
  login: (token: string, user: UserInfo) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      setAccessToken: (token) => set({ accessToken: token }),
      setUser: (user) => set({ user }),
      login: (token, user) =>
        set({ accessToken: token, user, isAuthenticated: true }),
      logout: () =>
        set({ accessToken: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'bairronow-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
