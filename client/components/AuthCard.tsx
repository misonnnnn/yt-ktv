"use client";

import Link from "next/link";
import AccountMenu from "@/components/AccountMenu";

export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="ktv-bg flex min-h-dvh flex-1 flex-col">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-sm text-white/50 hover:text-white/80">
          ← Home
        </Link>
        <AccountMenu />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-12 sm:px-6">
        <h1 className="mb-2 text-center text-2xl font-bold text-white sm:text-3xl">
          {title}
        </h1>
        <p className="mb-6 text-center text-sm text-white/50">{subtitle}</p>
        <div className="rounded-2xl border border-ktv-card-border bg-ktv-card/60 p-5 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/favorites";
  return value;
}
