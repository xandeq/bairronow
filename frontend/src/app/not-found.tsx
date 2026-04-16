import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-4xl font-bold text-fg">404</h2>
      <p className="text-lg text-muted-fg">Pagina nao encontrada</p>
      <Link
        href="/"
        className="rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary-hover"
      >
        Voltar ao inicio
      </Link>
    </div>
  );
}
