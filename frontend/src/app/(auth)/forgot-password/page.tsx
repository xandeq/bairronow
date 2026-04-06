"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useState } from "react";
import api from "@/lib/api";

const schema = z.object({
  email: z.string().email("E-mail invalido"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await api.post("/api/v1/auth/forgot-password", data);
    } catch {
      // Always show success to prevent email enumeration
    }
    setSuccess(true);
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-center mb-6">
          Recuperar senha
        </h1>

        {success ? (
          <div className="text-center">
            <p className="text-green-700 mb-4">
              Se o e-mail existir, enviaremos um link de recuperacao.
            </p>
            <Link href="/login/" className="text-green-700 hover:underline">
              Voltar para login
            </Link>
          </div>
        ) : (
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
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Enviando..." : "Enviar link de recuperacao"}
            </button>

            <p className="text-center text-sm">
              <Link href="/login/" className="text-green-700 hover:underline">
                Voltar para login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
