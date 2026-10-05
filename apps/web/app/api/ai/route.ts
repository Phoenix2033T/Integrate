import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, clientAddress, requestTooLarge } from "../../../lib/serverRateLimit";

type AiScope = "page" | "notebook" | "all";

type AiRequest = {
  prompt?: string;
  scope?: AiScope;
  context?: string;
  action?: string;
};

function extractOutputText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const data = payload as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };

  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  return (
    data.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text" && typeof item.text === "string")
      .map((item) => item.text)
      .join("\n\n")
      .trim() ?? ""
  );
}

export async function POST(request: NextRequest) {
  if (process.env.INTEGRATE_AI_ENABLED === "false") {
    return NextResponse.json({ error: "Integrate AI is temporarily unavailable." }, { status: 503 });
  }
  if (requestTooLarge(request.headers, 256_000)) {
    return NextResponse.json({ error: "This AI request is too large." }, { status: 413 });
  }
  const limit = Math.max(1, Number(process.env.AI_RATE_LIMIT_PER_MINUTE || 12));
  const rate = checkRateLimit(`ai:${clientAddress(request.headers)}`, limit);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many AI requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY is not configured. Add it to apps/web/.env.local and restart the development server."
      },
      { status: 503 }
    );
  }

  let body: AiRequest;
  try {
    body = (await request.json()) as AiRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  const context = body.context?.trim();
  const scope = body.scope ?? "page";

  if (!prompt) {
    return NextResponse.json({ error: "A prompt is required." }, { status: 400 });
  }

  if (!context) {
    return NextResponse.json({ error: "There is no note context to analyze." }, { status: 400 });
  }

  const instructions = [
    "You are Integrate AI, a study assistant embedded inside a note-taking app.",
    "Ground your answer in the supplied notes. Do not pretend the notes contain information that is not present.",
    "When the user asks to study, teach clearly and age-appropriately.",
    "For summaries, preserve important names, dates, formulas, causes, definitions, and relationships.",
    "For quizzes or flashcards, use the supplied notes as the primary source.",
    "If the notes are incomplete for the request, say what is missing.",
    "Use concise markdown unless the user asks for another format."
  ].join(" ");

  const contextualPrompt = [
    `Context scope: ${scope}`,
    body.action ? `Requested action: ${body.action}` : "",
    "--- NOTES BEGIN ---",
    context.slice(0, 60000),
    "--- NOTES END ---",
    "",
    `User request: ${prompt}`
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-6-luna",
      instructions,
      input: contextualPrompt,
      max_output_tokens: 2500
    })
  });

  const payload = await response.json();
  const requestId = response.headers.get("x-request-id");

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      `AI request failed with status ${response.status}.`;
    return NextResponse.json({ error: message, requestId }, { status: response.status });
  }

  const text = extractOutputText(payload);
  if (!text) {
    return NextResponse.json({ error: "The AI returned an empty response." }, { status: 502 });
  }

  return NextResponse.json({ text, requestId });
}
