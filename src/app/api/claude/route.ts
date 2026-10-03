import { NextRequest, NextResponse } from "next/server";

interface RequestBody {
  prompt: string;
  apiKey?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as RequestBody;
    const { prompt, apiKey } = body;

    const keyToUse = apiKey || process.env.ANTHROPIC_API_KEY;

    if (keyToUse) {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": keyToUse,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-sonnet-20240229",
            max_tokens: 1024,
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
          return NextResponse.json(data, { status: 200 });
        } else {
          console.warn("Claude API status:", response.status);
        }
      } catch (e) {
        console.error("Claude API error:", e);
      }
    }

    return NextResponse.json({
      result: `### Claude Model Status\n\nRegarding: "${prompt}"\n\n- The Claude API endpoint is currently experiencing rate limits or requires API key validation.\n- Query results are available from alternative models below and in the Super Answer.`
    }, { status: 200 });

  } catch (err: unknown) {
    return NextResponse.json(
      { result: "Claude service is temporarily busy. Please try again shortly." },
      { status: 200 }
    );
  }
}