import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join an Online Karaoke Party",
  description:
    "Join a free online karaoke party on TaraSing. Enter the party code and pick songs from your phone — no app download needed.",
  alternates: {
    canonical: "/join",
  },
};

export default function JoinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
