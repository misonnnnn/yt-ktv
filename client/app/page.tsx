import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute:
      "Free Online Karaoke – Sing Karaoke Online With Friends | TaraSing",
  },
  description:
    "Free online karaoke for parties at home. Host on your TV or laptop, friends join from their phones, pick YouTube songs, and sing together — no app download needed.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Free Online Karaoke – Sing Karaoke Online With Friends | TaraSing",
    description:
      "Free online karaoke on any TV or laptop. Friends scan a QR code, pick songs on their phones, and sing together — no app needed.",
    url: "/",
  },
};

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
    question: "Can I use my TV as the karaoke screen?",
    answer:
      "Yes. Open TaraSing on a smart TV browser, a laptop connected to a TV, or any large screen. That device becomes the karaoke stage while everyone else uses their phones.",
  },
  {
    question: "What songs can I sing?",
    answer:
      "Song search uses YouTube karaoke videos, so you can find popular tracks, OPM, and party favorites as karaoke versions online.",
  },
];

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

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-6 py-10 text-center landscape:py-6 sm:py-16">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600 to-pink-500 text-3xl ktv-glow landscape:mb-3 landscape:h-12 landscape:w-12 sm:mb-6 sm:h-20 sm:w-20 sm:text-4xl">
          🎤
        </div>

        <p className="mb-2 text-lg font-semibold text-purple-300/90 landscape:text-base sm:text-xl">
          TaraSing
        </p>

        <h1 className="mb-3 bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent landscape:mb-2 landscape:text-3xl sm:mb-4 sm:text-6xl md:text-7xl">
          Free Online Karaoke
        </h1>

        <p className="mb-2 text-lg font-medium text-white/80 landscape:text-base sm:text-2xl">
          Sing karaoke online with friends — no app needed
        </p>

        <p className="mb-8 max-w-lg text-sm leading-relaxed text-white/50 landscape:mb-5 sm:mb-12 sm:text-lg">
          Host free online karaoke on any TV or laptop. Friends join from their
          phones, pick YouTube karaoke songs, and sing together in the browser.
        </p>

        <div className="flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-4">
          <Link
            href="/create"
            className="ktv-btn-primary rounded-2xl px-8 py-3 text-base font-bold text-white landscape:py-2.5 sm:py-4 sm:text-lg"
          >
            Create Party
          </Link>
          <Link
            href="/join"
            className="ktv-btn-secondary rounded-2xl px-8 py-3 text-base font-semibold text-white landscape:py-2.5 sm:py-4 sm:text-lg"
          >
            Join Party
          </Link>
        </div>

        <div className="mt-12 grid w-full max-w-2xl grid-cols-1 gap-4 landscape:mt-8 sm:mt-20 sm:grid-cols-3">
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

        <section className="mt-16 w-full max-w-2xl text-left landscape:mt-12 sm:mt-24">
          <h2 className="mb-3 text-center text-2xl font-bold text-white sm:text-3xl">
            Sing Karaoke Online for Free
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-white/50 sm:text-base">
            TaraSing is free online karaoke you open in a browser — no
            subscription and no app store download. Create a party, share it
            with friends, and start singing with YouTube karaoke tracks in
            minutes.
          </p>
          <p className="text-sm leading-relaxed text-white/50 sm:text-base">
            Whether it&apos;s a birthday, house party, or a quiet night in, you
            get a shared song queue everyone can add to.{" "}
            <Link
              href="/free-online-karaoke"
              className="text-purple-300/90 underline-offset-2 hover:underline"
            >
              Learn more about free online karaoke
            </Link>
            .
          </p>
        </section>

        <section className="mt-16 w-full max-w-2xl text-left landscape:mt-12 sm:mt-24">
          <h2 className="mb-3 text-center text-2xl font-bold text-white sm:text-3xl">
            Karaoke With Friends
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-white/50 sm:text-base">
            Online karaoke is better with a group. One person hosts the party
            screen while friends join with their phones, search for songs, and
            add their picks to the queue — so nobody has to fight over one
            remote.
          </p>
          <p className="text-sm leading-relaxed text-white/50 sm:text-base">
            Guests can be in the same room or joining remotely as long as they
            have the party code.{" "}
            <Link
              href="/karaoke-with-friends"
              className="text-purple-300/90 underline-offset-2 hover:underline"
            >
              See how karaoke with friends works
            </Link>
            .
          </p>
        </section>

        <section className="mt-16 w-full max-w-2xl text-left landscape:mt-12 sm:mt-24">
          <h2 className="mb-3 text-center text-2xl font-bold text-white sm:text-3xl">
            Use Your TV as a Karaoke Screen
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-white/50 sm:text-base">
            Put the lyrics and video on the biggest screen you have. Open
            TaraSing on a smart TV browser, a laptop HDMI-connected to your TV,
            or a streaming stick that supports a web browser. That device stays
            on the host screen while everyone else uses their phones.
          </p>
          <p className="text-sm leading-relaxed text-white/50 sm:text-base">
            No special karaoke machine required — just a screen and speakers.{" "}
            <Link
              href="/karaoke-on-smart-tv"
              className="text-purple-300/90 underline-offset-2 hover:underline"
            >
              Tips for karaoke on a smart TV
            </Link>
            .
          </p>
        </section>

        <section className="mt-16 w-full max-w-2xl text-left landscape:mt-12 sm:mt-24">
          <h2 className="mb-3 text-center text-2xl font-bold text-white sm:text-3xl">
            How TaraSing Works
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

          <div className="mt-8 text-center">
            <Link
              href="/create"
              className="ktv-btn-primary inline-block rounded-2xl px-8 py-3 text-base font-bold text-white"
            >
              Create your karaoke party
            </Link>
          </div>
        </section>

        <section className="mt-16 w-full max-w-2xl text-left landscape:mt-12 sm:mt-24">
          <h2 className="mb-3 text-center text-2xl font-bold text-white sm:text-3xl">
            FAQ
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

        <section className="mt-16 w-full max-w-2xl landscape:mt-12 sm:mt-24">
          <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
            Popular karaoke guides
          </h2>
          <p className="mb-6 text-sm text-white/45 sm:text-base">
            More ways to explore online karaoke and videoke with TaraSing.
          </p>
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-3 text-sm">
            {[
              { href: "/free-online-karaoke", label: "Free online karaoke" },
              { href: "/online-karaoke", label: "Online karaoke" },
              { href: "/online-videoke", label: "Online videoke" },
              { href: "/karaoke-with-friends", label: "Karaoke with friends" },
              { href: "/karaoke-on-smart-tv", label: "Karaoke on smart TV" },
              { href: "/karaoke-philippines", label: "Karaoke Philippines" },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-purple-300/90 underline-offset-2 hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="px-6 py-8 text-center text-xs text-white/30">
        TaraSing — free online karaoke for parties at home
      </footer>
    </div>
  );
}
