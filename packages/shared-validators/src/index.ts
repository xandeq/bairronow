import { z } from 'zod';

export const emailSchema = z.string().email('E-mail invalido');
export const passwordSchema = z.string().min(8, 'Senha deve ter no minimo 8 caracteres');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptedPrivacyPolicy: z.literal(true, {
      message: 'Voce precisa aceitar a politica de privacidade',
    } as never),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas nao conferem',
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    email: emailSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas nao conferem',
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const cepSchema = z
  .string()
  .regex(/^\d{5}-?\d{3}$/, 'CEP invalido (use 00000-000)');
