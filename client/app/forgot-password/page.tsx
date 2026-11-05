"use client";

import Link from "next/link";
import { useState } from "react";
import AuthCard from "@/components/AuthCard";
import { Notice, fieldClass } from "@/components/LibrarySong";
import { forgotPassword } from "@/lib/accountApi";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const data = await forgotPassword(email);
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Forgot password"
      subtitle="We’ll email a reset link when mail is configured."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Notice>{error}</Notice>}
        {message && <Notice tone="ok">{message}</Notice>}
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClass}
        />
        <button
          type="submit"
          disabled={loading}
          className="ktv-btn-primary w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm">
        <Link href="/login" className="text-purple-300 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
