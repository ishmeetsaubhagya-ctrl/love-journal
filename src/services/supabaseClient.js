import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://grdkcoafzklmbgvflfsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZGtjb2FmemtsbWJndmZsZnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MzkyNjgsImV4cCI6MjEwNTIxNTI2OH0.yqi8L5xmARyxl4CiiH7Vqx_Pv6ZnoOqKBEzX--RsLnU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOCAL_STORAGE_KEY = 'saubhagya_ishmeet_memories_v1';
const TABLE_NAME = 'memories';

export const DEFAULT_MEMORIES = [];

// Normalize row data from Supabase Table (snake_case or camelCase)
function normalizeMemory(item) {
  return {
    id: item.id,
    title: item.title || '',
    date: item.date || '',
    location: item.location || '',
    mood: item.mood || '',
    story: item.story || '',
    author: item.author || 'Saubhagya & Ishmeet',
    category: item.category || '',
    driveUrl: item.drive_url || item.driveUrl || '',
    envelopeColor: item.envelope_color || item.envelopeColor || '#e8d5b0',
    sealSymbol: item.seal_symbol || item.sealSymbol || '♡',
    createdAt: item.created_at || item.createdAt || ''
  };
}

// Fetch memories from Supabase 'memories' Database Table
export async function getMemories() {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('id', { ascending: false });

    if (!error && Array.isArray(data)) {
      const normalized = data.map(normalizeMemory);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    } else if (error) {
      console.warn('Supabase DB table query returned error (table might not exist yet):', error.message);
    }
  } catch (err) {
    console.warn('Supabase DB table fetch exception:', err);
  }

  // LocalStorage fallback
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.error('Failed to parse cached memories:', e);
    }
  }

  return DEFAULT_MEMORIES;
}

// Insert new memory row into Supabase 'memories' Table
export async function saveMemory(newEntry) {
  const row = {
    title: newEntry.title || 'Untitled Moment',
    date: newEntry.date || new Date().toISOString().split('T')[0],
    location: newEntry.location || '',
    mood: newEntry.mood || '',
    story: newEntry.story || '',
    author: newEntry.author || 'Saubhagya & Ishmeet',
    category: newEntry.category || '',
    drive_url: newEntry.driveUrl || '',
    envelope_color: newEntry.envelopeColor || '#e8d5b0',
    seal_symbol: '♡'
  };

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([row])
      .select();

    if (error) {
      console.error('Error inserting row into Supabase memories table:', error);
      return await saveMemoryLocally(newEntry);
    }
    
    if (data && data.length > 0) {
      return await getMemories();
    }
  } catch (err) {
    console.error('Failed to save to Supabase memories table:', err);
    return await saveMemoryLocally(newEntry);
  }

  return await getMemories();
}

// Fallback local save if table isn't created yet
async function saveMemoryLocally(newEntry) {
  const current = await getMemories();
  const nextId = current.length > 0 ? Math.max(...current.map(m => Number(m.id) || 0)) + 1 : 1;
  const memoryToSave = {
    id: nextId,
    title: newEntry.title || 'Untitled Moment',
    date: newEntry.date || new Date().toISOString().split('T')[0],
    location: newEntry.location || '',
    mood: newEntry.mood || '',
    story: newEntry.story || '',
    author: newEntry.author || 'Saubhagya & Ishmeet',
    category: newEntry.category || '',
    driveUrl: newEntry.driveUrl || '',
    envelopeColor: newEntry.envelopeColor || '#e8d5b0',
    sealSymbol: '♡',
    createdAt: new Date().toISOString()
  };

  const updatedList = [memoryToSave, ...current];
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
  return updatedList;
}

// Update memory row in Supabase 'memories' Table
export async function updateMemory(id, updatedFields) {
  const row = {
    title: updatedFields.title,
    date: updatedFields.date,
    location: updatedFields.location,
    mood: updatedFields.mood,
    story: updatedFields.story,
    author: updatedFields.author,
    category: updatedFields.category,
    drive_url: updatedFields.driveUrl,
    envelope_color: updatedFields.envelopeColor,
    seal_symbol: '♡'
  };

  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .update(row)
      .eq('id', id);

    if (error) {
      console.error('Error updating row in Supabase memories table:', error);
      return await updateMemoryLocally(id, updatedFields);
    }
  } catch (err) {
    console.error('Failed to update memory in Supabase:', err);
    return await updateMemoryLocally(id, updatedFields);
  }

  return await getMemories();
}

// Fallback local update
async function updateMemoryLocally(id, updatedFields) {
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
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
  return updatedList;
}

// Delete memory row from Supabase 'memories' Table
export async function deleteMemory(id) {
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting row from Supabase memories table:', error);
      return await deleteMemoryLocally(id);
    }
  } catch (err) {
    console.error('Failed to delete memory from Supabase:', err);
    return await deleteMemoryLocally(id);
  }

  return await getMemories();
}

// Fallback local delete
async function deleteMemoryLocally(id) {
  const current = await getMemories();
  const updatedList = current.filter(item => Number(item.id) !== Number(id));
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
  return updatedList;
}
