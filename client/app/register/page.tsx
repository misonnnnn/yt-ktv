"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthCard from "@/components/AuthCard";
import { useAuth } from "@/components/AuthProvider";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { Notice, fieldClass } from "@/components/LibrarySong";
import { loginWithGoogle, registerAccount, resendVerification } from "@/lib/accountApi";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const data = await registerAccount({
        displayName,
        email,
        password,
        confirmPassword,
      });
      setSentTo(data.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!sentTo) return;
    setLoading(true);
    setError(null);
    try {
      const data = await resendVerification(sentTo);
      setNotice(data.message || "A new confirmation link is on the way.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend the email");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle(credential: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await loginWithGoogle(credential);
      setUser(data.user);
      router.push("/favorites");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  if (sentTo) {
    return (
      <AuthCard
        title="Check your email"
        subtitle="The account is created only after you open the link."
      >
        <div className="space-y-4">
          {error && <Notice>{error}</Notice>}
          {notice && <Notice tone="ok">{notice}</Notice>}
          <Notice tone="ok">
            {`We sent a confirmation link to ${sentTo}. If that inbox is not real, no TaraSing account is created.`}
          </Notice>
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={loading}
            className="ktv-btn-secondary w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Sending..." : "Resend email"}
          </button>
          <p className="text-center text-sm text-white/50">
            Already confirmed?{" "}
            <Link href="/login" className="text-purple-300 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create account"
      subtitle="We'll email you a confirmation link. Karaoke still works without an account."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Notice>{error}</Notice>}
        <input
          required
          autoComplete="nickname"
          placeholder="Display name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className={fieldClass}
        />
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
          autoComplete="new-password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={fieldClass}
        />
        <input
          type="password"
          required
          autoComplete="new-password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className={fieldClass}
        />
        <p className="text-xs text-white/40">
          Use at least 8 characters. You need to open the email link before the
          account can sign in.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="ktv-btn-primary w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
      <div className="my-5 h-px bg-white/10" />
      <GoogleSignInButton onCredential={(credential) => void handleGoogle(credential)} />
      <p className="mt-5 text-center text-sm text-white/50">
        Already have an account?{" "}
        <Link href="/login" className="text-purple-300 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
