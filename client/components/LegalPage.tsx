import Link from "next/link";
import type { ReactNode } from "react";
import SiteFooter from "@/components/SiteFooter";

type LegalPageProps = {
  title: string;
  children: ReactNode;
};

export default function LegalPage({ title, children }: LegalPageProps) {
  return (
    <div className="ktv-bg flex min-h-full flex-1 flex-col">
      <header className="px-6 py-4 sm:py-6">
        <Link
          href="/"
          className="text-sm font-medium text-white/50 transition hover:text-white/80"
        >
          ← TaraSing
        </Link>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pb-12 sm:pb-16">
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mb-8 text-sm text-white/40">TaraSing</p>
        <div className="space-y-6 text-sm leading-relaxed text-white/60 sm:text-base">
          {children}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
