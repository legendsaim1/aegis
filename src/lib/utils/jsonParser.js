/**
 * Robust JSON parser and sanitizer for AI model responses.
 * Handles markdown code fences (```json ... ```), leading/trailing conversational text,
 * unescaped control characters, and trailing commas.
 *
 * @param {string} rawText - Raw string output from LLM (Gemini, Groq, etc.)
 * @returns {any} Parsed JavaScript object or array
 * @throws {Error} If text cannot be parsed as valid JSON
 */
export function cleanAndParseJson(rawText) {
  if (typeof rawText !== 'string') {
    throw new Error('cleanAndParseJson expects a string input');
  }

  let cleaned = rawText.trim();

  // 1. Strip markdown code fences like ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, '$1').trim();

  // 2. If there are still stray fences, strip them
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // 3. Extract the JSON substring between the first '{' and last '}' (or '[' and ']')
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');

  let startIndex = -1;
  let endIndex = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    if (lastBrace !== -1 && lastBrace > firstBrace) {
      startIndex = firstBrace;
      endIndex = lastBrace + 1;
    }
  } else if (firstBracket !== -1) {
    if (lastBracket !== -1 && lastBracket > firstBracket) {
      startIndex = firstBracket;
      endIndex = lastBracket + 1;
    }
  }

  if (startIndex !== -1 && endIndex !== -1) {
    cleaned = cleaned.substring(startIndex, endIndex);
  }

  // 4. Try parsing directly
  try {
    return JSON.parse(cleaned);
  } catch (firstErr) {
    // 5. Attempt sanitizing common AI formatting issues (e.g. trailing commas)
    let sanitized = cleaned
      .replace(/,\s*([}\]])/g, '$1');

    try {
      return JSON.parse(sanitized);
    } catch (secondErr) {
      // 6. Attempt sanitizing unescaped control characters in extracted handwriting
      const escaped = sanitized.replace(/[\u0000-\u001F\u007F-\u009F]/g, (char) => {
        if (char === '\n') return '\\n';
        if (char === '\r') return '\\r';
        if (char === '\t') return '\\t';
        return '';
      });

      return JSON.parse(escaped);
    }
  }
}
