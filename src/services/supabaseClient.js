import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://grdkcoafzklmbgvflfsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZGtjb2FmemtsbWJndmZsZnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MzkyNjgsImV4cCI6MjEwNTIxNTI2OH0.yqi8L5xmARyxl4CiiH7Vqx_Pv6ZnoOqKBEzX--RsLnU';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZGtjb2FmemtsbWJndmZsZnN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTYzOTI2OCwiZXhwIjoyMTA1MjE1MjY4fQ.qB8eMcglf9Jz0FGXlzF0wx7lQB5_HKQfsapc3IA3UVk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STORAGE_FILE_PATH = 'memories/journal_entries.json';
const LOCAL_STORAGE_KEY = 'saubhagya_ishmeet_memories_v1';

export const DEFAULT_MEMORIES = [
  {
    id: 1,
    title: "Our First Date & The Spark That Started It All",
    date: "2023-10-14",
    location: "Roastery Coffee House",
    mood: "Magical",
    story: "The moment we sat down across from each other, time seemed to stand still. Your smile lit up the entire café, and what felt like minutes turned into hours of endless laughter, deep conversations, and the unforgettable feeling that I had finally found my favorite person.",
    author: "Saubhagya & Ishmeet",
    category: "Coffee Date",
    driveUrl: "https://drive.google.com",
    envelopeColor: "#e8d5b0",
    sealSymbol: "♡"
  },
  {
    id: 2,
    title: "Late Night Walks Under The Starlit Sky",
    date: "2023-12-24",
    location: "Central Park Promenade",
    mood: "Romantic",
    story: "Walking hand in hand through the cool night air, sharing dreams of our future together. With every step, I knew my heart would always belong with you. Every silence with you feels like a comfortable melody.",
    author: "Ishmeet",
    category: "Special Moment",
    driveUrl: "https://drive.google.com",
    envelopeColor: "#d4a373",
    sealSymbol: "💖"
  },
  {
    id: 3,
    title: "Celebrating Our Anniversary & Golden Memories",
    date: "2024-02-14",
    location: "The Grand Rooftop Grill",
    mood: "Unforgettable",
    story: "Surrounded by fairy lights and soft jazz music, we toasted to another incredible year of loving each other. You looked absolutely breathtaking. Here's to forever and always, my love.",
    author: "Saubhagya",
    category: "Anniversary",
    driveUrl: "https://drive.google.com",
    envelopeColor: "#c98474",
    sealSymbol: "🌹"
  }
];

// Helper to fetch text memories from Supabase Cloud with LocalStorage fallback
export async function getMemories() {
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/public/${STORAGE_FILE_PATH}?t=${Date.now()}`);
    if (res.ok) {
      const cloudData = await res.json();
      if (Array.isArray(cloudData) && cloudData.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudData));
        return cloudData;
      }
    }
  } catch (err) {
    console.warn('Supabase cloud fetch fallback to local:', err);
  }

  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      console.error('Failed to parse cached memories:', e);
    }
  }

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_MEMORIES));
  syncMemoriesToCloud(DEFAULT_MEMORIES);
  return DEFAULT_MEMORIES;
}

// Sync text entries list directly to Supabase cloud
export async function syncMemoriesToCloud(memoriesList) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(memoriesList));
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${STORAGE_FILE_PATH}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'content-type': 'application/json',
        'x-upsert': 'true'
      },
      body: JSON.stringify(memoriesList, null, 2)
    });
    const result = await response.json();
    return result;
  } catch (err) {
    console.error('Error syncing memories to Supabase Cloud:', err);
  }
}

// Create new memory entry
export async function saveMemory(newEntry) {
  const current = await getMemories();
  const nextId = current.length > 0 ? Math.max(...current.map(m => Number(m.id) || 0)) + 1 : 1;
  const memoryToSave = {
    id: nextId,
    title: newEntry.title || 'Untitled Moment',
    date: newEntry.date || new Date().toISOString().split('T')[0],
    location: newEntry.location || '',
    mood: newEntry.mood || 'Romantic',
    story: newEntry.story || '',
    author: newEntry.author || 'Saubhagya & Ishmeet',
    category: newEntry.category || 'Date',
    driveUrl: newEntry.driveUrl || '',
    envelopeColor: newEntry.envelopeColor || '#e8d5b0',
    sealSymbol: newEntry.sealSymbol || '♡',
    createdAt: new Date().toISOString()
  };

  const updatedList = [memoryToSave, ...current];
  await syncMemoriesToCloud(updatedList);
  return updatedList;
}

// Update existing memory entry
export async function updateMemory(id, updatedFields) {
  const current = await getMemories();
  const updatedList = current.map(item => {
    if (Number(item.id) === Number(id)) {
      return {
        ...item,
        ...updatedFields,
        updatedAt: new Date().toISOString()
      };
    }
    return item;
  });

  await syncMemoriesToCloud(updatedList);
  return updatedList;
}

// Delete memory entry permanently
export async function deleteMemory(id) {
  const current = await getMemories();
  const updatedList = current.filter(item => Number(item.id) !== Number(id));
  await syncMemoriesToCloud(updatedList);
  return updatedList;
}
