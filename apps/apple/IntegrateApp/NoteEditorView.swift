import SwiftUI
import SwiftData

struct NoteEditorView: View {
    @Bindable var page: PageModel
    @State private var mode: EditorMode = .ink
    @State private var showingDetails = false
    @State private var showingAI = false
    @State private var aiPrompt = ""
    @State private var aiAnswer = ""
    @State private var aiLoading = false

    enum EditorMode: String, CaseIterable, Identifiable {
        case ink = "Write"
        case type = "Type"
        var id: String { rawValue }

        var icon: String {
            switch self {
            case .ink: return "pencil.tip"
            case .type: return "textformat"
            }
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(page.title)
                        .font(.headline)
                        .lineLimit(1)
                    Text(page.subject)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Picker("Tool mode", selection: $mode) {
                    ForEach(EditorMode.allCases) { item in
                        Label(item.rawValue, systemImage: item.icon).tag(item)
                    }
                }
                .pickerStyle(.segmented)
                .frame(maxWidth: 220)

                Button {
                    showingDetails.toggle()
                } label: {
                    Image(systemName: "slider.horizontal.3")
                }
                .help("Page details")

                Button {
                    showingAI.toggle()
                } label: {
                    Image(systemName: "sparkles")
                }
                .help("Integrate AI")

                Button {
                    page.favorite.toggle()
                    page.updatedAt = .now
                } label: {
                    Image(systemName: page.favorite ? "star.fill" : "star")
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(.bar)

            if showingDetails {
                VStack(spacing: 10) {
                    TextField("Page title", text: $page.title)
                        .font(.title3.bold())
                    TextField("Subject", text: $page.subject)

                    if !page.recognizedInk.isEmpty {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Recognized handwriting")
                                .font(.caption.bold())
                                .foregroundStyle(.secondary)
                            Text(page.recognizedInk)
                                .font(.callout)
                                .textSelection(.enabled)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                .padding(14)
                .background(Color.accentColor.opacity(0.07))
            }

            Group {
                if mode == .ink {
                    ZStack {
                        Color.white
                        InkCanvasView(data: $page.inkData)
                    }
                } else {
                    TextEditor(text: $page.body)
                        .font(.body)
                        .padding(24)
                        .scrollContentBackground(.hidden)
                        .background(Color.white)
                        .foregroundStyle(.black)
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: 4))
            .shadow(color: .black.opacity(0.08), radius: 12, y: 4)
            .padding(.horizontal, 18)
            .padding(.vertical, 14)
            .background(Color.accentColor.opacity(0.045))
        }
        .navigationTitle(page.title)
        .navigationSubtitle("Handwriting notebook")
        .sheet(isPresented: $showingAI) {
            NavigationStack {
                Form {
                    Section("Ask about this page") {
                        TextField("Ask about your notes…", text: $aiPrompt, axis: .vertical)
                        Button(aiLoading ? "Working…" : "Ask Integrate AI") {
                            Task { await askAI() }
                        }
                        .disabled(aiPrompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || aiLoading)
                    }

                    if !aiAnswer.isEmpty {
                        Section("Answer") {
                            Text(aiAnswer)
                                .textSelection(.enabled)
                        }
                    }
                }
                .navigationTitle("Integrate AI")
                .toolbar {
                    Button("Done") { showingAI = false }
                }
            }
            .presentationDetents([.medium, .large])
        }
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
