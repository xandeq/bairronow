"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useState } from "react";
import api from "@/lib/api";

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
      <div className="text-center py-8">
        <p className="text-green-700 font-medium">
          Verifique seu e-mail para confirmar sua conta.
        </p>
        <Link href="/login/" className="text-green-700 hover:underline mt-4 inline-block">
          Voltar para login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          E-mail
        </label>
        <input
          id="email"
          type="email"
          {...register("email")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          placeholder="seu@email.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Senha
        </label>
        <input
          id="password"
          type="password"
          {...register("password")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">
            {errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Confirmar senha
        </label>
        <input
          id="confirmPassword"
          type="password"
          {...register("confirmPassword")}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className="flex items-start gap-2">
        <input
          id="acceptedPrivacyPolicy"
          type="checkbox"
          {...register("acceptedPrivacyPolicy")}
          className="mt-1"
        />
        <label htmlFor="acceptedPrivacyPolicy" className="text-sm text-gray-700">
          Li e aceito a{" "}
          <Link
            href="/privacy-policy/"
            className="text-green-700 hover:underline"
            target="_blank"
          >
            Politica de Privacidade
          </Link>
        </label>
      </div>
      {errors.acceptedPrivacyPolicy && (
        <p className="text-sm text-red-600">
          {errors.acceptedPrivacyPolicy.message}
        </p>
      )}

      {serverError && (
        <p className="text-sm text-red-600">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 transition-colors disabled:opacity-50"
      >
        {isLoading ? "Criando conta..." : "Criar conta"}
      </button>

      <p className="text-center text-sm">
        <Link href="/login/" className="text-green-700 hover:underline">
          Ja tem conta? Entrar
        </Link>
      </p>
    </form>
  );
}
