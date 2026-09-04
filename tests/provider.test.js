import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callAI } from '@/lib/ai/provider';
import { callGroq } from '@/lib/ai/groq/adapter';
import { getRecommendationPrompt } from '@/lib/ai/prompts/recommendations';

vi.mock('@/lib/ai/gemini/adapter', () => ({
  callGemini: vi.fn(),
}));

vi.mock('@/lib/ai/groq/adapter', () => ({
  callGroq: vi.fn(),
}));

vi.mock('@/lib/ai/groq/client', () => ({
  getGroqKeyCount: vi.fn(() => 1),
  markGroqKeyCooldown: vi.fn(),
}));

vi.mock('@/lib/ai/gemini/client', () => ({
  getGeminiKeyCount: vi.fn(() => 1),
  markGeminiKeyCooldown: vi.fn(),
}));

describe('provider prompt routing and model failover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes task === "analytics" to getRecommendationPrompt with parsed statsPayload', async () => {
    const statsPayload = [
      { topic: 'Topic A', avg_percentage: 35.5 },
      { topic: 'Topic B', avg_percentage: 50.0 }
    ];

    vi.mocked(callGroq).mockResolvedValue({ text: '{"recommendations": []}' });

    await callAI({
      task: 'analytics',
      params: { statsPayload: JSON.stringify(statsPayload) }
    });

    const expectedPrompt = getRecommendationPrompt(statsPayload);
    expect(callGroq).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expectedPrompt,
        model: 'qwen/qwen3-32b'
      })
    );
  });

  it('routes task === "copyDetection" to openai/gpt-oss-120b as primary', async () => {
    vi.mocked(callGroq).mockResolvedValue({ text: '{"results": []}' });

    const result = await callAI({
      task: 'copyDetection',
      params: { candidates: [] }
    });

    expect(callGroq).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'openai/gpt-oss-120b'
      })
    );
    expect(result.model).toBe('openai/gpt-oss-120b');
  });

  it('falls back to qwen/qwen3.6-27b when primary fails for copyDetection', async () => {
    // Primary fails
    vi.mocked(callGroq)
      .mockRejectedValueOnce(new Error('Rate limit 429'))
      // Tier-2 Groq fallback succeeds
      .mockResolvedValueOnce({ text: '{"results": []}' });

    const result = await callAI({
      task: 'copyDetection',
      params: { candidates: [] }
    });

    expect(callGroq).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ model: 'openai/gpt-oss-120b' })
    );
    expect(callGroq).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ model: 'qwen/qwen3.6-27b' })
    );
    expect(result.model).toBe('qwen/qwen3.6-27b (backup)');
  });
});
