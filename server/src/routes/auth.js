const express = require("express");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const accounts = require("../accounts");
const { isDatabaseEnabled } = require("../db");
const {
  validateEmail,
  validatePassword,
  validateDisplayName,
  cleanHttpsUrl,
} = require("../authRules");
const {
  rateLimit,
  clientKey,
  newToken,
  hashToken,
  getSessionUser,
  rejectBadOrigin,
  startSession,
  endSession,
  requireAccounts,
} = require("../httpAuth");
const { sendMail, appBaseUrl, mailIsConfigured } = require("../mailer");

const router = express.Router();

let googleClient = null;

function getGoogleClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return null;
  if (!googleClient) googleClient = new OAuth2Client(clientId);
  return googleClient;
}

function tooMany(req, res, bucket) {
  const allowed = rateLimit(`${bucket}:${clientKey(req)}`, 8, 15 * 60 * 1000);
  if (allowed) return false;
  res
    .status(429)
    .json({ error: "Too many attempts. Try again in a few minutes." });
  return true;
}

function confirmationLink(rawToken) {
  return `${appBaseUrl()}/verify-email?token=${rawToken}`;
}

async function sendConfirmation(email, rawToken) {
  if (!mailIsConfigured()) {
    const error = new Error(
      "Email confirmation is not set up yet. Add the Gmail SMTP settings on the server, then try again."
    );
    error.status = 503;
    throw error;
  }

  await sendMail({
    to: email,
    subject: "Confirm your TaraSing account",
    text: `Open this link to finish creating your TaraSing account. It expires in 24 hours:\n${confirmationLink(rawToken)}\n\nIf you did not ask for an account, you can ignore this email.`,
  });
}

async function sendVerification(user) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await accounts.saveToken(user.id, "verify_email", token.hash, expiresAt);
  await sendConfirmation(user.email, token.raw);
}

async function readGoogleProfile(credential) {
  const client = getGoogleClient();
  if (!client) {
    const error = new Error("Google sign-in is not configured");
    error.status = 503;
    throw error;
  }

  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    const error = new Error("Google did not confirm this email.");
    error.status = 400;
    throw error;
  }

  let displayName = String(payload.name || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  if (!displayName) displayName = "Singer";

  const avatar = cleanHttpsUrl(payload.picture);

  return {
    sub: String(payload.sub),
    email: String(payload.email).trim().toLowerCase(),
    displayName,
    avatarUrl: avatar || null,
  };
}

router.post("/register", async (req, res) => {
  try {
    if (!requireAccounts(res)) return;
    if (rejectBadOrigin(req, res)) return;
    if (tooMany(req, res, "register")) return;

    const name = validateDisplayName(req.body.displayName);
    if (name.error) return res.status(400).json({ error: name.error });

    const email = validateEmail(req.body.email);
    if (email.error) return res.status(400).json({ error: email.error });

    const password = validatePassword(req.body.password);
    if (password.error) return res.status(400).json({ error: password.error });

    if (req.body.password !== req.body.confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    const existing = await accounts.findUserByEmail(email.email);
    if (existing) {
      return res
        .status(409)
        .json({ error: "An account with that email already exists." });
    }

    if (!mailIsConfigured()) {
      return res.status(503).json({
        error:
          "Email confirmation is not set up yet. Add the Gmail SMTP settings on the server, then try again.",
      });
    }

    const passwordHash = await bcrypt.hash(password.password, 12);
    const token = newToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await accounts.savePendingSignup({
      email: email.email,
      displayName: name.displayName,
      passwordHash,
      tokenHash: token.hash,
      expiresAt,
    });

    try {
      await sendConfirmation(email.email, token.raw);
    } catch (error) {
      await accounts.deletePendingSignup(email.email);
      console.error("Signup email failed:", error.message);
      return res.status(503).json({
        error:
          "Could not send the confirmation email. Check the Gmail SMTP settings and try again.",
      });
    }

    res.status(201).json({ needsVerification: true, email: email.email });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ error: "Could not create account" });
  }
});

