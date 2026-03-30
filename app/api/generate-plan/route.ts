import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { profile, event, chatSnapshot, isEarlyCompletion = false } = await req.json();

    if (!profile || !event) {
      return NextResponse.json(
        { error: "Missing required profile or event data." },
        { status: 400 }
      );
    }

    // Calculate days remaining
    const today = new Date();
    const examDate = new Date(event.date);
    const diffTime = examDate.getTime() - today.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const targetDays = Math.max(1, Math.min(daysRemaining, 7));

    const isPanicMode = daysRemaining <= 3;

    const completedCount = event.completedTasks?.length || 0;
    const totalTasks = event.plan?.today_tasks?.length || 0; // Approximate from last plan

    // Clean and truncate syllabus to fit Groq 6000 TPM limit
    const cleanSyllabus = (text: string) => 
      text?.replace(/\s+/g, " ").replace(/\n+/g, " ").trim().slice(0, 3000) || "General course coverage";
    
    const displaySyllabus = cleanSyllabus(event.syllabus);
    const isTruncated = (event.syllabus?.length || 0) > 3000;

    let systemPrompt = `You are a world-class AI Study Planner advisor.
Your goal is to create a HIGHLY OPTIMIZED, PRIORITIZED, and REALISTIC study plan.

INPUT CONTEXT:
- Student Name: ${profile.name}
- Exam Name: ${event.name}
- Days Left: ${daysRemaining}
- Syllabus: ${displaySyllabus}${isTruncated ? " (Note: Syllabus truncated for brevity, focus on the core topics listed here)" : ""}
- Student Level: ${profile.studyLevel}
- Current Progress: ${completedCount} tasks completed so far.
- CURRENT LOCAL TIME: ${new Date().toLocaleTimeString()} (Use this to logically place a 'Food Break' if the session spans normal eating hours).
- EARLY COMPLETION STATUS: ${isEarlyCompletion ? "YES - The student has finished today's tasks early and is ready for the NEXT subset of their roadmap." : "NO"}

OUTPUT STRICT JSON REGARDLESS OF ANYTHING ELSE:
{
  "strategy": "Explain overall approach based on time and exam pressure",
  "today_tasks": [
    {
      "task": "string",
      "type": "High Yield / Quick Win / Concept / Revision / Rest / Meal",
      "priority": "High / Medium / Low",
      "reason": "Why this task is important",
      "estimated_time": "e.g. 45 mins"
    }
  ],
  "roadmap": [
    {
      "day": "Day 1",
      "focus": "What to study",
      "goal": "Outcome for the day"
    },
    {
      "day": "Day 2",
      "focus": "Next topic to study",
      "goal": "Outcome for the second day"
    }
  ],
  "progress_model": {
    "total_days": ${daysRemaining + 1},
    "expected_completion": "percentage dynamic based on syllabus",
    "warning": "If time is insufficient, explain what to skip"
  },
  "adaptive_rules": [
    "Rule for adjusting if tasks are skipped",
    "Rule for increasing depth if ahead of schedule"
  ]
}

RULES:
- NEVER overload the student (max 5 tasks per day).
- Prioritize high-yield topics first using the Priority Score logic: Importance × Exam Weightage × (1 / Time Left) × Knowledge Gap.
- EARLY COMPLETION RULE: If 'EARLY COMPLETION STATUS' is YES, DO NOT output the same tasks that were in the previous Day 1 plan. Transition strictly to the next logical set of topics from the roadmap to expand their study streak.
- If days left <= 3 → enter PANIC MODE (only critical topics).
- If syllabus is large and time is small → suggest selective study.
- Tasks must feel achievable and motivating.
- BREAK RULE: Insert exactly ONE 'Rest' break (5-10 mins) or 'Meal' (20 mins) BETWEEN every academic study task. 
- You MUST NEVER output two 'Rest' or 'Meal' type tasks in a row.
- Name all meal-related tasks exactly "Food Break" (do not use specific names like Breakfast, Lunch, or Dinner).
- ROADMAP RULE: Generate a multi-day plan covering EXACTLY the next ${targetDays} days. Do NOT output more days than necessary!
`;

    if (chatSnapshot && chatSnapshot.length > 0) {
      // Reduce snapshot to 5 to save tokens
      systemPrompt += `\nCHAT HISTORY SNAPSHOT:\n${JSON.stringify(chatSnapshot.slice(-5))}\nPay special attention to what the user explicitly said they don't understand.`;
    }

    const maxRetries = 2;
    for (let attempts = 0; attempts < maxRetries; attempts++) {
      try {
        const completion = await groq.chat.completions.create({
          messages: [{ role: "system", content: systemPrompt }],
          model: "llama-3.1-8b-instant",
          temperature: 0.2,
          response_format: { type: "json_object" },
        });

        const rawContent = completion.choices[0]?.message?.content || "";
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
          throw new Error("No valid JSON found in response");
        }

        const parsedJson = JSON.parse(jsonMatch[0]);
        
        if (!parsedJson.today_tasks || !Array.isArray(parsedJson.today_tasks)) {
           throw new Error("Missing 'today_tasks' array in JSON");
        }

        // Post-processing to programmatically enforce strict break rules
        let cleanedTasks = [];
        for (let i = 0; i < parsedJson.today_tasks.length; i++) {
          const task = parsedJson.today_tasks[i];
          const isBreak = task.type?.toLowerCase().includes("rest") || task.type?.toLowerCase().includes("meal");
          
          // Drop consecutive breaks
          if (isBreak && cleanedTasks.length > 0) {
            const prevTask = cleanedTasks[cleanedTasks.length - 1];
            const prevIsBreak = prevTask.type?.toLowerCase().includes("rest") || prevTask.type?.toLowerCase().includes("meal");
            if (prevIsBreak) {
              continue; // Skip this duplicate non-academic slot
            }
          }
          
          // Force duration maxes
          if (task.type?.toLowerCase().includes("meal")) {
             task.estimated_time = "20 mins";
          } else if (task.type?.toLowerCase().includes("rest")) {
             // Keep micro-breaks strictly short
             if (task.estimated_time?.includes("hour") || parseInt(task.estimated_time || "0") > 15) {
               task.estimated_time = "10 mins";
             }
          }
          cleanedTasks.push(task);
        }

        // Strip breaks from the bookends
        if (cleanedTasks.length > 0 && (cleanedTasks[0].type?.toLowerCase().includes("rest") || cleanedTasks[0].type?.toLowerCase().includes("meal"))) {
          cleanedTasks.shift();
        }
        if (cleanedTasks.length > 0 && (cleanedTasks[cleanedTasks.length - 1].type?.toLowerCase().includes("rest") || cleanedTasks[cleanedTasks.length - 1].type?.toLowerCase().includes("meal"))) {
          cleanedTasks.pop();
        }

        parsedJson.today_tasks = cleanedTasks;

        return NextResponse.json(parsedJson);
      } catch (parseError: any) {
        if (attempts === maxRetries - 1) {
          console.error("Failed to parse JSON after retries", parseError);
          return NextResponse.json(
             { error: "The AI returned an invalid schedule format." },
             { status: 500 }
          );
        }
      }
    }
  } catch (error: any) {
    console.error("Generate Plan API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate plan." },
      { status: 500 }
    );
  }
}
