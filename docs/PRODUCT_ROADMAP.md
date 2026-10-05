# Integrate Product Roadmap

## North star

Integrate is a cross-device learning workspace that combines excellent handwriting, lecture capture, PDF/document workflows, STEM computation, study tools, and grounded AI without making the canvas feel crowded.

The product principle is **paper first, intelligence when needed**. The default writing surface stays calm. Advanced capabilities appear contextually through nested tool controls, inspectors, and study views.

## Product pillars

1. **Best notebook** — low-latency ink, excellent stylus behavior, flexible paper, PDFs, media, organization, search, export, history, and accessibility.
2. **Best student workflow** — lecture audio/transcription, synchronized notes, active recall, flashcards, quizzes, split view, presentation, and assignment workflows.
3. **Intelligent notebook** — handwriting understanding, semantic search, page/notebook/library AI, source grounding, knowledge links, and automatic study materials.
4. **STEM workspace** — structured handwritten math, deterministic step checking, hints, graphing, LaTeX, units, chemistry/physics support, and code cells.
5. **Learning system** — spaced repetition, weak-topic detection, mistake history, mastery, adaptive practice, and revision planning.
6. **Everywhere** — iPad-first handwriting with purpose-built iPhone, web, macOS, and Windows experiences over one portable document model.

## UX architecture

### Library
Folders can contain folders and documents. The library supports notebook covers, folder colors/symbols, favorites, recent items, search, tags, smart collections, sorting, and grid/list layouts.

### Workspace
A workspace opens one or more documents in tabs. Desktop/tablet layouts can support split view and multiple windows.

### Document kinds
- Notebook
- PDF
- Whiteboard
- Text document
- Study set

### Canvas objects
The long-term canvas should store objects rather than treating a page as one textarea plus one ink layer:

- ink
- text block
- image
- shape
- equation
- audio marker
- attachment
- code block
- sticky note
- link
- study/tape region

Every object should have a stable ID, bounds, z-index, timestamps, and type-specific data. This is the foundation for lasso selection, moving/resizing content, collaboration, history, semantic indexing, and cross-device sync.

## Tool hierarchy

### Level 1 — primary toolbar
Pen, Highlighter, Eraser, Select, Text, Shapes, Insert, Audio, More, Pan, Undo, Redo.

### Level 2 — contextual controls
Selecting a primary tool reveals only its common controls: pen type/color/width, eraser mode, lasso filters, insert choices, shape choices, and so on.

### Level 3 — advanced inspector
Selecting the active tool again opens detailed controls such as pressure, nib shape, stabilization, writing aids, math assistance, presets, and accessibility options.

## Delivery phases

### Phase 1 — notebook foundation
- finish library organization and customization
- favorites/recent/grid/list
- notebook customization
- page thumbnails and management
- pressure-aware ink and pen presets
- precision/stroke eraser
- functional lasso and transforms
- positioned text boxes
- shapes and shape recognition
- placed images and PDF pages
- richer templates
- autosave, history, backup/export
- keyboard shortcuts and accessibility
- responsive tablet/desktop/mobile shells

### Phase 2 — student workflow
- audio recording
- transcription
- synchronized ink/audio timestamps
- tape/active recall
- study sets and flashcards
- split view
- presentation mode
- scan/import workflow
- robust PDF annotation

### Phase 3 — intelligence
- handwriting recognition pipeline
- AI over page/notebook/folder/library
- citations back to source pages
- semantic search
- summaries and study guides
- related-note suggestions and backlinks

### Phase 4 — STEM engine
- handwriting to structured math
- deterministic step verification
- mistake localization and hints
- graphing
- LaTeX conversion
- units and science notation
- code cells and safe execution architecture

### Phase 5 — learning system
- question generation
- spaced repetition
- mistake history
- weak-topic tracking
- mastery model
- adaptive practice and exam generation

### Phase 6 — accounts and sync
- authentication
- cloud database/object storage
- offline-first sync
- conflict resolution
- sharing and collaboration
- version history across devices

## Engineering rules

- Keep platform UI native-feeling while sharing the portable data model.
- Do not put every feature into the main page component; new product areas should be isolated into components/services.
- Keep migrations explicit and backwards compatible.
- AI never owns source-of-truth math correctness when deterministic checking is available.
- API keys stay server-side.
- User notes remain usable without AI.
- Offline editing is a core requirement, not an afterthought.
- Every major interaction must be keyboard and screen-reader reachable where the platform supports it.
- Do not claim a feature is complete until it is functional and validated, not merely represented in UI.

## Current implementation focus

The current sprint is Phase 1. The first foundation pass makes Favorites functional, adds adaptive grid/list library layouts, keeps nested folders, and adds notebook-level library metadata. Next, the monolithic web page should be split into Library, NotebookWorkspace, Toolbar, Inspector, and AI components before deeper canvas tools are added.
