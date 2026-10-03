# Integrate

Integrate is a multi-native AI-powered note-taking and learning platform for every subject.

## Vision

Integrate should work as an excellent normal notes app first, then add context-aware intelligence on top. The goal is a single workspace for handwriting, typing, PDFs, diagrams, math, history, science, English, computer science, and general studying.

## Current milestone

The web client now has the second working product layer:

- notebook → page organization
- create and rename notebooks
- create, switch, and delete pages
- text notes with lightweight formatting helpers
- pen and highlighter drawing
- click/drag stroke eraser
- ink color selection
- undo-last-stroke and clear-ink actions
- blank, lined, grid, and dotted paper
- persistent browser storage
- automatic migration from the original v1 note format
- search across every notebook
- responsive layout
- AI context surface for page / notebook / all-notes scope
- study actions including Summarize, Quiz me, Explain, Find gaps, Study guide, and Flashcards

The AI controls are still intentionally non-generative at this milestone. The data model is now ready for the next service layer to ground AI requests in actual page and notebook content instead of returning fake demo answers.

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

## Planned platform architecture

```text
apps/
  web/        Next.js web client
  apple/      SwiftUI iPhone, iPad, and macOS client
  windows/    WinUI 3 Windows client
  server/     API/backend services

packages/
  core/       shared document/domain model
  ai/         AI orchestration contracts
  math/       symbolic math and step-checking contracts
  sync/       synchronization model
  study/      quizzes, flashcards, and mastery model
```

## Product pillars

1. Notes — handwriting, typing, PDFs, images, drawing, organization, search.
2. Intelligence — ask a page, notebook, selection, or all notes with cited source context.
3. STEM — handwriting-to-math, deterministic step checking, graphs, formulas, and code cells.
4. Study — summaries, study guides, quizzes, flashcards, practice tests, timelines, and concept maps.
5. Multi-native — native Apple and Windows experiences plus a first-class web client.

## Next layer

The next major implementation layer is:

- real AI request/response pipeline with page/notebook grounding
- generated summaries, quizzes, flashcards, and study guides
- attachments and image blocks
- PDF import/annotation foundation
- richer text blocks
- folders/tags/favorites
- autosave/status indicators and revision history
- shared core schemas for native clients

## Status

Early active development. The current code is a functional foundation, not a completed production release.
