import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, clientAddress, requestTooLarge } from "../../../lib/serverRateLimit";

type RecognitionRequest = {
  imageDataUrl?: string;
  subject?: string;
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
    return NextResponse.json({ error: "Handwriting recognition is temporarily unavailable." }, { status: 503 });
  }
  if (requestTooLarge(request.headers, 5_500_000)) {
    return NextResponse.json({ error: "This handwriting image is too large." }, { status: 413 });
  }
  const limit = Math.max(1, Number(process.env.RECOGNITION_RATE_LIMIT_PER_MINUTE || 8));
  const rate = checkRateLimit(`recognize:${clientAddress(request.headers)}`, limit);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many recognition requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 503 }
    );
  }

  let body: RecognitionRequest;
  try {
    body = (await request.json()) as RecognitionRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.imageDataUrl?.startsWith("data:image/")) {
    return NextResponse.json({ error: "A drawing image is required." }, { status: 400 });
  }

  const subject = body.subject?.trim() || "General";
  const prompt = [
    "Transcribe the handwritten or drawn notes in this image.",
    "Preserve line breaks and structure.",
    "For mathematics, use readable plain-text math and LaTeX where helpful.",
    "For diagrams, briefly describe labels and relationships.",
    "Do not invent text you cannot see; mark uncertain fragments with [?].",
    `Subject context: ${subject}.`
  ].join(" ");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-6-luna",
      max_output_tokens: 4000,
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: body.imageDataUrl, detail: "high" }
          ]
        }
      ]
    })
  });

  const payload = await response.json();
  const requestId = response.headers.get("x-request-id");
  if (!response.ok) {
    return NextResponse.json(
      { error: payload?.error?.message || "Handwriting recognition failed.", requestId },
      { status: response.status }
    );
  }

  const text = extractOutputText(payload);
  if (!text) {
    return NextResponse.json({ error: "No handwriting text was recognized." }, { status: 502 });
  }

  return NextResponse.json({ text, requestId });
}
