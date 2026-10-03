using Microsoft.UI;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Input;
using Microsoft.UI.Xaml.Media;
using Microsoft.UI.Xaml.Shapes;
using Windows.Foundation;
using Windows.UI;

namespace Integrate.Windows;

public sealed partial class MainWindow : Window
{
    private readonly AIClient _ai = new();
    private WorkspaceModel _workspace = new();
    private NotebookModel? _notebook;
    private PageModel? _page;
    private Polyline? _activeLine;
    private InkStrokeModel? _activeStroke;
    private bool _loadingEditor;

    public MainWindow()
    {
        InitializeComponent();
        ExtendsContentIntoTitleBar = true;
        ApplySavedTheme();
        _ = LoadAsync();
    }

    private static string ThemeFilePath
    {
        get
        {
            var directory = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Integrate");
            Directory.CreateDirectory(directory);
            return Path.Combine(directory, "theme.txt");
        }
    }

    private void ApplySavedTheme()
    {
        var dark = File.Exists(ThemeFilePath) &&
                   string.Equals(File.ReadAllText(ThemeFilePath).Trim(), "dark", StringComparison.OrdinalIgnoreCase);
        ApplyTheme(dark);
    }

    private void ApplyTheme(bool dark)
    {
        RootGrid.RequestedTheme = dark ? ElementTheme.Dark : ElementTheme.Light;
        RootGrid.Background = new SolidColorBrush(
            dark
                ? Color.FromArgb(255, 6, 21, 33)
                : Color.FromArgb(255, 237, 247, 255));
        ThemeButton.Content = dark ? "☀ Light" : "☾ Dark";
        ThemeButton.Tag = dark ? "dark" : "light";
    }

    private void ThemeButton_Click(object sender, RoutedEventArgs e)
    {
        var dark = !string.Equals(ThemeButton.Tag?.ToString(), "dark", StringComparison.OrdinalIgnoreCase);
        ApplyTheme(dark);
        File.WriteAllText(ThemeFilePath, dark ? "dark" : "light");
    }

    private async Task LoadAsync()
    {
        _workspace = await WorkspaceStore.LoadAsync();
        RefreshNotebooks();
        NotebooksList.SelectedIndex = _workspace.Notebooks.Count > 0 ? 0 : -1;
    }

    private void RefreshNotebooks()
    {
        NotebooksList.ItemsSource = null;
        NotebooksList.ItemsSource = _workspace.Notebooks;
    }

    private void RefreshPages()
    {
        PagesList.ItemsSource = null;
        PagesList.ItemsSource = _notebook?.Pages;
    }

    private void LoadEditor()
    {
        _loadingEditor = true;
        try
        {
            TitleBox.Text = _page?.Title ?? "";
            SubjectBox.Text = _page?.Subject ?? "";
            BodyBox.Text = _page?.Body ?? "";
            RenderInk();
        }
        finally
        {
            _loadingEditor = false;
        }
    }

    private void RenderInk()
    {
        DrawingCanvas.Children.Clear();
        if (_page is null) return;

        foreach (var stroke in _page.InkStrokes)
        {
            var line = CreateLine(stroke);
            foreach (var point in stroke.Points)
            {
                line.Points.Add(new Point(point.X, point.Y));
            }
            DrawingCanvas.Children.Add(line);
        }
    }

    private static Polyline CreateLine(InkStrokeModel stroke)
    {
        var color = Microsoft.UI.Xaml.Media.Brushes.Black;
        return new Polyline
        {
            Stroke = color,
            StrokeThickness = stroke.Width,
            StrokeLineJoin = PenLineJoin.Round
        };
    }

    private void NotebooksList_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        _notebook = NotebooksList.SelectedItem as NotebookModel;
        RefreshPages();
        PagesList.SelectedIndex = _notebook?.Pages.Count > 0 ? 0 : -1;
    }

    private void PagesList_SelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        _page = PagesList.SelectedItem as PageModel;
        LoadEditor();
    }

    private async void NewNotebook_Click(object sender, RoutedEventArgs e)
    {
        var page = new PageModel();
        var notebook = new NotebookModel { Pages = [page] };
        _workspace.Notebooks.Add(notebook);
        RefreshNotebooks();
        NotebooksList.SelectedItem = notebook;
        await WorkspaceStore.SaveAsync(_workspace);
    }

    private async void NewPage_Click(object sender, RoutedEventArgs e)
    {
        if (_notebook is null) return;
        var page = new PageModel();
        _notebook.Pages.Add(page);
        RefreshPages();
        PagesList.SelectedItem = page;
        await WorkspaceStore.SaveAsync(_workspace);
    }

    private void Editor_TextChanged(object sender, TextChangedEventArgs e)
    {
        if (_loadingEditor || _page is null) return;
        _page.Title = TitleBox.Text;
        _page.Subject = SubjectBox.Text;
        _page.Body = BodyBox.Text;
        _page.UpdatedAt = DateTimeOffset.UtcNow;
    }

    private async void Save_Click(object sender, RoutedEventArgs e)
    {
        await WorkspaceStore.SaveAsync(_workspace);
    }

    private async void Favorite_Click(object sender, RoutedEventArgs e)
    {
        if (_page is null) return;
        _page.Favorite = !_page.Favorite;
        RefreshPages();
        PagesList.SelectedItem = _page;
        await WorkspaceStore.SaveAsync(_workspace);
    }

    private async void AskAI_Click(object sender, RoutedEventArgs e)
    {
        if (_page is null || string.IsNullOrWhiteSpace(AIPromptBox.Text)) return;
        AIAnswerText.Text = "Integrate AI is thinking…";
        try
        {
            AIAnswerText.Text = await _ai.AskAsync(AIPromptBox.Text, _page);
        }
        catch (Exception error)
        {
            AIAnswerText.Text = error.Message;
        }
    }

    private void DrawingCanvas_PointerPressed(object sender, PointerRoutedEventArgs e)
    {
        if (InkModeButton.IsChecked != true || _page is null) return;

        DrawingCanvas.CapturePointer(e.Pointer);
        var point = e.GetCurrentPoint(DrawingCanvas).Position;
        _activeStroke = new InkStrokeModel();
        _activeStroke.Points.Add(new InkPointModel { X = point.X, Y = point.Y });
        _activeLine = CreateLine(_activeStroke);
        _activeLine.Points.Add(point);
        DrawingCanvas.Children.Add(_activeLine);
    }

    private void DrawingCanvas_PointerMoved(object sender, PointerRoutedEventArgs e)
    {
        if (_activeLine is null || _activeStroke is null) return;
        var point = e.GetCurrentPoint(DrawingCanvas).Position;
        _activeLine.Points.Add(point);
        _activeStroke.Points.Add(new InkPointModel { X = point.X, Y = point.Y });
    }

    private async void DrawingCanvas_PointerReleased(object sender, PointerRoutedEventArgs e)
    {
        if (_activeStroke is null || _page is null) return;
        _page.InkStrokes.Add(_activeStroke);
        _page.UpdatedAt = DateTimeOffset.UtcNow;
        _activeStroke = null;
        _activeLine = null;
        DrawingCanvas.ReleasePointerCapture(e.Pointer);
        await WorkspaceStore.SaveAsync(_workspace);
    }
}
