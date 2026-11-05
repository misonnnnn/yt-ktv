function mailIsConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

function appBaseUrl() {
  const fromEnv = String(process.env.APP_URL || "").trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const client = String(process.env.CLIENT_URL || "")
    .split(",")
    .map((value) => value.trim())
    .find(Boolean);
  return (client || "http://localhost:3000").replace(/\/$/, "");
}

async function sendMail({ to, subject, text }) {
  if (!mailIsConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[mail skipped] To: ${to}\n${subject}\n${text}`);
    } else {
      console.error("SMTP is not configured. Account email was not sent.");
    }
    return { sent: false };
  }

  const nodemailer = require("nodemailer");
  const port = Number(process.env.SMTP_PORT || 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || "",
        }
      : undefined,
  });

  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
  });

  return { sent: true };
}

module.exports = { mailIsConfigured, appBaseUrl, sendMail };
