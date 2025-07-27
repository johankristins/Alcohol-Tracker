import { DrinkEntry } from '../types';

// API Configuration - supports both Azure Web App and Static Web App
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://alcohol-tracker-hxbkd9d6bng5apgt.swedencentral-01.azurewebsites.net/api';

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Convert DrinkEntry to API format
function toApiFormat(entry: DrinkEntry) {
  return {
    timestamp: entry.timestamp.toISOString(),
    notes: entry.notes,
    drink: {
      name: entry.drink.name,
      type: entry.drink.type,
      volume: entry.drink.volume,
      alcoholPercentage: entry.drink.alcoholPercentage
    }
  };
}

// Convert API response to DrinkEntry
function fromApiFormat(apiEntry: any): DrinkEntry {
  return {
    id: apiEntry.id.toString(),
    drink: {
      id: apiEntry.drink.id.toString(),
      name: apiEntry.drink.name,
      type: apiEntry.drink.type as any,
      volume: apiEntry.drink.volume,
      alcoholPercentage: apiEntry.drink.alcoholPercentage,
      standardUnits: apiEntry.drink.standardUnits
    },
    timestamp: new Date(apiEntry.timestamp),
    notes: apiEntry.notes
  };
}

export const apiStorage = {
  // Load all entries from API
  async loadEntries(): Promise<DrinkEntry[]> {
    try {
      const apiEntries = await apiCall<any[]>('/drinkentries');
      return apiEntries.map(fromApiFormat);
    } catch (error) {
      console.error('Failed to load entries from API:', error);
      return [];
    }
  },

  // Add a new entry via API
  async addEntry(entry: DrinkEntry): Promise<DrinkEntry> {
    try {
      const apiData = toApiFormat(entry);
      const createdEntry = await apiCall<any>('/drinkentries', {
        method: 'POST',
        body: JSON.stringify(apiData)
      });
      return fromApiFormat(createdEntry);
    } catch (error) {
      console.error('Failed to add entry via API:', error);
      throw error;
    }
  },

  // Delete an entry via API
  async deleteEntry(entryId: string): Promise<void> {
    try {
      console.log('Attempting to delete entry with ID:', entryId);
      const response = await fetch(`${API_BASE_URL}/drinkentries/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      console.log('Successfully deleted entry with ID:', entryId);
    } catch (error) {
      console.error('Failed to delete entry via API:', error);
      console.error('Entry ID was:', entryId);
      throw error;
    }
  },

  // Clear all entries via API
  async clearAllEntries(): Promise<void> {
    try {
      await apiCall('/drinkentries', {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to clear entries via API:', error);
      throw error;
    }
  },

  // Get statistics from API
  async getStatistics(): Promise<any> {
    try {
      return await apiCall('/drinkentries/statistics');
    } catch (error) {
      console.error('Failed to get statistics from API:', error);
      throw error;
    }
  },

  // Get all available drinks from API
  async getDrinks(): Promise<any[]> {
    try {
      return await apiCall<any[]>('/drinks');
    } catch (error) {
      console.error('Failed to get drinks from API:', error);
      return [];
    }
  }
}; 