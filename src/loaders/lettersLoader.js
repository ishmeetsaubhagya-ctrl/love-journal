import { DEFAULT_MEMORIES } from '../services/supabaseClient.js';

const LOCAL_STORAGE_KEY = 'saubhagya_ishmeet_memories_v1';

export function getLoadedLetters() {
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.error('Error reading cached letters:', e);
    }
  }
  return DEFAULT_MEMORIES || [];
}

export const letters = getLoadedLetters();