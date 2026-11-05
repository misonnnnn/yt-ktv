"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { recordPartyVisit } from "@/lib/accountApi";
import { rememberActiveParty } from "@/lib/activeParty";

/** Remember the open party, and attach it to an account when someone is signed in. */
export default function PartyAccountLink({
  roomCode,
  role,
  singerName,
}: {
  roomCode: string;
  role: "host" | "guest";
  singerName?: string;
}) {
  const { user, ready } = useAuth();

  useEffect(() => {
    if (!roomCode) return;
    rememberActiveParty(roomCode, singerName || "", role);
  }, [roomCode, singerName, role]);

  useEffect(() => {
    if (!ready || !user || !roomCode) return;
    void recordPartyVisit(roomCode, role).catch(() => {});
  }, [ready, user, roomCode, role]);

  return null;
}
