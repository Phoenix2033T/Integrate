# Integrate — Project Specification

> **Paper first. Intelligence when needed.**

**Project:** Integrate  
**Category:** Cross-platform note-taking, study, and STEM workspace  
**Status:** Web/PWA v0.9.0 release candidate; native Apple and Windows foundations  
**Last updated:** October 16, 2026  
**Repository:** https://github.com/Phoenix2033T/Integrate  
**Primary platform:** iPad and Apple Pencil experience, with responsive web and purpose-built desktop/mobile clients

---

## 1. Executive summary

**Integrate** is a local-first digital notebook designed to bring handwriting, typed notes, lecture capture, PDF work, mathematical reasoning, study workflows, and optional AI into one focused workspace.

The product takes inspiration from three categories of tools:

- **Goodnotes:** high-quality handwriting, notebooks, PDF annotation, paper templates, and organization.
- **Notability:** fast note capture, lecture recording, audio-linked notes, and contextual writing tools.
- **Derive:** STEM reasoning, math-step feedback, graphing, and learning-oriented intelligence.

Integrate is **not intended as a visual or functional clone**. It has its own visual identity, information architecture, document model, and long-term learning workflow. Its defining goal is to become **a notebook that understands what a student is learning without interrupting the act of writing**.

## 2. Product vision

A student should be able to attend class, write naturally with a stylus, annotate a worksheet, record a lecture, solve equations, and later turn that same material into explanations, flashcards, quizzes, and targeted practice—all without exporting between unrelated apps.

### Product principles

1. **Writing quality comes first.** Ink responsiveness, legibility, palm/stylus behavior, and low-friction page navigation are foundational.
2. **The paper is the product.** The interface should recede while writing and reveal advanced tools only when requested.
3. **Progressive disclosure.** Primary tools remain simple; contextual controls and advanced inspectors reveal depth.
4. **Local-first and resilient.** Notes remain useful without an AI service or internet connection; prevent data loss and make export straightforward.
5. **AI is assistive, not authoritative.** Ground answers in the user's material; use deterministic math checks where possible.
6. **Cross-device consistency, not identical layouts.** Shared content and recognizable interactions, with interfaces tailored to input and screen size.
7. **Accessible by design.** Keyboard support, readable contrast, focus states, screen-reader semantics, reduced-motion support, and appropriate touch targets.
8. **Original, premium identity.** Cohesive SVG iconography, restrained motion, subtle depth, excellent typography, and a recognizable Integrate brand.

## 3. Target users and use cases

**Primary audience:** secondary-school and university students using tablets, laptops, and desktops for handwritten and typed coursework.

**Additional audiences:** teachers, STEM learners, researchers, and people who mix visual and structured notes.

### Core workflows

- **Lecture:** open a notebook → write or type → optionally record audio → revisit content by page and timestamp.
- **Homework:** import a worksheet or PDF → annotate → check a math step → export or print.
- **Exam preparation:** select notes → request a study guide or quiz → review mistakes → practice weak concepts.
- **Organization:** create nested folders → customize symbols/colors → tag and favorite notebooks → search and retrieve material.
- **Cross-device:** capture with a stylus on iPad, review on phone, and work with larger layouts on desktop. True account sync is a **future milestone**, not part of the current release candidate.

## 4. Product structure

```text
Integrate
├── Library
│   ├── Nested folders and collections
│   ├── Notebooks, PDFs, whiteboards, documents, study sets
│   └── Search, favorites, recent, tags, trash
├── Workspace
│   ├── Tabs, page navigator, contextual toolbar
│   ├── Canvas and page objects
│   ├── Media, audio, and PDF workflows
│   └── Inspectors and export
├── Intelligence
│   ├── Handwriting understanding
│   ├── Grounded note Q&A and search
│   ├── Math and STEM assistance
│   └── Knowledge links
└── Study
    ├── Flashcards and quizzes
    ├── Active recall and spaced repetition
    └── Progress and mistake review
```

The **future document model** should represent notebook pages as collections of independently editable objects (ink, text, images, shapes, math, audio markers, files, code, and links). The **current web implementation** still uses a simpler page structure with typed body text, ink strokes, and attachments.

## 5. Visual design system

### Design direction

**Integrate Premium:** calm, polished, academically useful, and pleasant for long writing sessions. The design should feel native on iPad without reproducing another application's exact UI.

