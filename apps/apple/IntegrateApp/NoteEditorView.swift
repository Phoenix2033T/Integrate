import SwiftUI
import SwiftData

struct NoteEditorView: View {
    @Bindable var page: PageModel
    @State private var mode: EditorMode = .type
    @State private var aiPrompt = ""
    @State private var aiAnswer = ""
    @State private var aiLoading = false

    enum EditorMode: String, CaseIterable, Identifiable {
        case type = "Type"
        case ink = "Ink"
        var id: String { rawValue }
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Picker("Mode", selection: $mode) {
                    ForEach(EditorMode.allCases) { mode in
                        Text(mode.rawValue).tag(mode)
                    }
                }
                .pickerStyle(.segmented)
                .frame(maxWidth: 260)

                Spacer()

                Button(page.favorite ? "★" : "☆") {
                    page.favorite.toggle()
                    page.updatedAt = .now
                }
            }
            .padding()

            Form {
                TextField("Title", text: $page.title)
                    .font(.title.bold())
                TextField("Subject", text: $page.subject)

                if mode == .type {
                    TextEditor(text: $page.body)
                        .frame(minHeight: 360)
                } else {
                    InkCanvasView(data: $page.inkData)
                        .frame(minHeight: 480)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                if !page.recognizedInk.isEmpty {
                    Section("Recognized handwriting") {
                        Text(page.recognizedInk)
                            .textSelection(.enabled)
                    }
                }

                Section("Integrate AI") {
                    TextField("Ask about this page", text: $aiPrompt, axis: .vertical)
                    Button(aiLoading ? "Working…" : "Ask") {
                        Task { await askAI() }
                    }
                    .disabled(aiPrompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || aiLoading)

                    if !aiAnswer.isEmpty {
                        Text(aiAnswer)
                            .textSelection(.enabled)
                    }
                }
            }
            .formStyle(.grouped)
        }
        .navigationTitle(page.title)
    }

    @MainActor
    private func askAI() async {
        aiLoading = true
        defer { aiLoading = false }

        let context = """
        PAGE: \(page.title)
        SUBJECT: \(page.subject)
        \(page.body)
        \(page.recognizedInk.isEmpty ? "" : "RECOGNIZED HANDWRITING:\n\(page.recognizedInk)")
        """

        do {
            aiAnswer = try await APIClient.shared.askAI(prompt: aiPrompt, context: context)
        } catch {
            aiAnswer = "AI request failed: \(error.localizedDescription)"
        }
    }
}
