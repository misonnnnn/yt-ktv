"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { getAdminStats, type AdminStats } from "@/lib/api";

const STORAGE_KEY = "tarasing_admin_secret";

function StatCard({
  label,
  rooms,
  songs,
  views,
}: {
  label: string;
  rooms: number;
  songs: number;
  views: number;
}) {
  return (
    <div className="rounded-2xl border border-ktv-card-border bg-ktv-card/60 p-4 sm:p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-purple-300">
        {label}
      </h2>
      <dl className="space-y-2 text-sm sm:text-base">
        <div className="flex justify-between gap-4">
          <dt className="text-white/50">Rooms created</dt>
          <dd className="font-semibold text-white">{rooms}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-white/50">Songs queued</dt>
          <dd className="font-semibold text-white">{songs}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-white/50">Homepage visits</dt>
          <dd className="font-semibold text-white">{views}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadStats(adminSecret: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminStats(adminSecret);
      setStats(data);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(STORAGE_KEY, adminSecret);
      }
    } catch (err) {
      setStats(null);
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? sessionStorage.getItem(STORAGE_KEY)
        : null;
    if (!saved) return;
    setSecret(saved);
    void loadStats(saved);
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = secret.trim();
    if (!trimmed) return;
    void loadStats(trimmed);
  }

  function handleLogout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setSecret("");
    setStats(null);
    setError(null);
  }

  return (
    <div className="ktv-bg flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-4 sm:py-6">
        <Link
          href="/"
          className="text-sm font-medium text-white/50 transition hover:text-white/80"
        >
          ← TaraSing
        </Link>
        {stats && (
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-white/40 hover:text-white/70"
          >
            Lock
          </button>
        )}
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-6 pb-12">
        <h1 className="mb-2 text-3xl font-extrabold text-white">Admin</h1>
        <p className="mb-8 text-sm text-white/45">
          Simple usage stats for TaraSing parties and homepage visits.
        </p>

        {!stats && (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-ktv-card-border bg-ktv-card/60 p-5"
          >
            <label className="mb-2 block text-sm text-white/60" htmlFor="secret">
              Admin secret
            </label>
            <input
              id="secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="mb-4 w-full rounded-xl border border-ktv-card-border bg-black/30 px-4 py-3 text-white outline-none focus:border-purple-400"
              placeholder="ADMIN_SECRET"
              autoComplete="current-password"
            />
            <button
              type="submit"
              disabled={loading || !secret.trim()}
              className="ktv-btn-primary w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {loading ? "Loading..." : "View stats"}
            </button>
            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
          </form>
        )}

        {stats && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-white/40">
                Live now: {stats.liveConnectedUsers} user
                {stats.liveConnectedUsers === 1 ? "" : "s"} in{" "}
                {stats.liveConnectedRooms} room
                {stats.liveConnectedRooms === 1 ? "" : "s"}
              </p>
              <button
                type="button"
                onClick={() => void loadStats(secret.trim())}
                disabled={loading}
                className="text-sm text-purple-300 hover:text-purple-200 disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <StatCard
              label="Today"
              rooms={stats.today.roomsCreated}
              songs={stats.today.songsQueued}
              views={stats.today.homepageViews}
            />
            <StatCard
              label="Last 7 days"
              rooms={stats.last7Days.roomsCreated}
              songs={stats.last7Days.songsQueued}
              views={stats.last7Days.homepageViews}
            />
            <StatCard
              label="Last 30 days"
              rooms={stats.last30Days.roomsCreated}
              songs={stats.last30Days.songsQueued}
              views={stats.last30Days.homepageViews}
            />

            {error && <p className="text-sm text-red-300">{error}</p>}
          </div>
        )}
      </main>
    </div>
  );
}
