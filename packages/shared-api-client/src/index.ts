import axios, { AxiosInstance } from 'axios';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  CepLookupResult,
  VerificationStatusDto,
  AdminVerificationListItem,
  ProfileDto,
  UpdateProfileRequest,
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

export function createCepApi(client: AxiosInstance) {
  return {
    lookup: async (raw: string): Promise<CepLookupResult> => {
      const clean = raw.replace(/\D/g, '');
      const { data } = await client.get<CepLookupResult>('/api/v1/cep/' + clean);
      return data;
    },
  };
}

export function createVerificationApi(client: AxiosInstance) {
  return {
    submit: async (formData: FormData): Promise<VerificationStatusDto> => {
      const { data } = await client.post<VerificationStatusDto>(
        '/api/v1/verification',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return data;
    },
    getMyStatus: async (): Promise<VerificationStatusDto> => {
      const { data } = await client.get<VerificationStatusDto>('/api/v1/verification/me');
      return data;
    },
  };
}

export function createProfileApi(client: AxiosInstance) {
  return {
    getMe: async (): Promise<ProfileDto> => {
      const { data } = await client.get<ProfileDto>('/api/v1/profile/me');
      return data;
    },
    updateMe: async (body: UpdateProfileRequest): Promise<ProfileDto> => {
      const { data } = await client.put<ProfileDto>('/api/v1/profile/me', body);
      return data;
    },
  };
}

export function createAdminVerificationApi(client: AxiosInstance) {
  return {
    listPending: async (
      skip = 0,
      take = 20
    ): Promise<{ items: AdminVerificationListItem[]; total: number }> => {
      const { data } = await client.get<{ items: AdminVerificationListItem[]; total: number }>(
        '/api/v1/admin/verifications',
        { params: { status: 'pending', skip, take } }
      );
      return data;
    },
    approve: async (id: number): Promise<void> => {
      await client.post('/api/v1/admin/verifications/' + id + '/approve');
    },
    reject: async (id: number, reason: string): Promise<void> => {
      await client.post('/api/v1/admin/verifications/' + id + '/reject', { reason });
    },
    getProofUrl: (id: number): string => {
      const base = (client.defaults.baseURL || '').replace(/\/$/, '');
      return base + '/api/v1/admin/verifications/' + id + '/proof';
    },
  };
}

export type { AxiosInstance };
