import ForgotPasswordForm from "@/components/forms/ForgotPasswordForm";
import AuthLayout from "@/components/layouts/AuthLayout";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Enviaremos um link para o seu e-mail"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