| Element | Light appearance | Dark appearance |
| --- | --- | --- |
| Application canvas | Ice blue / very light blue-gray | Midnight navy / deep blue-gray |
| Elevated surfaces | White and softly translucent | Deep navy translucent panels |
| Primary text | Dark navy | Pale blue-white |
| Accent | Saturated, clear blue | Luminous blue |
| Borders | Fine cool-gray strokes | Low-contrast blue-gray strokes |
| Shadows | Soft, restrained depth | Deeper but subtle separation |
| Writing paper | Independent paper color and style | Independent paper color and style |

**Design rules:** custom SVG icons with consistent stroke weight; notebook covers visually distinct from folders; rounded but not oversized controls; clear selected states; soft transitions; avoid decorative glass where it reduces legibility.

### Main screens

**Library**
- Full-width, sidebar-free layout.
- Branded header, search, Documents/Favorites/Recent/Trash navigation.
- Colorful dimensional folder tiles with customizable symbols.
- Distinct notebook-cover cards with spines and page edges.
- Grid/list options, sorting, tags, and contextual item actions.

**Notebook**
- Minimal header with notebook title, page tabs, export, options, favorite, details, and AI.
- Floating primary tool palette and smaller contextual control tray.
- Paper-centered writing surface with a lightweight page-thumbnail navigator.
- Advanced controls in popovers rather than permanent panels.

**Pen inspector**
- Fountain, ballpoint, brush, and pencil tools.
- Color/width presets and custom color.
- Pressure sensitivity, tip sharpness/flatness, and stabilization where supported.
- Writing aids, handwriting recognition, and math assistance.

### Adaptive layouts

- **iPad/tablet:** flagship pen-first canvas, floating controls, comfortable landscape composition.
- **Desktop/web:** more room for keyboard shortcuts, side-by-side documents, inspector panels, and drag-and-drop.
- **Phone:** reading, quick notes, capture, audio, and study actions; compact navigation rather than a shrunken desktop toolbar.
- **Accessibility:** test touch, pointer, keyboard, and screen-reader paths; support reduced motion and readable contrast.

## 6. Feature specification

**Status legend:** **Current** = present in the web release candidate according to repository documentation; **Planned** = product goal requiring implementation and validation. Current does **not** mean every edge case or device has been manually QA-tested.

| Area | Current web capabilities | Planned extensions |
| --- | --- | --- |
| Library | Nested folders, customizable covers, favorites, recent, trash/restore, search, sorting, tags, grid/list | Smart folders, deeper indexing, drag-and-drop |
| Writing | Pressure-aware fountain/brush, ballpoint/pencil, highlighter, stabilization, pen settings | Improved tilt/palm behavior, presets, handwriting correction |
| Editing | Stroke/precision eraser, freeform lasso move/delete, vector lines/rectangles/ellipses/arrows | Object-level resizing, text boxes, shape recognition, transforms |
| Paper/pages | Blank, ruled, grid, dots, Cornell, engineering, isometric; page navigation/reorder/duplicate/delete | Custom templates, sections, advanced page management |
| Files | Image/PDF attachments, JSON backup/import, Markdown export, print/save PDF | Placed/resizable media, full PDF page-by-page annotation and editing |
| Audio | Local recording/playback; timestamped ink and replay foundation | Transcription, searchable transcript, richer synchronized playback |
| AI | Optional page/notebook/all-notes actions and handwriting recognition | Cited answers with source regions, semantic search, knowledge links |
| Math | Deterministic expression/equation-step equivalence checking | Error localization, guided hints, handwriting-to-LaTeX, graphs |
| Study | AI-generated study-oriented outputs when configured | Persistent flashcards, quizzes, spaced repetition, mastery tracking |
| Whiteboard/code | Not yet a complete dedicated engine | Infinite canvas, mind maps, code cells, safe Python execution |
| Platform | Web/PWA; Apple and Windows source foundations | Production native releases, authenticated offline-first sync |
| Collaboration | Not shipped | Sharing, permissions, comments, and real-time collaboration |

### Important feature boundaries

- A visible tool button is not proof that its complete engine exists.
- **AI features require valid server configuration** and should be clearly optional.
- Math-step verification is conservative; unsupported cases must be shown as unverified.
- A PDF attached to a note is **not equivalent** to a complete PDF annotation editor.
- Timestamped ink is a foundation for synchronized lecture replay, not a claim of full transcription.
- Native source projects are **not store-ready applications**.
- Automatic multi-device cloud sync and real-time collaboration are **not yet shipped**.

