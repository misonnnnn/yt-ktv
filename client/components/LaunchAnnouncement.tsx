"use client";

import { useCallback, useEffect, useId, useState } from "react";

const STORAGE_KEY = "tarasing-announcement-dismissed";

const highlights = [
  { icon: "🎤", text: "Create your own karaoke party." },
  { icon: "🎶", text: "Search, queue, and sing your favorite songs." },
  { icon: "📱", text: "Invite your friends and let everyone join the fun." },
];

export default function LaunchAnnouncement() {
  const titleId = useId();
  const [open, setOpen] = useState(false);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Private browsing can block storage. Still close for this visit.
    }
    setOpen(false);
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      // Show the announcement if storage cannot be read.
    }

    const timer = window.setTimeout(() => setOpen(true), 350);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <div
        className="ktv-announcement-backdrop absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="ktv-announcement-panel relative flex max-h-[min(92dvh,680px)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#160d28] shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-purple-500/30 via-pink-500/10 to-transparent" />

        <div className="relative flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
          <span className="text-3xl leading-none" aria-hidden>
            🎉
          </span>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close announcement"
            autoFocus
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg leading-none text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300"
          >
            <span aria-hidden>×</span>
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6">
          <h2
            id={titleId}
            className="mt-3 text-xl font-bold tracking-tight text-white sm:text-2xl"
          >
            Hey there! TaraSing is officially LIVE!
          </h2>

          <div className="mt-3 space-y-3 text-sm leading-relaxed text-white/65">
            <p>
              Our first phase has successfully launched, and I&apos;m so excited
              to finally share TaraSing with you!
            </p>
            <p>
              I&apos;d be more than happy to let you enjoy karaoke nights with
              your friends and family — without the hassle of subscriptions or
              complicated setups.
            </p>
          </div>

          <ul className="my-4 space-y-2">
            {highlights.map((item) => (
              <li
                key={item.text}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-medium text-white/90"
              >
                <span className="text-lg leading-none" aria-hidden>
                  {item.icon}
                </span>
                {item.text}
              </li>
            ))}
          </ul>

          <div className="space-y-3 text-sm leading-relaxed text-white/65">
            <p>
              TaraSing is still growing, and this is just the beginning!
              I&apos;ll continue improving the experience, adding new features,
              and making karaoke nights even more enjoyable for everyone.
            </p>
            <p>
              Since this is our first launch, you might encounter a few bugs or
              things that need improvement. I&apos;d genuinely appreciate your
              feedback and suggestions. They will help make TaraSing better!
            </p>
            <p>
              Thank you for being part of this journey. Whether you&apos;re
              here for a solo session or a full-on karaoke night with friends,
              I hope you have a great time!
            </p>
            <p className="font-medium text-white/80">
              Now, what are you waiting for? Let&apos;s sing!
            </p>
            <p className="pt-1 text-white/45">— The TaraSing Team</p>
          </div>
        </div>

        <div className="relative border-t border-white/10 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
          <button
            type="button"
            onClick={dismiss}
            className="ktv-btn-primary w-full rounded-2xl py-3 text-base font-bold text-white"
          >
            Let&apos;s sing
          </button>
        </div>
      </div>
    </div>
  );
}
