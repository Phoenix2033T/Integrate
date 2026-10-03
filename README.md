# Integrate

Integrate is a multi-native AI-powered note-taking and learning platform for every subject.

## Vision

Integrate should work as an excellent normal notes app first, then add context-aware intelligence on top. The goal is a single workspace for handwriting, typing, PDFs, diagrams, math, history, science, English, computer science, and general studying.

## Current milestone

The repository currently contains the first runnable web MVP. It includes:

- note creation and deletion
- editable note titles, subjects, and content
- persistent browser storage
- note search
- starter subject examples
- responsive desktop/mobile layout
- the first Integrate AI side-panel surface
- quick actions for Summarize, Quiz me, Explain, and Find gaps

The AI buttons are intentionally UI-only in this first slice. The next backend milestone will connect them to grounded note context rather than shipping a fake chatbot response.

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

## Status

Early development. The current code is a foundation, not a completed production release.
