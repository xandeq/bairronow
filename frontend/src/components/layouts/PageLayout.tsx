import { ReactNode } from "react";
import MainHeader from "./MainHeader";
import Footer from "./Footer";

export interface PageLayoutProps {
  children: ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <MainHeader />
      <main className="flex-1 px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto w-full">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
