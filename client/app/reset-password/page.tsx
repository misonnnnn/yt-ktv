"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import AuthCard from "@/components/AuthCard";
import { useAuth } from "@/components/AuthProvider";
import { Notice, fieldClass } from "@/components/LibrarySong";
import { resetPassword } from "@/lib/accountApi";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await resetPassword({ token, password, confirmPassword });
      setUser(data.user);
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Choose a new password" subtitle="This also confirms your email.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Notice>{error}</Notice>}
        {!token && <Notice>This reset link is missing a token.</Notice>}
        <input
          type="password"
          required
          autoComplete="new-password"
          placeholder="New password"
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
        <button
          type="submit"
          disabled={loading || !token}
          className="ktv-btn-primary w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save password"}
        </button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="ktv-bg min-h-dvh" />}>
      <ResetForm />
    </Suspense>
  );
}
