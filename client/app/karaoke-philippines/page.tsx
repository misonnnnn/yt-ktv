import type { Metadata } from "next";
import {
  relatedLinksExcept,
  SeoPage,
} from "@/components/SeoPage";

export const metadata: Metadata = {
  title: "Karaoke Philippines – Online Videoke at Home",
  description:
    "Karaoke Philippines style, online. Host videoke on your TV with TaraSing, sing OPM and party songs, and let the barkada join from their phones — free in the browser.",
  alternates: {
    canonical: "/karaoke-philippines",
  },
  openGraph: {
    title: "Karaoke Philippines – Online Videoke at Home | TaraSing",
    description:
      "Filipino karaoke night without the machine. Online videoke for OPM, barkada parties, and home celebrations.",
    url: "/karaoke-philippines",
  },
};

export default function KaraokePhilippinesPage() {
  return (
    <SeoPage
      h1="Karaoke Philippines"
      intro="Filipinos take karaoke seriously — and joyfully. TaraSing brings Karaoke Philippines energy online: videoke on the TV, phones for the barkada, and a shared queue of OPM and party hits."
      ctaLabel="Start a Pinoy karaoke night"
      sections={[
        {
          heading: "Home karaoke the modern way",
          paragraphs: [
            "From Manila condos to province gatherings, karaoke (or videoke) is how celebrations get loud. You do not always need a rented machine or a mall KTV room — a TV, speakers, and TaraSing can carry the night.",
            "Create a party on the biggest screen, share the code, and let everyone add songs. It feels like classic videoke, without the bulky box.",
          ],
        },
        {
          heading: "OPM, Tagalog hits, and international tracks",
          paragraphs: [
            "Search YouTube karaoke for OPM favorites, Tagalog love songs, and the English tracks every family party somehow knows. Guests queue from their phones so the playlist mixes generations naturally.",
            "Duet culture thrives here too: one person adds the song, two people grab the mics, and the room sings the chorus anyway.",
          ],
        },
        {
          heading: "For barkada nights and family events",
          paragraphs: [
            "Birthdays, despedida parties, Christmas gatherings, or a random Friday — online karaoke fits the Filipino habit of turning any excuse into a sing-along.",
            "Living abroad and missing home? Host online videoke with friends nearby and keep the same rituals. When you are ready, create a free party and send the code to the group chat.",
          ],
        },
      ]}
      relatedLinks={relatedLinksExcept("/karaoke-philippines")}
    />
  );
}
