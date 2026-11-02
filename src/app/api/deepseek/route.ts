import { NextRequest, NextResponse } from "next/server";
import { generateSmartDeepSeekResponse } from "@/lib/knowledge-engine";

interface RequestBody {
  prompt: string;
}

function cleanResponse(text: string): string {
  if (!text) return "";
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '');
  cleaned = cleaned.replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  return cleaned;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const rawBody = await req.text();
    if (!rawBody) {
      const fallback = await generateSmartDeepSeekResponse("Query");
      return NextResponse.json({ result: fallback }, { status: 200 });
    }

    const data: RequestBody = JSON.parse(rawBody);
    const prompt = data.prompt?.trim();
    if (!prompt) {
      const fallback = await generateSmartDeepSeekResponse("Query");
      return NextResponse.json({ result: fallback }, { status: 200 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENROUTER_API_KEY;

    if (apiKey && !apiKey.includes('your_deepseek_key')) {
      try {
        const isDeepSeekDirect = apiKey.startsWith("sk-");
        const endpoint = isDeepSeekDirect && !apiKey.includes("or-")
          ? "https://api.deepseek.com/chat/completions"
          : "https://openrouter.ai/api/v1/chat/completions";

        const modelName = isDeepSeekDirect && !apiKey.includes("or-")
          ? "deepseek-chat"
          : "deepseek/deepseek-r1-0528:free";

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              {
                role: "system",
                content: "You are a helpful assistant. Always format your responses in clean markdown syntax."
              },
              { role: "user", content: prompt },
            ],
            max_tokens: 1000,
            temperature: 0.7,
          })
        });

        if (response.ok) {
          const chatCompletion = await response.json();
          const rawResponse = chatCompletion.choices?.[0]?.message?.content || "";
          if (rawResponse) {
            return NextResponse.json({ result: cleanResponse(rawResponse) }, { status: 200 });
          }
        }
      } catch (err) {
        console.error("DeepSeek API error:", err);
      }
    }

    // Smart Knowledge Engine Fallback for expired quota or rate-limited API keys
    const smartResponse = await generateSmartDeepSeekResponse(prompt);
    return NextResponse.json({
      result: smartResponse
    }, { status: 200 });

  } catch {
    const fallback = await generateSmartDeepSeekResponse("Query");
    return NextResponse.json(
      { result: fallback },
      { status: 200 }
    );
  }
}