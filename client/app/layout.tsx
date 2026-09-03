import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tarasing.online";

export const metadata: Metadata = {
  // Used as the base for sitemap links, Open Graph, etc.
  metadataBase: new URL(siteUrl),
  title: {
    default: "TaraSing — Free Online Karaoke Party",
    template: "%s | TaraSing",
  },
  description:
    "Host a karaoke party on the big screen. Friends join from their phones, pick YouTube songs, and sing together — no app download needed.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "TaraSing — Free Online Karaoke Party",
    description:
      "Turn any TV or laptop into a karaoke machine. Friends scan a QR code and sing along from their phones.",
    url: siteUrl,
    siteName: "TaraSing",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "TaraSing — Free Online Karaoke Party",
    description:
      "Host karaoke on the big screen. Friends join from their phones — no app needed.",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-foreground">{children}</body>
    </html>
  );
}
