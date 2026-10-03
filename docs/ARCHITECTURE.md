# Integrate Architecture

Integrate is organized as a multi-native product with a shared product model and a web-hosted API surface.

## Clients

### Web
Location: `apps/web`

- Next.js
- React
- local-first workspace persistence
- typed notes
- ink canvas
- image/PDF attachments
- tags, favorites, folders, revisions
- page/notebook/all-notes AI context
- handwriting recognition through the server API
- deterministic symbolic/numeric math-step checking
- JSON backup/import
- Markdown export
- installable web-app manifest

### Apple
Location: `apps/apple`

- SwiftUI
- SwiftData
- PencilKit
- iPhone/iPad/macOS source targets
- native notebook/page navigation
- typed notes
- native ink
- AI API client

### Windows
Location: `apps/windows`

- WinUI 3
- Windows App SDK
- JSON persistence in LocalAppData
- notebook/page navigation
- typed notes
- native pointer/stylus ink
- AI API client

## Shared model

Location: `packages/core`

The shared schema defines the product's portable concepts:

- workspace
- notebook
- page
- ink stroke
- recognized handwriting
- attachment
- revision
- AI scope

Each native client maps these concepts to its platform-native persistence framework.

## AI flow

```text
Client
  |
  | page / notebook / all-notes context
  v
POST /api/ai
  |
  v
OpenAI Responses API
  |
  v
Grounded answer
```

Handwriting recognition follows:

```text
Ink strokes
  -> SVG image
  -> POST /api/recognize
  -> multimodal recognition
  -> recognizedInk
  -> AI context
```

## Math checking

`POST /api/math/check` does not rely on a language model. It uses symbolic simplification and deterministic numeric checks to determine whether two expressions or equations are equivalent.

The checker is intentionally conservative: an unverifiable step is reported as not verified rather than guessed to be correct.

## Persistence

The current web v1 is local-first:

- browser localStorage for workspace state
- small attachments can be stored as data URLs
- JSON backup/import prevents lock-in

Apple uses SwiftData. Windows uses LocalAppData JSON.

A production cloud-sync layer should replace local-only persistence for cross-device accounts. The portable schema is already structured for that migration.

## Security boundaries

- OpenAI API keys are server-side only.
- The browser calls Next.js API routes rather than OpenAI directly.
- Native clients use a configurable Integrate API base URL.
- No API keys should be committed to Git.

## Productionization boundaries

The repository contains a complete portfolio-grade v1 architecture and functional web product. A public production release still requires external operational work such as:

- hosted deployment
- user authentication
- production database/object storage
- account-based sync
- privacy policy / terms
- App Store signing and review
- Windows packaging/signing
- device QA and accessibility testing
- observability, rate limits, billing controls, and abuse protection
