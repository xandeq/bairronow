"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { AuthResponse } from "@/types/auth";
import FormField from "@/components/ui/FormField";
import Button from "@/components/ui/Button";

const loginSchema = z.object({
  email: z.string().email("E-mail invalido"),
  password: z.string().min(8, "Senha deve ter no minimo 8 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    setIsLoading(true);
    try {
      const response = await api.post<AuthResponse>(
        "/api/v1/auth/login",
        data
      );
      useAuthStore
        .getState()
        .login(response.data.accessToken, response.data.user);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setServerError(
        error.response?.data?.error || "Erro ao fazer login. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormField
        label="E-mail"
        type="email"
        placeholder="seu@email.com"
        error={errors.email?.message}
        {...register("email")}
      />
      <FormField
        label="Senha"
        type="password"
        error={errors.password?.message}
        {...register("password")}
      />

      {serverError && (
        <p className="text-sm text-danger font-semibold">{serverError}</p>
      )}

      <Button type="submit" loading={isLoading} fullWidth>
        Entrar
      </Button>

      <div className="flex justify-between text-sm font-semibold">
        <Link
          href="/forgot-password/"
          className="text-primary hover:text-primary-hover transition-colors"
        >
          Esqueceu a senha?
        </Link>
        <Link
          href="/register/"
          className="text-primary hover:text-primary-hover transition-colors"
        >
          Criar conta
        </Link>
      </div>
    </form>
  );
}
