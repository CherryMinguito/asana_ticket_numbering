const express = require("express");

const authController = require("../controllers/authController");

const router = express.Router();

router.get("/login", authController.getLoginPage);
router.post("/api/auth/login", authController.login);
router.post("/api/auth/logout", authController.logout);
router.get("/api/auth/me", authController.me);

module.exports = router;

