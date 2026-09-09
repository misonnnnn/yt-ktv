import type { Metadata } from "next";
import {
  relatedLinksExcept,
  SeoPage,
} from "@/components/SeoPage";

export const metadata: Metadata = {
  title: "Karaoke on Smart TV",
  description:
    "Use your smart TV as a karaoke screen with TaraSing. Host the party in the TV browser, friends join from phones, and lyrics play on the big display.",
  alternates: {
    canonical: "/karaoke-on-smart-tv",
  },
  openGraph: {
    title: "Karaoke on Smart TV | TaraSing",
    description:
      "Turn a smart TV or HDMI laptop into your karaoke stage. Phones handle the song queue.",
    url: "/karaoke-on-smart-tv",
  },
};

const faqs = [
  {
    question: "Does my smart TV need a special karaoke app?",
    answer:
      "No. If your TV (or a device plugged into it) can open a web browser, you can host TaraSing there. Guests still use their phones.",
  },
  {
    question: "What if the TV browser is awkward to type on?",
    answer:
      "Create the party on a laptop or phone first if needed, then open the host screen on the TV. Guests never need to type on the TV — they join from their phones.",
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

export default function KaraokeOnSmartTvPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <SeoPage
        h1="Karaoke on Smart TV"
        intro="Your smart TV is already the best karaoke screen in the house. With TaraSing, that TV shows the video and lyrics while friends control the song list from their phones."
        ctaLabel="Host karaoke on your TV"
        sections={[
          {
            heading: "Use the TV as the stage, not the remote",
            paragraphs: [
              "Typing song titles with a TV remote is painful. Karaoke on a smart TV works better when the display only plays the current track and phones handle search.",
              "Open TaraSing in the TV’s browser (or cast/HDMI from a laptop). Create a party, show the QR or code, and let guests join without touching the remote again.",
            ],
          },
          {
            heading: "Laptop-to-TV works just as well",
            paragraphs: [
              "Not every smart TV browser is great. A reliable option is opening TaraSing on a laptop and connecting it to the TV with HDMI. You still get a huge karaoke screen and phone-based queuing.",
              "Plug into a soundbar or Bluetooth speaker if you want more volume. The “machine” is just your existing living-room setup.",
            ],
          },
          {
            heading: "Quick checklist before guests arrive",
            paragraphs: [
              "Confirm the host device has a stable Wi‑Fi connection. Raise the TV volume and test YouTube playback once. Create the party, then leave the QR code visible so late arrivals can join without interrupting a song.",
              "When the room is ready, start the party and pass the mic — or the nearest hairbrush.",
            ],
          },
        ]}
        faqs={faqs}
        relatedLinks={relatedLinksExcept("/karaoke-on-smart-tv")}
      />
    </>
  );
}
