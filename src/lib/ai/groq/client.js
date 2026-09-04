import Groq from 'groq-sdk';
import { createLogger } from '../../utils/logger';
import { warmCooldownsFromDB, persistCooldown } from '../cooldownStore';

const log = createLogger('GroqClient');

// 1. Scan dynamically for keys up to 40
const groqKeys = [];
for (let i = 1; i <= 40; i++) {
  const k = process.env[`GROQ_API_KEY_${i}`];
  if (k) groqKeys.push(k);
}

// 2. In-memory cooldown tracking (keyIndex -> expiresAt ms)
const cooldowns = new Map();
let currentIndex = groqKeys.length > 0 ? Math.floor(Math.random() * groqKeys.length) : 0;

// 3. Cold-start warm-up: pre-populate in-memory Map from Supabase (fire-and-forget)
warmCooldownsFromDB('groq', 'primary', cooldowns);

export const getGroqKeyCount = () => {
  return groqKeys.length > 0 ? groqKeys.length : (process.env.GROQ_API_KEY ? 1 : 0);
};

export const markGroqKeyCooldown = (keyIndex, durationMs = 60000) => {
  const expiresAtMs = Date.now() + durationMs;

  // Update in-memory Map immediately (synchronous, zero latency)
  cooldowns.set(keyIndex, expiresAtMs);
  log.warn(`Groq Key ${keyIndex + 1} is on cooldown`, { keyIndex, durationMs });

  // Persist to Supabase fire-and-forget (non-blocking)
  persistCooldown('groq', 'primary', keyIndex, expiresAtMs);
};

export const getGroqClient = () => {
  if (groqKeys.length === 0) {
    if (process.env.GROQ_API_KEY) {
       return { client: new Groq({ apiKey: process.env.GROQ_API_KEY }), keyIndex: 0 };
    }
    throw new Error('No Groq API keys configured');
  }

  const now = Date.now();
  let attempts = 0;
  
  // Find next available key not on cooldown
  while (attempts < groqKeys.length) {
    const expiresAt = cooldowns.get(currentIndex);
    if (!expiresAt || now > expiresAt) {
      break; // Found one!
    }
    currentIndex = (currentIndex + 1) % groqKeys.length;
    attempts++;
  }

  if (attempts === groqKeys.length) {
    let minRemaining = Infinity;
    for (let i = 0; i < groqKeys.length; i++) {
      const exp = cooldowns.get(i);
      if (exp && exp > now) {
        minRemaining = Math.min(minRemaining, exp - now);
      }
    }
    const waitSeconds = Number.isFinite(minRemaining) ? Math.ceil(minRemaining / 1000) : 60;
    log.warn(`ALL Groq keys are currently on cooldown! Shortest cooldown expires in ${waitSeconds}s`);

    const error = new Error(`All Groq API keys are currently rate-limited. Try again in ${waitSeconds} seconds.`);
    error.code = 'ALL_KEYS_ON_COOLDOWN';
    error.status = 429;
    error.retryAfter = waitSeconds;
    throw error;
  }

  const selectedIndex = currentIndex;
  const currentKey = groqKeys[selectedIndex];
  
  currentIndex = (currentIndex + 1) % groqKeys.length;

  return { client: new Groq({ apiKey: currentKey }), keyIndex: selectedIndex };
};
