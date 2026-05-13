const prisma = require("../services/prisma");

function makeInitialsFromName(name) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(w => w[0].toUpperCase())
      .join("") + "-"
  );
}

async function addProject({ id, name, initials }) {
  const cleanId = (id ?? "").trim();
  const cleanName = (name ?? "").trim();
  let cleanInitials = (initials ?? "").trim();

  if (!cleanId || !cleanName) {
    const err = new Error("Project ID and name are required.");
    err.code = "VALIDATION";
    throw err;
  }

  if (!cleanInitials) cleanInitials = makeInitialsFromName(cleanName);

  try {
    return await prisma.project.create({
      data: { id: cleanId, name: cleanName, initials: cleanInitials },
    });
  } catch (err) {
    if (err && err.code === "P2002") {
      const e = new Error("Project with this ID already exists.");
      e.code = "DUPLICATE";
      throw e;
    }
    throw err;
  }
}

async function updateProject(id, { name, initials }) {
  const cleanId = (id ?? "").trim();

  const existing = await prisma.project.findUnique({ where: { id: cleanId } });
  if (!existing) {
    const err = new Error("Project not found.");
    err.code = "NOT_FOUND";
    throw err;
  }

  const nextName = ((name ?? existing.name) ?? "").trim();
  if (!nextName) {
    const err = new Error("Project name is required.");
    err.code = "VALIDATION";
    throw err;
  }

  const nextInitialsRaw = (initials ?? "").trim();
  const nextInitials =
    nextInitialsRaw || existing.initials || makeInitialsFromName(nextName);

  return await prisma.project.update({
    where: { id: cleanId },
    data: { name: nextName, initials: nextInitials },
  });
}

module.exports = {
  addProject,
  updateProject,
  makeInitialsFromName,
  readProjects: async () => prisma.project.findMany({ orderBy: { name: "asc" } }),
};
