import Link from "next/link";
import Image from "next/image";

export default function AuthHeader() {
  return (
    <header className="relative z-10 px-6 py-5 border-b-2 border-border bg-bg">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-2xl font-extrabold text-primary">
          <Image src="/brand/logo-icon.png" alt="BairroNow" width={36} height={36} priority />
          BairroNow
        </Link>
        <nav className="flex items-center gap-6 text-sm font-semibold">
          <Link href="/login/" className="hover:text-primary transition-colors">
            Entrar
          </Link>
          <Link
            href="/register/"
            className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover transition-colors"
          >
            Criar conta
          </Link>
        </nav>
      </div>
    </header>
  );
}
