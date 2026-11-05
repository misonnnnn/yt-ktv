"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import LibraryShell from "@/components/LibraryShell";
import { activePartyPath, readActiveParty } from "@/lib/activeParty";

export default function SingPage() {
  const [partyCode, setPartyCode] = useState("");
  const [partyPath, setPartyPath] = useState("");

  useEffect(() => {
    const party = readActiveParty();
    setPartyCode(party.roomCode);
    setPartyPath(activePartyPath());
  }, []);

  return (
    <LibraryShell
      title="Sing"
      intro="Host the karaoke screen, or join a party from your phone."
      allowGuests
    >
      <div className="space-y-4">
        {partyCode && partyPath && (
          <Link
            href={partyPath}
            className="flex items-center justify-between gap-3 rounded-2xl border border-purple-400/30 bg-purple-500/10 px-4 py-3"
          >
            <span>
              <span className="block text-sm font-semibold text-white">
                Back to your party
              </span>
              <span className="text-xs tracking-widest text-purple-200">
                {partyCode}
              </span>
            </span>
            <span className="text-sm text-purple-200">Open</span>
          </Link>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/create"
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-600 to-pink-500 p-6 text-white shadow-lg"
          >
            <p className="text-3xl">📺</p>
            <h2 className="mt-4 text-2xl font-bold">Host a party</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/85">
              Open this on the TV or laptop. Share the QR code, then let friends
              add songs from their phones.
            </p>
          </Link>

          <Link
            href="/join"
            className="rounded-3xl border border-ktv-card-border bg-ktv-card/80 p-6"
          >
            <p className="text-3xl">📱</p>
            <h2 className="mt-4 text-2xl font-bold text-white">Join a party</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              Enter the code from the host screen, search for a karaoke video,
              and add it to the queue.
            </p>
          </Link>
        </div>
      </div>
    </LibraryShell>
  );
}
