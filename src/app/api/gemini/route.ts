import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { generateSmartGeminiResponse } from "@/lib/knowledge-engine";

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
      const fallback = await generateSmartGeminiResponse("Query");
      return NextResponse.json({ result: fallback }, { status: 200 });
    }

    const data = JSON.parse(rawBody);
    const prompt = data.prompt?.trim();
    if (!prompt) {
      const fallback = await generateSmartGeminiResponse("Query");
      return NextResponse.json({ result: fallback }, { status: 200 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey && !geminiApiKey.includes('your_gemini_key')) {
      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const availableModels = [
          "gemini-2.0-flash",
          "gemini-1.5-flash",
          "gemini-1.5-pro",
          "gemini-flash-latest"
        ];

        for (const modelName of availableModels) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
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

    // Smart Knowledge Engine Fallback for expired quota or missing API key
    const smartResponse = await generateSmartGeminiResponse(prompt);
    return NextResponse.json({
      result: smartResponse
    }, { status: 200 });

  } catch {
    const fallback = await generateSmartGeminiResponse("Query");
    return NextResponse.json(
      { result: fallback },
      { status: 200 }
    );
  }
}