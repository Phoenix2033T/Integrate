import SwiftUI
import SwiftData

@main
struct IntegrateApp: App {
    @AppStorage("integrateAppearance") private var appearance = "light"

    private var preferredScheme: ColorScheme {
        appearance == "dark" ? .dark : .light
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(preferredScheme)
                .tint(Color(red: 0.10, green: 0.48, blue: 0.79))
        }
        .modelContainer(for: [NotebookModel.self, PageModel.self])
    }
}
