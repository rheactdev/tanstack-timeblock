# Timestripe · Horizons

A Timestripe Horizons workspace built with TanStack Start, React, Better Auth, and CouchDB. The interface follows the supplied Timestripe layout with BoldKit’s dark React components, square controls, hard shadows, and coral/teal/yellow accents.

## Start locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. Without `COUCHDB_URL`, development uses private JSON documents in the ignored `.data/` directory. Tasks, boards, accounts, and the generated development signing secret persist across restarts. Each visitor gets an isolated workspace using a signed, HttpOnly cookie. Signing in opens the account’s own workspace; guest tasks are kept separately.

## Add UI components

The shadcn CLI is configured in `components.json` with the [BoldKit React registry](https://github.com/ANIBIT14/boldkit#quick-start), Tailwind CSS v4, and `src/styles.css`. The `@/` alias resolves to `src/` in TypeScript and Vite; new UI components go into `src/components/ui/` and use the existing `src/lib/utils.ts`.

Add components from the project root with:

```sh
npx shadcn@latest add @boldkit/field
```

Replace `field` with the component name, or pass multiple names such as `@boldkit/button @boldkit/input`. At overwrite prompts, keep existing files to preserve their local changes. The existing theme and components are already in place; initialization and theme installation are not needed.

## Use local CouchDB

Compose runs only CouchDB for local development. The application runs on your host with `npm run dev`.

```sh
cp .env.example .env
```

Set `BETTER_AUTH_SECRET` to a random value and change `COUCHDB_PASSWORD`. Set `COUCHDB_URL=http://127.0.0.1:5984`, then:

```sh
docker compose up -d --wait --wait-timeout 120
npm run db:init
npm run dev
```

The single-node configuration automatically creates CouchDB’s required `_users` and `_replicator` system databases, preventing the missing `_users` error. It uses one replica and one shard per new database. The authenticated health check verifies `/_up` and both system databases; `--wait` returns only when those checks pass. This follows [CouchDB’s single-node setup](https://docs.couchdb.org/en/stable/setup/single-node.html).

The container runs as the image’s `couchdb` user (`5984:5984`) so its startup script does not try to change ownership of the read-only configuration mount. The mounted configuration loads before the image’s writable `docker.ini`, where CouchDB saves runtime settings.

The initializer creates the application database and its `kind` index. The app connects to CouchDB over HTTP from the server. Database credentials never enter the browser bundle. CouchDB uses a persistent Docker volume and binds to `127.0.0.1:5984`. Open [Fauxton](http://127.0.0.1:5984/_utils/) and sign in with the CouchDB credentials from `.env` to inspect it. To use a remote database, supply its URL and credentials through environment variables.

Check status with `docker compose ps` and logs with `docker compose logs --tail=100 couchdb`. Stop it with `docker compose down`; the database volume is preserved. After changing the CouchDB configuration, run the startup command again with `--force-recreate` so the new configuration is applied to an existing container.

Better Auth handles email/password sign-up, sign-in, sessions, and sign-out through `/api/auth/$`. Its custom CouchDB adapter stores user, account, session, and verification records. CouchDB revision checks protect conditional writes, consume operations, and concurrent workspace updates. A deterministic user email key enforces uniqueness during concurrent sign-ups. The adapter currently queries records by model, so larger deployments should add field-specific Mango selectors and indexes.

## What you can do

- Plan in Inbox, a specific Day, Week, Month, Year, and timeless Life. A goal belongs to exactly one period. A single collapsible BoldKit sidebar contains all planning views and workspace tools.
- Collapse and expand horizon rails. The initial layout expands Inbox, Year, and Life; later layout and sorting preferences are saved in the workspace.
- Open Days (seven days), Weeks (six weeks), Months (twelve months), or Years (ten years) for adjacent calendar columns. Use the date picker to move the shared calendar cursor. Dates use Monday-start weeks in America/New_York without UTC date shifts.
- Create goals inline, complete/reopen them, drag between periods, and save their list position. The menu’s Move to position action provides a keyboard/touch alternative. Manual movement returns that destination list to manual sort.
- Reschedule from quick choices or pick a specific date, week, month, or year. Goal details edit title, notes, completion, and one of Timestripe’s six marker colors.
- Hover or focus a column heading to reveal Add and Collapse controls. Filter by color and completion. Search titles and notes with F, ⌘K, or Ctrl+K; search matches whole words.
- Duplicate goals, delete them with Undo, or restore them from Settings → Deleted goals. Restore preserves the goal’s period, board, notes, color, and completion state.
- Change the scenic strip, export JSON, and sign into an isolated account workspace. New workspaces start empty. Guest goals stay separate from account goals.

Boards, subgoals, recurring goals, hours/time blocking, quarters, decades, and collaboration are deferred from this MVP. Existing board data is preserved, and all existing goals remain available in Horizons. Incomplete goals stay on their assigned date and are never silently carried forward.

## Existing data

Workspace schema v2 adds calendar dates, manual positions, soft deletion, and layout/sort preferences. The first load of a legacy workspace migrates its day/week/month/year labels into the corresponding current periods. Existing IDs, notes, colors, boards, completion state, and list order are retained. The original workspace is retained as `legacyWorkspace` on the same server document, with migration metadata. No data reset or migration command is required.

## Application boundaries

`src/routes/` contains file-based TanStack Router routes for `/horizons`, `/inbox`, `/days`, `/weeks`, `/months`, and `/years`. Legacy `/boards/$boardId` URLs redirect to Horizons, and legacy board filters are normalized to all goals. The shared pathless planner route validates the calendar cursor (`date`), text (`q`), completion visibility (`completed`), color, and selected goal (`goal`) with Zod. Default filter values are stripped from URLs. The root URL redirects legacy `view` links to the corresponding routes. Planning routes explicitly use `ssr: true` so their navigation and goals arrive in the initial HTML.

`src/routes/__root.tsx` renders the complete HTML document with `HeadContent` and `Scripts`. `src/server.ts` uses `defaultStreamHandler`. The main loader awaits the critical workspace and returns a separate progress promise; `Suspense` and `Await` consume the deferred result. Browser state is read in effects, keeping server rendering deterministic.

Typed `createServerFn` functions live in `src/lib/functions.ts`. Mutations validate their inputs on the server and resolve the owner from the session or signed visitor cookie. Client-provided task IDs never select a different owner’s workspace. All database access, credentials, signing, and Better Auth server configuration live in `.server.ts` modules behind explicit `server-only` imports. API routes dynamically import their server handlers.

## Deploy on Node

```sh
npm run build
npm start
```

Provide `COUCHDB_URL`, `COUCHDB_DATABASE`, `COUCHDB_USER`, `COUCHDB_PASSWORD`, `BETTER_AUTH_SECRET`, and your public `BETTER_AUTH_URL` in the runtime environment. Production refuses an unconfigured database or missing signing secret. `TIMESTRIPE_LOCAL_DEMO=true` explicitly opts into file-backed, single-process preview mode.

Nitro’s `node-server` preset emits `.output/server/index.mjs` and `.output/public`. The included Dockerfile packages that output. To target another supported runtime, change the Nitro preset and supply its environment bindings; routes, loaders, and server functions keep the same application model. Preserve streaming responses through any reverse proxy.

## Deploy with Coolify

Use the repository’s `compose.coolify.yaml` for production. The existing `compose.yaml` remains the local CouchDB-only stack.

1. Create a Git-based application in Coolify and select the **Docker Compose** build strategy.
2. Set Base Directory to the repository root and Docker Compose Location to `compose.coolify.yaml`. Save and load the definition.
3. Set these runtime variables in Coolify:

   | Variable | Value |
   | --- | --- |
   | `BETTER_AUTH_URL` | Optional override; defaults to Coolify's generated `SERVICE_URL_APP_3000`. |
   | `BETTER_AUTH_SECRET` | Required: a persistent random secret of at least 32 characters. |
   | `COUCHDB_PASSWORD` | Required: the database administrator password. |
   | `COUCHDB_USER` | Optional; defaults to `timestripe`. |
   | `COUCHDB_DATABASE` | Optional; defaults to `timestripe`. |
   | `S3_KEYID`, `S3_SECRET` | B2 application key ID and application key; required for profile-picture uploads. |
   | `S3_ENDPOINT` | B2 S3 endpoint hostname or HTTPS URL, without a bucket path. |
   | `S3_REGION` | Region matching the B2 S3 endpoint. |
   | `S3_BUCKET` | Existing public bucket name for profile pictures. |

4. Under Domains, assign your domain to the **app** service with internal port **3000**, for example `https://planner.example.com:3000`. Coolify manages `SERVICE_URL_APP_3000` from that configuration; the Compose file passes its public URL to `BETTER_AUTH_URL` automatically. The `3000` in the generated variable's name selects the internal proxy port; the public URL still uses normal HTTP/HTTPS ports. If you already entered a literal `BETTER_AUTH_URL`, clear that override or set it to `$SERVICE_URL_APP_3000` with interpolation enabled. A manual override should be your public origin, such as `https://planner.example.com`, with no internal-port suffix or `/api/auth` path.
5. Deploy, then review the application and CouchDB logs and health status.

These steps follow [Coolify’s Docker Compose deployment documentation](https://coolify.io/docs/applications/builds/docker-compose). The Compose file publishes no host ports. CouchDB uses service-to-service networking at `http://couchdb:5984` and has no public domain. Set secrets in Coolify; no local `.env` file is loaded into the images or mounted at runtime.

Both services build from this repository. The Node 24 application image retains Nitro’s `node-server` output. The CouchDB image includes `couchdb/single-node.ini`, so deployment does not depend on repository bind mounts or the Preserve repository option. CouchDB data persists in the named `couchdb-data` volume managed by the Compose resource.

The app waits for CouchDB’s authenticated health check, then runs `scripts/init-couchdb.mjs` before starting Nitro. This initializer creates the application database only when absent and ensures the `kind` index exists; it does not reset documents. It is safe to run again on container restart. The app’s `/api/health` endpoint reports HTTP process readiness without creating guest workspaces; CouchDB has its own database health check.

Keep the same signing secret, database credentials, database name, and persistent volume across redeployments. This stack creates a separate database on the Coolify server; existing local CouchDB data is not transferred automatically. Use CouchDB replication or your backup/restore process if you want to move that data.

Deployment has not been run or validated here. The manual deployment checks are in [MANUAL-CHECKLIST.md](MANUAL-CHECKLIST.md).

## Profile pictures with Backblaze B2

Set `S3_KEYID`, `S3_SECRET`, `S3_ENDPOINT`, `S3_REGION`, and `S3_BUCKET` in the server runtime environment. Local development reads the existing `.env`; Coolify deployments need the same variables configured in Coolify. The bucket must already be public and the application key must allow writing files under `avatars/`. A typical endpoint is `https://s3.us-west-004.backblazeb2.com`, with `us-west-004` as its region; use the endpoint and region for your own bucket.

Sign in, open the account dialog from the sidebar avatar, and choose **Upload photo** or **Change photo**. JPEG, PNG, and WebP images up to 5 MB are accepted. The server validates and decodes the file, applies orientation, crops it to a 512 × 512 WebP, and removes metadata before uploading. Images above 40 megapixels are rejected. The public S3 URL is saved through Better Auth's current-user API; profile updates refresh the sidebar without resetting the planner view or filters.

Uploads use a typed POST server function with session-resolved ownership. B2 credentials, image processing, and storage calls stay behind explicit server-only boundaries. The browser never receives storage credentials and needs no bucket upload CORS rule. Existing B2 objects are retained when a picture is replaced; the app uploads a new UUID-named object rather than overwriting or deleting bucket contents. Nitro explicitly traces Sharp into its Node deployment output; build the Docker image for the deployment host's architecture.

This follows [Backblaze's S3-compatible API documentation](https://www.backblaze.com/docs/cloud-storage-s3-compatible-api), [Better Auth's user-update API](https://better-auth.com/docs/concepts/users-accounts#update-user-information), and its [TanStack cookie integration](https://better-auth.com/docs/integrations/tanstack#usage-tips).

No tests, builds, type checks, or application browser checks were run for this rebuild, at the user’s request. Use [MANUAL-CHECKLIST.md](MANUAL-CHECKLIST.md) for the verification handoff. TanStack’s generated route tree is refreshed as implementation code generation; Vite also maintains it during development.

BoldKit React primitives and theme styles are vendored from its [official registry](https://github.com/ANIBIT14/boldkit/tree/main/registry/default) under the included [MIT license](BOLDKIT-LICENSE). Tailwind CSS v4 is integrated through its Vite plugin. Outfit Variable is bundled locally through Fontsource. Mountain photography: [Unsplash image](https://images.unsplash.com/photo-1464822759023-fed622ff2c3b).
