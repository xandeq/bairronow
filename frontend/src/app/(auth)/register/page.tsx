import RegisterForm from "@/components/forms/RegisterForm";
import AuthLayout from "@/components/layouts/AuthLayout";

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Junte-se aos vizinhos verificados"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
