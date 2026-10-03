# Integrate for Windows

Native WinUI 3 client for Windows.

## Requirements

- Visual Studio 2026 with the Windows App SDK workload
- .NET 8 SDK or later
- Windows App SDK 2.5.1

Open `Integrate.Windows.csproj` in Visual Studio and run the x64 or ARM64 target.

Set an environment variable before launch if you want AI features:

```powershell
$env:INTEGRATE_API_BASE_URL="https://your-integrate-host.example/"
```

The Windows client includes native notebook/page navigation, JSON persistence in LocalAppData, typed notes, pointer/stylus ink, favorites, and the same Integrate AI API contract as the web and Apple clients.
