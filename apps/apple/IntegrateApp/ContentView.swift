import SwiftUI
import SwiftData

struct ContentView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \NotebookModel.title) private var notebooks: [NotebookModel]

    @State private var selectedNotebook: NotebookModel?
    @State private var selectedPage: PageModel?
    @AppStorage("integrateAppearance") private var appearance = "light"

    var body: some View {
        NavigationSplitView {
            List(selection: $selectedNotebook) {
                Section("Notebooks") {
                    ForEach(notebooks) { notebook in
                        Label("\(notebook.emoji) \(notebook.title)", systemImage: "book.closed")
                            .tag(notebook)
                    }
                }
            }
            .navigationTitle("Integrate")
            .toolbar {
                ToolbarItemGroup {
                    Picker("Appearance", selection: $appearance) {
                        Label("Light", systemImage: "sun.max").tag("light")
                        Label("Dark", systemImage: "moon.stars").tag("dark")
                    }
                    .pickerStyle(.menu)

                    Button {
                        createNotebook()
                    } label: {
                        Label("New Notebook", systemImage: "plus")
                    }
                }
            }
        } content: {
            if let selectedNotebook {
                List(selection: $selectedPage) {
                    ForEach(selectedNotebook.pages) { page in
                        VStack(alignment: .leading, spacing: 3) {
                            Text(page.favorite ? "★ \(page.title)" : page.title)
                                .fontWeight(.semibold)
                            Text(page.subject)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .tag(page)
                    }
                }
                .navigationTitle(selectedNotebook.title)
                .toolbar {
                    Button {
                        createPage(in: selectedNotebook)
                    } label: {
                        Label("New Page", systemImage: "doc.badge.plus")
                    }
                }
            } else {
                ContentUnavailableView("Choose a notebook", systemImage: "book")
            }
        } detail: {
            if let selectedPage {
                NoteEditorView(page: selectedPage)
            } else {
                ContentUnavailableView("Choose a page", systemImage: "doc.text")
            }
        }
        .task {
            if notebooks.isEmpty {
                seed()
            } else if selectedNotebook == nil {
                selectedNotebook = notebooks.first
                selectedPage = notebooks.first?.pages.first
            }
        }
    }

    private func createNotebook() {
        let page = PageModel()
        let notebook = NotebookModel(pages: [page])
        modelContext.insert(notebook)
        selectedNotebook = notebook
        selectedPage = page
    }

    private func createPage(in notebook: NotebookModel) {
        let page = PageModel()
        notebook.pages.append(page)
        selectedPage = page
    }

    private func seed() {
        let welcome = PageModel(
            title: "Welcome to Integrate",
            body: "Take typed or handwritten notes, then study them with Integrate AI."
        )
        let notebook = NotebookModel(title: "My Notes", folder: "School", emoji: "📘", pages: [welcome])
        modelContext.insert(notebook)
        selectedNotebook = notebook
        selectedPage = welcome
    }
}
