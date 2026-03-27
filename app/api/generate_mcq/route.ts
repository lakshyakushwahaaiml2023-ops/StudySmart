// app/api/generate-mcq/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateMCQ } from "@/lib/groq";

export async function POST(request: NextRequest) {
  try {
    const { text, difficulty, count } = await request.json();

    // Validation
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Please provide text to generate MCQs from" },
        { status: 400 }
      );
    }

    if (text.length > 50000) {
      return NextResponse.json(
        { error: "Text is too long (max 50000 characters)" },
        { status: 400 }
      );
    }

    if (!["Easy", "Medium", "Hard"].includes(difficulty)) {
      return NextResponse.json(
        { error: "Difficulty must be Easy, Medium, or Hard" },
        { status: 400 }
      );
    }

    const numCount = parseInt(count);
    if (isNaN(numCount) || numCount < 1 || numCount > 20) {
      return NextResponse.json(
        { error: "Question count must be between 1 and 20" },
        { status: 400 }
      );
    }

    const questions = await generateMCQ(text, difficulty, numCount);

    return NextResponse.json({ questions });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to generate MCQs";
    console.error("MCQ generation API error:", error);
    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}
