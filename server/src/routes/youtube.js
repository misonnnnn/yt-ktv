const express = require("express");
require("dotenv").config();

const router = express.Router();

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
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
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
