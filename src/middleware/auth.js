const AUTH_EMAIL = (process.env.AUTH_EMAIL || "").trim().toLowerCase();

function isAuthed(req) {
  return Boolean(req.session && req.session.user && req.session.user.email);
}

function isAdmin(req) {
  if (!isAuthed(req)) return false;
  if (!AUTH_EMAIL) return false;
  return String(req.session.user.email).toLowerCase() === AUTH_EMAIL;
}

function requireAuth(req, res, next) {
  if (isAuthed(req)) return next();
  if (req.path.startsWith("/api/")) return res.status(401).json({ error: "Unauthorized" });
  return res.redirect("/login");
}

function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next();
  return res.status(403).json({ error: "Forbidden" });
}

module.exports = {
  isAuthed,
  isAdmin,
  requireAuth,
  requireAdmin,
  AUTH_EMAIL,
};

