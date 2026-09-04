import { GoogleGenerativeAI } from '@google/generative-ai';
import { createLogger } from '../../utils/logger';
import { warmCooldownsFromDB, persistCooldown } from '../cooldownStore';

const log = createLogger('GeminiClient');

// 1. Scan dynamically for keys up to 20
const primaryKeys = [];
for (let i = 1; i <= 20; i++) {
  const k = process.env[`GEMINI_API_KEY_${i}`];
  if (k) primaryKeys.push(k);
}

const backupKeys = [];
for (let i = 1; i <= 20; i++) {
  const k = process.env[`GEMINI_BACKUP_KEY_${i}`];
  if (k) backupKeys.push(k);
}

// 2. In-memory cooldown tracking (keyIndex -> expiresAt ms)
const primaryCooldowns = new Map();
const backupCooldowns = new Map();

let primaryIndex = primaryKeys.length > 0 ? Math.floor(Math.random() * primaryKeys.length) : 0;
let backupIndex = backupKeys.length > 0 ? Math.floor(Math.random() * backupKeys.length) : 0;

// 3. Cold-start warm-up: pre-populate in-memory Maps from Supabase (fire-and-forget)
warmCooldownsFromDB('gemini', 'primary', primaryCooldowns);
warmCooldownsFromDB('gemini', 'backup', backupCooldowns);

export const getGeminiKeyCount = (useBackup = false) => {
  const keys = useBackup ? backupKeys : primaryKeys;
  return keys.length > 0 ? keys.length : (process.env.GEMINI_API_KEY ? 1 : 0);
};

export const markGeminiKeyCooldown = (keyIndex, useBackup = false, durationMs = 60000) => {
  const cooldowns = useBackup ? backupCooldowns : primaryCooldowns;
  const keyType = useBackup ? 'backup' : 'primary';
  const expiresAtMs = Date.now() + durationMs;

  // Update in-memory Map immediately (synchronous, zero latency)
  cooldowns.set(keyIndex, expiresAtMs);
  log.warn(`Key is on cooldown`, { keyIndex, useBackup, durationSeconds: durationMs / 1000 });

  // Persist to Supabase fire-and-forget (non-blocking — adds zero latency)
  persistCooldown('gemini', keyType, keyIndex, expiresAtMs);
};

export const getGeminiClient = (useBackup = false) => {
  const keys = useBackup ? backupKeys : primaryKeys;
  const cooldowns = useBackup ? backupCooldowns : primaryCooldowns;
  let currentIndex = useBackup ? backupIndex : primaryIndex;

  if (keys.length === 0) {
    if (process.env.GEMINI_API_KEY) {
        return { client: new GoogleGenerativeAI(process.env.GEMINI_API_KEY), keyIndex: 0 };
    }
    throw new Error(`No ${useBackup ? 'backup' : 'primary'} Gemini API keys configured`);
  }

  const now = Date.now();
  let attempts = 0;
  
  while (attempts < keys.length) {
    const expiresAt = cooldowns.get(currentIndex);
    if (!expiresAt || now > expiresAt) {
      break; 
    }
    currentIndex = (currentIndex + 1) % keys.length;
    attempts++;
  }

  if (attempts === keys.length) {
    let minRemaining = Infinity;
    for (let i = 0; i < keys.length; i++) {
      const exp = cooldowns.get(i);
      if (exp && exp > now) {
        minRemaining = Math.min(minRemaining, exp - now);
      }
    }
    const waitSeconds = Number.isFinite(minRemaining) ? Math.ceil(minRemaining / 1000) : 60;
    log.warn(`ALL ${useBackup ? 'backup' : 'primary'} Gemini keys are currently on cooldown! Shortest cooldown expires in ${waitSeconds}s`);

    const error = new Error(`All ${useBackup ? 'backup' : 'primary'} Gemini API keys are currently rate-limited. Try again in ${waitSeconds} seconds.`);
    error.code = 'ALL_KEYS_ON_COOLDOWN';
    error.status = 429;
    error.retryAfter = waitSeconds;
    throw error;
  }

  const selectedIndex = currentIndex;
  const currentKey = keys[selectedIndex];
  
  if (useBackup) {
    backupIndex = (currentIndex + 1) % keys.length;
  } else {
    primaryIndex = (currentIndex + 1) % keys.length;
  }

  return { client: new GoogleGenerativeAI(currentKey), keyIndex: selectedIndex };
};
