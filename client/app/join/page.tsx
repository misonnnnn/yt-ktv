"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function JoinPartyPage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [nickname, setNickname] = useState("");

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const code = roomCode.trim().toUpperCase();
    if (!code) return;

    const params = new URLSearchParams();
    if (nickname.trim()) params.set("name", nickname.trim());
    const qs = params.toString();
    router.push(`/join/${code}${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="ktv-bg flex min-h-dvh flex-1 flex-col">
      <header className="px-6 py-4 landscape:py-3 sm:py-6">
        <Link
          href="/"
          className="text-sm text-white/50 transition hover:text-white/80"
        >
          ← Back to home
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-10 landscape:justify-start landscape:pb-6 landscape:pt-2 sm:pb-16">
        <div className="mb-6 text-center landscape:mb-4 sm:mb-8">
          <div className="mb-3 text-3xl landscape:mb-2 landscape:text-2xl sm:mb-4 sm:text-4xl">
            📱
          </div>
          <h1 className="text-2xl font-bold text-white landscape:text-xl sm:text-3xl">
            Join a Party
          </h1>
          <p className="mt-2 text-sm text-white/50 sm:text-base">
            Enter the party code shown on the host screen.
          </p>
        </div>

        <form
          onSubmit={handleJoin}
          className="space-y-4 rounded-2xl border border-ktv-card-border bg-ktv-card/60 p-5 landscape:space-y-3 landscape:p-4 sm:space-y-5 sm:p-6"
        >
          <div>
            <label
              htmlFor="roomCode"
              className="mb-2 block text-sm font-medium text-white/70"
            >
              Party code
            </label>
            <input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="ABC123"
              className="w-full rounded-xl border border-ktv-card-border bg-white/5 px-4 py-3 font-mono text-lg uppercase tracking-widest text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label
              htmlFor="nickname"
              className="mb-2 block text-sm font-medium text-white/70"
            >
              Your nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Sarah"
              className="w-full rounded-xl border border-ktv-card-border bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            className="ktv-btn-primary w-full rounded-xl py-3 text-base font-bold text-white landscape:py-2.5 sm:py-4 sm:text-lg"
          >
            Join Party
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-white/30">
          Tip: scan the QR code on the host screen to join instantly
        </p>
      </main>
    </div>
  );
}
