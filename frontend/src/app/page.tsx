import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
        Conecte-se com seus vizinhos
      </h1>
      <p className="text-gray-600 text-center mb-8 max-w-md">
        A plataforma de vizinhanca para comunidades verificadas no Brasil.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/login/"
          className="px-8 py-3 bg-green-700 text-white rounded-lg font-medium text-center hover:bg-green-800 transition-colors"
        >
          Entrar
        </Link>
        <Link
          href="/register/"
          className="px-8 py-3 border-2 border-green-700 text-green-700 rounded-lg font-medium text-center hover:bg-green-50 transition-colors"
        >
          Criar conta
        </Link>
      </div>
    </div>
  );
}
