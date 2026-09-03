import Link from "next/link";

export default function HomePage() {
  return (
    <div className="ktv-bg flex min-h-full flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        {/* Logo / branding */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600 to-pink-500 text-4xl ktv-glow">
          🎤
        </div>

        <h1 className="mb-4 bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl md:text-7xl">
          TaraSing
        </h1>

        <p className="mb-2 text-xl font-medium text-white/80 sm:text-2xl">
          Your living room. Your stage. Let's sing!
        </p>

        <p className="mb-12 max-w-lg text-base leading-relaxed text-white/50 sm:text-lg">
          Turn any TV or laptop into a karaoke machine. Friends scan a QR code,
          pick songs from their phones, and sing along together — no app
          download needed.
        </p>

        <div className="flex w-full max-w-sm flex-col gap-4 sm:max-w-none sm:flex-row sm:justify-center">
          <Link
            href="/create"
            className="ktv-btn-primary rounded-2xl px-8 py-4 text-lg font-bold text-white"
          >
            Create Party
          </Link>
          <Link
            href="/join"
            className="ktv-btn-secondary rounded-2xl px-8 py-4 text-lg font-semibold text-white"
          >
            Join Party
          </Link>
        </div>

        {/* Feature hints */}
        <div className="mt-20 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: "📺", label: "Host on the big screen" },
            { icon: "📱", label: "Guests control from phones" },
            { icon: "🎵", label: "YouTube karaoke songs" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-ktv-card-border bg-ktv-card/40 px-4 py-5"
            >
              <div className="mb-2 text-2xl">{item.icon}</div>
              <p className="text-sm text-white/60">{item.label}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-white/30">
        KaraokeTV — UI preview with mock data
      </footer>
    </div>
  );
}
