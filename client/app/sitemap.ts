import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.tarasing.online";

const seoPages = [
  "/free-online-karaoke",
  "/online-karaoke",
  "/online-videoke",
  "/karaoke-with-friends",
  "/karaoke-on-smart-tv",
  "/karaoke-philippines",
] as const;

// Public pages only — private room URLs stay out of the sitemap
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/create`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/join`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...seoPages.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];
}
