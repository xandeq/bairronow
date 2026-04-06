import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NossoVizinho",
  description: "Conecte-se com seus vizinhos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <header className="bg-green-700 text-white px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">
              NossoVizinho
            </Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-gray-100 border-t px-4 py-4 text-center text-sm text-gray-600">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/privacy-policy/"
              className="hover:underline text-green-700"
            >
              Politica de Privacidade
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
