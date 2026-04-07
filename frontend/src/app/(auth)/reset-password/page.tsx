import { Suspense } from "react";
import ResetPasswordForm from "@/components/forms/ResetPasswordForm";
import AuthLayout from "@/components/layouts/AuthLayout";

export default function ResetPasswordPage() {
  return (
    <AuthLayout title="Redefinir senha" subtitle="Escolha uma nova senha forte">
      <Suspense
        fallback={<p className="text-center text-fg/60">Carregando...</p>}
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
