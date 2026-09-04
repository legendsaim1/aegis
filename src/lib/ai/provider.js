import { callGemini } from './gemini/adapter';
import { callGroq } from './groq/adapter';
import { getGroqKeyCount } from './groq/client';
import { getGeminiKeyCount } from './gemini/client';
import { getOCRPrompt } from './prompts/ocr';
import { getGradingPrompt } from './prompts/grading';
import { getRubricPrompt } from './prompts/rubrics';
import { getQuestionExtractorPrompt } from './prompts/questionExtractor';
import { getCopyDetectionPrompt } from './prompts/copyDetection';
import { getRecommendationPrompt } from './prompts/recommendations';
import { createLogger } from '../utils/logger';

const TASK_CONFIG = {
  ocr: { primary: 'gemini', model: 'gemini-3.1-flash-lite' },
  questionExtract: { primary: 'gemini', model: 'gemini-3.1-flash-lite' },
  grading: { primary: 'groq', model: 'openai/gpt-oss-120b' },
  rubrics: { primary: 'groq', model: 'openai/gpt-oss-120b' },
  copyDetection: { primary: 'groq', model: 'openai/gpt-oss-120b' },
  analytics: { primary: 'groq', model: 'qwen/qwen3-32b' },
  topicRecommendations: { primary: 'groq', model: 'openai/gpt-oss-120b' },
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const callAI = async ({ task, params, fileBuffer, mimeType, isJson = true, modelOverride, reqId }) => {
  const log = createLogger('Provider', reqId);
  const config = TASK_CONFIG[task];
  if (!config) throw new Error(`Unknown task: ${task}`);

  const activeModel = modelOverride || config.model;

  // Generate prompt
  let prompt = "";
  if (task === 'ocr') {
    prompt = getOCRPrompt(params.questionsList, params.subjectName);
  } else if (task === 'questionExtract') {
    prompt = getQuestionExtractorPrompt();
  } else if (task === 'grading') {
    prompt = getGradingPrompt(params);
  } else if (task === 'rubrics') {
    prompt = getRubricPrompt(params);
  } else if (task === 'copyDetection') {
    prompt = getCopyDetectionPrompt(params.candidates);
  } else if (task === 'topicRecommendations') {
    prompt = getRecommendationPrompt(params.weakTopics);
  } else if (task === 'analytics') {
    prompt = getRecommendationPrompt(JSON.parse(params.statsPayload || "[]"));
  } else {
    prompt = params.prompt || "";
  }

  // Determine dynamic max retries based on available keys
  const primaryRetries = config.primary === 'gemini' ? getGeminiKeyCount(false) : getGroqKeyCount();
  const maxRetries = Math.max(1, primaryRetries);

  // Try Primary Provider
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (config.primary === 'gemini') {
        const result = await callGemini({ model: activeModel, prompt, fileBuffer, mimeType, useBackup: false, isJson });
        return { ...result, model: activeModel };
      } else {
        const result = await callGroq({ model: activeModel, prompt, isJson });
        return { ...result, model: activeModel };
      }
    } catch (error) {
      log.warn(`Primary provider attempt failed`, { provider: config.primary, attempt, maxRetries, error: error.message });
      if (attempt === maxRetries) break; // Exhausted primary keys

      // Delay before next attempt to allow rate limits to recover slightly
      await delay(2000);
    }
  }

  log.warn(`Primary provider failed for task '${task}', initiating failover.`);

  // --- Tier 2: Groq model fallback (same keys, different model = different RPM/TPM pool) ---
  // NOTE: Grading is intentionally excluded here to prevent inter-student grading bias.
  //       OCR is also excluded since it's Gemini-primary.
  const GROQ_MODEL_FALLBACKS = {
    rubrics: 'qwen/qwen3.6-27b',
    copyDetection: 'qwen/qwen3.6-27b',
    topicRecommendations: 'qwen/qwen3-32b',
  };

  const groqFallbackModel = GROQ_MODEL_FALLBACKS[task];
  if (groqFallbackModel && groqFallbackModel !== activeModel) {
    log.warn(`Falling back to alternative Groq model`, { task, groqFallbackModel });
    const groqRetries = Math.max(1, getGroqKeyCount());
    for (let attempt = 1; attempt <= groqRetries; attempt++) {
      try {
        const result = await callGroq({ model: groqFallbackModel, prompt, isJson });
        return { ...result, model: `${groqFallbackModel} (backup)` };
      } catch (error) {
        log.warn(`Backup Groq attempt failed`, { model: groqFallbackModel, attempt, groqRetries, error: error.message });
        if (attempt === groqRetries) break;
        await delay(2000);
      }
    }
  }

  log.warn(`Falling back to universal backup Gemini keys for task '${task}'`);

  // Try Backup Provider (Gemini Flash-Lite for ALL tasks)
  const backupRetries = Math.max(1, getGeminiKeyCount(true));
  for (let attempt = 1; attempt <= backupRetries; attempt++) {
    try {
      const result = await callGemini({ model: 'gemini-3.1-flash-lite', prompt, fileBuffer, mimeType, useBackup: true, isJson });
      return { ...result, model: 'gemini-3.1-flash-lite (backup)' };
    } catch (error) {
      log.warn(`Backup Gemini attempt failed`, { attempt, backupRetries, error: error.message });
      if (attempt === backupRetries) {
        throw new Error(`AI Request Failed: Both primary and backup providers exhausted for task '${task}'.`);
      }

      await delay(3000);
    }
  }
};
