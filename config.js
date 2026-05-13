// Load .env variables
require("dotenv").config();
const fs = require("fs");
const path = require("path");

// Environment
const isDev = process.env.NODE_ENV === "development";

// File paths
const TICKET_FILE = isDev 
  ? path.join(__dirname, "files", "test_tickets.json")
  : path.join(__dirname, "files", "tickets.json");

const PROJECT_FILE = isDev
  ? path.join(__dirname, "files", "test_projects.json")
  : path.join(__dirname, "files", "projects.json");

// ASANA token
const ASANA_TOKEN = process.env.ASANA_TOKEN;

// Export all config
module.exports = {
  isDev,
  TICKET_FILE,
  PROJECT_FILE,
  ASANA_TOKEN
};
