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

function writeSessionCookie(res, raw) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  const maxAge = Math.floor(SESSION_MS / 1000);
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${raw}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`
  );
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`
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

async function startSession(res, userId) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_MS);
  await accounts.createSession(userId, token.hash, expiresAt);
  writeSessionCookie(res, token.raw);
}

async function endSession(req, res) {
  const raw = readCookie(req, COOKIE);
  if (raw) await accounts.deleteSession(hashToken(raw));
  clearSessionCookie(res);
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
  requireAccounts,
};
