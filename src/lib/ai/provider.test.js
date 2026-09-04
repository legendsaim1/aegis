import { describe, it, expect, vi, beforeEach } from 'vitest';
import { callAI } from './provider';
import { callGroq } from './groq/adapter';
import { getRecommendationPrompt } from './prompts/recommendations';

vi.mock('./gemini/adapter', () => ({
  callGemini: vi.fn(),
}));

vi.mock('./groq/adapter', () => ({
  callGroq: vi.fn(),
}));

vi.mock('./groq/client', () => ({
  getGroqKeyCount: vi.fn(() => 1),
  markGroqKeyCooldown: vi.fn(),
}));

vi.mock('./gemini/client', () => ({
  getGeminiKeyCount: vi.fn(() => 1),
  markGeminiKeyCooldown: vi.fn(),
}));

describe('provider prompt routing', () => {
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
});
