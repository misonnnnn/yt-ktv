"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AccountMenu from "@/components/AccountMenu";
import { useAuth } from "@/components/AuthProvider";

const links = [
  { href: "/sing", label: "Sing" },
  { href: "/favorites", label: "My Favorites" },
  { href: "/playlists", label: "My Playlists" },
  { href: "/history", label: "My History" },
  { href: "/activity", label: "My Activity" },
  { href: "/profile", label: "My Profile" },
];

function GuestPrompt() {
  return (
    <div className="rounded-3xl border border-ktv-card-border bg-ktv-card/70 p-6 text-center sm:p-10">
      <p className="text-3xl">🎤</p>
      <h2 className="mt-3 text-xl font-bold text-white">Create a free account</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/60">
        Save your favorite songs, create personal playlists, and keep track of
        your karaoke history. Create your free TaraSing account today!
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/register"
          className="ktv-btn-primary rounded-2xl px-6 py-3 text-sm font-bold text-white"
        >
          Create account
        </Link>
        <Link
          href="/login"
          className="ktv-btn-secondary rounded-2xl px-6 py-3 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </div>
      <p className="mt-4 text-xs text-white/40">
        Parties, search, and singing stay open without an account.
      </p>
    </div>
  );
}

export default function LibraryShell({
  title,
  intro,
  allowGuests = false,
  children,
}: {
  title: string;
  intro?: string;
  allowGuests?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, ready } = useAuth();

  return (
    <div className="ktv-bg min-h-dvh">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="font-semibold text-purple-200">
          TaraSing
        </Link>
        <AccountMenu />
      </header>

      <nav className="mx-auto flex w-full max-w-5xl gap-2 overflow-x-auto px-4 pb-4">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                active
                  ? "bg-white text-[#140c24]"
                  : link.href === "/sing"
                    ? "bg-gradient-to-r from-purple-600 to-pink-500 font-semibold text-white"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <main className="mx-auto w-full max-w-5xl px-4 pb-16">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-sm text-white/50">{intro}</p>}
        <div className="mt-6">
          {!ready && <p className="text-sm text-white/40">Loading...</p>}
          {ready && !user && !allowGuests && <GuestPrompt />}
          {ready && (user || allowGuests) ? children : null}
        </div>
      </main>
    </div>
  );
}
