require("dotenv").config();

const fs = require("fs");
const path = require("path");

const prisma = require("../services/prisma");
const { PROJECT_FILE, TICKET_FILE } = require("../../config");

function readJsonIfExists(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error(`Failed to read ${filePath}:`, err.message);
    return fallback;
  }
}

async function main() {
  const projects = readJsonIfExists(PROJECT_FILE, []);
  const tickets = readJsonIfExists(TICKET_FILE, {});
  const usersFile = path.join(__dirname, "..", "..", "files", "users.json");
  const users = readJsonIfExists(usersFile, []);

  console.log(`Importing ${projects.length} projects...`);

  for (const p of projects) {
    if (!p?.id) continue;
    await prisma.project.upsert({
      where: { id: String(p.id) },
      update: {
        name: String(p.name || ""),
        initials: String(p.initials || ""),
      },
      create: {
        id: String(p.id),
        name: String(p.name || ""),
        initials: String(p.initials || ""),
      },
    });
  }

  console.log("Importing ticket counters + tasks...");
  for (const [projectId, entry] of Object.entries(tickets || {})) {
    if (!projectId) continue;

    // Ensure project exists (in case tickets has extra ids)
    await prisma.project.upsert({
      where: { id: String(projectId) },
      update: {},
      create: {
        id: String(projectId),
        name: String(entry?.projectName || entry?.name || projectId),
        initials: String(entry?.initials || ""),
      },
    });

    const lastNumber = Number(entry?.lastNumber ?? 0) || 0;
    await prisma.projectCounter.upsert({
      where: { projectId: String(projectId) },
      update: { lastNumber },
      create: { projectId: String(projectId), lastNumber },
    });

    const tasks = Array.isArray(entry?.tasks) ? entry.tasks : [];
    for (const t of tasks) {
      const taskId = String(t.taskId || t.gid || "").trim();
      if (!taskId) continue;
      const number = Number(t.number ?? 0) || 0;

      await prisma.ticketTask.upsert({
        where: { taskId },
        update: {
          projectId: String(projectId),
          originalName: String(t.originalName || t.taskName || ""),
          newName: t.newName ? String(t.newName) : null,
          number,
        },
        create: {
          projectId: String(projectId),
          taskId,
          originalName: String(t.originalName || t.taskName || ""),
          newName: t.newName ? String(t.newName) : null,
          number,
        },
      });
    }
  }

  console.log(`Importing ${users.length} users...`);
  for (const u of users) {
    const email = String(u.email || "").trim().toLowerCase();
    const passwordHash = String(u.passwordHash || "").trim();
    if (!email || !passwordHash) continue;

    await prisma.user.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, passwordHash },
    });
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

