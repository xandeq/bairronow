import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Politica de Privacidade</h1>

      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">Dados Coletados</h2>
          <p className="text-muted-fg">
            Coletamos os seguintes dados para o funcionamento da plataforma
            BairroNow:
          </p>
          <ul className="list-disc pl-6 text-muted-fg space-y-1">
            <li>Nome e e-mail para identificacao da conta</li>
            <li>
              CEP e comprovante de residencia para verificacao de endereco
            </li>
            <li>Conteudo de publicacoes e mensagens na plataforma</li>
            <li>Dados de uso e navegacao para melhoria do servico</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Como Usamos</h2>
          <p className="text-muted-fg">
            Seus dados sao utilizados exclusivamente para:
          </p>
          <ul className="list-disc pl-6 text-muted-fg space-y-1">
            <li>Verificar sua identidade e endereco de residencia</li>
            <li>Exibir conteudo relevante ao seu bairro</li>
            <li>Permitir interacoes com vizinhos verificados</li>
            <li>Enviar notificacoes sobre atividades na sua comunidade</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Seus Direitos</h2>
          <p className="text-muted-fg">
            Em conformidade com a Lei Geral de Protecao de Dados (LGPD), voce
            tem direito a:
          </p>
          <ul className="list-disc pl-6 text-muted-fg space-y-1">
            <li>Acessar seus dados pessoais armazenados</li>
            <li>Solicitar correcao de dados incorretos</li>
            <li>Solicitar exclusao de seus dados</li>
            <li>Revogar consentimento a qualquer momento</li>
            <li>Solicitar portabilidade dos seus dados</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Contato</h2>
          <p className="text-muted-fg">
            Para exercer seus direitos ou tirar duvidas sobre esta politica,
            entre em contato pelo e-mail:{" "}
            <span className="font-medium">privacidade@bairronow.com.br</span>
          </p>
        </section>
      </div>

      <div className="mt-8">
        <Link href="/" className="text-green-700 hover:underline">
          Voltar para a pagina inicial
        </Link>
      </div>
    </div>
  );
}
