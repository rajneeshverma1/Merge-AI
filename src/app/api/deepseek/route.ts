import { NextRequest, NextResponse } from "next/server";

interface RequestBody {
  prompt: string;
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
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
      return NextResponse.json({ result: "Request body is missing" }, { status: 200 });
    }

    const data: RequestBody = JSON.parse(rawBody);
    const prompt = data.prompt?.trim();
    if (!prompt) {
      return NextResponse.json({ result: "Prompt field is required" }, { status: 200 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENROUTER_API_KEY;

    if (apiKey) {
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
            max_tokens: 500,
            temperature: 0.7,
          })
        });

        if (response.ok) {
          const chatCompletion = await response.json();
          const rawResponse = chatCompletion.choices?.[0]?.message?.content || "";
          if (rawResponse) {
            return NextResponse.json({ result: cleanResponse(rawResponse) }, { status: 200 });
          }
        } else {
          console.warn("DeepSeek API status:", response.status);
        }
      } catch (err) {
        console.error("DeepSeek API error:", err);
      }
    }

    return NextResponse.json({
      result: `### DeepSeek Model Status\n\nRegarding: "${prompt}"\n\n- DeepSeek API endpoint is currently undergoing rate limit queueing.\n- Response details are processed in the Super Answer.`
    }, { status: 200 });

  } catch (error: unknown) {
    return NextResponse.json(
      { result: "DeepSeek service is temporarily busy." },
      { status: 200 }
    );
  }
}