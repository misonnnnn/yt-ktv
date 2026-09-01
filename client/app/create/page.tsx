"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createRoom } from "@/lib/api";

export default function CreatePartyPage() {
  const router = useRouter();
  const [partyName, setPartyName] = useState("Karaoke Night");
  const [hostName, setHostName] = useState("John");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await createRoom(
        partyName.trim() || "Karaoke Night",
        hostName.trim() || "Host"
      );

      const params = new URLSearchParams({
        room: data.room.roomCode,
        party: data.room.partyName,
        host: data.room.hostName,
      });
      router.push(`/host?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create party");
    } finally {
      setLoading(false);
    }
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
          <div className="mb-4 text-4xl">🎉</div>
          <h1 className="text-3xl font-bold text-white">Create a Party</h1>
          <p className="mt-2 text-white/50">
            Set up your karaoke room and share the QR code with friends.
          </p>
        </div>

        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-ktv-card-border bg-ktv-card/60 p-6 space-y-5"
        >
          {error && (
            <div className="rounded-xl bg-red-500/20 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="partyName"
              className="mb-2 block text-sm font-medium text-white/70"
            >
              Party name
            </label>
            <input
              id="partyName"
              type="text"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder="Karaoke Night"
              className="w-full rounded-xl border border-ktv-card-border bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label
              htmlFor="hostName"
              className="mb-2 block text-sm font-medium text-white/70"
            >
              Your nickname (host)
            </label>
            <input
              id="hostName"
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="John"
              className="w-full rounded-xl border border-ktv-card-border bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="ktv-btn-primary w-full rounded-xl py-4 text-lg font-bold text-white disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Party"}
          </button>
        </form>
      </main>
    </div>
  );
}
