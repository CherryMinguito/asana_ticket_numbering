const express = require("express");

const usersController = require("../controllers/usersController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/api/users", requireAuth, requireAdmin, usersController.listUsers);
router.post("/api/users", requireAuth, requireAdmin, usersController.createUser);
router.delete("/api/users/:email", requireAuth, requireAdmin, usersController.deleteUser);

module.exports = router;

