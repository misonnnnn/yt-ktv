"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { logoutAccount, type AccountUser } from "@/lib/accountApi";

function Avatar({ user, size = 32 }: { user: AccountUser; size?: number }) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        referrerPolicy="no-referrer"
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="flex items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-500 text-xs font-bold text-white"
      style={{ width: size, height: size }}
    >
      {user.displayName.slice(0, 1).toUpperCase()}
    </span>
  );
}

export default function AccountMenu() {
  const { user, ready, setUser } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointer(event: MouseEvent) {
      if (!panel.current?.contains(event.target as Node)) setOpen(false);
    }

    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [open]);

  async function handleLogout() {
    try {
      await logoutAccount();
    } catch {
      // Still leave the local session if the server is briefly unreachable.
    }
    setUser(null);
    setOpen(false);
    router.push("/");
  }

  if (!ready) {
    return <div className="h-9 w-24 rounded-xl bg-white/5" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="px-2 text-sm text-white/70 hover:text-white">
          Sign in
        </Link>
        <Link
          href="/register"
          className="ktv-btn-primary rounded-xl px-3 py-2 text-sm font-semibold text-white"
        >
          Create account
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={panel}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 py-1 pl-1 pr-3 text-sm text-white"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar user={user} />
        <span className="max-w-28 truncate">{user.displayName}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-52 rounded-2xl border border-ktv-card-border bg-[#140c24] p-2 shadow-xl"
        >
          {[
            ["/sing", "Sing"],
            ["/favorites", "My Favorites"],
            ["/playlists", "My Playlists"],
            ["/history", "My History"],
            ["/activity", "My Activity"],
            ["/profile", "My Profile"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white"
            >
              {label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={() => void handleLogout()}
            className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm text-pink-300 hover:bg-white/5"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