router.post("/login", async (req, res) => {
  try {
    if (!requireAccounts(res)) return;
    if (rejectBadOrigin(req, res)) return;
    if (tooMany(req, res, "login")) return;

    const email = validateEmail(req.body.email);
    const password = String(req.body.password || "");
    if (email.error || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await accounts.findUserByEmail(email.email);
    const matches =
      user?.password_hash &&
      (await bcrypt.compare(password, user.password_hash));

    if (!matches) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        error:
          "Confirm your email before signing in. Open the link we sent, or request a new one from the create-account page.",
      });
    }

    await startSession(res, user.id);
    res.json({ user: accounts.publicUser(user) });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ error: "Could not sign in" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    if (rejectBadOrigin(req, res)) return;
    if (isDatabaseEnabled()) await endSession(req, res);
    else clearCookieOnly(res);
    res.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error.message);
    res.status(500).json({ error: "Could not sign out" });
  }
});

function clearCookieOnly(res) {
  res.setHeader(
    "Set-Cookie",
    "tara_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
  );
}

router.get("/me", async (req, res) => {
  try {
    if (!isDatabaseEnabled()) return res.json({ user: null });
    const user = await getSessionUser(req);
    res.json({ user: accounts.publicUser(user) });
  } catch (error) {
    console.error("Session error:", error.message);
    res.status(500).json({ error: "Could not load session" });
  }
});

