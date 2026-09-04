import { getGeminiClient, markGeminiKeyCooldown } from './client';

export const callGemini = async ({ model, prompt, fileBuffer, mimeType, useBackup = false, isJson = true }) => {
  const { client: genAI, keyIndex } = getGeminiClient(useBackup);
  const aiModel = genAI.getGenerativeModel({ model });

  const parts = [{ text: prompt }];

  if (fileBuffer && mimeType) {
    parts.push({
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType
      }
    });
  }

  try {
    const result = await aiModel.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig: {
        responseMimeType: isJson ? "application/json" : "text/plain",
        maxOutputTokens: 8192,
      }
    }, { timeout: 120000 });

    const candidate = result.response.candidates?.[0];
    const finishReason = candidate?.finishReason;

    if (finishReason === 'MAX_TOKENS') {
      const error = new Error('OCR output was truncated because it reached the maximum token limit (MAX_TOKENS). The answer sheet is unusually long or dense.');
      error.code = 'MAX_TOKENS_TRUNCATED';
      error.finishReason = finishReason;
      throw error;
    }

    return {
      text: result.response.text(),
      finishReason: finishReason || 'STOP',
      usage: {
        promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
        completionTokens: result.response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: result.response.usageMetadata?.totalTokenCount || 0,
      }
    };
  } catch (error) {
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Quota') || error?.message?.includes('exhausted')) {
      markGeminiKeyCooldown(keyIndex, useBackup, 60000); // 60s cooldown
    }
    throw error;
  }
};
