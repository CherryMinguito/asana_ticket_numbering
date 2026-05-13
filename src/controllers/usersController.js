const bcrypt = require("bcryptjs");

const { listUsersSafe, addUser, normalizeEmail, deleteUserByEmail } = require("../models/userModel");
const { AUTH_EMAIL } = require("../middleware/auth");

async function listUsers(req, res) {
  res.json(await listUsersSafe());
}

async function createUser(req, res) {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");
  if (!email || !password) return res.status(400).json({ error: "email and password are required" });

  const passwordHash = bcrypt.hashSync(password, 10);
  try {
    const created = await addUser({ email, passwordHash });
    return res.status(201).json(created);
  } catch (err) {
    if (err.code === "VALIDATION") return res.status(400).json({ error: err.message });
    if (err.code === "DUPLICATE") return res.status(409).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: "Failed to add user" });
  }
}

async function deleteUser(req, res) {
  const email = normalizeEmail(req.params.email);
  if (!email) return res.status(400).json({ error: "email is required" });

  if (AUTH_EMAIL && email === AUTH_EMAIL) {
    return res.status(400).json({ error: "Cannot delete admin user" });
  }

  try {
    await deleteUserByEmail(email);
    return res.json({ ok: true });
  } catch (err) {
    if (err.code === "VALIDATION") return res.status(400).json({ error: err.message });
    if (err.code === "NOT_FOUND") return res.status(404).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: "Failed to delete user" });
  }
}

module.exports = {
  listUsers,
  createUser,
  deleteUser,
};

