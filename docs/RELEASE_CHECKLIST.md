# Integrate release checklist

## Automated gate

A release candidate must pass Web CI on the exact commit being released:

- TypeScript typecheck
- Next.js production build

## Product smoke test

Test on desktop Chrome/Edge and iPad Safari:

- create nested folders and customize a folder
- create/customize/move/favorite/trash/restore a notebook
- create, reorder, duplicate, and delete pages
- pen, highlighter, pressure ink, stroke eraser, precision eraser
- lasso select/move/delete and vector shapes
- text notes and paper templates
- local audio recording and playback
- handwriting recognition with AI enabled
- Math Assist
- search, sorting, theme switching
- JSON backup and restore
- Markdown export and print/PDF
- install as a PWA and reopen after going offline

## Production configuration

Required for AI:

- OPENAI_API_KEY
- OPENAI_MODEL
- INTEGRATE_AI_ENABLED
- AI_RATE_LIMIT_PER_MINUTE
- RECOGNITION_RATE_LIMIT_PER_MINUTE

Recommended:

- NEXT_PUBLIC_APP_VERSION
- provider-level spend alerts and a hard spend limit
- HTTPS
- uptime monitoring against /api/health
- error monitoring and deployment logs

## Before broad public launch

The local-first web release can ship without accounts, but do not advertise features that are not present. Before adding hosted accounts or collaboration, complete authentication, encrypted cloud storage, sync conflict handling, account deletion/export, production abuse controls, and a reviewed privacy/legal flow.

Before distributing through an app store, separately complete signing, store metadata, screenshots, privacy declarations, accessibility testing, and native-client QA.

## Release rule

Never tag a release from a commit whose exact Web CI run has not passed.
