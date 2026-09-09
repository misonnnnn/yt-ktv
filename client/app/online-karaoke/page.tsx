import type { Metadata } from "next";
import {
  relatedLinksExcept,
  SeoPage,
} from "@/components/SeoPage";

export const metadata: Metadata = {
  title: "Online Karaoke",
  description:
    "Online karaoke made simple with TaraSing. Turn any TV or laptop into a karaoke screen and let friends pick songs from their phones.",
  alternates: {
    canonical: "/online-karaoke",
  },
  openGraph: {
    title: "Online Karaoke | TaraSing",
    description:
      "Host online karaoke at home. Big-screen playback, phone-based song picks, shared queue — all in the browser.",
    url: "/online-karaoke",
  },
};

export default function OnlineKaraokePage() {
  return (
    <SeoPage
      h1="Online Karaoke"
      intro="Online karaoke lets you sing together without a dedicated karaoke machine. TaraSing turns a normal TV or laptop into the stage and puts song search on everyone’s phone."
      ctaLabel="Start online karaoke"
      sections={[
        {
          heading: "How online karaoke is different from a machine",
          paragraphs: [
            "A classic karaoke box stores songs locally and usually has one controller. Online karaoke streams sing-along videos and keeps a shared queue online, so guests add tracks from their own devices.",
            "That means less hardware and more flexibility. As long as your screen and speakers work, you can host karaoke in a living room, dorm, or Airbnb.",
          ],
        },
        {
          heading: "A shared queue, not a single remote",
          paragraphs: [
            "The best online karaoke setups separate “watching” from “choosing.” TaraSing keeps the video on the host screen while friends search and queue songs on their phones.",
            "You still take turns singing, but people can browse the next track while someone else finishes theirs — the party keeps moving.",
          ],
        },
        {
          heading: "Works for home nights and small gatherings",
          paragraphs: [
            "Online karaoke fits birthday parties, after-dinner hangs, and office socials where you want energy without renting equipment. Create a party, share the code, and let the playlist build itself.",
            "If you specifically need zero cost and no downloads, see our guide to free online karaoke. Prefer the Filipino “videoke” vibe? We cover that too.",
          ],
        },
      ]}
      relatedLinks={relatedLinksExcept("/online-karaoke")}
    />
  );
}
