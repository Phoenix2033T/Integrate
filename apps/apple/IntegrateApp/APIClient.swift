import Foundation

struct AIRequest: Codable {
    let prompt: String
    let action: String
    let scope: String
    let context: String
}

struct AIResponse: Codable {
    let text: String
}

enum APIClientError: Error {
    case invalidBaseURL
    case invalidResponse
    case server(String)
}

actor APIClient {
    static let shared = APIClient()

    private var baseURL: URL? {
        guard
            let value = Bundle.main.object(forInfoDictionaryKey: "INTEGRATE_API_BASE_URL") as? String,
            !value.isEmpty
        else {
            return nil
        }
        return URL(string: value)
    }

    func askAI(prompt: String, context: String, scope: String = "page") async throws -> String {
        guard let baseURL else { throw APIClientError.invalidBaseURL }
        let url = baseURL.appending(path: "api/ai")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(
            AIRequest(prompt: prompt, action: "", scope: scope, context: context)
        )

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIClientError.invalidResponse
        }

        if !(200..<300).contains(http.statusCode) {
            let message = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])?["error"] as? String
            throw APIClientError.server(message ?? "Request failed.")
        }

        return try JSONDecoder().decode(AIResponse.self, from: data).text
    }
}
