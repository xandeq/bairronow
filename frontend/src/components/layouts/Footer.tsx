import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 px-6 py-6 border-t-2 border-border bg-muted">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-fg/70">
        <p className="font-medium">
          © {new Date().getFullYear()} BairroNow
        </p>
        <Link
          href="/privacy-policy/"
          className="font-semibold hover:text-primary transition-colors"
        >
          Política de Privacidade
        </Link>
      </div>
    </footer>
  );
}
