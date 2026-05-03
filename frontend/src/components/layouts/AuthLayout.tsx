import { ReactNode } from "react";
import AuthHeader from "./AuthHeader";
import Footer from "./Footer";
import Decorative from "@/components/ui/Decorative";

export interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function AuthLayout({
  title,
  subtitle,
  children,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <AuthHeader />
      <main className="relative flex-1 flex items-center justify-center px-4 py-12 overflow-hidden">
        <Decorative variant="auth" />
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-extrabold text-fg">{title}</h1>
              {subtitle && (
                <p className="mt-2 text-sm text-fg/60 font-medium">{subtitle}</p>
              )}
            </div>
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
