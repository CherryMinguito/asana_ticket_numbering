const prisma = require("../services/prisma");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function listUsersSafe() {
  const users = await prisma.user.findMany({
    select: { email: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return users;
}

async function addUser({ email, passwordHash }) {
  const cleanEmail = normalizeEmail(email);
  const cleanHash = String(passwordHash || "").trim();

  if (!cleanEmail) {
    const err = new Error("email is required");
    err.code = "VALIDATION";
    throw err;
  }
  if (!cleanHash) {
    const err = new Error("passwordHash is required");
    err.code = "VALIDATION";
    throw err;
  }

  try {
    const user = await prisma.user.create({
      data: { email: cleanEmail, passwordHash: cleanHash },
      select: { email: true, createdAt: true },
    });
    return user;
  } catch (err) {
    if (err && err.code === "P2002") {
      const e = new Error("User already exists");
      e.code = "DUPLICATE";
      throw e;
    }
    throw err;
  }
}

async function findUserByEmail(email) {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return null;
  return await prisma.user.findUnique({ where: { email: cleanEmail } });
}

async function deleteUserByEmail(email) {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) {
    const err = new Error("email is required");
    err.code = "VALIDATION";
    throw err;
  }

  const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (!existing) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  await prisma.user.delete({ where: { email: cleanEmail } });
  return { ok: true };
}

module.exports = {
  normalizeEmail,
  listUsersSafe,
  addUser,
  findUserByEmail,
  deleteUserByEmail,
};

