const express = require("express");
require("dotenv").config();
const store = require("../store");

const router = express.Router();

const POPULAR_PAGE_SIZE = 7;
const YOUTUBE_POPULAR_QUERY = "Karaoke songs with lyrics";

function popularSource() {
  const value = String(process.env.POPULAR_SOURCE || "youtube").trim().toLowerCase();
  return value === "picks" ? "picks" : "youtube";
}

router.get("/popular", async (req, res) => {
  try {
    if (popularSource() === "picks") {
      const page = Number.parseInt(String(req.query.page || "1"), 10);
      const data = await store.listPopularSongs(page);
      return res.json({
        ...data,
        source: "picks",
        nextPageToken: null,
        prevPageToken: null,
      });
    }

    if (!process.env.YOUTUBE_API_KEY) {
      return res.status(500).json({ error: "YouTube API is not configured" });
    }

    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", YOUTUBE_POPULAR_QUERY);
    url.searchParams.set("type", "video");
    url.searchParams.set("videoEmbeddable", "true");
    url.searchParams.set("maxResults", String(POPULAR_PAGE_SIZE));
    url.searchParams.set("key", process.env.YOUTUBE_API_KEY);

    const pageToken = String(req.query.pageToken || "").trim();
    if (pageToken && pageToken.length <= 300) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error("YouTube API error:", data);
      return res.status(502).json({ error: "YouTube search failed. Try again." });
    }

    const songs = (data.items || [])
      .filter((item) => item.id && item.id.videoId)
      .map((item) => ({
        videoId: item.id.videoId,
        title: decodeHtml(item.snippet.title),
        channelTitle: decodeHtml(item.snippet.channelTitle),
        thumbnail:
          item.snippet.thumbnails?.medium?.url ||
          item.snippet.thumbnails?.default?.url ||
          "",
        publishedAt: item.snippet.publishedAt,
      }));

    res.json({
      source: "youtube",
      songs,
      page: 1,
      pageSize: POPULAR_PAGE_SIZE,
      total: songs.length,
      totalPages: 0,
      nextPageToken: data.nextPageToken || null,
      prevPageToken: data.prevPageToken || null,
    });
  } catch (error) {
    console.error("Popular songs error:", error);
    res.status(500).json({ error: "Failed to load popular songs" });
  }
});

/** Turn YouTube HTML entities (like &#39;) into normal text. */
function decodeHtml(text) {
  if (!text) return "";

  return String(text)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

router.get("/search", async (req, res) => {
  const query = req.query.q + " karaoke";

  if (!query || String(query).trim() === "") {
    return res.status(400).json({ error: "Search query is required" });
  }

  if (!process.env.YOUTUBE_API_KEY) {
    return res.status(500).json({ error: "YouTube API is not configured" });
  }

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", String(query).trim());
    url.searchParams.set("type", "video");
    url.searchParams.set("videoEmbeddable", "true");
    url.searchParams.set("maxResults", "10");
    url.searchParams.set("key", process.env.YOUTUBE_API_KEY);

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error("YouTube API error:", data);
      return res.status(502).json({ error: "YouTube search failed. Try again." });
    }

    const results = (data.items || []).map((item) => ({
      videoId: item.id.videoId,
      title: decodeHtml(item.snippet.title),
      channelTitle: decodeHtml(item.snippet.channelTitle),
      thumbnail:
        item.snippet.thumbnails?.medium?.url ||
        item.snippet.thumbnails?.default?.url ||
        "",
      publishedAt: item.snippet.publishedAt,
    }));

    res.json({ results });
  } catch (error) {
    console.error("YouTube search error:", error);
    res.status(500).json({ error: "Failed to search YouTube" });
  }
});

module.exports = router;
