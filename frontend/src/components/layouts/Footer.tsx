import Link from "next/link";

const year = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-fg">Meu Vizinho</span>
          <span className="text-xs text-muted-fg">&copy; {year}</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/privacy-policy/"
            className="text-xs font-medium text-muted-fg hover:text-primary transition-colors"
          >
            Privacidade
          </Link>
          <span className="text-xs text-muted-fg">
            Conectando vizinhos desde {year}
          </span>
        </div>
      </div>
    </footer>
  );
}
