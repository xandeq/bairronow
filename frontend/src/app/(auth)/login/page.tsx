import LoginForm from "@/components/forms/LoginForm";
import AuthLayout from "@/components/layouts/AuthLayout";
import Link from "next/link";

function BairroNowPanel() {
  return (
    <div className="relative flex flex-col justify-between h-full min-h-screen p-10 xl:p-14 overflow-hidden text-white"
      style={{ background: "linear-gradient(145deg, #0f2042 0%, #1e3a8a 40%, #1a5c3a 100%)" }}>

      {/* Decorative background pattern */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
        {/* Large glowing orbs */}
        <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full opacity-[0.12]"
          style={{ background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full opacity-[0.10]"
          style={{ background: "radial-gradient(circle, #34d399 0%, transparent 70%)" }} />
        <div className="absolute top-[40%] left-[30%] w-48 h-48 rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #fbbf24 0%, transparent 70%)" }} />

        {/* Grid pattern overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Floating house icons */}
        <svg className="absolute top-[18%] right-[10%] w-16 h-16 opacity-10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <svg className="absolute top-[55%] right-[6%] w-10 h-10 opacity-8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <svg className="absolute top-[70%] left-[5%] w-12 h-12 opacity-[0.06]" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>

      {/* Top logo */}
      <div className="relative z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg group-hover:bg-white/20 transition-colors">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">BairroNow</span>
        </Link>
      </div>

      {/* Hero content */}
      <div className="relative z-10 space-y-8">
        {/* Hero text */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-white/90 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Comunidade ativa agora
          </div>
          <h2 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight">
            Seu bairro,<br />
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #93c5fd 0%, #6ee7b7 100%)" }}>
              na palma da mão.
            </span>
          </h2>
          <p className="text-base text-white/70 leading-relaxed max-w-xs">
            Marketplace, grupos, eventos e muito mais — tudo com os vizinhos do seu bairro.
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-3">
          {[
            { icon: "🛍️", title: "Marketplace local", desc: "Compre e venda perto de você" },
            { icon: "💬", title: "Chat com vizinhos", desc: "Mensagens diretas e em grupos" },
            { icon: "📍", title: "Eventos e notícias", desc: "Tudo que acontece no bairro" },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-base shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{f.title}</p>
                <p className="text-xs text-white/60 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom stats */}
      <div className="relative z-10">
        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white/8 border border-white/12 backdrop-blur-sm">
          {[
            { value: "12K+", label: "Vizinhos" },
            { value: "320+", label: "Bairros" },
            { value: "4.8★", label: "Avaliação" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-extrabold text-white">{s.value}</p>
              <p className="text-xs text-white/55 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout
      title="Bem-vindo de volta"
      subtitle="Entre na sua conta para continuar"
      leftPanel={<BairroNowPanel />}
    >
      <LoginForm />
    </AuthLayout>
  );
}
