"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import AuthCard from "@/components/AuthCard";
import { useAuth } from "@/components/AuthProvider";
import { Notice } from "@/components/LibrarySong";
import { getSession, verifyEmail, type AccountUser } from "@/lib/accountApi";

const verifyOnce = new Map<string, ReturnType<typeof verifyEmail>>();

function verifyEmailOnce(token: string) {
  const existing = verifyOnce.get(token);
  if (existing) return existing;
  const request = verifyEmail(token);
  verifyOnce.set(token, request);
  return request;
}

function VerifyEmail() {
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const token = searchParams.get("token") || "";
  const [message, setMessage] = useState("Checking your link...");
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    function showReady(user: AccountUser) {
      if (!active) return;
      setUser(user);
      setOk(true);
      setMessage("Your email is confirmed. Your TaraSing account is ready.");
    }

    async function confirm() {
      const session = await getSession().catch(() => ({ user: null }));
      if (!active) return;
      if (session.user?.emailVerified) {
        showReady(session.user);
        return;
      }

      if (!token) {
        setOk(false);
        setMessage("This verification link is missing a token.");
        return;
      }

      try {
        const data = await verifyEmailOnce(token);
        if (!active) return;
        if (data.user) {
          showReady(data.user);
          return;
        }
        setOk(true);
        setMessage("Your email is confirmed. Your TaraSing account is ready.");
      } catch (err) {
        const again = await getSession().catch(() => ({ user: null }));
        if (!active) return;
        if (again.user) {
          showReady(again.user);
          return;
        }
        setOk(false);
        setMessage(err instanceof Error ? err.message : "Could not verify email");
      }
    }

    void confirm();
    return () => {
      active = false;
    };
  }, [token, setUser]);

  return (
    <AuthCard
      title="Confirm your email"
      subtitle="This finishes account creation. Karaoke still works for guests."
    >
      {ok === null ? (
        <p className="text-sm text-white/60">{message}</p>
      ) : (
        <Notice tone={ok ? "ok" : "error"}>{message}</Notice>
      )}
      <p className="mt-5 text-center text-sm">
        <Link href={ok ? "/favorites" : "/login"} className="text-purple-300 hover:underline">
          {ok ? "Go to your favorites" : "Back to sign in"}
        </Link>
      </p>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="ktv-bg min-h-dvh" />}>
      <VerifyEmail />
    </Suspense>
  );
}
