import LoginForm from "@/components/forms/LoginForm";
import AuthLayout from "@/components/layouts/AuthLayout";

export default function LoginPage() {
  return (
    <AuthLayout title="Entrar" subtitle="Bem-vindo de volta ao seu bairro">
      <LoginForm />
    </AuthLayout>
  );
}
