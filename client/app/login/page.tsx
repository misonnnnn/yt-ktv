"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import AuthCard, { safeNextPath } from "@/components/AuthCard";
import { useAuth } from "@/components/AuthProvider";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { Notice, fieldClass } from "@/components/LibrarySong";
import { loginAccount, loginWithGoogle } from "@/lib/accountApi";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nextPath = safeNextPath(searchParams.get("next"));

  async function finish(user: Parameters<typeof setUser>[0]) {
    setUser(user);
    router.push(nextPath);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await loginAccount(email, password);
      await finish(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle(credential: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await loginWithGoogle(credential);
      await finish(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Sign in"
      subtitle="Optional. Guests can still host and join karaoke parties."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Notice>{error}</Notice>}
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClass}
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={fieldClass}
        />
        <button
          type="submit"
          disabled={loading}
          className="ktv-btn-primary w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="mt-3 text-right text-sm">
        <Link href="/forgot-password" className="text-purple-300 hover:underline">
          Forgot password?
        </Link>
      </p>
      <div className="my-5 h-px bg-white/10" />
      <GoogleSignInButton onCredential={(credential) => void handleGoogle(credential)} />
      <p className="mt-5 text-center text-sm text-white/50">
        New here?{" "}
        <Link href="/register" className="text-purple-300 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="ktv-bg min-h-dvh" />}>
      <LoginForm />
    </Suspense>
  );
}
