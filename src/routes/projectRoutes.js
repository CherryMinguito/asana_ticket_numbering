const express = require("express");

const projectsController = require("../controllers/projectsController");

const router = express.Router();

router.get("/api/projects", projectsController.listProjects);
router.post("/api/projects", projectsController.createProject);
router.put("/api/projects/:id", projectsController.updateProjectById);

module.exports = router;

