/**
 * Merge AI - Shared AI Provider and Model Types
 */

export type AIProviderId = 'gemini' | 'deepseek' | 'claude' | 'gpt' | 'mistral';

export interface AIModelInfo {
  id: AIProviderId;
  name: string;
  tagline: string;
  color: string;
  accentClass: string;
  contextWindow: string;
}

export interface ModelComparisonResponse {
  model: AIProviderId;
  response: string;
  latencyMs?: number;
  tokensUsed?: number;
  completedAt?: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
}

export interface SynthesizedAnswer {
  query: string;
  summary: string;
  contributingModels: AIProviderId[];
  synthesizedAt: string;
}
