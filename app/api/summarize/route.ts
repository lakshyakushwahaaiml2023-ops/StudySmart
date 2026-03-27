// app/api/summarize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { summarizeNotes } from "@/lib/groq";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Please provide text to summarize" },
        { status: 400 }
      );
    }

    if (text.length > 50000) {
      return NextResponse.json(
        { error: "Text is too long (max 50000 characters)" },
        { status: 400 }
      );
    }

    const result = await summarizeNotes(text);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to summarize notes";
    console.error("Summarize API error:", error);
    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}
