const prisma = require("../services/prisma");

function parseLastNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
    const err = new Error("lastNumber must be a non-negative integer.");
    err.code = "VALIDATION";
    throw err;
  }
  return n;
}

async function getLastNumberByProjectId(projectId) {
  const counter = await prisma.projectCounter.findUnique({ where: { projectId } });
  return counter?.lastNumber ?? null;
}

async function setLastNumberForProject(projectId, initials, lastNumber) {
  // "initials" is kept for compatibility; it's stored on Project.
  return await prisma.projectCounter.upsert({
    where: { projectId },
    update: { lastNumber },
    create: { projectId, lastNumber },
  });
}

module.exports = {
  parseLastNumber,
  getLastNumberByProjectId,
  setLastNumberForProject,
};

