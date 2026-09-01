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
    const code = roomCode.trim().toUpperCase() || "KTV-7X2M";
    const params = new URLSearchParams();
    if (nickname.trim()) params.set("name", nickname.trim());
    const qs = params.toString();
    router.push(`/join/${code}${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="ktv-bg flex min-h-full flex-1 flex-col">
      <header className="px-6 py-6">
        <Link
          href="/"
          className="text-sm text-white/50 transition hover:text-white/80"
        >
          ← Back to home
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-16">
        <div className="mb-8 text-center">
          <div className="mb-4 text-4xl">📱</div>
          <h1 className="text-3xl font-bold text-white">Join a Party</h1>
          <p className="mt-2 text-white/50">
            Enter the party code shown on the host screen.
          </p>
        </div>

        <form
          onSubmit={handleJoin}
          className="rounded-2xl border border-ktv-card-border bg-ktv-card/60 p-6 space-y-5"
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
              placeholder="KTV-7X2M"
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
            className="ktv-btn-primary w-full rounded-xl py-4 text-lg font-bold text-white"
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
