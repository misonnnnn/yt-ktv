import Link from "next/link";

export type SeoSection = {
  heading: string;
  paragraphs: string[];
};

export type SeoFaq = {
  question: string;
  answer: string;
};

export type SeoRelatedLink = {
  href: string;
  label: string;
};

type SeoPageProps = {
  h1: string;
  intro: string;
  sections: SeoSection[];
  faqs?: SeoFaq[];
  relatedLinks: SeoRelatedLink[];
  ctaLabel?: string;
};

export function SeoPage({
  h1,
  intro,
  sections,
  faqs,
  relatedLinks,
  ctaLabel = "Start a Free Karaoke Party",
}: SeoPageProps) {
  return (
    <div className="ktv-bg flex min-h-full flex-1 flex-col">
      <header className="px-6 py-4 sm:py-6">
        <Link
          href="/"
          className="text-sm font-medium text-white/50 transition hover:text-white/80"
        >
          ← TaraSing
        </Link>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pb-12 sm:pb-16">
        <div className="mb-8 text-center sm:mb-10">
          <p className="mb-2 text-sm font-medium text-purple-300/80">TaraSing</p>
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {h1}
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
            {intro}
          </p>
          <Link
            href="/create"
            className="ktv-btn-primary mt-6 inline-block rounded-2xl px-8 py-3 text-base font-bold text-white"
          >
            {ctaLabel}
          </Link>
        </div>

        <div className="space-y-10 text-left">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-3 text-xl font-bold text-white sm:text-2xl">
                {section.heading}
              </h2>
              {section.paragraphs.map((p, i) => (
                <p
                  key={i}
                  className="mb-3 text-sm leading-relaxed text-white/50 last:mb-0 sm:text-base"
                >
                  {p}
                </p>
              ))}
            </section>
          ))}

          {faqs && faqs.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold text-white sm:text-2xl">
                FAQ
              </h2>
              <div className="space-y-3">
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
          )}

          <section>
            <h2 className="mb-4 text-xl font-bold text-white sm:text-2xl">
              Explore more
            </h2>
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {relatedLinks.map((link) => (
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
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/create"
            className="ktv-btn-primary inline-block rounded-2xl px-8 py-3 text-base font-bold text-white"
          >
            {ctaLabel}
          </Link>
          <p className="mt-3 text-sm text-white/40">
            Or{" "}
            <Link href="/join" className="text-white/60 hover:text-white/80">
              join an existing party
            </Link>
          </p>
        </div>
      </main>

      <footer className="px-6 py-8 text-center text-xs text-white/30">
        <Link href="/" className="hover:text-white/50">
          TaraSing
        </Link>
        {" — "}
        free online karaoke for parties at home
      </footer>
    </div>
  );
}

/** Shared related links for SEO landing pages (exclude the current page). */
export const SEO_LINKS: SeoRelatedLink[] = [
  { href: "/free-online-karaoke", label: "Free online karaoke" },
  { href: "/online-karaoke", label: "Online karaoke" },
  { href: "/online-videoke", label: "Online videoke" },
  { href: "/karaoke-with-friends", label: "Karaoke with friends" },
  { href: "/karaoke-on-smart-tv", label: "Karaoke on smart TV" },
  { href: "/karaoke-philippines", label: "Karaoke Philippines" },
];

export function relatedLinksExcept(pathname: string): SeoRelatedLink[] {
  return SEO_LINKS.filter((link) => link.href !== pathname);
}
