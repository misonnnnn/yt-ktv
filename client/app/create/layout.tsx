import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a Free Online Karaoke Party",
  description:
    "Create a free online karaoke party on TaraSing. Host on your TV or laptop and let friends join from their phones.",
  alternates: {
    canonical: "/create",
  },
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
