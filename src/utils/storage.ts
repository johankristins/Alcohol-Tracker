import { DrinkEntry } from '../types';

const STORAGE_KEY = 'alcohol-tracker-entries';

export const saveEntries = (entries: DrinkEntry[]): void => {
  try {
    const serialized = JSON.stringify(entries.map(entry => ({
      ...entry,
      timestamp: entry.timestamp.toISOString()
    })));
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    console.error('Failed to save entries:', error);
  }
};

export const loadEntries = (): DrinkEntry[] => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return [];
    
    const parsed = JSON.parse(serialized);
    return parsed.map((entry: any) => ({
      ...entry,
      timestamp: new Date(entry.timestamp)
    }));
  } catch (error) {
    console.error('Failed to load entries:', error);
    return [];
  }
};

export const addEntry = (entry: DrinkEntry): void => {
  const entries = loadEntries();
  entries.push(entry);
  saveEntries(entries);
};

export const deleteEntry = (entryId: string): void => {
  const entries = loadEntries();
  const filtered = entries.filter(entry => entry.id !== entryId);
  saveEntries(filtered);
};

export const clearAllEntries = (): void => {
  localStorage.removeItem(STORAGE_KEY);
}; 