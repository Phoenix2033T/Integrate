using System.Text.Json;

namespace Integrate.Windows;

public static class WorkspaceStore
{
    private static readonly JsonSerializerOptions Options = new()
    {
        WriteIndented = true
    };

    private static string FilePath
    {
        get
        {
            var directory = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Integrate");
            Directory.CreateDirectory(directory);
            return Path.Combine(directory, "workspace.json");
        }
    }

    public static async Task<WorkspaceModel> LoadAsync()
    {
        if (!File.Exists(FilePath))
        {
            return Seed();
        }

        try
        {
            var json = await File.ReadAllTextAsync(FilePath);
            return JsonSerializer.Deserialize<WorkspaceModel>(json, Options) ?? Seed();
        }
        catch
        {
            return Seed();
        }
    }

    public static Task SaveAsync(WorkspaceModel workspace)
    {
        return File.WriteAllTextAsync(FilePath, JsonSerializer.Serialize(workspace, Options));
    }

    private static WorkspaceModel Seed()
    {
        return new WorkspaceModel
        {
            Notebooks =
            [
                new NotebookModel
                {
                    Title = "My Notes",
                    Folder = "School",
                    Emoji = "📘",
                    Pages =
                    [
                        new PageModel
                        {
                            Title = "Welcome to Integrate",
                            Body = "Take typed or handwritten notes, then study them with Integrate AI."
                        }
                    ]
                }
            ]
        };
    }
}
