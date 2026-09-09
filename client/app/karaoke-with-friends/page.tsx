import type { Metadata } from "next";
import {
  relatedLinksExcept,
  SeoPage,
} from "@/components/SeoPage";

export const metadata: Metadata = {
  title: "Karaoke With Friends",
  description:
    "Karaoke with friends online using TaraSing. Host on one screen, everyone joins from their phones, and the song queue stays shared — no app download.",
  alternates: {
    canonical: "/karaoke-with-friends",
  },
  openGraph: {
    title: "Karaoke With Friends | TaraSing",
    description:
      "Group karaoke without fighting over one device. Friends join by code or QR and add their own songs.",
    url: "/karaoke-with-friends",
  },
};

export default function KaraokeWithFriendsPage() {
  return (
    <SeoPage
      h1="Karaoke With Friends"
      intro="Karaoke with friends should feel easy: one big screen for the performance, everyone’s phone for picking songs, and a queue that feels fair. That is how TaraSing is built."
      ctaLabel="Invite friends to karaoke"
      sections={[
        {
          heading: "Why group karaoke falls apart on one phone",
          paragraphs: [
            "Passing a single phone or tablet around breaks the mood. People stop chatting, the next singer cannot browse ahead, and half the room never gets a turn.",
            "TaraSing fixes that by design. The host screen plays the current track while each friend searches and queues from their own device.",
          ],
        },
        {
          heading: "Same room or mixed setups",
          paragraphs: [
            "Most nights, everyone is on the couch. Guests scan the QR code on the host screen or type the party code. In seconds they are in the room and adding songs.",
            "If someone is late or joining from another spot with the code, they can still add tracks to the same queue. The party stays one shared list.",
          ],
        },
        {
          heading: "Simple rules that keep the night fun",
          paragraphs: [
            "Create the party on the loudest speakers you have. Ask friends to add one or two songs each so the queue stays manageable. Take turns, cheer loudly, and keep the next track ready.",
            "When you are ready, create a party and share the code. No app installs for guests — just the browser they already use.",
          ],
        },
      ]}
      relatedLinks={relatedLinksExcept("/karaoke-with-friends")}
    />
  );
}
