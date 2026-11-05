function validateEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
    return { error: "Enter a valid email address." };
  }
  return { email };
}

function validatePassword(value) {
  const password = String(value || "");
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password.length > 72) {
    return { error: "Password must be 72 characters or fewer." };
  }
  return { password };
}

function validateDisplayName(value) {
  const displayName = String(value || "").replace(/\s+/g, " ").trim();
  if (!displayName || displayName.length > 80) {
    return { error: "Display name must be 1–80 characters." };
  }
  return { displayName };
}

function cleanVideoId(value) {
  const videoId = String(value || "").trim();
  if (!/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) return null;
  return videoId;
}

function clip(value, max) {
  const text = String(value || "").trim();
  if (!text) return null;
  return text.slice(0, max);
}

function cleanHttpsUrl(value, max = 1000) {
  const url = String(value || "").trim();
  if (!url) return null;
  if (!/^https:\/\/[^\s]+$/i.test(url) || url.length > max) return undefined;
  return url;
}

module.exports = {
  validateEmail,
  validatePassword,
  validateDisplayName,
  cleanVideoId,
  clip,
  cleanHttpsUrl,
};
