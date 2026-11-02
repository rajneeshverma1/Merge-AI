import { NextRequest, NextResponse } from "next/server";
import { generateSmartGPTResponse } from "@/lib/knowledge-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, apiKey } = body;
    
    if (!content) {
      return NextResponse.json(
        { error: "Content is required in the request body." },
        { status: 400 }
      );
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const directKey = apiKey || process.env.OPENAI_API_KEY;

    // 1. Try OpenRouter with gpt-4o-mini if available
    if (openRouterKey && !openRouterKey.includes('your_')) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openRouterKey}`,
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are a helpful assistant. Provide responses in clean markdown format."
              },
              { role: "user", content }
            ],
            max_tokens: 350,
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
        console.error("OpenRouter GPT error:", err);
      }
    }

    // 2. Try direct OpenAI API key if provided
    if (directKey && !directKey.includes('your_openai_key')) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${directKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are a helpful assistant. Provide responses in clean markdown format."
              },
              { role: "user", content }
            ],
            max_tokens: 350,
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
        console.error("OpenAI direct API fetch error:", err);
      }
    }

    // 3. Fallback to Smart Knowledge Engine
    const smartResponse = await generateSmartGPTResponse(content);
    return NextResponse.json({
      result: smartResponse
    }, { status: 200 });

  } catch {
    const fallback = await generateSmartGPTResponse("Query");
    return NextResponse.json(
      { result: fallback },
      { status: 200 }
    );
  }
}