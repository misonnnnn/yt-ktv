import type { Metadata } from "next";
import {
  relatedLinksExcept,
  SeoPage,
} from "@/components/SeoPage";

export const metadata: Metadata = {
  title: "Online Videoke",
  description:
    "Online videoke for home parties. Host on a TV or laptop with TaraSing, let friends join from their phones, and sing YouTube karaoke tracks together.",
  alternates: {
    canonical: "/online-videoke",
  },
  openGraph: {
    title: "Online Videoke | TaraSing",
    description:
      "Bring videoke night online — big screen for lyrics, phones for song picks, no machine required.",
    url: "/online-videoke",
  },
};

const faqs = [
  {
    question: "Is online videoke the same as online karaoke?",
    answer:
      "They mean the same idea for most people. “Videoke” is the common term in the Philippines for karaoke with on-screen lyrics and video.",
  },
  {
    question: "Can we sing OPM and party classics?",
    answer:
      "Yes. Search YouTube karaoke versions of OPM, ballads, and party anthems, then add them to the shared queue.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default function OnlineVideokePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <SeoPage
        h1="Online Videoke"
        intro="Miss the videoke box but not the setup hassle? Online videoke with TaraSing gives you lyrics on the big screen and song picks on every phone — the same party energy, lighter gear."
        ctaLabel="Start online videoke"
        sections={[
          {
            heading: "Videoke culture, browser-friendly",
            paragraphs: [
              "In the Philippines, videoke is part of birthdays, reunions, and weekend hangouts. Online videoke keeps that ritual going when you do not have a machine plugged into the TV.",
              "Open TaraSing on the screen everyone can see, create a party, and let guests scan in. The queue fills with everyone’s favorites instead of one person holding the mic and the remote.",
            ],
          },
          {
            heading: "OPM, ballads, and party songs",
            paragraphs: [
              "Search for karaoke versions of OPM hits, love songs, and upbeat tracks on YouTube, then add them to the shared list. Guests can queue a duet or a solo while the current singer finishes.",
              "Because song choice lives on phones, shy friends can add a track without walking up to the TV and typing in front of the room.",
            ],
          },
          {
            heading: "No machine, still a full night",
            paragraphs: [
              "You still need a screen, speakers, and people ready to sing — that is the fun part. What you skip is disc updates, remote batteries, and “which USB has the songs?”",
              "Hosting for a Filipino crew abroad? Online videoke works anywhere with internet, so the barkada can keep the tradition even outside the home country.",
            ],
          },
        ]}
        faqs={faqs}
        relatedLinks={relatedLinksExcept("/online-videoke")}
      />
    </>
  );
}
