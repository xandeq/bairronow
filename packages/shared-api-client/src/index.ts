import axios, { AxiosInstance } from 'axios';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  CepAddress,
} from '@bairronow/shared-types';

export interface TokenStore {
  getAccessToken: () => string | null;
  setAccessToken: (token: string) => void;
  onUnauthorized: () => void;
}

export interface ClientOptions {
  baseURL: string;
  tokenStore: TokenStore;
}

export function createApiClient({ baseURL, tokenStore }: ClientOptions): AxiosInstance {
  const client = axios.create({
    baseURL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use((config) => {
    const token = tokenStore.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (r) => r,
    async (error) => {
      const original = error.config;
      if (error.response?.status === 401 && original && !original._retry) {
        original._retry = true;
        try {
          const { data } = await client.post<{ accessToken: string }>('/api/v1/auth/refresh');
          tokenStore.setAccessToken(data.accessToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return client(original);
        } catch {
          tokenStore.onUnauthorized();
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export function createAuthApi(client: AxiosInstance) {
  return {
    login: (body: LoginRequest) =>
      client.post<AuthResponse>('/api/v1/auth/login', body).then((r) => r.data),
    register: (body: RegisterRequest) =>
      client.post<AuthResponse>('/api/v1/auth/register', body).then((r) => r.data),
    logout: () => client.post('/api/v1/auth/logout'),
    forgotPassword: (body: ForgotPasswordRequest) =>
      client.post('/api/v1/auth/forgot-password', body),
    resetPassword: (body: ResetPasswordRequest) =>
      client.post('/api/v1/auth/reset-password', body),
  };
}

export function createCepApi() {
  const cep = axios.create({ baseURL: 'https://viacep.com.br/ws' });
  return {
    lookup: async (raw: string): Promise<CepAddress> => {
      const clean = raw.replace(/\D/g, '');
      const { data } = await cep.get(`/${clean}/json/`);
      if (data.erro) throw new Error('CEP nao encontrado');
      return {
        cep: data.cep,
        logradouro: data.logradouro,
        bairro: data.bairro,
        localidade: data.localidade,
        uf: data.uf,
      };
    },
  };
}

export type { AxiosInstance };
