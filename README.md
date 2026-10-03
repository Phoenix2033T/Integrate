# Integrate

Integrate is a multi-native AI-powered note-taking and learning platform for every subject.

## Vision

Integrate should work as an excellent normal notes app first, then add context-aware intelligence on top. The goal is a single workspace for handwriting, typing, PDFs, diagrams, math, history, science, English, computer science, and general studying.

## Current milestone

The web client now includes the third major product layer:

- notebook → page organization
- notebook folders
- create, rename, and organize notebooks
- create, switch, favorite, and delete pages
- search across titles, subjects, note text, tags, and notebooks
- typed notes with lightweight formatting helpers
- pen, highlighter, eraser, ink color, and undo
- blank, lined, grid, and dotted paper
- tags
- image attachments
- small PDF imports with persistent local storage
- autosave status
- page version snapshots and restore
- migration from earlier Integrate local-storage formats
- page / notebook / all-notes AI context scopes
- real server-side AI requests
- generated summaries, quizzes, explanations, gap analysis, study guides, and flashcards
- shared core schemas for future native clients
- GitHub Actions web build CI

## Run the web app

Requirements:

- Node.js 20+
- npm 10+

From the repository root:

```bash
npm install
npm run dev:web
```

Then open:

```text
http://localhost:3000
```

## Enable Integrate AI

Copy the example environment file:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Then edit `apps/web/.env.local`:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-6-luna
```

Restart the development server after changing environment variables.

The API key is read only by the Next.js server route. It is never intentionally sent to the browser.

## AI architecture

The browser sends:

```text
user request
+ selected scope (page / notebook / all notes)
+ grounded note text and metadata
```

to:

```text
POST /api/ai
```

The server then calls the OpenAI Responses API and returns only the generated answer to the client.

Handwritten ink currently contributes metadata indicating that ink exists, but handwriting OCR is not implemented yet. That will be a separate recognition layer before symbolic math checking.

## Attachment limits

For this local-first MVP, files up to about 1.5 MB can be persisted as browser data URLs. Larger files keep their metadata but are not fully persisted. Production storage will move attachments into object storage instead of browser localStorage.

## Planned platform architecture

```text
apps/
  web/        Next.js web client
  apple/      SwiftUI iPhone, iPad, and macOS client
  windows/    WinUI 3 Windows client
  server/     backend services as the project grows

packages/
  core/       shared document/domain model
  ai/         AI orchestration contracts
  math/       symbolic math and step-checking contracts
  sync/       synchronization model
  study/      quizzes, flashcards, and mastery model
```

## Product pillars

1. Notes — handwriting, typing, PDFs, images, drawing, organization, search.
2. Intelligence — ask a page, notebook, selection, or all notes with grounded context.
3. STEM — handwriting-to-math, deterministic step checking, graphs, formulas, and code cells.
4. Study — summaries, study guides, quizzes, flashcards, practice tests, timelines, and concept maps.
5. Multi-native — native Apple and Windows experiences plus a first-class web client.

## Next major layers

- handwriting OCR / math recognition
- deterministic symbolic math checking
- production auth, database, sync, and object storage
- richer block editor
- full PDF annotation
- image-aware AI context
- spaced repetition and mastery tracking
- native Apple client
- native Windows client

## Status

Active development. The current web app is a functional local-first prototype, not yet a production release.
