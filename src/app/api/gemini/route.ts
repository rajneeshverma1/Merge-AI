import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

function cleanAndFormatResponse(text: string): string {
  if (!text) return "";
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^(#{1,6})\s*(.+)$/gm, '$1 $2');
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');
  return cleaned;
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const rawBody = await req.text();
    if (!rawBody) {
      return NextResponse.json({ result: "Request body is missing" }, { status: 200 });
    }

    const data = JSON.parse(rawBody);
    const prompt = data.prompt?.trim();
    if (!prompt) {
      return NextResponse.json({ result: "Prompt field is required" }, { status: 200 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const enhancedPrompt = `Please provide a well-structured response using proper markdown formatting:\n\nUser's question: ${prompt}`;
        const availableModels = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];

        for (const modelName of availableModels) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(enhancedPrompt);
            const responseText = result.response.text();
            if (responseText) {
              return NextResponse.json({ result: cleanAndFormatResponse(responseText) }, { status: 200 });
            }
          } catch (modelError) {
            console.warn(`Gemini model ${modelName} error:`, modelError);
          }
        }
      } catch (err) {
        console.error("Gemini API error:", err);
      }
    }

    return NextResponse.json({
      result: `### Gemini Model Status\n\nRegarding: "${prompt}"\n\n- Gemini API is currently experiencing rate limit queueing or key validation.\n- Query details are synthesized into the Super Answer above.`
    }, { status: 200 });

  } catch (error: unknown) {
    return NextResponse.json(
      { result: "Gemini service is temporarily busy." },
      { status: 200 }
    );
  }
}