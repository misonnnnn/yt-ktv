"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LibraryShell from "@/components/LibraryShell";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { Notice, fieldClass } from "@/components/LibrarySong";
import { useAuth } from "@/components/AuthProvider";
import {
  changePassword,
  deleteAccount,
  loginWithGoogle,
  logoutAccount,
  resendVerification,
  updateProfile,
} from "@/lib/accountApi";

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName);
    setAvatarUrl(user.avatarUrl || "");
  }, [user]);

  if (!user) return <LibraryShell title="My Profile">{null}</LibraryShell>;

  const created = new Date(user.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    try {
      const data = await updateProfile({ displayName, avatarUrl });
      setUser(data.user);
      setNotice("Profile saved. This does not change your Google account.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    try {
      const data = await changePassword({
        currentPassword,
        password,
        confirmPassword,
      });
      setUser(data.user);
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      setNotice("Password saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password");
    }
  }

  async function handleDelete(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await deleteAccount(
        user?.hasPassword
          ? { password: deletePassword }
          : { confirm: deleteConfirm }
      );
      setUser(null);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete account");
    }
  }

  async function handleLogout() {
    await logoutAccount().catch(() => {});
    setUser(null);
    router.push("/");
  }

  return (
    <LibraryShell
      title="My Profile"
      intro="Your TaraSing profile. Google sign-in only confirms who you are. It does not ask for YouTube permissions."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {error && (
          <div className="lg:col-span-2">
            <Notice>{error}</Notice>
          </div>
        )}
        {notice && (
          <div className="lg:col-span-2">
            <Notice tone="ok">{notice}</Notice>
          </div>
        )}

        <section className="space-y-4 rounded-3xl border border-ktv-card-border bg-ktv-card/70 p-5">
          <div className="flex items-center gap-4">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-500 text-2xl font-bold">
                {user.displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-lg font-semibold text-white">{user.displayName}</p>
              <p className="text-sm text-white/50">{user.email}</p>
              <p className="text-xs text-white/35">Joined {created}</p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-3">
            <label className="block text-sm text-white/60">
              Display name
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className={`${fieldClass} mt-1`}
              />
            </label>
            <label className="block text-sm text-white/60">
              Profile picture https link
              <input
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="https://"
                className={`${fieldClass} mt-1`}
              />
            </label>
            <p className="text-xs text-white/35">
              Email stays {user.email}.{" "}
              {user.emailVerified ? "Verified." : "Not verified yet."}
            </p>
            {!user.emailVerified && (
              <button
                type="button"
                onClick={() => {
                  void resendVerification()
                    .then((data) => setNotice(data.message || "Check your email."))
                    .catch((err: unknown) =>
                      setError(err instanceof Error ? err.message : "Could not send email")
                    );
                }}
                className="text-sm text-purple-300 hover:underline"
              >
                Resend verification email
              </button>
            )}
            <button
              type="submit"
              className="ktv-btn-primary rounded-xl px-4 py-2 text-sm font-bold text-white"
            >
              Save profile
            </button>
          </form>
        </section>

        <div className="space-y-4">
          <section className="rounded-3xl border border-ktv-card-border bg-ktv-card/70 p-5">
            <h2 className="mb-3 font-semibold text-white">
              {user.hasPassword ? "Change password" : "Set a password"}
            </h2>
            <form onSubmit={savePassword} className="space-y-3">
              {user.hasPassword && (
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className={fieldClass}
                />
              )}
              <input
                type="password"
                autoComplete="new-password"
                placeholder="New password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={fieldClass}
              />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={fieldClass}
              />
              <button
                type="submit"
                className="ktv-btn-secondary rounded-xl px-4 py-2 text-sm text-white"
              >
                Save password
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-ktv-card-border bg-ktv-card/70 p-5">
            <h2 className="mb-3 font-semibold text-white">Google</h2>
            <p className="mb-3 text-sm text-white/50">
              Connect the Google account that uses {user.email}.
            </p>
            <GoogleSignInButton
              onCredential={(credential) => {
                void loginWithGoogle(credential)
                  .then((data) => {
                    setUser(data.user);
                    setNotice("Google is connected to this account.");
                  })
                  .catch((err: unknown) =>
                    setError(err instanceof Error ? err.message : "Could not connect Google")
                  );
              }}
            />
          </section>

          <section className="rounded-3xl border border-red-500/20 bg-red-500/5 p-5">
            <h2 className="mb-2 font-semibold text-white">Delete account</h2>
            <p className="mb-3 text-sm text-white/50">
              This removes your profile, favorites, playlists, and history right away.
              Open karaoke parties stay up.
            </p>
            <form onSubmit={handleDelete} className="space-y-3">
              {user.hasPassword ? (
                <input
                  type="password"
                  placeholder="Password"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  className={fieldClass}
                />
              ) : (
                <input
                  placeholder="Type DELETE"
                  value={deleteConfirm}
                  onChange={(event) => setDeleteConfirm(event.target.value)}
                  className={fieldClass}
                />
              )}
              <button
                type="submit"
                className="rounded-xl bg-red-500/80 px-4 py-2 text-sm font-semibold text-white"
              >
                Delete my account
              </button>
            </form>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="mt-4 text-sm text-white/50 hover:text-white"
            >
              Log out
            </button>
          </section>
        </div>
      </div>
    </LibraryShell>
  );
}
