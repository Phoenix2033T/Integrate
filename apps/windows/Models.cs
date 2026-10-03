using System.Text.Json.Serialization;

namespace Integrate.Windows;

public sealed class InkPointModel
{
    public double X { get; set; }
    public double Y { get; set; }
}

public sealed class InkStrokeModel
{
    public string Color { get; set; } = "#1F2937";
    public double Width { get; set; } = 3.0;
    public List<InkPointModel> Points { get; set; } = [];
}

public sealed class PageModel
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = "Untitled Page";
    public string Subject { get; set; } = "General";
    public string Body { get; set; } = "";
    public string RecognizedInk { get; set; } = "";
    public bool Favorite { get; set; }
    public List<string> Tags { get; set; } = [];
    public List<InkStrokeModel> InkStrokes { get; set; } = [];
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    [JsonIgnore]
    public string DisplayTitle => Favorite ? $"★ {Title}" : Title;
}

public sealed class NotebookModel
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = "New Notebook";
    public string Folder { get; set; } = "Unfiled";
    public string Emoji { get; set; } = "📓";
    public List<PageModel> Pages { get; set; } = [];
}

public sealed class WorkspaceModel
{
    public int Version { get; set; } = 3;
    public List<NotebookModel> Notebooks { get; set; } = [];
}
