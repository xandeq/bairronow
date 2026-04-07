import Constants from 'expo-constants';
import { createApiClient, createAuthApi, createCepApi } from '@bairronow/shared-api-client';
import { useAuthStore } from './auth-store';

const baseURL =
  (Constants.expoConfig?.extra?.apiUrl as string) || 'https://api.bairronow.com.br';

export const apiClient = createApiClient({
  baseURL,
  tokenStore: {
    getAccessToken: () => useAuthStore.getState().accessToken,
    setAccessToken: (t) => useAuthStore.getState().setAccessToken(t),
    onUnauthorized: () => useAuthStore.getState().logout(),
  },
});

export const authApi = createAuthApi(apiClient);
export const cepApi = createCepApi();
