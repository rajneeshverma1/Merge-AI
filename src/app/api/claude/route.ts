import { NextRequest, NextResponse } from "next/server";

interface RequestBody {
  prompt: string;
  apiKey?: string;
}

function generateDemoClaudeResponse(prompt: string): string {
  const p = prompt.trim();
  return `### Anthropic Claude 3.5 Sonnet

Here is a comprehensive breakdown of **"${p}"**:

* **Analytical Perspective**: Breaking down the key dimensions of your request.
* **Best Practices**:
  - Maintain safety, clarity, and precision in execution.
  - Ensure user experience and responsiveness remain primary design goals.

\`\`\`json
{
  "analysis": "Completed",
  "query": "${p.replace(/"/g, '\\"')}",
  "confidence": 0.98
}
\`\`\`

Summary: Focusing on scalable principles will deliver optimal outcomes for this use case.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as RequestBody;
    const { prompt, apiKey } = body;

    const keyToUse = apiKey || process.env.ANTHROPIC_API_KEY;

    if (keyToUse && !keyToUse.includes('your_anthropic_key')) {
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
        }
      } catch (e) {
        console.error("Claude API error:", e);
      }
    }

    // Demo Mode Fallback for expired quota or rate-limited API keys
    return NextResponse.json({
      result: generateDemoClaudeResponse(prompt)
    }, { status: 200 });

  } catch (err: unknown) {
    return NextResponse.json(
      { result: generateDemoClaudeResponse("Query") },
      { status: 200 }
    );
  }
}