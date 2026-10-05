# Integrate

Integrate is a local-first notebook and study workspace built for handwriting, typed notes, lecture capture, STEM work, and optional AI assistance.

## Release status

The web app is now organized as a **0.9.0 release candidate**. The release gate is an exact-commit TypeScript check plus a Next.js production build in GitHub Actions. Do not tag 1.0 until that gate and the manual smoke-test checklist in `docs/RELEASE_CHECKLIST.md` pass.

The Apple and Windows folders are native-client foundations, not store-ready binaries. The first releasable product is the installable web/PWA client.

## What works in the web release candidate

- nested folders and customizable notebook covers
- Favorites, Recent, Trash/restore, search, sorting, tags, grid/list library views
- multiple pages with thumbnail navigation, reorder, duplicate, and delete
- pressure-aware pen styles and highlighter
- stroke and precision erasers
- freeform lasso selection with move/delete transforms
- vector lines, rectangles, ellipses, and arrows
- blank, ruled, grid, dotted, Cornell, engineering, and isometric paper
- typed notes and recognized-handwriting context
- local lecture audio recording and playback
- timestamped ink foundation for audio-linked writing replay
- deterministic Math Assist for algebra-step equivalence
- optional grounded AI actions and handwriting recognition
- local autosave
- JSON backup/import
- Markdown export and print/save-as-PDF
- light/dark appearance
- installable PWA with offline shell caching
- privacy/product disclosure pages
- health endpoint, security headers, request-size limits, and basic AI abuse controls

## Run locally

Requirements: Node.js 24 and npm.

```bash
npm install
npm run dev:web
```

Open `http://localhost:3000`.

For iPad testing on the same Wi-Fi network:

```bash
npm --workspace @integrate/web run dev -- --hostname 0.0.0.0
```

Then open the Network address printed by Next.js.

## AI configuration

Copy `apps/web/.env.example` to `apps/web/.env.local`, add a server-side API key, and restart the server.

The default model is `gpt-6-luna`. The key is read by server routes and is not intentionally sent to the browser. AI can be disabled with `INTEGRATE_AI_ENABLED=false`. Basic per-instance request limits are configurable; a broad public launch with hosted accounts should replace these with account/edge-backed quotas.

## Production build

```bash
npm run typecheck:web
npm run build:web
npm --workspace @integrate/web run start
```

Health check: `GET /api/health`.

A portable Docker build is included:

```bash
docker build -t integrate .
docker run --rm -p 3000:3000 --env-file apps/web/.env.local integrate
```

Use HTTPS in production.

## Data model and privacy

The current release is local-first. Workspace data is stored in browser storage; recorded audio uses IndexedDB. AI requests transmit only the context needed for the action the user invokes. There is no hosted Integrate account database or automatic cross-device sync in this release.

Because clearing browser site data can remove local work, users should export backups for important notebooks.

## Repository

```text
apps/
  web/        Next.js release candidate
  apple/      SwiftUI native-client foundation
  windows/    WinUI native-client foundation

packages/
  core/       shared document/domain model

docs/
  PRODUCT_ROADMAP.md
  ARCHITECTURE.md
  RUNBOOK.md
  STATUS.md
  RELEASE_CHECKLIST.md
```

## Release boundary

Version 1.0 of the web product does not need to pretend cloud collaboration exists. Authentication, encrypted hosted sync, collaborative editing, production account quotas, and store-signed native binaries are separate hosted/native milestones and must be completed before those capabilities are advertised.

See `docs/RELEASE_CHECKLIST.md` for the release gate.
