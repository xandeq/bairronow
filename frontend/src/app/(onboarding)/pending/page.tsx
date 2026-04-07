import Link from "next/link";
import AuthLayout from "@/components/layouts/AuthLayout";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function PendingPage() {
  return (
    <AuthLayout
      title="Aguardando verificação"
      subtitle="Recebemos seu comprovante"
    >
      <div className="space-y-5">
        <Card bgColor="muted" padding="md">
          <div className="flex items-center gap-3 mb-3">
            <Badge variant="accent">Em análise</Badge>
          </div>
          <p className="text-fg/80 font-medium">
            Nossa equipe está revisando seu comprovante de residência. Esse
            processo costuma levar até 24 horas. Você receberá um e-mail
            assim que sua conta for verificada.
          </p>
        </Card>
        <Link
          href="/login/"
          className="block text-center font-semibold text-primary hover:text-primary-hover"
        >
          Voltar para o login
        </Link>
      </div>
    </AuthLayout>
  );
}
