#!/usr/bin/env node
require("dotenv").config();

const readline = require("readline");

const { addProject } = require("../models/projectStore");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  try {
    const id = (await ask("Asana Project ID: ")).trim();
    const name = (await ask("Project Name: ")).trim();
    const initials = (await ask("Ticket Initials (e.g. AATN-): ")).trim();

    const newProject = await addProject({ id, name, initials });

    console.log("✅ Project added successfully:");
    console.table(newProject);
  } catch (err) {
    console.error("❌ Failed to add project:", err.message);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

main();
