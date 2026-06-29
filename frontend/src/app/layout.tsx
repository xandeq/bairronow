import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// API_URL known at build time for the static export — we can preconnect to it
// in <head> so the browser warms the TCP + TLS handshake before the first XHR.
// Saves ~100–300ms on the first authenticated API call in real-world Brazilian
// mobile networks (high RTT to SmarterASP via Cloudflare).
const apiOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_API_URL
      ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
      : null;
  } catch {
    return null;
  }
})();

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://meuvizinho.com.br"
  ),
  title: {
    default: "Meu Vizinho — Conecte-se com seus vizinhos",
    template: "%s | Meu Vizinho",
  },
  description:
    "Rede social de bairro: diretório verificado de grupos WhatsApp, condomínios com síndico reivindicável, marketplace e feed local para vizinhos verificados.",
  applicationName: "Meu Vizinho",
  authors: [{ name: "Meu Vizinho" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://meuvizinho.com.br",
    siteName: "Meu Vizinho",
    title: "Meu Vizinho — Sua comunidade de bairro conectada",
    description:
      "Diretório verificado de grupos WhatsApp, condomínios com síndico reivindicável, marketplace e feed local entre vizinhos verificados.",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Meu Vizinho",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Meu Vizinho — Sua comunidade de bairro conectada",
    description:
      "Diretório verificado de grupos WhatsApp, condomínios com síndico reivindicável, marketplace e feed local entre vizinhos verificados.",
    images: ["/icons/icon-512x512.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  formatDetection: {
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Meu Vizinho',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${outfit.variable} h-full antialiased`}
    >
      <head>
        {apiOrigin && (
          <>
            <link rel="preconnect" href={apiOrigin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={apiOrigin} />
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col font-sans bg-bg text-fg">
        <Providers>{children}</Providers>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
