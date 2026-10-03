import SwiftUI
import SwiftData

@main
struct IntegrateApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(for: [NotebookModel.self, PageModel.self])
    }
}
