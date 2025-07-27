import React from 'react';
import { DrinkEntry } from '../types';

interface DrinkListProps {
  entries: DrinkEntry[];
  onDeleteEntry: (entryId: string) => Promise<void>;
}

const getDrinkTypeLabel = (type: string): string => {
  const typeLabels: Record<string, string> = {
    beer: 'Öl',
    wine: 'Vin',
    spirit: 'Sprit',
    cocktail: 'Cocktail',
    other: 'Annat'
  };
  return typeLabels[type] || type;
};

const getDrinkTypeIcon = (type: string): string => {
  const icons: Record<string, string> = {
    beer: '🍺',
    wine: '🍷',
    spirit: '🥃',
    cocktail: '🍸',
    other: '🥤'
  };
  return icons[type] || '🥤';
};

const formatDate = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const entryDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (entryDate.getTime() === today.getTime()) {
    return 'Idag';
  }
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (entryDate.getTime() === yesterday.getTime()) {
    return 'Igår';
  }
  
  return date.toLocaleDateString('sv-SE', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const DrinkList: React.FC<DrinkListProps> = ({ entries, onDeleteEntry }) => {
  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🍺</div>
        <h3>Inga drycker registrerade än</h3>
        <p>Lägg till din första dryck för att komma igång!</p>
      </div>
    );
  }

  // Group entries by date
  const groupedEntries = entries.reduce((acc, entry) => {
    const dateKey = entry.timestamp.toISOString().split('T')[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, DrinkEntry[]>);

  const sortedDates = Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a));

  return (
    <div className="drink-list">
      <h2>Registrerade drycker</h2>
      
      {sortedDates.map(dateKey => {
        const dateEntries = groupedEntries[dateKey].sort((a, b) => 
          b.timestamp.getTime() - a.timestamp.getTime()
        );
        const date = new Date(dateKey);
        
        return (
          <div key={dateKey} className="date-group">
            <div className="date-header">
              <h3>{formatDate(date)}</h3>
              <span className="date-count">
                {dateEntries.length} dryck{dateEntries.length !== 1 ? 'ar' : ''}
              </span>
            </div>
            
            <div className="entries-container">
              {dateEntries.map(entry => (
                <div key={entry.id} className="drink-entry">
                  <div className="drink-info">
                    <div className="drink-icon">
                      {getDrinkTypeIcon(entry.drink.type)}
                    </div>
                    <div className="drink-details">
                      <div className="drink-name">{entry.drink.name}</div>
                      <div className="drink-meta">
                        <span className="drink-type">{getDrinkTypeLabel(entry.drink.type)}</span>
                        <span className="drink-volume">{entry.drink.volume}cl</span>
                        <span className="drink-alcohol">{entry.drink.alcoholPercentage}%</span>
                        <span className="drink-units">{entry.drink.standardUnits} enheter</span>
                      </div>
                      {entry.notes && (
                        <div className="drink-notes">{entry.notes}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="drink-actions">
                    <div className="drink-time">
                      {formatTime(entry.timestamp)}
                    </div>
                    <button
                      className="delete-btn"
                      onClick={async () => await onDeleteEntry(entry.id)}
                      title="Ta bort"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}; 