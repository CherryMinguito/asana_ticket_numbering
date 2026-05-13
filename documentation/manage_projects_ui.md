## Projects Admin UI Plan

### Goal
Add a simple web UI (served by the existing Express app) that lets a user:
- View a table of projects
- Add a new project
- Update an existing project

Projects are stored in `PROJECT_FILE` (from `config.js`), currently `files/projects.json` (prod) / `files/test_projects.json` (dev).

---

## Requirements

### Views / Pages
1. **Projects List View**
   - Route: `GET /projects`
   - Shows a table of all projects from `PROJECT_FILE`
   - Includes an "Add Project" form on the same page
   - Each row includes an **Edit** button/link

2. **Edit Project View**
   - Route: `GET /projects/:id/edit`
   - Shows an edit form prefilled with project values
   - `id` is read-only (primary key)

---

## Routes (Backend)

### Read / List
- `GET /projects`
  - Load projects from `PROJECT_FILE`
  - Render HTML table + Add form
  - Optional: show success/error message via query params (`?ok=added`, `?ok=updated`, `?err=...`)

### Create
- `POST /projects`
  - Input: `id`, `name`, `initials` (from HTML form)
  - Validation:
    - `id` required
    - `name` required
    - `initials` optional; if blank, generate from name (like `add-project.js`)
    - reject duplicate `id`
  - Write updated array to `PROJECT_FILE`
  - Redirect to `/projects?ok=added`

### Edit form
- `GET /projects/:id/edit`
  - Load projects, find by `id`
  - If not found: show 404 page/message
  - Render HTML edit form

### Update
- `POST /projects/:id`
  - Input: `name`, `initials`
  - Validation:
    - `name` required
    - `initials` required (recommended) or fallback to existing initials if omitted
  - Update matching project in array and write to `PROJECT_FILE`
  - Redirect to `/projects?ok=updated`

---

## Implementation Notes

### Body parsing for HTML forms
The app currently parses JSON bodies. For HTML form submits, enable URL-encoded parsing:
- `app.use(express.urlencoded({ extended: false }))`

### Storage helpers (recommended)
Create small helper functions (either inline or in a `services/` module):
- `readProjects()` -> array
- `writeProjects(projects)` -> writes JSON with `null, 2`
- `generateInitials(name)` -> matches `add-project.js` behavior

### Keep the scanner in sync
`update_tickets.js` currently loads projects once at startup:
- Replace the startup constant with reading `PROJECT_FILE` inside `runScanner()` so new/edited projects take effect without restarting the server.

---

## UX / UI Details (Minimal)

### Projects table columns
- Project ID
- Name
- Initials
- Actions: `Edit`

### Add form fields (on `/projects`)
- Asana Project ID (required)
- Project Name (required)
- Ticket Initials (optional, placeholder like `SCF-`)

### Edit form fields (on `/projects/:id/edit`)
- Asana Project ID (read-only)
- Project Name (required)
- Ticket Initials (required)

---

## Acceptance Criteria
- Visiting `/projects` shows all projects from `PROJECT_FILE` in a table.
- Submitting the add form creates a new project in `PROJECT_FILE` and it appears in the table after redirect.
- Clicking Edit opens `/projects/:id/edit` with prefilled values.
- Submitting the edit form updates the project in `PROJECT_FILE` and changes show in the table after redirect.
- The ticketing scanner uses the updated projects list without needing a server restart.
