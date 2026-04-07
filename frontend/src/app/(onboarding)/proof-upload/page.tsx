import AuthLayout from "@/components/layouts/AuthLayout";
import ProofUploadForm from "@/components/forms/ProofUploadForm";

export default function ProofUploadPage() {
  return (
    <AuthLayout
      title="Comprovante de residência"
      subtitle="Passo 2 de 2 — Envie um documento que comprove seu endereço"
    >
      <ProofUploadForm />
    </AuthLayout>
  );
}
