const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const router = express.Router();

const User = require("../models/User"); // adjust path to match your actual User model
const { sendPasswordResetEmail } = require("../utils/sendEmail"); // adjust path if you save it elsewhere

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Helper: sign a JWT
function generateToken(user) {
  return jwt.sign(
    { id: user._id || user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Shared auth check — verifies the Bearer token and attaches req.userId.
// Used by both /me and the new /set-password route below.
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided." });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
}

// ---------- GET CURRENT USER ----------
// Used by AuthContext's refreshUser() to verify the stored token and hydrate user state
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.json({ success: true, user: user.toPublicJSON ? user.toPublicJSON() : { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
});

// ---------- REGISTER ----------
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "An account with this email already exists." });
    }

    // NOTE: password is hashed automatically by the pre("save") hook on the
    // User model — hashing it again here (as the old code did with
    // bcrypt.hash before User.create) would double-hash it and break login
    // for every newly registered account. Pass the plain password through
    // and let the model hook handle hashing exactly once.
    const user = await User.create({ name, email: email.toLowerCase(), password, provider: "local" });

    const token = generateToken(user);
    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Something went wrong during registration." });
  }
});

// ---------- LOGIN ----------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    // BUGFIX: password has `select: false` on the schema, so it's excluded
    // from query results unless explicitly re-selected here. Without this,
    // user.password was ALWAYS undefined — meaning every login attempt,
    // even with the correct password, fell into the "no password set"
    // branch below and returned "Invalid email or password."
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user || !user.password) {
      // !user.password now correctly and exclusively means "this account
      // was created via Google/GitHub and has no password set" — not a
      // side effect of a missing .select() call.
      return res.status(401).json({
        success: false,
        message: user
          ? "This account was created with Google or GitHub sign-in. Log in that way, or set a password from your account settings."
          : "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Something went wrong during login." });
  }
});

// ---------- SET PASSWORD ----------
// For accounts created via Google/GitHub that have no password yet. Must be
// logged in already (the JWT proves which account this is for) — there's no
// "current password" to check since one was never set.
router.post("/set-password", requireAuth, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    const user = await User.findById(req.userId).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.password) {
      return res.status(409).json({
        success: false,
        message: "This account already has a password. Use the change-password flow instead.",
      });
    }

    user.password = password; // pre("save") hook hashes this automatically
    await user.save();

    res.json({ success: true, message: "Password set. You can now log in with your email and this password." });
  } catch (err) {
    console.error("Set password error:", err);
    res.status(500).json({ success: false, message: "Something went wrong setting your password." });
  }
});

// ---------- FORGOT PASSWORD ----------
// Always responds with the same generic success message whether or not the
// email exists — otherwise this endpoint becomes a way to check which
// emails have accounts on your site, which is a privacy/enumeration leak.
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const genericResponse = {
      success: true,
      message: "If an account with that email exists, a reset link has been sent.",
    };

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.json(genericResponse); // don't reveal whether the email exists
    }

    // Generate a random token. We email the PLAIN version to the user but
    // only ever store its SHA-256 hash — same reasoning as never storing
    // plain-text passwords.
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save({ validateBeforeSave: false }); // skip password-required validation on this partial save

    const resetUrl = `${FRONTEND_URL}/reset-password/${rawToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (emailErr) {
      console.error("Failed to send reset email:", emailErr);
      // Roll back the token so a failed email doesn't leave a dangling,
      // unusable reset request sitting on the account.
      user.resetPasswordTokenHash = null;
      user.resetPasswordExpires = null;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: "Could not send reset email. Please try again later." });
    }

    res.json(genericResponse);
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ success: false, message: "Something went wrong." });
  }
});

// ---------- RESET PASSWORD ----------
// The :token in the URL is the PLAIN token from the email — we hash it the
// same way here and compare hashes, never storing or trusting the plain
// token beyond this one comparison.
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }

    const tokenHash = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: Date.now() }, // must not be expired
    }).select("+resetPasswordTokenHash +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({ success: false, message: "This reset link is invalid or has expired." });
    }

    user.password = password; // pre("save") hook hashes this
    user.resetPasswordTokenHash = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ success: false, message: "Something went wrong." });
  }
});

// ---------- GOOGLE ----------
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${FRONTEND_URL}/login?error=oauth_failed` }),
  (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`${FRONTEND_URL}/oauth-success?token=${token}`);
  }
);

// ---------- GITHUB ----------
router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"], session: false })
);

router.get(
  "/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: `${FRONTEND_URL}/login?error=oauth_failed` }),
  (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`${FRONTEND_URL}/oauth-success?token=${token}`);
  }
);

module.exports = router;