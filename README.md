# Asana Automated Ticket Numbering

Small Node.js app + UI that manages:

- Asana **projects** (name + initials)
- per-project **last ticket number**
- **users** that can log into the admin UI

Data is stored in **SQLite** via **Prisma**.

## Requirements

- Node.js (recommended: 20+)
- npm

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a `.env` file

Copy the example and fill in your own values:

```bash
cp .env.example .env
```

The minimum required variables:

```bash
DATABASE_URL="file:./prisma/dev.db"
SESSION_SECRET="replace-with-random-string"
AUTH_EMAIL="your-admin-email@example.com"
AUTH_PASSWORD_HASH="bcrypt-hash-here"
ASANA_TOKEN="your-asana-token"
```

Generate an `AUTH_PASSWORD_HASH` (bcrypt) before pasting it into `.env`:

```bash
node -e "const b=require('bcryptjs'); console.log(b.hashSync(process.argv[1], 10));" "your-password"
```

> Do not commit `.env` — it contains secrets and is gitignored.

### 3. Run the database migration

This creates the SQLite database at `prisma/prisma/dev.db`:

```bash
npm run db:migrate
```

Open Prisma Studio (optional):

```bash
npm run db:studio
```

### 4. (Optional) Import sample JSON data

Sample data lives in `files/projects.json` and `files/tickets.json`. To load it into the database, run:

```bash
npm run db:import
```

The script also looks for `files/users.json` if you have one — otherwise it skips users. You can create users through the admin UI after logging in.

## Run the UI server

```bash
npm run start
```

Then open `http://localhost:3000` and log in with the `AUTH_EMAIL` + password you configured in step 2.

From the admin UI you can:

- Add additional projects
- Add additional users (email + password)

## CLI utilities

Add a project (interactive):

```bash
npm run add-project
```

Run the Asana scanner/ticket updater (polls every 5 minutes):

```bash
npm run update-tickets
```

You can also scope it to a single project:

```bash
node src/cli/update_tickets.js --projectId <asanaProjectId>
```

## Notes

- **Do not commit** `.env` (it contains secrets).
- The SQLite database file lives at `prisma/prisma/dev.db` and is ignored by git.
- `files/users.json` is gitignored as well; create users through the UI instead.
