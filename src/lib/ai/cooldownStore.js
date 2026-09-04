import { supabaseServer } from '../supabase/server';
import { createLogger } from '../utils/logger';

const log = createLogger('CooldownStore');

/**
 * Reads all active (non-expired) cooldowns for a given provider + key_type
 * from Supabase and populates the provided in-memory Map.
 *
 * Call fire-and-forget on module load — never await this in the critical path.
 *
 * @param {string} provider      - 'gemini' | 'groq'
 * @param {string} keyType       - 'primary' | 'backup'
 * @param {Map<number,number>} cooldownMap - The in-memory Map to populate (keyIndex -> expiresAtMs)
 */
export async function warmCooldownsFromDB(provider, keyType, cooldownMap) {
  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase
      .from('api_key_cooldowns')
      .select('key_index, expires_at')
      .eq('provider', provider)
      .eq('key_type', keyType)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      log.warn('Failed to warm cooldowns from DB', { provider, keyType, error: error.message });
      return;
    }

    if (data && data.length > 0) {
      for (const row of data) {
        cooldownMap.set(row.key_index, new Date(row.expires_at).getTime());
      }
      log.info('Warmed cooldown cache from DB', { provider, keyType, count: data.length });
    }
  } catch (err) {
    // Non-fatal: warm-up failure means in-memory Map starts empty (same behaviour as before this feature)
    log.warn('Unexpected error warming cooldowns', { provider, keyType, error: err.message });
  }
}

/**
 * Upserts a key cooldown record to Supabase so other serverless instances
 * can see it on their next cold start.
 *
 * Call fire-and-forget from markKeyCooldown — never await this in the critical path.
 *
 * @param {string} provider    - 'gemini' | 'groq'
 * @param {string} keyType     - 'primary' | 'backup'
 * @param {number} keyIndex    - 0-based index of the rate-limited key
 * @param {number} expiresAtMs - Unix timestamp (ms) when the cooldown expires
 */
export async function persistCooldown(provider, keyType, keyIndex, expiresAtMs) {
  try {
    const supabase = supabaseServer();
    const { error } = await supabase
      .from('api_key_cooldowns')
      .upsert(
        {
          provider,
          key_type: keyType,
          key_index: keyIndex,
          expires_at: new Date(expiresAtMs).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'provider,key_type,key_index' }
      );

    if (error) {
      log.warn('Failed to persist cooldown to DB', { provider, keyType, keyIndex, error: error.message });
    }
  } catch (err) {
    // Non-fatal: in-memory cooldown already set; persistence failure only affects other instances
    log.warn('Unexpected error persisting cooldown', { provider, keyType, keyIndex, error: err.message });
  }
}
