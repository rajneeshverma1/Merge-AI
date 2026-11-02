import { NextRequest, NextResponse } from 'next/server';
import { generateSmartMergeAnswer } from '@/lib/knowledge-engine';

interface AIResponse {
  model: string;
  result?: string;
  response?: string;
  summary?: string;
  text?: string;
}

interface SummaryRequest {
  message: string;
  responses: AIResponse[];
}

interface SummaryResult {
  success: boolean;
  result: string;
  summary: string;
  originalMessage: string;
  responseCount: number;
  processedAt: string;
}

class SummaryService {
  private buildSystemPrompt(): string {
    return `You are an expert AI synthesis assistant. Your single task is to create the most accurate, comprehensive, and actionable final answer by combining multiple AI responses.`;
  }

  private cleanResponse(text: string): string {
    if (!text) return "";
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '');
    cleaned = cleaned.replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '');
    return cleaned.trim();
  }

  private buildSummaryPrompt(message: string, responses: AIResponse[]): string {
    let prompt = `Question: "${message}"\n\n`;
    responses.forEach((resp, index) => {
      const responseText = resp.result || resp.response || resp.summary || resp.text || '';
      if (responseText) {
        prompt += `Response ${index + 1} (${resp.model || 'AI'}):\n${responseText}\n\n`;
      }
    });
    return prompt;
  }

  private async callMistralOrFallback(systemPrompt: string, userPrompt: string, responses: AIResponse[], message: string): Promise<string> {
    const providers = [];

    if (process.env.MISTRAL_API_KEY && !process.env.MISTRAL_API_KEY.includes('your_mistral_key')) {
      providers.push({
        name: 'Mistral',
        endpoint: 'https://api.mistral.ai/v1/chat/completions',
        apiKey: process.env.MISTRAL_API_KEY,
        model: 'mistral-small-latest'
      });
    }

    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your_openai_key')) {
      providers.push({
        name: 'OpenAI',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-4o-mini'
      });
    }

    if (process.env.DEEPSEEK_API_KEY && !process.env.DEEPSEEK_API_KEY.includes('your_deepseek_key')) {
      const isDirect = process.env.DEEPSEEK_API_KEY.startsWith('sk-');
      providers.push({
        name: 'DeepSeek',
        endpoint: isDirect ? 'https://api.deepseek.com/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions',
        apiKey: process.env.DEEPSEEK_API_KEY,
        model: isDirect ? 'deepseek-chat' : 'deepseek/deepseek-r1-0528:free'
      });
    }

    // Try providers sequentially if active
    for (const provider of providers) {
      try {
        const res = await fetch(provider.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: provider.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 2000,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.choices && data.choices[0]?.message?.content) {
            return data.choices[0].message.content.trim();
          }
        }
      } catch (err) {
        console.error(`Provider ${provider.name} failed:`, err);
      }
    }

    // Smart Topic-Aware Knowledge Synthesis Fallback
    const modelResponses = responses.map(r => ({
      model: r.model || 'model',
      response: r.result || r.response || r.summary || r.text || ''
    }));
    return await generateSmartMergeAnswer(message, modelResponses);
  }

  async generateSummary(request: SummaryRequest): Promise<SummaryResult> {
    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildSummaryPrompt(request.message, request.responses);

      const response = await this.callMistralOrFallback(systemPrompt, userPrompt, request.responses, request.message);
      const cleanedResponse = this.cleanResponse(response);

      return {
        success: true,
        result: cleanedResponse,
        summary: cleanedResponse,
        originalMessage: request.message,
        responseCount: request.responses.length,
        processedAt: new Date().toISOString()
      };
    } catch {
      const modelResponses = (request.responses || []).map(r => ({
        model: r.model || 'model',
        response: r.result || r.response || r.summary || r.text || ''
      }));
      const smartResult = await generateSmartMergeAnswer(request.message, modelResponses);
      return {
        success: true,
        result: smartResult,
        summary: smartResult,
        originalMessage: request.message,
        responseCount: request.responses?.length || 0,
        processedAt: new Date().toISOString()
      };
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, responses } = body;
    if (!message || !responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: message and responses array',
          success: false
        },
        { status: 400 }
      );
    }

    const summaryService = new SummaryService();
    const result = await summaryService.generateSummary(body as SummaryRequest);
    return NextResponse.json(result, { status: 200 });
    
  } catch {
    const body = await request.json().catch(() => ({ message: "Query", responses: [] }));
    const smartResult = await generateSmartMergeAnswer(body.message || "Query", body.responses || []);
    return NextResponse.json({
      success: true,
      result: smartResult,
      summary: smartResult,
      processedAt: new Date().toISOString()
    }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Summary API is running with intelligent synthesis',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
}