## 7. Interaction architecture

The writing interface uses three levels:

1. **Primary toolbar:** Pen, Highlighter, Eraser, Select, Text, Shapes, Insert, Audio, More, Pan; Undo/Redo separate.
2. **Contextual controls:** selected pen/color/width, eraser mode, shape type, selection actions, insert choices, and paper style.
3. **Advanced inspector:** detailed pen dynamics, writing aids, palette shortcuts, math tools, and future specialized settings.

The canvas should support a shared **command/history** model so editing, undo/redo, future collaboration, and version restoration are consistent. The UI should not own persistence logic directly.

## 8. Technical architecture

### Repository structure

```text
apps/
  web/         Next.js 15, React 19, TypeScript, PWA and server API routes
  apple/       SwiftUI / SwiftData / PencilKit native-client foundation
  windows/     WinUI 3 native-client foundation
packages/
  core/        Shared portable domain model
docs/
  ARCHITECTURE.md
  PRODUCT_ROADMAP.md
  STATUS.md
  RUNBOOK.md
  RELEASE_CHECKLIST.md
PROJECT.md      This product and project specification
```

### Current data and services

- **Web storage:** browser localStorage for workspace state; IndexedDB for recorded audio.
- **Ink:** pointer/stylus input with pressure metadata, smoothing, and stored stroke geometry.
- **AI:** optional server routes; API credentials must remain server-side.
- **Math:** symbolic/numeric verification through the math-checking service.
- **Export:** JSON backup/import, Markdown, and browser print/PDF.
- **Quality gate:** TypeScript check and Next.js production build in GitHub Actions.

### Target architecture

```text
Platform UI (Web / Apple / Windows)
          |
Library + Workspace + Editor Controllers
          |
Commands / History / Selection / Tools
          |
Shared Versioned Document Model
          |
Persistence Adapters + Search Index + Media Store
          |
Optional Sync + AI + STEM + Study Services
```

**Architectural priorities:** split the remaining monolithic web page into feature modules; version and migrate the existing workspace schema without losing notes; make the object canvas extensible; separate UI, editor commands, storage, and network services; preserve offline behavior.

### Proposed domain concepts

`Workspace`, `Folder`, `Document`, `Notebook`, `Page`, `CanvasObject`, `InkStroke`, `Attachment`, `AudioTimeline`, `Revision`, `StudySet`, and `LearningEvent`.

Future canvas objects should have stable IDs, type, bounds, transform, z-order, timestamps, and type-specific payloads. This is a **design target**, not a description of the current persisted schema.

## 9. Development roadmap

### Milestone A — dependable notebook foundation

**Goal:** make writing, organizing, and recovering notes trustworthy.

- Refactor Library, NotebookWorkspace, Toolbar, Inspector, Canvas, and AI into clear modules.
- Improve ink latency, pen settings, selection, and editing behavior.
- Add positioned text objects and placed/resizable images.
- Build a complete PDF page import/annotation/export workflow.
- Strengthen undo/redo, history, backups, migration, and accessibility.
- Validate on real iPad, desktop browser, touch, mouse, and keyboard.

**Exit criteria:** core note creation/editing survives reloads, export/import, tool switching, and realistic device QA without data loss.

### Milestone B — student workflows

**Goal:** make Integrate useful throughout a class and study cycle.

- Improve audio timeline and handwriting synchronization.
- Add transcription with explicit user control and clear privacy behavior.
- Implement tape/active recall, persistent flashcards, quizzes, and study sets.
- Add split view, document tabs, presentation mode, and better scanning/PDF workflows.

**Exit criteria:** a user can capture a lecture, revisit a relevant moment, study the content, and export their work.

### Milestone C — grounded intelligence

**Goal:** useful AI that can show where answers came from.

- Handwriting indexing and reliable source references.
- Page/notebook/folder/library Q&A with source-page citations.
- Semantic retrieval, study-guide generation, and related-note links.
- Privacy controls for what is transmitted and when.

**Exit criteria:** answers reference the correct source material; unsupported claims and missing context are clearly identified.

### Milestone D — STEM engine

**Goal:** help users reason through work, not simply display answers.

