using System.Net.Http.Json;
using System.Text.Json;

namespace Integrate.Windows;

public sealed class AIClient
{
    private readonly HttpClient _httpClient = new();
    private readonly Uri? _baseUri;

    public AIClient()
    {
        var raw = Environment.GetEnvironmentVariable("INTEGRATE_API_BASE_URL");
        if (Uri.TryCreate(raw, UriKind.Absolute, out var uri))
        {
            _baseUri = uri;
        }
    }

    public async Task<string> AskAsync(string prompt, PageModel page, CancellationToken cancellationToken = default)
    {
        if (_baseUri is null)
        {
            throw new InvalidOperationException(
                "Set INTEGRATE_API_BASE_URL to your deployed Integrate web/API URL.");
        }

        var context = $"""
        PAGE: {page.Title}
        SUBJECT: {page.Subject}
        {page.Body}
        {(string.IsNullOrWhiteSpace(page.RecognizedInk) ? "" : $"RECOGNIZED HANDWRITING:\n{page.RecognizedInk}")}
        """;

        var payload = new
        {
            prompt,
            action = "",
            scope = "page",
            context
        };

        using var response = await _httpClient.PostAsJsonAsync(
            new Uri(_baseUri, "api/ai"),
            payload,
            cancellationToken);

        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"AI request failed: {body}");
        }

        using var document = JsonDocument.Parse(body);
        return document.RootElement.GetProperty("text").GetString() ?? "";
    }
}
