"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useState } from "react";
import api from "@/lib/api";
import FormField from "@/components/ui/FormField";
import Button from "@/components/ui/Button";

const registerSchema = z
  .object({
    email: z.string().email("E-mail invalido"),
    password: z
      .string()
      .min(8, "Senha deve ter no minimo 8 caracteres")
      .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiuscula")
      .regex(/[0-9]/, "Senha deve conter pelo menos um numero")
      .regex(
        /[^A-Za-z0-9]/,
        "Senha deve conter pelo menos um caractere especial"
      ),
    confirmPassword: z.string(),
    acceptedPrivacyPolicy: z.literal(true, {
      error: "Voce deve aceitar a politica de privacidade",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas nao coincidem",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    setIsLoading(true);
    try {
      await api.post("/api/v1/auth/register", {
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        acceptedPrivacyPolicy: data.acceptedPrivacyPolicy,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setServerError(
        error.response?.data?.error || "Erro ao criar conta. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-6 space-y-4">
        <p className="text-secondary font-semibold text-lg">
          Verifique seu e-mail para confirmar sua conta.
        </p>
        <Link
          href="/login/"
          className="inline-block text-primary font-semibold hover:text-primary-hover"
        >
          Voltar para login
        </Link>
      </div>
    );
  }

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
      <FormField
        label="Confirmar senha"
        type="password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <div className="space-y-1.5">
        <label className="flex items-start gap-2 text-sm text-fg/80 font-medium">
          <input
            type="checkbox"
            {...register("acceptedPrivacyPolicy")}
            className="mt-1 w-4 h-4 accent-primary"
          />
          <span>
            Li e aceito a{" "}
            <Link
              href="/privacy-policy/"
              className="text-primary font-semibold hover:text-primary-hover"
              target="_blank"
            >
              Política de Privacidade
            </Link>
          </span>
        </label>
        {errors.acceptedPrivacyPolicy && (
          <p className="text-sm text-danger font-medium">
            {errors.acceptedPrivacyPolicy.message}
          </p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-danger font-semibold">{serverError}</p>
      )}

      <Button type="submit" loading={isLoading} fullWidth>
        Criar conta
      </Button>

      <p className="text-center text-sm font-semibold">
        <Link
          href="/login/"
          className="text-primary hover:text-primary-hover transition-colors"
        >
          Já tem conta? Entrar
        </Link>
      </p>
    </form>
  );
}
