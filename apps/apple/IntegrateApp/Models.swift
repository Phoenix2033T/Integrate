import Foundation
import SwiftData

@Model
final class NotebookModel {
    @Attribute(.unique) var id: UUID
    var title: String
    var folder: String
    var emoji: String
    @Relationship(deleteRule: .cascade) var pages: [PageModel]

    init(
        id: UUID = UUID(),
        title: String = "New Notebook",
        folder: String = "Unfiled",
        emoji: String = "📓",
        pages: [PageModel] = []
    ) {
        self.id = id
        self.title = title
        self.folder = folder
        self.emoji = emoji
        self.pages = pages
    }
}

@Model
final class PageModel {
    @Attribute(.unique) var id: UUID
    var title: String
    var subject: String
    var body: String
    var recognizedInk: String
    var favorite: Bool
    var tags: [String]
    var inkData: Data
    var updatedAt: Date

    init(
        id: UUID = UUID(),
        title: String = "Untitled Page",
        subject: String = "General",
        body: String = "",
        recognizedInk: String = "",
        favorite: Bool = false,
        tags: [String] = [],
        inkData: Data = Data(),
        updatedAt: Date = .now
    ) {
        self.id = id
        self.title = title
        self.subject = subject
        self.body = body
        self.recognizedInk = recognizedInk
        self.favorite = favorite
        self.tags = tags
        self.inkData = inkData
        self.updatedAt = updatedAt
    }
}
