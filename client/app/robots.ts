import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tarasing.online";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Host screen + live room pages are private (not for Google)
      disallow: ["/host", "/join/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
