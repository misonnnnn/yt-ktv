"use client";

import { useEffect, useState } from "react";
import LibraryShell from "@/components/LibraryShell";
import { Notice } from "@/components/LibrarySong";
import { useAuth } from "@/components/AuthProvider";
import { getActivity, type Activity } from "@/lib/accountApi";

function formatWhen(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const cards = [
  { key: "turnsStarted", label: "Turns started", hint: "Your request reached the stage" },
  { key: "songsRequested", label: "Songs requested", hint: "Added while you were signed in" },
  { key: "partiesHosted", label: "Parties hosted", hint: "Parties you created" },
  { key: "partiesJoined", label: "Parties joined", hint: "Other parties you entered" },
] as const;

export default function ActivityPage() {
  const { user, ready } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    getActivity()
      .then((data) => {
        if (!cancelled) setActivity(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load activity");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [ready, user]);

  return (
    <LibraryShell
      title="My Activity"
      intro="Your TaraSing parties and song requests. This is not a YouTube listening chart, and songs in someone else’s queue are not added to your counts."
    >
      {error && <Notice>{error}</Notice>}
      {!activity && !error && <p className="text-sm text-white/40">Loading activity...</p>}
      {activity && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {cards.map((card) => (
              <section
                key={card.key}
                className="rounded-3xl border border-ktv-card-border bg-ktv-card/70 p-5"
              >
                <p className="text-sm text-white/45">{card.label}</p>
                <p className="mt-2 text-4xl font-bold text-white">{activity[card.key]}</p>
                <p className="mt-2 text-xs text-white/35">{card.hint}</p>
              </section>
            ))}
          </div>

          <section className="rounded-3xl border border-ktv-card-border bg-ktv-card/50 p-5">
            <h2 className="text-lg font-semibold text-white">Recent requests</h2>
            {activity.recentRequests.length === 0 ? (
              <p className="mt-3 text-sm text-white/45">No requests yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-white/5">
                {activity.recentRequests.map((song) => (
                  <li key={song.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {song.title || "Saved video"}
                      </p>
                      <p className="truncate text-xs text-white/40">
                        {song.artist || "YouTube"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-white/40">
                      {song.startedAt ? "Turn started" : "Requested"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-3xl border border-ktv-card-border bg-ktv-card/50 p-5">
            <h2 className="text-lg font-semibold text-white">Recent parties</h2>
            {activity.recentParties.length === 0 ? (
              <p className="mt-3 text-sm text-white/45">No parties yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-white/5">
                {activity.recentParties.map((party) => (
                  <li
                    key={`${party.role}-${party.roomCode}`}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        {party.partyName || party.roomCode}
                      </p>
                      <p className="text-xs text-white/40">
                        {party.role === "host" ? "Hosted" : "Joined"} · {party.roomCode}
                      </p>
                    </div>
                    <span className="text-xs text-white/40">{formatWhen(party.visitedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </LibraryShell>
  );
}
