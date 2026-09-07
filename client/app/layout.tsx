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

// Prefer www so sitemap/canonical match your live Search Console URLs
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.tarasing.online";

// Tells Google the brand name is "TaraSing" (not just the domain)
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "TaraSing",
  alternateName: ["TaraSing Karaoke", "tarasing.online"],
  url: siteUrl,
};

export const metadata: Metadata = {
  // Used as the base for sitemap links, Open Graph, etc.
  metadataBase: new URL(siteUrl),
  title: {
    default: "TaraSing — Free Online Karaoke | Sing with Friends",
    template: "%s | TaraSing",
  },
  description:
    "Free online karaoke for parties at home. Host on your TV or laptop, friends join from their phones, pick YouTube songs, and sing together — no app download needed.",
  keywords: [
    "online karaoke",
    "online karaoke free",
    "free karaoke",
    "karaoke online",
    "karaoke party",
    "karaoke with friends",
    "YouTube karaoke",
  ],
  applicationName: "TaraSing",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "TaraSing — Free Online Karaoke | Sing with Friends",
    description:
      "Free online karaoke on any TV or laptop. Friends scan a QR code, pick songs on their phones, and sing together — no app needed.",
    url: siteUrl,
    siteName: "TaraSing",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "TaraSing — Free Online Karaoke",
    description:
      "Free online karaoke for home parties. Host on the big screen, friends join from their phones.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
