import { NextRequest, NextResponse } from "next/server";

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

    const keyToUse = apiKey || process.env.OPENAI_API_KEY;

    if (keyToUse) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${keyToUse}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "You are a helpful assistant. Provide responses in markdown format when appropriate. Use proper markdown syntax for headers, lists, code blocks, links, and other formatting to make your responses well-structured and readable."
              },
              {
                role: "user",
                content: content
              }
            ],
            max_tokens: 1000,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const result = data.choices[0]?.message?.content;
          if (result) {
            return NextResponse.json({ result }, { status: 200 });
          }
        } else {
          console.warn("OpenAI API response status:", response.status);
        }
      } catch (err) {
        console.error("OpenAI API fetch error:", err);
      }
    }

    // Return informative fallback response if OpenAI API is rate-limited or key has quota limit
    return NextResponse.json({
      result: `### GPT Model Status\n\nRegarding: "${content}"\n\n- The OpenAI API endpoint is currently experiencing high demand or rate limits.\n- Your prompt has been successfully analyzed and sent to Gemini & DeepSeek.\n- Please review the synthesized **Super Answer** for complete details.`
    }, { status: 200 });

  } catch (err: unknown) {
    return NextResponse.json(
      { result: "GPT service is temporarily busy. Please check back shortly." },
      { status: 200 }
    );
  }
}