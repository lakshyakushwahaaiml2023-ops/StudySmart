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
  history: ChatMessage[] = [],
  contextData?: any
): Promise<string> => {
  const trimmedMessage = message.trim();
  if (!trimmedMessage) {
    throw new Error("Message cannot be empty");
  }

  const safeHistory = history
    .filter((item) => item.content.trim().length > 0)
    .slice(-8);

  let systemPrompt = `You are StudySmart assistant, a world-class academic mentor. 
Your goal is to support students and VERIFY their learning.

CRITICAL TASK VERIFICATION RULES:
1. SEQUENTIAL MASTERY: Tasks MUST be completed in the exact order listed (1st, 2nd, etc.). Look at the "TODAY'S OPERATIONAL TASKS" list.
2. If a user tries to mark a task as done (e.g. Task #2) while a previous task (e.g. Task #1) is still "PENDING", YOU MUST REFUSE. Explain that StudySmart enforces a linear mastery path and they must finish the current task first.
3. If the user completes the current (first unfinished) task, provide high-energy reinforcement and append exactly "[VERIFIED: task-ID]" at the very end of your message.
4. MANDATORY: The tag [VERIFIED: task-ID] is the ONLY way the dashboard updates. You MUST include it for the user's progress to be saved.
5. If they ask for a practice problem or quiz, feel free to generate one, but don't force it for task completion.

TONE: Extra friendly, HIGH-ENERGY, encouraging. Use high-school level language and 100% technical correctness in your explanations. 
FORMATTING: ALWAYS use standard Markdown and LaTeX for scientific content (e.g. $ x $ and $$ E=mc^2 $$).

SCHEDULE SYNC & TIME RULES:
1. If the user suggests they are starting their study session now, or asks to shift their schedule to the current time, YOU MUST append exactly "[SYNC_NOW]" to your response. This will trigger a real-time UI update.
2. You now have access to the EXACT scheduled times for each task in the "LIVE DASHBOARD CONTEXT". Use this to help the user manage their time.
3. If a user says "I'll be out" or "I'm busy", look at which tasks conflict with that window and suggest a new plan or a shift.
4. MUTATION RULE: If the user explicitly asks you to CHANGE, RESCHEDULE, ADD, or DELETE a task on their current dashboard, YOU MUST:
   - Provide a friendly verbal confirmation (e.g. "Sure, I've updated your schedule!") and WRAP IT in [CONFIRMATION] tags.
   - Then, output the NEW updated task list as a JSON array inside the [UPDATE_PLAN] tags below.
   - TIME HANDLING: If a user specifies a specific clock time (e.g. "8:00 PM") for a task, calculate the duration required to reach that time from the previous task, or use "Now" as the baseline. 
   - Wrap the array EXACTLY like this:
[CONFIRMATION] {Your verbal response here} [/CONFIRMATION]
[UPDATE_PLAN]
[
  { "task": "Task Name", "type": "High Yield", "estimated_time": "45 mins", "priority": "High", "reason": "..." }
]
[/UPDATE_PLAN]
   - The array must contain ALL tasks for the day. Return ONLY valid JSON inside those tags.`;

  if (contextData && contextData.profile) {
    systemPrompt += `\n\n--- LIVE DASHBOARD CONTEXT ---`;
    systemPrompt += `\nSTUDENT: ${contextData.profile.name} (${contextData.profile.studyLevel})`;
    
    // Use the optimized activeSchedule passed from the frontend if available
    const scheduleToUse = contextData.activeSchedule || (contextData.profile.events[0]?.plan?.today_tasks || []);

    systemPrompt += `\nCURRENT SCHEDULE:\n${JSON.stringify(scheduleToUse.map((t: any) => ({
      id: t.id,
      task: t.task,
      time: t.timeSlot || t.estimated_time,
      isCompleted: t.isCompleted
    })))}`;

    if (contextData.studyText) {
      systemPrompt += `\n\n--- CURRENT STUDY MATERIAL ---\n${contextData.studyText.slice(0, 2500)}\n(Use this content for your mini-quiz to ensure relevance)`;
    }
    if (contextData.summary) {
      systemPrompt += `\n\n--- AI SUMMARY ---\n${contextData.summary}`;
    }
    systemPrompt += `\n------------------------------`;
  }

  const completion = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.5,
    messages: [
      {
        role: "system",
        content: systemPrompt,
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
  formulas: Array<{ name: string; formula: string; explanation: string }>;
}> => {
  const completion = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: `You are an expert educator. Analyze the following study notes and provide:

1. A highly structured, visually clean bullet-point summary in MARKDOWN FORMAT. The entire summary MUST be a SINGLE STRING within the "summary" JSON key. Do NOT produce a nested JSON object for the summary; instead, use Markdown headers (\`##\`, \`###\`) and bullets (\`-\`) within your string.
2. Every distinct fact, property, or step MUST be its own bullet point (\`-\`). Never produce long paragraphs of text.
3. Use bolding (\`**Term**\`) to highlight key vocabulary within the summary.
4. Ensure double newlines (\`\\\\n\\\\n\`) between sections and sub-sections to create clear visual breathing room.
5. Use blockquotes (\`> **Tip:** ...\`) for "Expert Tips", "JEE-specific Advice", or "Common Mistakes". These will be rendered with special emphasis.
6. Explain foundational concepts clearly, focusing on the "learning approach"—explain *why* things happen and connect ideas logically. Use simple, high-school level language.
7. Key terms and definitions. If any important equations are foundational, include them here as well.
8. Extract ALL relevant equations into a dedicated formulas array. If none, return an empty array.

CRITICAL FORMATTING RULE: You MUST format all mathematical expressions, equations, variables, and scientific constants using strict LaTeX notation. Use \`$$ equation $$\` for standalone blocks and \`$ variable $\` for ANY inline math or symbol (e.g., use \`$ u_x $\` instead of \`u_x\`, \`$ \\\\theta $\` instead of \`theta\`). NEVER use plain text for scientific symbols. 
VERY IMPORTANT: Because your output is strictly parsed as JSON, you MUST double-escape ALL LaTeX backslashes. For example, you must write \`\\\\frac\` instead of \`\\frac\`, \`\\\\sin\` instead of \`\\sin\`, and \`\\\\theta\` instead of \`\\theta\`. Failure to double-escape will corrupt the math rendering. Use proper standard Markdown for everything else.

Format your response as a FLAT JSON (ONLY JSON, no other text). Use real newlines in your strings, not literal \\n characters.
{
  "summary": "## Main Topic
- Bullet point 1
- Bullet point 2

### Sub Topic
- Point 1",
  "keyTerms": [
    { "term": "Term name", "definition": "Clear, simple definition" }
  ],
  "formulas": [
    { "name": "Name of Formula", "formula": "$$ F = ma $$", "explanation": "What it calculates" }
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
      formulas: parsed.formulas || [],
    };
  } catch (error) {
    console.error("Failed to parse Groq summary response:", error);
    throw new Error("Failed to parse AI response");
  }
};

export const generateMCQ = async (
  text: string,
  difficulty: "Easy" | "Medium" | "Hard",
  count: number,
  targetedTopics?: string
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

  let userPrompt = `You are an expert exam question creator. Create ${count} multiple-choice questions from the following study material at ${difficulty} level.

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
}`;

  if (targetedTopics) {
    userPrompt += `\n\nTARGETED REMEDIAL LEARNING FOCUS:\nThe student recently struggled with or answered incorrectly questions regarding the following specific topics/concepts:\n${targetedTopics}\n\nYou MUST heavily prioritize and test these specific failed topics in your new questions to help them learn, while keeping the rest organically balanced. Do NOT generate the exact same questions as before.`;
  }

  userPrompt += `\n\nSTUDY MATERIAL:\n${text}\n
IMPORTANT RULES:
1. Return ONLY JSON, nothing else
2. Each question must have 4 distinct options
3. Options should be plausible but only one correct
4. Include explanations for learning
5. Vary question types (definition, application, analysis)
6. CRITICAL: ANY mathematical/scientific notation, variable, or symbol (e.g., $ \theta $, $ u_x $) MUST be written in strict LaTeX ($$ equation $$ or $ inline $). NEVER use plain text for scientific symbols.
7. JSON ESCANING: You MUST double-escape all LaTeX backslashes (e.g. \\\\frac, \\\\theta) so they do not break JSON parsing. DO NOT use raw ascii symbols like * or /.`;

  const completion = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: userPrompt,
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