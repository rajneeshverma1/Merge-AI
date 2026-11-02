import { NextRequest, NextResponse } from "next/server";
import { generateSmartClaudeResponse } from "@/lib/knowledge-engine";

interface RequestBody {
  prompt: string;
  apiKey?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as RequestBody;
    const { prompt, apiKey } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required in the request body." },
        { status: 400 }
      );
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const directKey = apiKey || process.env.ANTHROPIC_API_KEY;

    // 1. Try OpenRouter with anthropic/claude-haiku-4.5
    if (openRouterKey && !openRouterKey.includes('your_')) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openRouterKey}`,
          },
          body: JSON.stringify({
            model: "anthropic/claude-haiku-4.5",
            messages: [
              {
                role: "system",
                content: "You are Claude, a helpful assistant. Provide structured, accurate, and concise responses in clean markdown syntax."
              },
              { role: "user", content: prompt }
            ],
            max_tokens: 180,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const result = data.choices?.[0]?.message?.content;
          if (result) {
            return NextResponse.json({ result }, { status: 200 });
          }
        }
      } catch (err) {
        console.error("OpenRouter Claude error:", err);
      }
    }

    // 2. Try direct Anthropic key if available
    if (directKey && !directKey.includes('your_anthropic_key')) {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": directKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-5-haiku-latest",
            max_tokens: 350,
            messages: [
              {
                role: "user",
                content: prompt
              }
            ]
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.content && data.content[0]?.text) {
            return NextResponse.json({ result: data.content[0].text }, { status: 200 });
          }
        }
      } catch (e) {
        console.error("Direct Claude API error:", e);
      }
    }

    // 3. Smart Knowledge Engine Fallback
    const smartResponse = await generateSmartClaudeResponse(prompt);
    return NextResponse.json({
      result: smartResponse
    }, { status: 200 });

  } catch {
    const fallback = await generateSmartClaudeResponse("Query");
    return NextResponse.json(
      { result: fallback },
      { status: 200 }
    );
  }
}