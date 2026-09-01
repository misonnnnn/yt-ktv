"use client";

import { QRCodeSVG } from "qrcode.react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import YouTubePlaceholder from "@/components/YouTubePlaceholder";
import Queue from "@/components/Queue";
import {
  mockCurrentSong,
  mockParty,
  mockQueue,
} from "@/lib/mock-data";

function HostScreenContent() {
  const searchParams = useSearchParams();

  const partyName = searchParams.get("party") || mockParty.name;
  const hostName = searchParams.get("host") || mockParty.hostName;
  const roomId = searchParams.get("room") || mockParty.roomId;
  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${roomId}`
      : `http://localhost:3000/join/${roomId}`;

  return (
    <div className="min-h-full bg-[#08040f]">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-ktv-card-border px-6 py-4 lg:px-10">
        <div>
          <h1 className="text-xl font-bold text-white lg:text-2xl">
            {partyName}
          </h1>
          <p className="text-sm text-white/50">Hosted by {hostName}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Party code
            </p>
            <p className="font-mono text-lg font-bold tracking-widest text-purple-300">
              {roomId}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <span className="text-sm text-white/70">
              {mockParty.guestCount} guests
            </span>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_320px] lg:gap-8 lg:p-10 xl:grid-cols-[1fr_360px]">
        {/* Left: player + now singing */}
        <div className="flex flex-col gap-6">
          <YouTubePlaceholder
            title={mockCurrentSong.title}
            artist={mockCurrentSong.artist}
          />

          <div className="rounded-2xl border border-ktv-card-border bg-ktv-card/60 p-6 lg:p-8">
            <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-pink-400">
              Now Singing
            </p>
            <p className="text-4xl font-extrabold text-white lg:text-5xl">
              {mockCurrentSong.singer}
            </p>
            <p className="mt-4 text-2xl font-bold text-white/90 lg:text-3xl">
              {mockCurrentSong.title}
            </p>
            <p className="mt-1 text-lg text-white/50 lg:text-xl">
              {mockCurrentSong.artist}
            </p>
          </div>
        </div>

        {/* Right sidebar: QR + queue */}
        <div className="flex flex-col gap-6">
          {/* QR code card */}
          <div className="flex flex-col items-center rounded-2xl border border-ktv-card-border bg-ktv-card/60 p-6">
            <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-purple-300">
              Scan to Join
            </p>
            <p className="mb-4 text-xs text-white/40">
              Guests use their phone — no video on guest devices
            </p>
            <div className="rounded-xl bg-white p-3">
              <QRCodeSVG value={joinUrl} size={160} level="M" />
            </div>
            <p className="mt-4 font-mono text-sm tracking-widest text-white/60">
              {roomId}
            </p>
          </div>

          <Queue items={mockQueue} title="Up Next" />
        </div>
      </main>
    </div>
  );
}

export default function HostPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-[#08040f] text-white/50">
          Loading host screen...
        </div>
      }
    >
      <HostScreenContent />
    </Suspense>
  );
}
