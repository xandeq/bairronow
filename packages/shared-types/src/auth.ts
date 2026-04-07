export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  acceptedPrivacyPolicy: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  email: string;
  displayName: string | null;
  emailConfirmed: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  email: string;
  newPassword: string;
}

export interface ApiError {
  error: string;
  errors?: Record<string, string[]>;
}
