# Integrate Runbook

## Web

Requirements:

- Node.js 24 recommended
- npm

From the repository root:

```bash
npm install
npm run dev:web
```

Open:

```text
http://localhost:3000
```

### Enable AI and handwriting recognition

Copy:

```text
apps/web/.env.example
```

to:

```text
apps/web/.env.local
```

and set:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-6-luna
```

Never commit `.env.local`.

## Apple

Requirements:

- macOS with Xcode
- XcodeGen

From `apps/apple`:

```bash
xcodegen generate
open Integrate.xcodeproj
```

Set `INTEGRATE_API_BASE_URL` in the target Info settings to a deployed Integrate API URL if you want AI from the native client.

## Windows

Requirements:

- Visual Studio with Windows App SDK tooling
- .NET 8 or later

Open:

```text
apps/windows/Integrate.Windows.csproj
```

For AI:

```powershell
$env:INTEGRATE_API_BASE_URL="https://your-integrate-host.example/"
```

Then launch the app from Visual Studio.

## GitHub Actions

The `Web CI` workflow runs only when web/shared files change. It installs dependencies and runs a production Next.js build, including TypeScript checking.

## Backups

In the web app:

- **Backup** downloads the entire workspace as JSON.
- **Import** restores an Integrate JSON workspace.
- **Export MD** exports the current page as Markdown.

Use backups before clearing browser data.

## Troubleshooting

### AI says OPENAI_API_KEY is not configured

Create `apps/web/.env.local`, add the key, and restart the Next.js dev server.

### Handwriting recognition fails

Check that:

- the page contains ink
- the API key is configured
- the configured model supports image input
- the server can reach the OpenAI API

### Native AI does not work

The native apps intentionally do not contain an API key. They need `INTEGRATE_API_BASE_URL` pointing at a running/deployed Integrate API.
