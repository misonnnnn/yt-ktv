/** Add both www and non-www variants of a site origin. */
function withWwwVariants(origin) {
  try {
    const url = new URL(origin);
    const host = url.hostname;
    const variants = [url.origin];

    if (host === "localhost" || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) {
      return variants;
    }

    if (host.startsWith("www.")) {
      url.hostname = host.slice(4);
    } else {
      url.hostname = `www.${host}`;
    }
    variants.push(url.origin);
    return variants;
  } catch {
    return [origin];
  }
}

/** Normalize and collect allowed browser origins for CORS / Socket.IO. */
function getAllowedOrigins() {
  const defaults = ["http://localhost:3000", "http://127.0.0.1:3000"];

  const fromEnv = String(process.env.CLIENT_URL || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => value.replace(/^http:\/\/http:\/\//i, "http://"))
    .map((value) => value.replace(/\/:(\d+)$/, ":$1"))
    .map((value) => value.replace(/\/$/, ""))
    .flatMap(withWwwVariants);

  return [...new Set([...defaults, ...fromEnv])];
}

function isOriginAllowed(origin) {
  if (!origin) return true;
  return getAllowedOrigins().includes(origin);
}

module.exports = { getAllowedOrigins, isOriginAllowed };
