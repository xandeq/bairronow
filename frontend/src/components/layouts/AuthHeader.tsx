import Link from "next/link";

export default function AuthHeader() {
  return (
    <header className="relative z-10 px-6 py-5 border-b-2 border-border bg-bg">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-extrabold text-primary">
          BairroNow
        </Link>
        <nav className="flex items-center gap-6 text-sm font-semibold">
          <Link href="/login/" className="hover:text-primary transition-colors">
            Entrar
          </Link>
          <Link
            href="/register/"
            className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-hover transition-transform hover:scale-105"
          >
            Criar conta
          </Link>
        </nav>
      </div>
    </header>
  );
}
