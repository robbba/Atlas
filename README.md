# ATLAS Hosted

ATLAS (Allocation, Timeline, Load and Allocation System) is an offline-runtime-ready monorepo for planning and allocation.

## Layout

- `packages/core` — pure domain types and immutable state transitions.
- `packages/server` — Fastify service and the isolated SQLite adapter in `src/db.ts`.
- `apps/web` — Vite TypeScript client.

## Local development

Install dependencies once, then run the Fastify and Vite processes separately:

```sh
npm install
npm run dev:server
npm run dev:web
```

The Vite development server proxies `/api` to Fastify on port `3000`.

## Validation and build

```sh
npm run typecheck
npm run test
npm run build
```

## Container deployment

```sh
docker compose up --build
```

Fastify serves both the API and the generated client at `http://localhost:3000`. The named `atlas-sqlite` volume mounts to `/data`, retaining `atlas.db` and its SQLite WAL sidecar files across container restarts.

The application has no CDN or other runtime network dependency. A first-time Docker build still requires base images and npm packages to be available through a cache, mirror, or registry.

## Hosted authentication and roles

On a new database, open the hosted application and complete the first-run administrator wizard. Setup is one-time and is protected by a database transaction, so only one administrator can be created. Subsequent users sign in with the account name and password created by an administrator.

The hosted roles are:

- **Admin** — full planner access, management settings/categories, account management, imports, and audit history.
- **User** — may update schedule cells and activities, but cannot change management categories/settings or manage accounts.
- **Reader** — read-only access to schedules, plans, activities, dashboards, and reports.

Authentication uses server-side password hashes and opaque, HttpOnly session cookies. Passwords and session tokens are not stored in planner JSON or browser local storage. The server, rather than hidden browser controls, enforces role permissions.

The server records audit events for authentication, account changes, planner updates, and other protected mutations. Audit history must not be treated as a replacement for database backups: retain regular copies of the SQLite database and WAL files using an approved backup procedure.

For local development, HTTP may be used temporarily. For production, place the service behind an HTTPS reverse proxy so session cookies and credentials are protected in transit. Do not expose the service directly over plaintext HTTP in production.

The legacy JSON file chooser remains available only when the application is opened in offline `file:` mode. Hosted mode starts with authentication instead of the JSON splash screen.

### Personal upcoming view

Administrators can optionally link a hosted login account to one personnel record. This is a one-to-one relationship: personnel can exist without login accounts, and login-only accounts can exist without personnel records. Linking never creates or deletes either object automatically.

Linked accounts receive a **My upcoming** sidebar view showing the next 14 calendar days of their own activities, shifts/work codes, absences, out-of-office statuses, planned/confirmed state, and cancelled activities. Unlinked accounts do not receive a personal view. Only administrators can create or change links.

### Administrator review responsibility

Administrators can optionally receive an explicit responsibility scope for a canonical organisation branch. A scope is intended for the Admin change-review queue and includes descendants. It does not currently restrict the Admin's broader planner editing permissions. Global administrators can assign or remove scopes; a scoped administrator cannot widen their own responsibility. An Admin with no scope remains global by default.

The Dashboard includes an Admin-only **My employees’ changes** card. It lists recent operational cell and activity changes, identifies the actor and time, and provides a full review modal. Selecting a schedule-cell change opens the Schedule at its date and temporarily highlights the affected cell in red. This review feed is separate from legacy Boss View work-schedule check marks.

Hosted operational check-off is now an Admin function rather than a separate Boss View password. Admins can use the small **Check** control in schedule cells for daily statuses and activity assignments. The server records the checking administrator and timestamp, and rejects non-Admin requests. The old local Boss View password remains only for offline file mode during the migration period.