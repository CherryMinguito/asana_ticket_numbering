require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

// ---------------- CONFIG ----------------
const { isDev, TICKET_FILE, PROJECT_FILE, ASANA_TOKEN } = require("../../config");

const PROJECTS_TO_SCAN = JSON.parse(
  fs.readFileSync(PROJECT_FILE, "utf8")
);

// ---------------------------------------

// Load tickets.json
let tickets = {};
if (fs.existsSync(TICKET_FILE)) {
  tickets = JSON.parse(fs.readFileSync(TICKET_FILE, "utf8"));
}

// Save to tickets.json
function saveTickets() {
  fs.writeFileSync(TICKET_FILE, JSON.stringify(tickets, null, 2));
}

// Generate initials from project name
function getInitials(name) {
  return name
    .split(/\s+/)
    .map(word => word[0]?.toUpperCase() || "")
    .join("");
}

// Get next ticket number per project
function getNextTicket(projectId) {
  if (!tickets[projectId]) {
    tickets[projectId] = { lastNumber: 0, tasks: [], initials: "PRJ" };
  }
  tickets[projectId].lastNumber += 1;
  saveTickets();
  return tickets[projectId].lastNumber;
}

// Add ticket entry
function addTicket(projectId, taskId, originalName, ticketNumber, projectName, initials) {
  if (!tickets[projectId]) {
    tickets[projectId] = {
      lastNumber: 0,
      tasks: [],
      initials: initials || getInitials(projectName)
    };
  }

  if (!tickets[projectId].tasks.some(t => t.taskId === taskId)) {
    const prefix = `[${initials}${ticketNumber}]`;

    tickets[projectId].tasks.push({
      taskId,
      originalName,
      newName: `${prefix} ${originalName}`,
      number: ticketNumber
    });

    tickets[projectId].initials = initials;
    tickets[projectId].lastNumber = ticketNumber;

    saveTickets();
  }
}

// Fetch Asana task details
async function getTaskDetails(taskId) {
  const res = await axios.get(`https://app.asana.com/api/1.0/tasks/${taskId}`, {
    headers: { Authorization: `Bearer ${ASANA_TOKEN}` },
  });
  return res.data.data;
}

// Update task name in Asana
async function updateAsanaTask(taskId, taskName, ticketNumber, initials) {
  const prefix = `[${initials}${ticketNumber}]`;
  const newName = taskName.startsWith(prefix)
    ? taskName
    : `${prefix} ${taskName}`;

  await axios.put(
    `https://app.asana.com/api/1.0/tasks/${taskId}`,
    { data: { name: newName } },
    { headers: { Authorization: `Bearer ${ASANA_TOKEN}` } }
  );

  console.log(`✔ Updated task ${taskId}: ${newName}`);
  return newName;
}

// Fetch tasks created today
async function getTodayTasks(projectId) {
//   const today = new Date().toISOString().split("T")[0];

  // Compute timestamp for 5 minutes ago
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const url = `https://app.asana.com/api/1.0/tasks?project=${projectId}&modified_since=${fiveMinutesAgo}`;

  const res = await axios.get(url,
    { headers: { Authorization: `Bearer ${ASANA_TOKEN}` } }
  );



  return res.data.data || [];
}

function needsTicketPrefix(name) {
  // Trim whitespace
  name = name.trim();

  // Check first 7 characters for any digit
  const firstSeven = name.slice(0, 7);

  // If there’s a digit, assume a ticket prefix exists
  return !/\d/.test(firstSeven);
}

// ---------------- PROCESS A PROJECT ----------------
async function processProject(project) {
  const { id: projectId, name: projectName, initials } = project;

  console.log(`\n🔍 Scanning project: ${projectName} (${projectId})`);

  let tasks = [];
  try {
    tasks = await getTodayTasks(projectId);
  } catch (err) {
    console.error(`❌ Failed to fetch tasks for ${projectName}:`, err.message);
    return;
  }

  for (const task of tasks) {
    const taskId = task.gid;

    let details;
    try {
      details = await getTaskDetails(taskId);
    } catch {
      console.log(`⚠️ Skipping task ${taskId}; cannot fetch details.`);
      continue;
    }
    
    const taskName = details.name || "";
    const taskDesc = details.notes || "";

    // Skip if both name and description are empty
    if (!taskName.trim() && !taskDesc.trim()) {
      console.log(`⚠️ Skipping task ${taskId}; empty name and description.`);
      continue;
    }

    // Initialize ticket entry if missing
    if (!tickets[projectId]) {
      tickets[projectId] = {
        lastNumber: 0,
        tasks: [],
        initials: initials
      };
    }

    if (!needsTicketPrefix(taskName, initials)) {
      continue; // already has prefix
    }

    const ticketNumber = getNextTicket(projectId);

    // Update task name
    await updateAsanaTask(taskId, taskName, ticketNumber, initials);

    // Save entry
    addTicket(projectId, taskId, taskName, ticketNumber, projectName, initials);
  }

  console.log(`✔ Finished: ${projectName}`);
}

// ---------------- RUN SCANNER ----------------
async function runScanner() {
  console.log("\n===============================");
  console.log("🕒 Running 5-minute Asana scan...");
  console.log("===============================\n");

  // IMPORTANT: use project object, not ID
  for (const project of PROJECTS_TO_SCAN) {
    await processProject(project);
  }
}

// Run immediately
runScanner();

// Run every 5 minutes
setInterval(runScanner, 5 * 60 * 1000);

// Simple express endpoint
app.get("/", (req, res) => res.send("Asana Auto-Ticketing is Running!"));

// Start server
const PORT = process.env.UPDATE_TICKETS_PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
