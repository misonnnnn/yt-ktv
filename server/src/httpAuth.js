const crypto = require("crypto");
const accounts = require("./accounts");
const { isDatabaseEnabled } = require("./db");
const { isOriginAllowed } = require("./origins");

const COOKIE = "tara_session";
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

const hits = new Map();

function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

function clientKey(req) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function newToken() {
  const raw = crypto.randomBytes(32).toString("hex");
  return { raw, hash: hashToken(raw) };
}

function readCookie(req, name) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function siteKey(host) {
  const hostname = String(host || "")
    .split(",")[0]
    .trim()
    .split(":")[0]
    .toLowerCase();
  if (
    !hostname ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)
  ) {
    return hostname;
  }
  const parts = hostname.split(".");
  if (parts.length <= 2) return hostname;
  return parts.slice(-2).join(".");
}

function isHttpsRequest(req) {
  if (process.env.NODE_ENV === "production") return true;
  if (req.secure) return true;
  const forwarded = String(req.headers["x-forwarded-proto"] || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  if (forwarded === "https") return true;
  try {
    return new URL(String(req.headers.origin || "")).protocol === "https:";
  } catch {
    return false;
  }
}

/** Browser page and API host are different sites (for example tarasing.online calling Railway). */
function isCrossSiteRequest(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  let originHost = "";
  try {
    originHost = new URL(origin).hostname;
  } catch {
    return false;
  }
  const requestHost = req.headers["x-forwarded-host"] || req.headers.host;
  return siteKey(originHost) !== siteKey(requestHost);
}

function cookieAttributes(req) {
  const https = isHttpsRequest(req);
  if (isCrossSiteRequest(req) && https) {
    // Lax cookies are dropped on a cross-site fetch, so the login body can
    // succeed while every later request looks signed out.
    return "; SameSite=None; Secure; Partitioned";
  }
  return https ? "; SameSite=Lax; Secure" : "; SameSite=Lax";
}

function writeSessionCookie(req, res, raw) {
  const maxAge = Math.floor(SESSION_MS / 1000);
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${raw}; HttpOnly; Path=/; Max-Age=${maxAge}${cookieAttributes(req)}`
  );
}

function clearSessionCookie(req, res) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=; HttpOnly; Path=/; Max-Age=0${cookieAttributes(req)}`
  );
}

async function getSessionUser(req) {
  if (!isDatabaseEnabled()) return null;
  const raw = readCookie(req, COOKIE);
  if (!raw || raw.length < 32) return null;
  return accounts.findUserBySession(hashToken(raw));
}

async function requireUser(req, res) {
  if (!isDatabaseEnabled()) {
    res.status(503).json({ error: "Accounts require MySQL. Set DB_URL in the server env." });
    return null;
  }
  const user = await getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Please sign in" });
    return null;
  }
  return user;
}

function rejectBadOrigin(req, res) {
  const origin = req.headers.origin;
  if (!origin || isOriginAllowed(origin)) return false;
  res.status(403).json({ error: "Forbidden" });
  return true;
}

async function startSession(req, res, userId) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_MS);
  await accounts.createSession(userId, token.hash, expiresAt);
  writeSessionCookie(req, res, token.raw);
}

async function endSession(req, res) {
  const raw = readCookie(req, COOKIE);
  if (raw) await accounts.deleteSession(hashToken(raw));
  clearSessionCookie(req, res);
}

function requireAccounts(res) {
  if (isDatabaseEnabled()) return true;
  res.status(503).json({
    error: "Accounts require MySQL. Set DB_URL in the server env.",
  });
  return false;
}

module.exports = {
  rateLimit,
  clientKey,
  newToken,
  hashToken,
  getSessionUser,
  requireUser,
  rejectBadOrigin,
  startSession,
  endSession,
  clearSessionCookie,
  requireAccounts,
};
