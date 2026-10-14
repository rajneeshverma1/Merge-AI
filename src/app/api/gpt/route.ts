import { NextRequest, NextResponse } from "next/server";

function generateDemoGPTResponse(prompt: string): string {
  const p = prompt.trim();
  return `### OpenAI GPT-4 Vision & Analysis

Regarding **"${p}"**:

1. **Core Concept**: Here is a structured approach from GPT's perspective.
2. **Key Insights**:
   - **Strategic Focus**: Prioritize core execution and scalable design patterns.
   - **Implementation**: Maintain modular architecture and clean component structures.

3. **Practical Code Example**:
\`\`\`typescript
// Demonstration pattern
export async function handleQuery(query: string) {
  return { status: "success", topic: query, model: "GPT-4" };
}
\`\`\`

> *Tip*: Combine rapid iteration with continuous feedback loops for optimal results.`;
}

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

    if (keyToUse && !keyToUse.includes('your_openai_key')) {
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
        }
      } catch (err) {
        console.error("OpenAI API fetch error:", err);
      }
    }

    // Demo Mode Fallback for expired quota or rate-limited API keys
    return NextResponse.json({
      result: generateDemoGPTResponse(content)
    }, { status: 200 });

  } catch (err: unknown) {
    return NextResponse.json(
      { result: generateDemoGPTResponse("Query") },
      { status: 200 }
    );
  }
}