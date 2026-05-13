const { readProjects, addProject, updateProject } = require("../models/projectModel");
const { getLastNumberByProjectId, parseLastNumber, setLastNumberForProject } = require("../models/ticketModel");

async function listProjects(req, res) {
  const projects = await readProjects();
  const withLast = await Promise.all(
    projects.map(async (p) => ({
      ...p,
      lastNumber: await getLastNumberByProjectId(p.id),
    }))
  );
  res.json(withLast);
}

async function createProject(req, res) {
  try {
    const project = await addProject(req.body || {});

    const lastNumber = parseLastNumber(req.body?.lastNumber);
    if (lastNumber !== null) await setLastNumberForProject(project.id, project.initials, lastNumber);

    res.status(201).json({ ...project, lastNumber: await getLastNumberByProjectId(project.id) });
  } catch (err) {
    if (err.code === "VALIDATION") return res.status(400).json({ error: err.message });
    if (err.code === "DUPLICATE") return res.status(409).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: "Failed to add project" });
  }
}

async function updateProjectById(req, res) {
  try {
    const updated = await updateProject(req.params.id, req.body || {});

    const lastNumber = parseLastNumber(req.body?.lastNumber);
    if (lastNumber !== null) await setLastNumberForProject(updated.id, updated.initials, lastNumber);

    res.json({ ...updated, lastNumber: await getLastNumberByProjectId(updated.id) });
  } catch (err) {
    if (err.code === "VALIDATION") return res.status(400).json({ error: err.message });
    if (err.code === "NOT_FOUND") return res.status(404).json({ error: err.message });
    console.error(err);
    return res.status(500).json({ error: "Failed to update project" });
  }
}

module.exports = {
  listProjects,
  createProject,
  updateProjectById,
};

