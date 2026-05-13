const bcrypt = require("bcryptjs");
const path = require("path");

const { findUserByEmail } = require("../models/userModel");

const AUTH_EMAIL = (process.env.AUTH_EMAIL || "").trim().toLowerCase();
const AUTH_PASSWORD_HASH = (process.env.AUTH_PASSWORD_HASH || "").trim();

function getLoginPage(req, res) {
  if (req.session?.user?.email) return res.redirect("/");
  res.sendFile(path.join(__dirname, "..", "public", "login.html"));
}

async function login(req, res) {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!email || !password) return res.status(400).json({ error: "email and password are required" });

  const adminConfigured = Boolean(AUTH_EMAIL && AUTH_PASSWORD_HASH);

  let ok = false;
  if (adminConfigured && email === AUTH_EMAIL) {
    ok = bcrypt.compareSync(password, AUTH_PASSWORD_HASH);
  } else {
    const user = await findUserByEmail(email);
    if (user?.passwordHash) ok = bcrypt.compareSync(password, user.passwordHash);
  }

  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  req.session.user = { email };
  return res.json({ ok: true, email });
}

function logout(req, res) {
  req.session.destroy(() => res.json({ ok: true }));
}

function me(req, res) {
  if (!req.session?.user?.email) return res.status(401).json({ error: "Unauthorized" });
  return res.json({ ok: true, email: req.session.user.email });
}

module.exports = {
  getLoginPage,
  login,
  logout,
  me,
};

