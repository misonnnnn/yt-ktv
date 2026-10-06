import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { CONTACT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "TaraSing Terms of Use, including agreement to the YouTube Terms of Service.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use">
      <p>Last updated: September 30, 2026</p>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white sm:text-xl">1. About TaraSing</h2>
        <p>
          TaraSing is a free online karaoke service that lets people host a party
          on a TV or laptop and join from their phones to queue and sing along to
          YouTube karaoke videos.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white sm:text-xl">
          2. YouTube Terms of Service
        </h2>
        <p>
          TaraSing uses YouTube API Services to search for and play videos. By
          using TaraSing, you agree to be bound by the{" "}
          <a
            href="https://www.youtube.com/t/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-300 underline hover:text-purple-200"
          >
            YouTube Terms of Service
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white sm:text-xl">3. Acceptable use</h2>
        <p>
          You may use TaraSing only for lawful, personal karaoke parties. Do not
          abuse the service, disrupt other parties, or attempt to misuse YouTube
          content or our systems.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white sm:text-xl">4. Contact</h2>
        <p>
          Questions about these terms:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-purple-300 underline hover:text-purple-200"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
