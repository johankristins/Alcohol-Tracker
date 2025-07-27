import React, { useState, useEffect } from 'react';
import './App.css';
import { DrinkEntry } from './types';
import { apiStorage } from './utils/apiStorage';
import { AddDrinkForm } from './components/AddDrinkForm';
import { DrinkList } from './components/DrinkList';
import { Statistics } from './components/Statistics';

function App() {
  const [entries, setEntries] = useState<DrinkEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'add' | 'list' | 'stats'>('add');

  useEffect(() => {
    const loadEntriesFromAPI = async () => {
      try {
        const savedEntries = await apiStorage.loadEntries();
        setEntries(savedEntries);
      } catch (error) {
        console.error('Failed to load entries:', error);
        // Fallback to empty array if API is not available
        setEntries([]);
      }
    };
    
    loadEntriesFromAPI();
  }, []);

  const handleAddDrink = async (entry: DrinkEntry): Promise<DrinkEntry> => {
    try {
      const createdEntry = await apiStorage.addEntry(entry);
      setEntries(prev => [...prev, createdEntry]);
      return createdEntry;
    } catch (error) {
      console.error('Failed to add entry:', error);
      alert('Kunde inte lägga till dryck. Kontrollera att backend API:et körs.');
      throw error;
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      console.log('Deleting entry with ID:', entryId);
      await apiStorage.deleteEntry(entryId);
      console.log('Successfully deleted entry, updating state...');
      setEntries(prev => {
        const filtered = prev.filter(entry => entry.id !== entryId);
        console.log('Updated entries count:', filtered.length);
        return filtered;
      });
    } catch (error) {
      console.error('Failed to delete entry:', error);
      alert('Kunde inte ta bort dryck. Kontrollera att backend API:et körs.');
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Är du säker på att du vill ta bort alla registreringar? Detta går inte att ångra.')) {
      try {
        await apiStorage.clearAllEntries();
        setEntries([]);
      } catch (error) {
        console.error('Failed to clear entries:', error);
        alert('Kunde inte rensa alla drycker. Kontrollera att backend API:et körs.');
      }
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🍺 Alkohol Tracker</h1>
        <p>Spåra din alkoholkonsumtion enkelt och smidigt</p>
      </header>

      <nav className="app-nav">
        <button
          className={`nav-tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          ➕ Lägg till
        </button>
        <button
          className={`nav-tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          📋 Lista
        </button>
        <button
          className={`nav-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Statistik
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'add' && (
          <AddDrinkForm onAddDrink={handleAddDrink} />
        )}
        
        {activeTab === 'list' && (
          <div className="list-container">
            <div className="list-header">
              <DrinkList entries={entries} onDeleteEntry={handleDeleteEntry} />
              {entries.length > 0 && (
                <button className="clear-all-btn" onClick={handleClearAll}>
                  🗑️ Rensa alla
                </button>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'stats' && (
          <Statistics entries={entries} />
        )}
      </main>

      <footer className="app-footer">
        <p>
          <strong>Standardenhet:</strong> 1 standardenhet = 12g ren alkohol
        </p>
        <p>
          <small>
            Rekommenderad daglig gräns: 2-3 standardenheter för män, 1-2 för kvinnor
          </small>
        </p>
      </footer>
    </div>
  );
}

export default App;
