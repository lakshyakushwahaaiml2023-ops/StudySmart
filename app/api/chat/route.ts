import { NextRequest, NextResponse } from "next/server";
import { chatWithAssistant } from "@/lib/groq";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      message?: string;
      history?: ChatMessage[];
    };

    const message = (body.message || "").trim();
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return NextResponse.json(
        { error: "Please provide a message" },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message is too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    const sanitizedHistory = history
      .filter(
        (item) =>
          (item.role === "user" || item.role === "assistant") &&
          typeof item.content === "string"
      )
      .slice(-8);

    const reply = await chatWithAssistant(message, sanitizedHistory);
    return NextResponse.json({ reply });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to get chat response";
    console.error("Chat API error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