- Structured math recognition and LaTeX conversion.
- Step-by-step deterministic validation, error location, and optional hints.
- 2D graphing, equations, calculus tools, and unit-aware science notation.
- Evaluate safe code-cell execution architecture before implementing Python.

**Exit criteria:** math feedback is testable, reproducible, and clearly distinguishes verified from unverified work.

### Milestone E — learning system

**Goal:** turn saved notes and mistakes into a personalized study loop.

- Spaced repetition, mastery concepts, practice history, and weak-topic review.
- Adaptive quizzes and revision planning with user-editable controls.
- Progress summaries that explain their evidence and limitations.

### Milestone F — reliable sync and native delivery

**Goal:** one portable library across devices.

- Authentication, hosted storage, encrypted transport, and account quotas.
- Offline-first synchronization with conflict resolution and migration.
- Native Apple and Windows QA, packaging/signing, accessibility, and store readiness.
- Sharing and collaboration only after permissions, history, and sync are robust.

## 10. Quality, privacy, and release requirements

### Functional acceptance

- A new notebook can be created, edited, closed, reopened, and exported.
- Existing v4 local data remains accessible after future schema upgrades.
- Pen, eraser, selection, and page operations have predictable undo/redo behavior.
- A failed AI request never blocks access to local notes.
- Imported content and exported files preserve the information the format supports.
- UI actions are functional, disabled with an explanation, or clearly labeled experimental.

### Nonfunctional targets (proposed; not measured claims)

- Responsive handwriting with no obvious lag on supported stylus hardware.
- Fast library navigation with realistic notebook counts.
- No silent data loss after refresh, interrupted operation, or migration.
- Keyboard-visible focus and appropriate touch target sizes.
- Reduced-motion support, contrast checks, and screen-reader QA.
- Clear error states, recovery paths, and offline indicators.

### Privacy and safety

- Keep API keys out of client bundles and version control.
- Request user permission before audio recording or sensitive uploads.
- Send only the minimum necessary context for explicitly invoked AI tasks.
- Explain that browser site-data removal can erase local notes; provide backups.
- Do not describe browser-local data as cloud-synced.
- Treat generated academic answers as assistance; retain transparent source grounding and math verification.

### Release gate

The web release candidate is **not automatically production-ready**. Before declaring v1.0, require:

1. Exact-commit typecheck and production build.
2. Manual smoke testing from `docs/RELEASE_CHECKLIST.md`.
3. Device/browser checks, export/import recovery tests, and privacy review.
4. Clear documentation of unsupported features and known limitations.

Hosted accounts, billing, production sync, real-time collaboration, and signed native distribution require separate operational and engineering work.

## 11. Development setup

**Requirements:** Node.js 24 and npm.

```bash
git clone https://github.com/Phoenix2033T/Integrate.git
cd Integrate
npm install
npm run dev:web
```

Open `http://localhost:3000`.

For iPad testing on the same Wi-Fi network:

```bash
npm --workspace @integrate/web run dev -- --hostname 0.0.0.0
```

Open the **Network** address printed by Next.js. Keep the development server running.

For a production check:

```bash
npm run typecheck:web
npm run build:web
```

AI configuration is described in `README.md` and `apps/web/.env.example`. Never commit `.env.local` or API keys.

## 12. Project management conventions

- Keep **this file** as the consolidated product specification.
- Keep `README.md` focused on quick start and current release facts.
- Keep `docs/PRODUCT_ROADMAP.md` for detailed phase planning.
- Keep `docs/ARCHITECTURE.md` for implementation decisions.
- Keep `docs/STATUS.md` for what has actually been built and validated.
- Keep `docs/RELEASE_CHECKLIST.md` as the release gate.
- Mark new features as **planned**, **in progress**, **implemented**, or **validated**; do not equate a visual prototype with a complete feature.
- Preserve existing user data and document migrations before schema changes.
- Prefer small, testable increments over broad unvalidated claims of completion.

## 13. Definition of success

Integrate succeeds when it becomes the place where a student can **capture knowledge, understand it, practice it, and retrieve it**—with excellent handwriting and organization at its core, advanced STEM and study intelligence available when needed, and an interface that remains beautiful and practical on every supported device.

**Product statement:** *Integrate is not simply a place to store notes. It is a workspace that helps turn notes into understanding.*
