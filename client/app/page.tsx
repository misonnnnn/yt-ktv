import Link from "next/link";

const faqs = [
  {
    question: "Is TaraSing free online karaoke?",
    answer:
      "Yes. TaraSing is free online karaoke you can use in your browser. Create a party, share the code or QR, and start singing — no paid app required.",
  },
  {
    question: "Do I need to download an app?",
    answer:
      "No. Host on a TV, laptop, or tablet browser. Guests join from their phones in the browser and pick songs from there.",
  },
  {
    question: "How does online karaoke with friends work?",
    answer:
      "One person creates a party on the big screen. Friends scan the QR code or enter the party code, search YouTube karaoke songs on their phones, and add them to the shared queue.",
  },
  {
    question: "What songs can I sing?",
    answer:
      "Song search uses YouTube karaoke videos, so you can find popular tracks, OPM, and party favorites as karaoke versions online.",
  },
];

// Helps Google show FAQ rich results for common searches
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function HomePage() {
  return (
    <div className="ktv-bg flex min-h-full flex-1 flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-6 py-16 text-center">
        {/* Logo / branding */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600 to-pink-500 text-4xl ktv-glow">
          🎤
        </div>

        <h1 className="mb-4 bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl md:text-7xl">
          TaraSing
        </h1>

        <p className="mb-2 text-xl font-medium text-white/80 sm:text-2xl">
          Free online karaoke for your next party
        </p>

        <p className="mb-12 max-w-lg text-base leading-relaxed text-white/50 sm:text-lg">
          Host free online karaoke on any TV or laptop. Friends join from their
          phones, pick YouTube karaoke songs, and sing together — no app
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

        {/* How it works — keyword-rich section for Google */}
        <section className="mt-24 w-full max-w-2xl text-left">
          <h2 className="mb-3 text-center text-2xl font-bold text-white sm:text-3xl">
            How free online karaoke works
          </h2>
          <p className="mb-8 text-center text-sm text-white/45 sm:text-base">
            Start an online karaoke night in three simple steps.
          </p>

          <ol className="space-y-4">
            {[
              {
                step: "1",
                title: "Create a party on the big screen",
                text: "Open TaraSing on your TV, laptop, or tablet and create a free online karaoke party.",
              },
              {
                step: "2",
                title: "Friends join from their phones",
                text: "Guests scan the QR code or enter the party code — no app install needed.",
              },
              {
                step: "3",
                title: "Pick songs and sing",
                text: "Search YouTube karaoke tracks, add them to the queue, and sing along together.",
              },
            ].map((item) => (
              <li
                key={item.step}
                className="flex gap-4 rounded-2xl border border-ktv-card-border bg-ktv-card/40 p-4"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-600/80 text-sm font-bold text-white">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/50">
                    {item.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ — useful for "online karaoke free" type queries */}
        <section className="mt-24 w-full max-w-2xl text-left">
          <h2 className="mb-3 text-center text-2xl font-bold text-white sm:text-3xl">
            Online karaoke FAQ
          </h2>
          <p className="mb-8 text-center text-sm text-white/45 sm:text-base">
            Quick answers if you&apos;re looking for free online karaoke.
          </p>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-2xl border border-ktv-card-border bg-ktv-card/40 p-5"
              >
                <h3 className="font-semibold text-white">{faq.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="px-6 py-8 text-center text-xs text-white/30">
        TaraSing — free online karaoke for parties at home
      </footer>
    </div>
  );
}