router.post("/google", async (req, res) => {
  try {
    if (!requireAccounts(res)) return;
    if (rejectBadOrigin(req, res)) return;
    if (tooMany(req, res, "google")) return;

    const credential = String(req.body.credential || "");
    if (!credential) {
      return res.status(400).json({ error: "Missing Google credential" });
    }

    const profile = await readGoogleProfile(credential);
    await accounts.deletePendingSignup(profile.email);
    const sessionUser = await getSessionUser(req);

    if (sessionUser) {
      if (sessionUser.email !== profile.email) {
        return res.status(400).json({
          error:
            "That Google account uses a different email than this TaraSing account.",
        });
      }

      const owner = await accounts.findUserByProvider("google", profile.sub);
      if (owner && owner.id !== sessionUser.id) {
        return res.status(409).json({
          error: "That Google account is already used by another TaraSing user.",
        });
      }
      if (!owner) {
        await accounts.linkProvider(sessionUser.id, "google", profile.sub);
      }

      const updates = {};
      if (!sessionUser.avatar_url && profile.avatarUrl) {
        updates.avatarUrl = profile.avatarUrl;
      }
      if (!sessionUser.email_verified) updates.emailVerified = true;
      const user = Object.keys(updates).length
        ? await accounts.updateUser(sessionUser.id, updates)
        : sessionUser;

      return res.json({ user: accounts.publicUser(user) });
    }

    const bySub = await accounts.findUserByProvider("google", profile.sub);
    if (bySub) {
      await startSession(res, bySub.id);
      return res.json({ user: accounts.publicUser(bySub) });
    }

    const byEmail = await accounts.findUserByEmail(profile.email);
    if (byEmail) {
      if (!byEmail.email_verified) {
        return res.status(409).json({
          error:
            "An account with this email already exists. Sign in with your password, then connect Google from your profile.",
        });
      }
      await accounts.linkProvider(byEmail.id, "google", profile.sub);
      await startSession(res, byEmail.id);
      return res.json({ user: accounts.publicUser(byEmail) });
    }

    const created = await accounts.createUser({
      displayName: profile.displayName,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
      emailVerified: true,
    });
    await accounts.linkProvider(created.id, "google", profile.sub);
    await startSession(res, created.id);
    res.status(201).json({ user: accounts.publicUser(created) });
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) console.error("Google sign-in error:", error.message);
    res.status(status).json({
      error: status >= 500 ? "Google sign-in failed" : error.message,
    });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    if (!requireAccounts(res)) return;
    if (rejectBadOrigin(req, res)) return;
    if (tooMany(req, res, "forgot")) return;

    const email = validateEmail(req.body.email);
    if (email.error) return res.status(400).json({ error: email.error });

    const user = await accounts.findUserByEmail(email.email);
    if (user) {
      const token = newToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await accounts.saveToken(user.id, "reset_password", token.hash, expiresAt);
      const link = `${appBaseUrl()}/reset-password?token=${token.raw}`;
      await sendMail({
        to: user.email,
        subject: "Reset your TaraSing password",
        text: `Reset your TaraSing password (link expires in 1 hour):\n${link}\n\nIf you did not ask for this, you can ignore this email.`,
      });
    }

    res.json({
      message:
        "If an account with that email exists, password reset instructions are on the way.",
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    res.status(500).json({ error: "Could not start password reset" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    if (!requireAccounts(res)) return;
    if (rejectBadOrigin(req, res)) return;
    if (tooMany(req, res, "reset")) return;

    const password = validatePassword(req.body.password);
    if (password.error) return res.status(400).json({ error: password.error });
    if (req.body.password !== req.body.confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    const raw = String(req.body.token || "");
    const row = raw
      ? await accounts.consumeToken("reset_password", hashToken(raw))
      : null;
    if (!row) {
      return res.status(400).json({ error: "This reset link is invalid or expired." });
    }

    const passwordHash = await bcrypt.hash(password.password, 12);
    const user = await accounts.updateUser(row.user_id, {
      passwordHash,
      emailVerified: true,
    });
    await startSession(res, user.id);
    res.json({ user: accounts.publicUser(user) });
  } catch (error) {
    console.error("Reset password error:", error.message);
    res.status(500).json({ error: "Could not reset password" });
  }
});

router.post("/verify-email", async (req, res) => {
  try {
    if (!requireAccounts(res)) return;
    if (rejectBadOrigin(req, res)) return;

    const raw = String(req.body.token || "");
    if (!raw) {
      return res.status(400).json({ error: "This verification link is missing a token." });
    }

    const pending = await accounts.consumePendingSignup(hashToken(raw));
    if (pending) {
      const existing = await accounts.findUserByEmail(pending.email);
      if (existing) {
        return res
          .status(409)
          .json({ error: "That email is already registered. Sign in instead." });
      }

      let user;
      try {
        user = await accounts.createUser({
          displayName: pending.display_name,
          email: pending.email,
          passwordHash: pending.password_hash,
          emailVerified: true,
        });
      } catch (error) {
        if (error.code !== "ER_DUP_ENTRY") throw error;
        user = await accounts.findUserByEmail(pending.email);
      }

      if (!user) {
        return res.status(500).json({ error: "Could not verify email" });
      }

      await startSession(res, user.id);
      return res.json({ success: true, user: accounts.publicUser(user) });
    }

    const row = await accounts.consumeToken("verify_email", hashToken(raw));
    if (!row) {
      return res
        .status(400)
        .json({ error: "This verification link is invalid or expired." });
    }

    const user = await accounts.updateUser(row.user_id, { emailVerified: true });
    await startSession(res, user.id);
    res.json({ success: true, user: accounts.publicUser(user) });
  } catch (error) {
    console.error("Verify email error:", error.message);
    res.status(500).json({ error: "Could not verify email" });
  }
});

router.post("/resend-verification", async (req, res) => {
  try {
    if (rejectBadOrigin(req, res)) return;
    if (tooMany(req, res, "resend")) return;

    const generic = {
      success: true,
      message:
        "If that address is waiting for confirmation, a new link is on the way.",
    };

    const sessionUser = await getSessionUser(req);
    if (sessionUser && !sessionUser.email_verified) {
      await sendVerification(sessionUser);
      return res.json({
        success: true,
        message: "A new confirmation link is on the way.",
      });
    }

    const email = validateEmail(req.body.email);
    if (email.error) return res.status(400).json({ error: email.error });

    const pending = await accounts.findPendingByEmail(email.email);
    if (pending && mailIsConfigured()) {
      const token = newToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await accounts.savePendingSignup({
        email: pending.email,
        displayName: pending.display_name,
        passwordHash: pending.password_hash,
        tokenHash: token.hash,
        expiresAt,
      });
      try {
        await sendConfirmation(pending.email, token.raw);
      } catch (error) {
        console.error("Resend confirmation failed:", error.message);
      }
    }

    res.json(generic);
  } catch (error) {
    console.error("Resend verification error:", error.message);
    res.status(500).json({ error: "Could not send verification email" });
  }
});

module.exports = router;
