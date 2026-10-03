# Integrate for Apple platforms

Native SwiftUI client for iPhone, iPad, and macOS.

## Requirements

- Xcode 18 or later
- iOS 18+ / macOS 15+
- XcodeGen for generating the checked-in project configuration

## Generate the Xcode project

From `apps/apple`:

```bash
xcodegen generate
open Integrate.xcodeproj
```

The source uses SwiftUI, SwiftData, and PencilKit. Set `INTEGRATE_API_BASE_URL` in the generated target Info settings to the URL where the Integrate web/server API is deployed, for example `https://your-integrate-host.example/`.

The iPad/iPhone client includes native notebook navigation, typed notes, PencilKit ink, favorites, local SwiftData persistence, and the AI API client. macOS shares the same SwiftUI/SwiftData model and editor source.
