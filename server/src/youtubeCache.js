/** Turn YouTube HTML entities into normal text. */
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

const DAY_MS = 24 * 60 * 60 * 1000;
const STALE_AFTER_MS = 25 * DAY_MS;
const EXPIRE_AFTER_MS = 30 * DAY_MS;

/**
 * Refresh cached YouTube snippet fields (title, channel, thumbnail URL).
 * Video ids the user saved are kept. Audiovisual content is never downloaded.
 */
async function fetchVideoMeta(videoIds) {
  const map = new Map();
  const key = process.env.YOUTUBE_API_KEY;
  if (!key || videoIds.length === 0) return map;

  for (let index = 0; index < videoIds.length; index += 50) {
    const chunk = videoIds.slice(index, index + 50);
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("id", chunk.join(","));
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("key", key);

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        console.error("YouTube metadata refresh failed");
        continue;
      }

      for (const item of data.items || []) {
        const thumbs = item.snippet?.thumbnails || {};
        map.set(item.id, {
          title: decodeHtml(item.snippet?.title || "").slice(0, 255) || null,
          artist:
            decodeHtml(item.snippet?.channelTitle || "").slice(0, 255) || null,
          thumbnail: String(
            thumbs.medium?.url || thumbs.default?.url || ""
          ).slice(0, 500),
        });
      }
    } catch (error) {
      console.error("YouTube metadata refresh error:", error.message);
    }
  }

  return map;
}

async function refreshStoredMetadata(rows, save) {
  const now = Date.now();
  const needsRefresh = [];

  for (const row of rows) {
    const cachedAt = row.metadata_cached_at
      ? new Date(row.metadata_cached_at).getTime()
      : 0;
    const age = cachedAt ? now - cachedAt : Infinity;

    if (age > EXPIRE_AFTER_MS) {
      row.title = null;
      row.artist = null;
      row.thumbnail = null;
      row.metadata_cached_at = null;
    }

    if (!row.metadata_cached_at || age > STALE_AFTER_MS) {
      needsRefresh.push(row);
    }
  }

  if (needsRefresh.length > 0 && process.env.YOUTUBE_API_KEY) {
    const meta = await fetchVideoMeta([
      ...new Set(needsRefresh.map((row) => row.video_id)),
    ]);
    const cachedAt = new Date();

    for (const row of needsRefresh) {
      const info = meta.get(row.video_id);
      if (!info) continue;
      row.title = info.title;
      row.artist = info.artist;
      row.thumbnail = info.thumbnail || null;
      row.metadata_cached_at = cachedAt;
      await save(row);
    }
  }

  return rows;
}

function presentSong(row) {
  const cachedAt = row.metadata_cached_at
    ? new Date(row.metadata_cached_at).getTime()
    : 0;
  const fresh = cachedAt && Date.now() - cachedAt < EXPIRE_AFTER_MS;

  return {
    id: row.id,
    videoId: row.video_id,
    title: fresh ? row.title : null,
    artist: fresh ? row.artist : null,
    thumbnail: fresh ? row.thumbnail : null,
    position: row.position,
    roomCode: row.room_code,
    requestedAt: row.requested_at,
    startedAt: row.started_at,
    createdAt: row.created_at,
  };
}

module.exports = { refreshStoredMetadata, presentSong };
