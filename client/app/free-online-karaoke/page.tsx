import type { Metadata } from "next";
import {
  relatedLinksExcept,
  SeoPage,
} from "@/components/SeoPage";

export const metadata: Metadata = {
  title: "Free Online Karaoke",
  description:
    "Sing free online karaoke in your browser with TaraSing. Host on a TV or laptop, friends join from phones, and queue YouTube karaoke songs — no app download.",
  alternates: {
    canonical: "/free-online-karaoke",
  },
  openGraph: {
    title: "Free Online Karaoke | TaraSing",
    description:
      "Free browser-based karaoke for home parties. No app, no subscription — just create a party and sing.",
    url: "/free-online-karaoke",
  },
};

const faqs = [
  {
    question: "Is TaraSing really free?",
    answer:
      "Yes. Creating a party and singing with friends on TaraSing does not require a paid subscription or app purchase.",
  },
  {
    question: "What do I need to start free online karaoke?",
    answer:
      "A device with a browser for the host screen (TV, laptop, or tablet) and phones for guests. An internet connection is enough.",
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

export default function FreeOnlineKaraokePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <SeoPage
        h1="Free Online Karaoke"
        intro="Want karaoke night without buying a machine or downloading apps? TaraSing is free online karaoke you can start in your browser in a few taps."
        ctaLabel="Create a free karaoke party"
        sections={[
          {
            heading: "What free online karaoke means here",
            paragraphs: [
              "TaraSing runs in the browser. You create a party on a big screen, share a code or QR with friends, and everyone adds songs from their phones. There is no paid “pro” tier required to host a normal party.",
              "Songs come from YouTube karaoke videos, so you can search for popular hits and sing-along tracks without managing a private song library.",
            ],
          },
          {
            heading: "Why people choose browser karaoke",
            paragraphs: [
              "App installs slow a party down — guests forget passwords, storage fills up, or someone has the wrong phone OS. With TaraSing, friends open a link, enter the party code, and start picking songs.",
              "The host keeps the lyrics and video on the TV or laptop while the queue stays shared. That split keeps the living room focused on singing, not on passing one phone around.",
            ],
          },
          {
            heading: "Good for last-minute parties",
            paragraphs: [
              "If friends are already over and someone says “tara, karaoke,” you can be live in minutes. Open the site on the screen you already own, create a party, and let guests join from the couches.",
              "No cables to a karaoke box, no disc library, and no arguing over who gets the tablet. Everyone queues their own turn.",
            ],
          },
        ]}
        faqs={faqs}
        relatedLinks={relatedLinksExcept("/free-online-karaoke")}
      />
    </>
  );
}
