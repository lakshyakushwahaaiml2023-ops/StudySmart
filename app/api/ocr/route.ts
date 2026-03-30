import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "No image data provided" }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "Server Configuration Error: GROQ_API_KEY is missing" }, { status: 500 });
    }

    try {
      // Call Groq Vision Model (Updated to Meta Llama 4 Scout for 2026 stability)
      const response = await client.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "You are a professional academic OCR assistant. Transcribe the handwritten or typed text from this image into a clean, structured text format. \n\nRULES:\n1. Preserve the logical structure (headers, lists, sections).\n2. Use LaTeX for any mathematical formulas or scientific symbols (e.g., $ x^2 $, $ \\theta $).\n3. If you see diagrams, describe them briefly in [brackets].\n4. Output ONLY the transcribed text, no conversational filler.",
              },
              {
                type: "image_url",
                image_url: {
                  url: image, // Base64 data URI: data:image/jpeg;base64,...
                },
              },
            ],
          },
        ],
        temperature: 0.1, 
      });

      const transcription = response.choices[0]?.message?.content || "";

      if (!transcription) {
        throw new Error("Groq returned an empty transcription choices array.");
      }

      return NextResponse.json({ text: transcription });
    } catch (groqError: any) {
      console.error("Groq API error details:", groqError);
      return NextResponse.json({ 
        error: `Groq AI Error: ${groqError?.message || "Vision model failed to process image"}`,
        details: groqError?.response?.data || "No additional info"
      }, { status: 502 });
    }
  } catch (error: any) {
    console.error("General OCR API Error:", error);
    return NextResponse.json({ error: `OCR Service Error: ${error?.message || "Internal failure"}` }, { status: 500 });
  }
}
