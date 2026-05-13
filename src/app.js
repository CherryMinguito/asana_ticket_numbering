const express = require("express");
const session = require("express-session");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const userRoutes = require("./routes/userRoutes");
const { requireAuth } = require("./middleware/auth");

const SESSION_SECRET = process.env.SESSION_SECRET || "dev-insecure-secret-change-me";

const app = express();

app.use(express.json());
app.set("trust proxy", 1);

app.use(
  session({
    name: "aant.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.COOKIE_SECURE === "true",
    },
  })
);

// Auth endpoints + login page
app.use(authRoutes);

// Protect everything except login + auth endpoints
app.use((req, res, next) => {
  if (req.path === "/login") return next();
  if (req.path.startsWith("/api/auth/")) return next();
  return requireAuth(req, res, next);
});

// API routes
app.use(projectRoutes);
app.use(userRoutes);

// Static UI (MVC "views")
app.use(express.static(path.join(__dirname, "public")));

// Serve the app shell
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

module.exports = app;

