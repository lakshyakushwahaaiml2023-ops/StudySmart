import Groq from "groq-sdk";

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error("Missing GROQ_API_KEY environment variable");
}

const client = new Groq({ apiKey });

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export const chatWithAssistant = async (
  message: string,
  history: ChatMessage[] = []
): Promise<string> => {
  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    throw new Error("Message cannot be empty");
  }

  const safeHistory = history
    .filter((item) => item.content.trim().length > 0)
    .slice(-8);

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content:
          "You are StudySmart assistant. Give concise, helpful learning support for student notes and quizzes. Be friendly, encouraging, and use simple language suitable for a high school student to explain complex topics.",
      },
      ...safeHistory,
      {
        role: "user",
        content: trimmedMessage,
      },
    ],
  });

  const responseText = completion.choices[0]?.message?.content;
  if (!responseText || responseText.trim().length === 0) {
    throw new Error("Empty response from Groq");
  }

  return responseText.trim();
};

export const summarizeNotes = async (text: string): Promise<{
  summary: string;
  keyTerms: Array<{ term: string; definition: string }>;
}> => {
  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: `You are an expert educator. Analyze the following study notes and provide:

1. A quick, high-level structured bullet-point summary of the core syllabus or notes, organized by main topics. Use very simple, easy-to-understand language and keep it concise.
2. Key terms and definitions. If any important equations or scientific constants are foundational to the notes, please also explicitly include them here as key terms.
3. Extract ALL relevant equations, mathematical formulas, and scientific constants with their names and a brief explanation into a dedicated formulas array (this applies to all types of text, including plain text syllabuses). If there are none, return an empty array for formulas.

Format your response as JSON (ONLY JSON, no other text):
{
  "summary": "# Main Topic\\n- Bullet point 1\\n- Bullet point 2\\n\\n## Sub Topic\\n- Point 1",
  "keyTerms": [
    { "term": "Term name", "definition": "Clear, simple definition" }
  ],
  "formulas": [
    { "name": "Name of Formula", "formula": "The mathematical formula (e.g. F = ma)", "explanation": "What it calculates" }
  ]
}

NOTES TO ANALYZE:
${text}

Remember: Output ONLY valid JSON.`,
      },
    ],
  });

  try {
    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) throw new Error("Empty response from Groq");

    // Extract JSON from potential markdown code blocks
    let jsonText = responseText;
    if (jsonText.includes("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonText.includes("```")) {
      jsonText = jsonText.replace(/```\n?/g, "");
    }

    const parsed = JSON.parse(jsonText.trim());
    return {
      summary: parsed.summary,
      keyTerms: parsed.keyTerms || [],
    };
  } catch (error) {
    console.error("Failed to parse Groq summary response:", error);
    throw new Error("Failed to parse AI response");
  }
};

export const generateMCQ = async (
  text: string,
  difficulty: "Easy" | "Medium" | "Hard",
  count: number
): Promise<
  Array<{
    question: string;
    options: string[];
    correct: string;
    explanation: string;
  }>
> => {
  const difficultyGuide = {
    Easy: "simple, definition-based, straightforward concepts",
    Medium: "application-level, requires understanding, some analysis",
    Hard: "critical thinking, synthesis, complex scenarios, rarely obvious",
  };

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: `You are an expert exam question creator. Create ${count} multiple-choice questions from the following study material at ${difficulty} level.

Difficulty level: ${difficultyGuide[difficulty]}

Return ONLY valid JSON in this format (no markdown, no explanation before/after):
{
  "questions": [
    {
      "question": "The actual question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": "Option A",
      "explanation": "Why this is correct and why others are wrong. Use simple, easy-to-understand language."
    }
  ]
}

STUDY MATERIAL:
${text}

IMPORTANT RULES:
1. Return ONLY JSON, nothing else
2. Each question must have 4 distinct options
3. Options should be plausible but only one correct
4. Include explanations for learning
5. Vary question types (definition, application, analysis)`,
      },
    ],
  });

  try {
    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) throw new Error("Empty response from Groq");

    let jsonText = responseText;
    if (jsonText.includes("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonText.includes("```")) {
      jsonText = jsonText.replace(/```\n?/g, "");
    }

    const parsed = JSON.parse(jsonText.trim());
    return parsed.questions || [];
  } catch (error) {
    console.error("Failed to parse Groq MCQ response:", error);
    throw new Error("Failed to generate MCQs");
  }
};

export default client;