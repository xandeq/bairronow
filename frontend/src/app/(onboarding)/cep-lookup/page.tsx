import AuthLayout from "@/components/layouts/AuthLayout";
import CEPForm from "@/components/forms/CEPForm";

export default function CEPLookupPage() {
  return (
    <AuthLayout
      title="Onde você mora?"
      subtitle="Passo 1 de 2 — Informe seu CEP"
    >
      <CEPForm />
    </AuthLayout>
  );
}
