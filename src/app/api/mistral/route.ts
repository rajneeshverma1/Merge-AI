import { NextRequest, NextResponse } from 'next/server';

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

class SummaryService {
  private buildSystemPrompt(): string {
    return `You are an expert AI synthesis assistant. Your single task is to create the most accurate, comprehensive, and actionable final answer by combining multiple AI responses.

CRITICAL INSTRUCTIONS:
1. Synthesize all responses into ONE definitive answer
2. Extract the best information from each response
3. Resolve contradictions by choosing the most accurate information
4. Present the final answer as if it came from a single, highly knowledgeable source
5. Use clear, professional markdown formatting
6. Be concise but complete - no redundancy or fluff`;
  }

  private cleanResponse(text: string): string {
    if (!text) return "";
    
    let cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, '');
    cleaned = cleaned.replace(/<reasoning>[\s\S]*?<\/reasoning>/g, '');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.trim();
    
    return cleaned;
  }

  private buildSummaryPrompt(message: string, responses: AIResponse[]): string {
    let prompt = `Question: "${message}"\n\n`;
    prompt += `Multiple AI responses to synthesize:\n\n`;

    responses.forEach((resp, index) => {
      const responseText = resp.result || resp.response || resp.summary || resp.text || '';
      if (responseText) {
        prompt += `Response ${index + 1}:\n${responseText}\n\n`;
      }
    });

    prompt += `\nTask: Create the single best, most comprehensive answer by combining the valuable information from all responses above. Present it as one unified, authoritative response without referencing the individual sources.`;

    return prompt;
  }

  private async callMistralOrFallback(systemPrompt: string, userPrompt: string, responses: AIResponse[]): Promise<string> {
    const providers = [];

    if (process.env.MISTRAL_API_KEY) {
      providers.push({
        name: 'Mistral',
        endpoint: 'https://api.mistral.ai/v1/chat/completions',
        apiKey: process.env.MISTRAL_API_KEY,
        model: 'mistral-small-latest'
      });
    }

    if (process.env.OPENAI_API_KEY) {
      providers.push({
        name: 'OpenAI',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-3.5-turbo'
      });
    }

    if (process.env.DEEPSEEK_API_KEY) {
      const isDirect = process.env.DEEPSEEK_API_KEY.startsWith('sk-');
      providers.push({
        name: 'DeepSeek',
        endpoint: isDirect ? 'https://api.deepseek.com/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions',
        apiKey: process.env.DEEPSEEK_API_KEY,
        model: isDirect ? 'deepseek-chat' : 'deepseek/deepseek-r1-0528:free'
      });
    }

    if (process.env.OPENROUTER_API_KEY) {
      providers.push({
        name: 'OpenRouter',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        apiKey: process.env.OPENROUTER_API_KEY,
        model: 'deepseek/deepseek-r1-0528:free'
      });
    }

    // Try providers sequentially
    for (const provider of providers) {
      try {
        console.log(`Attempting synthesis with provider: ${provider.name}`);
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
        } else {
          console.warn(`Provider ${provider.name} returned status ${res.status}`);
        }
      } catch (err) {
        console.error(`Provider ${provider.name} failed:`, err);
      }
    }

    // Fallback synthesis if external endpoints fail or are rate limited
    const validResponses = responses
      .map(r => r.result || r.response || r.summary || r.text || '')
      .filter(t => t && t.length > 5);

    if (validResponses.length > 0) {
      return `### Super Answer (Synthesized AI Insights)\n\n${validResponses.join('\n\n---\n\n')}`;
    }

    throw new Error('All AI synthesis providers were unavailable');
  }

  async generateSummary(request: SummaryRequest): Promise<any> {
    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildSummaryPrompt(request.message, request.responses);

      const response = await this.callMistralOrFallback(systemPrompt, userPrompt, request.responses);
      const cleanedResponse = this.cleanResponse(response);

      return {
        success: true,
        result: cleanedResponse,
        summary: cleanedResponse,
        originalMessage: request.message,
        responseCount: request.responses.length,
        processedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating summary:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary';
      return {
        success: false,
        error: errorMessage,
        result: "I'm having technical difficulties generating the final summary. Please check your API key configuration.",
        originalMessage: request.message,
        responseCount: request.responses.length,
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
    
    // Always return 200 with result payload so client UI displays response cleanly
    return NextResponse.json(result, { status: 200 });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        success: false,
        result: "I'm having technical difficulties. Please try again shortly.",
        processedAt: new Date().toISOString()
      },
      { status: 200 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Summary API is running',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
}