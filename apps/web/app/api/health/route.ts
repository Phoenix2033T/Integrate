import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "integrate-web",
      version: process.env.NEXT_PUBLIC_APP_VERSION || "development",
      aiConfigured: Boolean(process.env.OPENAI_API_KEY),
      time: new Date().toISOString()
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
