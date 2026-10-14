import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { AIModelInfo, AIProviderId } from "@/types/ai"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const AI_MODELS_REGISTRY: Record<AIProviderId, AIModelInfo> = {
  gpt: {
    id: 'gpt',
    name: 'OpenAI GPT-4o',
    tagline: 'High intelligence & reasoning',
    color: '#10A37F',
    accentClass: 'from-emerald-500/20 to-teal-500/10 text-emerald-400',
    contextWindow: '128k',
  },
  claude: {
    id: 'claude',
    name: 'Claude 3.5 Sonnet',
    tagline: 'Nuanced analysis & code synthesis',
    color: '#D97706',
    accentClass: 'from-amber-500/20 to-orange-500/10 text-amber-400',
    contextWindow: '200k',
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini 1.5 Pro',
    tagline: 'Multimodal context processing',
    color: '#3B82F6',
    accentClass: 'from-blue-500/20 to-indigo-500/10 text-blue-400',
    contextWindow: '1M',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek-R1',
    tagline: 'Deep step-by-step reasoning',
    color: '#6366F1',
    accentClass: 'from-indigo-500/20 to-violet-500/10 text-indigo-400',
    contextWindow: '64k',
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral Synthesis',
    tagline: 'Multi-model aggregator engine',
    color: '#EC4899',
    accentClass: 'from-pink-500/20 to-rose-500/10 text-pink-400',
    contextWindow: '32k',
  },
};

export function getModelInfo(modelId: AIProviderId): AIModelInfo {
  return AI_MODELS_REGISTRY[modelId] || {
    id: modelId,
    name: modelId.toUpperCase(),
    tagline: 'AI Model',
    color: '#71717A',
    accentClass: 'from-zinc-500/20 to-zinc-500/10 text-zinc-400',
    contextWindow: 'Unknown',
  };
}

export function formatExecutionTime(ms?: number): string {
  if (!ms) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
